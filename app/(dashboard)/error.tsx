'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { NavIcon } from '@/components/ui/NavIcon';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Brewline] Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8"
      style={{ minHeight: '60vh' }}>
      <div className="text-5xl">⚠️</div>
      <h2 className="text-[24px] font-semibold tracking-tight m-0"
        style={{ fontFamily: 'var(--font-fraunces)' }}>
        Something went wrong
      </h2>
      <p className="text-[14px] m-0 max-w-sm" style={{ color: 'var(--muted)' }}>
        {process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred loading this page.'}
      </p>
      <Button variant="primary" onClick={reset}>
        <NavIcon name="refresh" size={14} /> Try again
      </Button>
    </div>
  );
}
