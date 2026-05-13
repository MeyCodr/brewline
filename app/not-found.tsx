import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4"
      style={{ background: 'var(--canvas)' }}>
      <div className="text-5xl mb-2">☕</div>
      <h1 className="text-[40px] font-medium tracking-tight m-0"
        style={{ fontFamily: 'var(--font-fraunces)' }}>
        Page not found
      </h1>
      <p className="text-[15px] m-0 max-w-sm" style={{ color: 'var(--muted)' }}>
        This page doesn&apos;t exist. It may have been moved or the link is incorrect.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
