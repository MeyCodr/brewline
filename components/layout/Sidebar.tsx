'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Logo } from '@/components/ui/Logo';
import { NavIcon } from '@/components/ui/NavIcon';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',   desc: 'Today at a glance', icon: 'grid'    as const, href: '/dashboard' },
  { id: 'orders',    label: 'Orders',       desc: 'Live tickets',      icon: 'receipt' as const, href: '/orders'    },
  { id: 'menu',      label: 'Menu',         desc: 'Items & pricing',   icon: 'menu'    as const, href: '/menu'      },
  { id: 'kitchen',   label: 'Kitchen',      desc: 'KDS board',         icon: 'chef'    as const, href: '/kitchen'   },
  { id: 'tables',    label: 'Tables',       desc: 'Floor & QR codes',  icon: 'table'   as const, href: '/tables'    },
  { id: 'customer',  label: 'Guest view',   desc: 'QR menu preview',   icon: 'phone'   as const, href: '/menu/01'   },
];

export function Sidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <aside
      className="border-r flex flex-col sticky top-0 h-screen px-4 py-5"
      style={{
        width: 280,
        background: 'linear-gradient(180deg, var(--canvas) 0%, var(--canvas-2) 100%)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 pb-4">
        <Logo size={40} />
        <div>
          <div className="font-semibold text-[18px] tracking-tight" style={{ fontFamily: 'var(--font-fraunces)' }}>
            Brewline
          </div>
          <div className="text-[11px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--muted)' }}>
            Cafe Operations
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-3" style={{ color: '#a8a29e' }}>
        Workspace
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map((n) => {
          const active = pathname.startsWith(n.href) && (n.href !== '/dashboard' || pathname === '/dashboard');
          return (
            <Link
              key={n.id}
              href={n.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 relative no-underline"
              style={{
                color: active ? 'var(--text)' : 'var(--muted)',
                background: active ? '#fff' : 'transparent',
                boxShadow: active ? 'var(--shadow-sm), 0 0 0 1px var(--border)' : 'none',
                fontSize: '13.5px',
                fontWeight: 500,
              }}
            >
              <span style={{ color: active ? 'var(--brand-1)' : undefined }}>
                <NavIcon name={n.icon} size={18} />
              </span>
              <span className="flex flex-col leading-tight flex-1">
                <span className="font-semibold text-[13.5px]">{n.label}</span>
                <span className="text-[11px] mt-0.5" style={{ color: '#a8a29e' }}>{n.desc}</span>
              </span>
              {n.id === 'orders' && pendingCount > 0 && (
                <span className="text-[10.5px] font-bold text-white px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--brand-1)' }}>
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2.5 pt-3">
        <div
          className="relative h-[130px] rounded-2xl overflow-hidden"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(28,25,23,0.15) 0%, rgba(28,25,23,0.78) 100%)' }} />
          <div className="absolute inset-0 p-3.5 flex flex-col justify-end text-white">
            <div className="text-[10px] uppercase tracking-widest opacity-85">Today&apos;s shift</div>
            <div className="text-[20px] mt-0.5" style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 500 }}>07:00 — 16:00</div>
            <div className="text-[11px] opacity-85 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
              4 on the floor · 2 on break
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors duration-150 hover:bg-red-50 hover:text-red-600 w-full"
          style={{ color: 'var(--muted)' }}
        >
          <NavIcon name="logout" size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
