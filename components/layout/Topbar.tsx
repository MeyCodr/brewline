'use client';

import { useEffect, useState } from 'react';
import { NavIcon } from '@/components/ui/NavIcon';
import { useSession } from 'next-auth/react';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { data: session } = useSession();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'MC';

  return (
    <header
      className="flex items-center justify-between px-8 py-[18px] sticky top-0 z-30 border-b backdrop-blur-sm"
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      <div>
        <div className="text-[11px] uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>{date}</div>
        <h1
          className="text-[24px] font-semibold tracking-tight mt-0.5 mb-0"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-[13px] mt-0.5 m-0" style={{ color: 'var(--muted)' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[10px] w-80 border"
          style={{ background: 'var(--canvas-2)', borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <NavIcon name="search" size={15} />
          <input
            placeholder="Search orders, items, tables…"
            className="border-0 bg-transparent outline-none flex-1 text-[13px] placeholder:text-[var(--muted)]"
            style={{ color: 'var(--text)' }}
          />
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded border"
            style={{ background: 'var(--canvas)', borderColor: 'var(--border)', color: 'var(--muted)', fontFamily: 'inherit' }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Bell */}
        <button
          className="relative w-[38px] h-[38px] rounded-[10px] border flex items-center justify-center transition-colors duration-150 hover:bg-stone-100"
          style={{ background: 'var(--canvas-2)', borderColor: 'var(--border)', color: 'var(--stone-600)' } as React.CSSProperties}
        >
          <NavIcon name="bell" size={16} />
          <span className="absolute top-2 right-2 w-[7px] h-[7px] bg-red-500 rounded-full border-2" style={{ borderColor: 'var(--canvas)' }} />
        </button>

        {/* Clock */}
        <div
          className="px-3.5 py-2 rounded-full border text-[12px] font-semibold"
          style={{ background: 'var(--canvas-2)', borderColor: 'var(--border)', color: 'var(--stone-700)' } as React.CSSProperties}
        >
          {time}
        </div>

        {/* Avatar */}
        <div
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[12px] font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
            boxShadow: '0 0 0 2px var(--canvas), 0 0 0 3px var(--border)',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
