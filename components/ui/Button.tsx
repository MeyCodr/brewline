import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', block, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-[10px] font-semibold transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          size === 'sm' && 'px-3 py-1.5 text-xs',
          size === 'md' && 'px-3.5 py-2 text-[13px]',
          size === 'lg' && 'px-4 py-3 text-sm rounded-xl',
          variant === 'primary' && [
            'text-white',
            'shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_4px_12px_-2px_var(--brand-shadow)]',
            'hover:-translate-y-px hover:shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_8px_18px_-4px_var(--brand-shadow)]',
          ],
          variant === 'ghost' && [
            'bg-white border border-[var(--border)] text-[var(--text)]',
            'hover:bg-stone-100',
          ],
          block && 'w-full',
          className
        )}
        style={
          variant === 'primary'
            ? { background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' }
            : undefined
        }
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
