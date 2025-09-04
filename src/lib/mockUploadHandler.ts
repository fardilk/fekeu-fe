// Minimal in-memory mock of an upload endpoint handler for tests
export type UploadedFile = {
  filename: string
  buffer: Uint8Array
  mimetype?: string
  size: number
}

export type UploadRecord = {
  id: number
  profileId?: number
  filename: string
  path: string
  store_path: string
  keuangan_id?: number | null
}

// In-memory stores used by the mock handler and tests
export const inMemoryStore: Record<string, Uint8Array> = {}
export const uploadsDb: UploadRecord[] = []
export const catatanDb: { id: number; amount: number }[] = []

let nextUploadId = 1
let nextCatatanId = 1

// Simple OCR stub that inspects filename to decide result. Tests rely on these rules.
export function ocrStub(file: UploadedFile): { matches: number; amount?: number } {
  const name = file.filename.toLowerCase()
  if (name.includes('ocr_error')) throw new Error('ocr_error')
  if (name.includes('none')) return { matches: 0 }
  if (name.includes('ambig')) return { matches: 2 }
  // filename like one-amount-12345.jpg returns amount 12345
  const m = name.match(/amount-(\d+)/)
  if (m) {
    const amt = Number(m[1])
    return { matches: 1, amount: amt }
  }
  // default: one match but no amount (treated as amount not found)
  return { matches: 1 }
}

function normalizeAmountHeuristic(raw?: number | undefined): number | null {
  if (!raw || Number.isNaN(raw)) return null
  let n = Math.floor(raw)
  // Heuristic: if value looks like cents (very large), divide by 100
  if (n > 1_000_000) {
    return Math.round(n / 100)
  }
  // If it's small (<1000) assume it's already the correct integer (no cents)
  return n
}

export type ProcessUploadResult =
  | { ok: true; data: { id: number; path: string; store_path: string; catatan_id?: number } }
  | { ok: false; error: { code: string; message: string } }

export async function processUpload(opts: {
  file?: UploadedFile | null
  folder?: string
  profileId?: number
  keuangan_id?: number | null
  amount?: number | null
}): Promise<ProcessUploadResult> {
  const folder = opts.folder || 'keu'

  if (!opts.file) {
    return { ok: false, error: { code: 'missing_file', message: 'file missing' } }
  }

  const file = opts.file

  // Size validation: max 1MB
  if (file.size > 1_048_576) {
    return { ok: false, error: { code: 'file_too_large', message: 'file too large (max 1MB)' } }
  }

  // Extension + mime validation (basic)
  const ext = file.filename.split('.').pop()?.toLowerCase() || ''
  const allowedExt = ['jpg', 'jpeg', 'png']
  if (!allowedExt.includes(ext)) {
    return { ok: false, error: { code: 'unsupported_type', message: 'File tidak dikenali, gunakan file lain!' } }
  }

  const allowedMimes = ['image/jpeg', 'image/png']
  if (file.mimetype && !allowedMimes.includes(file.mimetype)) {
    return { ok: false, error: { code: 'unsupported_type', message: 'File tidak dikenali, gunakan file lain!' } }
  }

  // Simulate save to public/<folder>/<filename>
  const storePath = `public/${folder}/${file.filename}`
  const storeKey = `${folder}/${file.filename}`

  try {
    inMemoryStore[storePath] = file.buffer
  } catch (err) {
    return { ok: false, error: { code: 'save_failed', message: 'save_failed' } }
  }

  // Duplicate detection: same profile + filename
  const existing = uploadsDb.find(u => u.profileId === opts.profileId && u.filename === file.filename)
  if (existing) {
    // Attempt late OCR linking if missing keuangan_id
    if (!existing.keuangan_id) {
      try {
        const ocr = ocrStub(file)
        if (ocr.matches === 1 && ocr.amount) {
          const normalized = normalizeAmountHeuristic(ocr.amount)
          if (normalized !== null) {
            const cat = { id: nextCatatanId++, amount: normalized }
            catatanDb.push(cat)
            existing.keuangan_id = cat.id
          }
        }
      } catch (e) {
        // ignore OCR errors during late linking
      }
    }
    return {
      ok: true,
      data: { id: existing.id, path: storeKey, store_path: storePath, catatan_id: existing.keuangan_id ?? undefined },
    }
  }

  // Create new upload record (audit) with a pending state (we'll update after OCR)
  const uploadRecord: UploadRecord = {
    id: nextUploadId++,
    profileId: opts.profileId,
    filename: file.filename,
    path: storeKey,
    store_path: storePath,
    keuangan_id: null,
  }
  uploadsDb.push(uploadRecord)

  // Run OCR
  let ocrResult
  try {
    ocrResult = ocrStub(file)
  } catch (e) {
    // remove saved file and mark failed
    delete inMemoryStore[storePath]
    return { ok: false, error: { code: 'ocr_error', message: 'OCR internal error' } }
  }

  if (ocrResult.matches === 0) {
    delete inMemoryStore[storePath]
    return { ok: false, error: { code: 'amount_not_found', message: 'Nominal tidak ditemukan, gunakan file lain' } }
  }

  if (ocrResult.matches > 1) {
    delete inMemoryStore[storePath]
    return { ok: false, error: { code: 'ambiguous_amount', message: 'Gagal! Gunakan file lain' } }
  }

  // matches === 1
  const parsed = normalizeAmountHeuristic(ocrResult.amount)
  if (parsed === null) {
    delete inMemoryStore[storePath]
    return { ok: false, error: { code: 'amount_not_found', message: 'Nominal tidak ditemukan, gunakan file lain' } }
  }

  // Create or link CatatanKeuangan
  const catatan = { id: nextCatatanId++, amount: parsed }
  catatanDb.push(catatan)
  uploadRecord.keuangan_id = catatan.id

  return {
    ok: true,
    data: { id: uploadRecord.id, path: uploadRecord.path, store_path: uploadRecord.store_path, catatan_id: catatan.id },
  }
}
