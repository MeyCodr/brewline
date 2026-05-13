import { cn } from '@/lib/utils';

type BadgeVariant = 'amber' | 'blue' | 'emerald' | 'stone' | 'red' | 'violet';

interface BadgeProps {
  variant: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  amber:   'bg-amber-50   text-amber-700',
  blue:    'bg-blue-50    text-blue-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  stone:   'bg-stone-100  text-stone-600',
  red:     'bg-red-50     text-red-600',
  violet:  'bg-violet-50  text-violet-600',
};

export function Badge({ variant, size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-semibold uppercase tracking-wide',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs rounded-lg',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
