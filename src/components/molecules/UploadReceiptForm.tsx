import React, { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import uploadReceipt, { finalizeUpload, UploadResponse } from '../../lib/api/upload';
import { useToast } from '../ui/ToastContext';

type Variant = 'default' | 'soft' | 'solid';

type Props = {
  // onUpload may return an OCR result object { ocrFound: boolean, amount?: number }
  onUpload?: (file: File) => Promise<any> | void;
  maxSizeMB?: number; // default 1
  accept?: string; // mime filter
  variant?: Variant;
};

export const UploadReceiptForm: React.FC<Props> = ({ onUpload, maxSizeMB = 1, accept = 'image/*', variant = 'default' }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<boolean>(false); // simulate cached/uploaded state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const setGlobalUploading = useUIStore(s => s.setUploading);
  const authToken = useAuthStore(s => s.token);
  const toast = useToast();
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

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
    const f = e.target.files?.[0] ?? null;
    if (!f) { setFile(null); setCached(false); return; }
    // validate type: only jpg/jpeg/png (PDF forbidden)
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) {
      setError('Invalid file type. Only JPG, JPEG and PNG are allowed.');
      setFile(null); setCached(false);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB} MB.`);
      setFile(null); setCached(false);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(f);
    // mark as cached (not yet uploaded) so UI shows it in list
    setCached(true);
  };

  const clear = () => {
    setFile(null); setError(null); setCached(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Attach only: mark file as cached locally, do not call backend
  const doAttach = async () => {
    if (!file) return;
    setError(null);
    setCached(true);
    // keep progress null until actual upload
  };

  // Submit: perform the actual upload to POST /uploads
  const submitUpload = async () => {
    if (!file || uploading) return;
    try {
      setUploading(true);
      setGlobalUploading(true);
      setError(null);
      setProgress(0);

      const handler = onUpload ?? (async (f: File) => await uploadReceipt(f, authToken ?? '', (p) => setProgress(p)));
      const result = await handler(file);

      // handle OCR result shape if present
      if (result && typeof result === 'object' && 'ocrFound' in result) {
        if (!result.ocrFound) {
          setError(result.message || 'OCR failed or no amount found. Please rescan or demolish the document.');
          setProgress(null);
          return;
        }
      }

      // success: mark uploaded and keep the file visible
      setCached(false);
      setProgress(100);
      setUploadResult(result as UploadResponse);
      toast.showToast('Berhasil upload', 'success');
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
      setProgress(null);
    } finally {
      setUploading(false);
      setGlobalUploading(false);
    }
  };

  const handleSubmitUpload = async () => {
    if (!uploadResult) return;
    try {
      setUploading(true);
      setGlobalUploading(true);
      await finalizeUpload(uploadResult.id, authToken ?? '');
      toast.showToast('Berhasil submit', 'success');
      // keep the file list visible but mark as done
      setCached(false);
    } catch (err: any) {
      setError(err?.message || 'Submit failed');
    } finally {
      setUploading(false);
      setGlobalUploading(false);
    }
  };

  return (
    <div className={containerClasses}>
      <h2 className={titleClass}>Upload and attach files</h2>
      <p className={descClass}>Attachments will be a part of this project.</p>

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
        />
      </label>

      {/* When no file selected show only the square */}
      {!file && (
        <div className="mt-2 text-xs text-slate-500">No file selected</div>
      )}

      {/* When file selected show list + actions */}
      {file && (
        <div className="mt-4 space-y-3">
          <div className="text-sm font-medium">1 file ready to attach</div>
          <div className={listBoxClasses}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${isSolid ? 'bg-teal-600 border-teal-500 text-teal-100' : 'bg-white border'} rounded flex items-center justify-center ${isSolid ? 'text-teal-100' : 'text-slate-600'}`}>{file.type.startsWith('image') ? '🖼️' : '📄'}</div>
              <div className="truncate">
                <div className={`font-medium truncate max-w-[220px] ${isSolid ? 'text-teal-100' : ''}`} title={file.name}>{file.name}</div>
                <div className={metaTextClass}>{(file.size / 1024 / 1024).toFixed(2)} MB • {cached ? 'Cached, not uploaded' : 'Uploaded'}</div>
              </div>
            </div>
            <div className="text-sm text-slate-500">{cached ? 'Pending' : 'Done'}</div>
          </div>

          {error && <div className={`text-sm ${isSolid ? 'text-red-200' : 'text-red-600'}`}>{error}</div>}

          {(uploading || progress !== null) && (
            <div className="w-full">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${isSolid ? 'bg-teal-300' : 'bg-indigo-500'}`}
                  style={{ width: `${progress ?? 0}%`, transition: 'width 200ms linear' }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">{progress ?? 0}%</div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={clear} disabled={uploading}>Cancel</Button>
            {!uploadResult && (
              <Button type="button" onClick={doAttach} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Attach files'}
              </Button>
            )}
            {uploadResult && (
              <Button type="button" onClick={handleSubmitUpload} disabled={uploading}>
                {uploading ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadReceiptForm;
