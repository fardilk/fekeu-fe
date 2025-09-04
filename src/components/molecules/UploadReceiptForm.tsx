import React, { useRef, useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Button } from '../atoms/Button';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import uploadReceipt, { UploadResponse } from '../../lib/api/upload';
import { useUploadCacheStore } from '../../store/uploadCacheStore';
// toast removed; parent supplies success feedback via onUpload callback

type Variant = 'default' | 'soft' | 'solid';

type Props = {
  // onUpload is now a success callback invoked AFTER successful backend upload
  onUpload?: (file: File, result: UploadResponse) => Promise<void> | void;
  maxSizeMB?: number; // default 1
  accept?: string; // mime filter
  variant?: Variant;
};

export const UploadReceiptForm: React.FC<Props> = ({ onUpload, maxSizeMB = 1, accept = 'image/*', variant = 'default' }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cacheFile = useUploadCacheStore(s => s.file);
  const setCacheFile = useUploadCacheStore(s => s.setFile);
  // Queue of files for upload with per-file metadata
  type QItem = {
    id: string;
    file: File;
    status: 'pending' | 'preparing' | 'prepared' | 'uploading' | 'uploaded' | 'invalid' | 'failed';
    progress: number | null;
    error?: string | null;
    result?: UploadResponse | null;
  };

  const [items, setItems] = useState<QItem[]>(cacheFile ? [{ id: String(Date.now()), file: cacheFile, status: 'pending', progress: null, error: null, result: null }] : []);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<boolean>(false); // simulate cached/uploaded state (legacy)
  const [uploading, setUploading] = useState(false);
  const lastProgressEmitRef = useRef<Record<string, number>>({});
  const setGlobalUploading = useUIStore(s => s.setUploading);
  const authToken = useAuthStore(s => s.token);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const prepareIntervalRef = useRef<Record<string, number | null> | null>(null);

  const isSoft = variant === 'soft';
  const isSolid = variant === 'solid';

  const containerClasses = `max-w-md w-full p-6 rounded ${isSolid ? 'shadow-lg bg-teal-600 text-white' : isSoft ? 'shadow-md bg-gradient-to-br from-indigo-50 via-white to-slate-50' : 'shadow-md bg-white'}`;
  const titleClass = `text-lg font-semibold ${isSolid ? 'text-white' : 'text-slate-900'}`;
  const descClass = `text-sm ${isSolid ? 'text-teal-100' : 'text-slate-500'}`;
  const squareBase = 'w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer';
  const squareClasses = isSolid
    ? `${squareBase} border-teal-400 bg-teal-500/8 hover:bg-teal-500/16`
    : `${squareBase} border-slate-200 hover:bg-slate-50`;
  const listBoxClasses = isSolid ? 'bg-teal-700/20 border-teal-500/30 rounded p-3 flex items-center justify-between' : 'bg-slate-50 border rounded p-3 flex items-center justify-between';
  const metaTextClass = isSolid ? 'text-teal-100 text-sm' : 'text-xs text-slate-500';

  const onFileSelection: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];

    // Build new items, validate each and append to queue (dedupe by name+size)
    setItems((prev) => {
      const existingKeys = new Set(prev.map((p) => `${p.file.name}:${p.file.size}`));
      const newOnes: QItem[] = [];
      for (const f of files) {
        const key = `${f.name}:${f.size}`;
        if (existingKeys.has(key)) continue;
        let status: QItem['status'] = 'pending';
        let err: string | null = null;
        if (!allowed.includes(f.type)) {
          status = 'invalid';
          err = 'Invalid file type. Only JPG, JPEG and PNG are allowed.';
        } else if (f.size > maxSizeMB * 1024 * 1024) {
          status = 'invalid';
          err = `File too large. Max ${maxSizeMB} MB.`;
        }
        newOnes.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, file: f, status, progress: null, error: err, result: null });
      }
      // persist last selected to upload cache store (legacy single-file store)
      if (newOnes.length > 0) {
        try { setCacheFile(newOnes[0].file); } catch (_) {}
      }
      return [...prev, ...newOnes];
    });
    // reset input so same file can be re-selected later
    if (inputRef.current) inputRef.current.value = '';
  };

  const clear = (id?: string) => {
    // if id provided remove single item, otherwise clear all
    if (id) {
      setItems((s) => s.filter((it) => it.id !== id));
    } else {
      setItems([]);
      try { setCacheFile(null); } catch (_) {}
      setError(null);
    }
    // clear any intervals
    if (prepareIntervalRef.current) {
      // it's a map stored on the ref; clear all
      Object.values(prepareIntervalRef.current).forEach((v) => { if (v) window.clearInterval(v); });
      prepareIntervalRef.current = {} as any;
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  // Attach: simulate local preparation with progress (no backend call)
  // prepare (attach) a single item by id
  const doAttach = (id: string) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, error: null } : it));
    const item = items.find((i) => i.id === id);
    if (!item || item.status === 'invalid' || item.status === 'prepared' || item.status === 'preparing') return;

    // clear existing interval for this id
    if (!prepareIntervalRef.current) prepareIntervalRef.current = {} as any;
    if (prepareIntervalRef.current && prepareIntervalRef.current[id]) {
      window.clearInterval(prepareIntervalRef.current[id] as number);
      prepareIntervalRef.current[id] = null;
    }

    let current = 0;
    // set status to preparing
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, status: 'preparing', progress: 0 } : it));

    if (prepareIntervalRef.current) {
      prepareIntervalRef.current[id] = window.setInterval(() => {
      current += Math.random() * 25 + 15; // increment 15-40
      if (current >= 100) current = 100;
      const pct = current;
      const now = performance.now();
      // throttle simulated progress to ~60ms min interval per-item
      const last = lastProgressEmitRef.current[id] || 0;
      if (now - last > 60) {
        setItems((prev) => prev.map((it) => it.id === id ? { ...it, progress: pct >= 100 ? 100 : Math.min(99, pct) } : it));
        lastProgressEmitRef.current[id] = now;
      }
      if (current === 100) {
        // finalize
        if (prepareIntervalRef.current && prepareIntervalRef.current[id]) {
          window.clearInterval(prepareIntervalRef.current[id]);
          prepareIntervalRef.current[id] = null;
        }
        setItems((prev) => prev.map((it) => it.id === id ? { ...it, status: 'prepared', progress: 0 } : it));
        setCached(true);
      }
    }, 120);
    }
  }; // end doAttach

  // Submit: send file to backend (real upload)
  const submitUpload = async (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it || uploading || it.status !== 'prepared') return;
    if (!authToken) {
      setItems((prev) => prev.map((x) => x.id === id ? { ...x, error: 'Anda belum login. Silakan login terlebih dahulu.' } : x));
      return;
    }

    try {
      setUploading(true);
      setGlobalUploading(true);
      setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: 'uploading', progress: 0 } : x));

      const result = await uploadReceipt(it.file, authToken ?? '', (p) => {
        const now = performance.now();
        const last = lastProgressEmitRef.current[id] || 0;
        if (now - last > 80 || p === 100) {
          setItems((prev) => prev.map((x) => x.id === id ? { ...x, progress: p } : x));
          lastProgressEmitRef.current[id] = now;
        }
      });

      // success -> remove item from queue so user can start again
      try {
        // clear any prepare interval for this id
        if (prepareIntervalRef.current && prepareIntervalRef.current[id]) {
          window.clearInterval(prepareIntervalRef.current[id] as number);
          prepareIntervalRef.current[id] = null;
        }
      } catch (_) {}

      // notify parent then remove from list
      if (onUpload) {
        try { await onUpload(it.file, result as UploadResponse); } catch (_) {}
      }
      setItems((prev) => prev.filter((x) => x.id !== id));
      setCached(false);
    } catch (err: any) {
      setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: 'failed', error: err?.message || 'Upload failed', progress: null } : x));
    } finally {
      setUploading(false);
      setGlobalUploading(false);
    }
  };

  // submit all prepared files sequentially
  const submitAll = async () => {
    const prepared = items.filter((i) => i.status === 'prepared');
    for (const it of prepared) {
      // eslint-disable-next-line no-await-in-loop
      await submitUpload(it.id);
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (prepareIntervalRef.current) {
          Object.values(prepareIntervalRef.current).forEach((v) => { if (v) window.clearInterval(v); });
        }
    };
  }, []);

  return (
    <div className={containerClasses}>
  <h2 className={titleClass}>Upload dan Lampirkan Berkas</h2>
  <p className={descClass}>Lampiran akan menjadi bagian dari proyek ini.</p>

      {/* Upload square - always shown */}
      <label className="mt-4 block">
        <div className={squareClasses}>
          <div className="flex flex-col items-center gap-3">
            <div className="">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="48"
                height="48"
                className="w-12 h-12"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="uploadFolderGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#38b2ac" />
                    <stop offset="100%" stopColor="#81e6d9" />
                  </linearGradient>
                </defs>
                <path
                  d="M3 8a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"
                  fill="none"
                  stroke="url(#uploadFolderGrad)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-sm">
              <span className="text-indigo-600 underline">Click to Upload</span> or drag and drop
            </div>
            <div className={`text-xs ${isSolid ? 'text-indigo-100' : 'text-slate-400'}`}>(Max. File size: {maxSizeMB} MB)</div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={onFileSelection}
          multiple
        />
      </label>

      {/* When no file selected show only the square */}
      {items.length === 0 && (
        <div className="mt-2 text-xs text-slate-500">No file selected</div>
      )}

      {/* When files exist show list + actions */}
      {items.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="text-sm font-medium">{items.length} file dipilih</div>

          <div className="space-y-3">
            {items.map((it) => {
              const statusLabel = it.status === 'invalid'
                ? 'Gagal'
                : it.status === 'uploaded'
                  ? 'Selesai'
                  : it.status === 'prepared'
                    ? 'Siap dikirim'
                    : it.status === 'preparing'
                      ? 'Menyiapkan'
                      : it.status === 'uploading'
                        ? 'Mengirim'
                        : 'Menunggu';
              const icon = it.status === 'invalid'
                ? '❌'
                : it.status === 'uploaded'
                  ? '📤'
                  : it.status === 'prepared'
                    ? '✅'
                    : it.status === 'preparing'
                      ? '⏳'
                      : (it.file.type.startsWith('image') ? '🖼️' : '📄');
              return (
                <div key={it.id} className={listBoxClasses + ' relative'}>
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-10 h-10 ${isSolid ? 'bg-teal-600 border-teal-500 text-teal-100' : 'bg-white border'} rounded flex items-center justify-center text-lg ${isSolid ? 'text-teal-100' : 'text-slate-600'}`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${isSolid ? 'text-teal-100' : ''}`} title={it.file.name}>{it.file.name}</div>
                      <div className={metaTextClass}>
                        {(it.file.size / 1024 / 1024).toFixed(2)} MB • {it.status === 'invalid' ? 'Invalid' : it.status === 'uploaded' ? 'Uploaded' : it.status === 'prepared' ? 'Prepared' : it.status === 'preparing' ? 'Preparing' : 'Pending'} • <span className="capitalize">{statusLabel}</span>
                      </div>
                      {it.error && <div className={`text-xs mt-1 ${isSolid ? 'text-red-200' : 'text-red-600'}`}>{it.error}</div>}
                      {(it.status === 'preparing' || it.status === 'uploading') && it.progress !== null && (
                        <div className="mt-2">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full ${isSolid ? 'bg-teal-300' : 'bg-indigo-500'}`} style={{ width: `${it.progress}%`, transition: 'width 200ms linear' }} />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">{it.progress}% {it.status === 'preparing' ? 'menyiapkan' : it.status === 'uploading' ? 'mengirim' : ''}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                      <button
                        type="button"
                        onClick={() => clear(it.id)}
                        disabled={uploading || it.status === 'uploading'}
                        className={`p-2 rounded border text-xs hover:bg-red-50 disabled:opacity-50 ${isSolid ? 'border-teal-500/40 text-teal-50 hover:bg-teal-600/40' : 'border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300'}`}
                        aria-label="Remove file"
                        title="Remove file"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                      {it.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => doAttach(it.id)}
                          disabled={uploading}
                          className={`p-2 rounded border text-xs hover:bg-indigo-50 disabled:opacity-50 ${isSolid ? 'border-teal-500/40 text-teal-50 hover:bg-teal-500/60' : 'border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300'}`}
                          aria-label="Attach (prepare)"
                          title="Attach (prepare)"
                        >
                          <i className="fa-solid fa-arrow-up" />
                        </button>
                      )}
                      {(it.status === 'prepared' || it.status === 'uploading') && (
                        <button
                          type="button"
                          onClick={() => submitUpload(it.id)}
                          disabled={uploading || it.status === 'uploading'}
                          className={`p-2 rounded border text-xs hover:bg-emerald-50 disabled:opacity-50 ${isSolid ? 'border-teal-500/40 text-teal-50 hover:bg-teal-500/60' : 'border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300'}`}
                          aria-label={it.status === 'uploading' ? 'Uploading...' : 'Submit'}
                          title={it.status === 'uploading' ? 'Uploading...' : 'Submit'}
                        >
                          <i className={`fa-solid ${it.status === 'uploading' ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(() => {
            if (items.length === 0) return null;
            const allPrepared = items.every(i => i.status === 'prepared');
            if (allPrepared) {
              return (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => clear()} disabled={uploading}>Cancel</Button>
                  <Button type="button" onClick={submitAll} disabled={uploading}>Submit All</Button>
                </div>
              );
            }
            return (
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => clear()} disabled={uploading}>Clear All</Button>
                <Button type="button" onClick={() => { items.filter(i => i.status === 'pending').forEach(i => doAttach(i.id)); }} disabled={uploading || items.every(i => i.status !== 'pending')}>Attach All</Button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default UploadReceiptForm;
