import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('bg-white border rounded-[var(--radius)] p-5 shadow-sm', className)}
      style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-semibold text-[17px] tracking-tight m-0"
      style={{ fontFamily: 'var(--font-fraunces)' }}
    >
      {children}
    </h3>
  );
}

export function CardSub({ children }: { children: React.ReactNode }) {
  return <p className="text-xs mt-0.5 m-0" style={{ color: 'var(--muted)' }}>{children}</p>;
}
