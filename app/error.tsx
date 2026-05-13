'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Brewline] Unhandled error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#faf7f2', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#78716c', fontSize: 14, margin: 0, maxWidth: 400 }}>
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 12, textAlign: 'left', maxWidth: 600, overflowX: 'auto' }}>
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
