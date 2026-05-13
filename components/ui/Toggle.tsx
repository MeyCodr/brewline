'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="relative inline-block w-[30px] h-[18px] cursor-pointer">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span
        className="absolute inset-0 rounded-full transition-colors duration-150"
        style={{ background: checked ? 'var(--brand-1)' : 'var(--border)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-150"
          style={{ transform: checked ? 'translateX(12px)' : 'translateX(0)' }}
        />
      </span>
    </label>
  );
}
