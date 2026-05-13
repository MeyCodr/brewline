'use client';

import { useState, useRef, useCallback } from 'react';
import { NavIcon } from '@/components/ui/NavIcon';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'done' | 'error';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [tab, setTab] = useState<'upload' | 'url'>(value && !value.startsWith('/uploads/') ? 'url' : 'upload');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [urlInput, setUrlInput] = useState(tab === 'url' ? value : '');
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Upload helper ──────────────────────────────────────────────── */
  const upload = useCallback(async (file: File) => {
    setErrorMsg('');
    setUploadState('uploading');
    setProgress(10);

    const form = new FormData();
    form.append('file', file);

    try {
      // Simulate incremental progress while waiting
      const timer = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 200);

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      clearInterval(timer);
      setProgress(100);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Upload failed');
      }

      const { url } = await res.json();
      setUploadState('done');
      onChange(url);
    } catch (err) {
      setUploadState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setProgress(0);
    }
  }, [onChange]);

  /* ── Drop handlers ──────────────────────────────────────────────── */
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setUploadState('dragging'); }
  function onDragLeave() { if (uploadState === 'dragging') setUploadState('idle'); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setUploadState('idle');
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  }

  function handleUrlBlur() {
    if (urlInput !== value) onChange(urlInput);
  }

  function clearImage() {
    onChange('');
    setUploadState('idle');
    setProgress(0);
    setErrorMsg('');
    setUrlInput('');
  }

  /* ── Derived display ─────────────────────────────────────────────── */
  const previewUrl = value || '';
  const isUploading = uploadState === 'uploading';
  const isDragging  = uploadState === 'dragging';

  return (
    <div className="mb-3">
      {/* Tab bar */}
      <div className="flex gap-1 mb-2" style={{ background: 'var(--canvas-2)', borderRadius: 10, padding: 3, width: 'fit-content' }}>
        {(['upload', 'url'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-3 py-1 rounded-[8px] text-[12px] font-semibold transition-all"
            style={{
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--muted)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {t === 'upload' ? '⬆ Upload file' : '🔗 Image URL'}
          </button>
        ))}
      </div>

      {tab === 'upload' ? (
        <div className="flex flex-col gap-2">
          {/* Drop zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileRef.current?.click()}
            className={cn(
              'relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer select-none',
              isDragging ? 'border-[var(--brand-1)] bg-[var(--brand-tint)]' : 'border-[var(--border)] hover:border-stone-300 hover:bg-stone-50',
              isUploading && 'cursor-not-allowed opacity-70',
              previewUrl ? 'h-36' : 'h-28'
            )}
          >
            {/* Image preview overlay */}
            {previewUrl && (
              <div className="absolute inset-0 rounded-[10px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                {/* Tinted overlay so the icons are visible */}
                <div className="absolute inset-0 bg-stone-900/40" />
              </div>
            )}

            {/* Content (always on top) */}
            <div className={cn('relative z-10 flex flex-col items-center gap-1.5', previewUrl ? 'text-white' : '')}>
              {isUploading ? (
                <>
                  <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--brand-1)', borderTopColor: 'transparent' }} />
                  <span className="text-[12px] font-medium">Uploading…</span>
                </>
              ) : isDragging ? (
                <>
                  <NavIcon name="download" size={22} />
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--brand-text)' }}>Drop to upload</span>
                </>
              ) : previewUrl ? (
                <>
                  <NavIcon name="refresh" size={18} />
                  <span className="text-[12px] font-semibold">Replace image</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-tint)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
                    Click to upload or drag &amp; drop
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>JPEG, PNG, WebP, GIF · max 5 MB</span>
                </>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--canvas-2)' }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2))' }}
              />
            </div>
          )}

          {/* Success + remove row */}
          {uploadState === 'done' && previewUrl && (
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <NavIcon name="check" size={13} /> Uploaded successfully
              </span>
              <button type="button" onClick={clearImage} className="ml-auto text-red-500 hover:underline font-medium">
                Remove
              </button>
            </div>
          )}

          {/* Error */}
          {uploadState === 'error' && (
            <p className="text-[12px] text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{errorMsg}</p>
          )}

          {/* If there's already a URL (from previous session or Unsplash) but tab is upload, show remove option */}
          {previewUrl && uploadState === 'idle' && (
            <button type="button" onClick={clearImage} className="text-[12px] text-red-500 hover:underline font-medium w-fit">
              Remove image
            </button>
          )}

          <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={onFileChange} />
        </div>

      ) : (
        /* URL tab */
        <div className="flex flex-col gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onBlur={handleUrlBlur}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onChange(urlInput); } }}
            placeholder="https://images.unsplash.com/…"
            className="w-full px-3 py-2 border rounded-[10px] text-[13.5px] outline-none transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
            onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-tint)'; }}
            onBlurCapture={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />

          {/* Live preview */}
          {value && (
            <div className="relative w-full h-28 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-stone-900/70 text-white flex items-center justify-center hover:bg-stone-900"
              >
                <NavIcon name="x" size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
