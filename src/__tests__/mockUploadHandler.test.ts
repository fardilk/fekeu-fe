import { describe, it, expect, beforeEach } from 'vitest'
import { processUpload, inMemoryStore, uploadsDb, catatanDb } from '../lib/mockUploadHandler'

function makeFile(name: string, size = 1024, mimetype = 'image/jpeg') {
  return {
    filename: name,
    buffer: new Uint8Array(size),
    mimetype,
    size,
  }
}

describe('mockUploadHandler', () => {
  beforeEach(() => {
    // clear stores
    Object.keys(inMemoryStore).forEach(k => delete inMemoryStore[k as any])
    uploadsDb.splice(0, uploadsDb.length)
    catatanDb.splice(0, catatanDb.length)
  })

  it('returns missing_file when no file provided', async () => {
    const res = await processUpload({})
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('missing_file')
  })

  it('rejects files >1MB', async () => {
    const f = makeFile('big.jpg', 2_000_000)
    const res = await processUpload({ file: f })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('file_too_large')
  })

  it('rejects unsupported extension', async () => {
    const f = makeFile('file.pdf', 1024, 'application/pdf')
    const res = await processUpload({ file: f })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('unsupported_type')
  })

  it('returns amount_not_found when OCR finds 0 matches', async () => {
    const f = makeFile('none.jpg')
    const res = await processUpload({ file: f })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('amount_not_found')
  })

  it('returns ambiguous_amount when OCR finds multiple matches', async () => {
    const f = makeFile('ambig.jpg')
    const res = await processUpload({ file: f })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('ambiguous_amount')
  })

  it('handles ocr_error gracefully', async () => {
    const f = makeFile('ocr_error.jpg')
    const res = await processUpload({ file: f })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('ocr_error')
  })

  it('creates upload and catatan on success and returns details', async () => {
    const f = makeFile('one-amount-12345.jpg')
    const res = await processUpload({ file: f, profileId: 10 })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.path).toBe('keu/one-amount-12345.jpg')
      expect(res.data.catatan_id).toBeTruthy()
    }
  })

  it('returns existing upload when duplicate filename for same profile', async () => {
    const f1 = makeFile('dup-amount-200.jpg')
    const r1 = await processUpload({ file: f1, profileId: 7 })
    expect(r1.ok).toBe(true)
    if (!r1.ok) return

    // Second upload with same filename/profile should return same id
    const f2 = makeFile('dup-amount-200.jpg')
    const r2 = await processUpload({ file: f2, profileId: 7 })
    expect(r2.ok).toBe(true)
    if (r2.ok) expect(r2.data.id).toBe(r1.data.id)
  })
})
