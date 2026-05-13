'use client';

import { useState, useTransition, useEffect } from 'react';
import { NavIcon } from '@/components/ui/NavIcon';

type KDSStatus = 'PENDING' | 'PREPARING' | 'READY';

interface KDSItem { name: string; qty: number; mods: string | null; }
interface KDSOrder {
  id: string; number: string; tableNumber: number;
  status: KDSStatus; note: string | null; placedAt: number; items: KDSItem[];
}

const COLS: { key: KDSStatus; label: string; next: KDSStatus | 'COMPLETED'; nextLabel: string; headClass: string; btnClass: string; }[] = [
  { key: 'PENDING',   label: 'New',       next: 'PREPARING', nextLabel: 'Start',  headClass: 'from-amber-400 to-amber-600',   btnClass: 'from-blue-500 to-blue-700' },
  { key: 'PREPARING', label: 'Preparing', next: 'READY',     nextLabel: 'Ready',  headClass: 'from-blue-500 to-blue-700',     btnClass: 'from-emerald-500 to-emerald-700' },
  { key: 'READY',     label: 'Ready',     next: 'COMPLETED', nextLabel: 'Served', headClass: 'from-emerald-500 to-emerald-700', btnClass: 'from-stone-700 to-stone-900' },
];

export function KitchenClient({ initialOrders }: { initialOrders: KDSOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [now, setNow] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  function advance(id: string) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const col = COLS.find(c => c.key === order.status);
    if (!col) return;

    if (col.next === 'COMPLETED') {
      setOrders(prev => prev.filter(o => o.id !== id));
    } else {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: col.next as KDSStatus } : o));
    }

    startTransition(async () => {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: col.next }),
      });
    });
  }

  return (
    <div
      className="min-h-screen p-8 pb-12"
      style={{
        backgroundImage: 'linear-gradient(rgba(28,25,23,0.92), rgba(28,25,23,0.96)), url(https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&q=80)',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        color: '#f5f5f4',
      }}
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] opacity-55">Bar 1 · Kitchen display</div>
          <h2 className="text-[32px] font-medium mt-1 mb-0 tracking-tight" style={{ fontFamily: 'var(--font-fraunces)' }}>
            Live tickets
          </h2>
        </div>
        <div className="flex gap-7">
          {[
            { num: orders.length, label: 'Active' },
            { num: '4:12', label: 'Avg prep' },
            { num: now, label: 'Local' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-[24px] font-medium" style={{ fontFamily: 'var(--font-fraunces)' }}>{s.num}</div>
              <div className="text-[11px] opacity-60 uppercase tracking-[0.06em]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-3 gap-3.5">
        {COLS.map(col => {
          const colOrders = orders.filter(o => o.status === col.key);
          return (
            <div key={col.key} className="flex flex-col gap-2.5">
              {/* Column header */}
              <div className={`px-4 py-3 rounded-xl flex justify-between items-center text-white font-semibold text-[13px] tracking-wide bg-gradient-to-br ${col.headClass}`}>
                <span>{col.label}</span>
                <span className="bg-white/25 px-2 py-0.5 rounded-full text-[11px] font-bold">{colOrders.length}</span>
              </div>

              {/* Cards */}
              {colOrders.length === 0 && (
                <div className="rounded-xl p-7 text-center text-[13px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }}>
                  No tickets
                </div>
              )}
              {colOrders.map(o => {
                const urgent = o.placedAt > 10 && col.key === 'PENDING';
                return (
                  <div
                    key={o.id}
                    className={`bg-white rounded-[14px] p-4 pb-4 ${urgent ? 'animate-urgent' : ''}`}
                    style={{ color: 'var(--text)', boxShadow: urgent ? undefined : '0 8px 24px -8px rgba(0,0,0,0.4)' }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-[16px] font-medium" style={{ fontFamily: 'var(--font-fraunces)' }}>{o.number}</div>
                        <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>Table {o.tableNumber}</div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold ${urgent ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-600'}`}
                      >
                        <NavIcon name="clock" size={11} />
                        {o.placedAt}m
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 mb-3">
                      {o.items.map((it, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-[14px] font-medium min-w-[22px]" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--brand-text)' }}>
                            {it.qty}×
                          </span>
                          <div>
                            <div className="text-[13.5px] font-semibold leading-snug">{it.name}</div>
                            {it.mods && <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--muted)' }}>{it.mods}</div>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {o.note && (
                      <div className="rounded-[10px] px-2.5 py-2 mb-2.5 text-[11.5px] italic" style={{ background: 'var(--canvas-2)', color: '#57534e' }}>
                        📝 {o.note}
                      </div>
                    )}

                    <button
                      onClick={() => advance(o.id)}
                      disabled={isPending}
                      className={`w-full py-2.5 rounded-[10px] text-[12.5px] font-bold text-white tracking-wide transition-opacity hover:opacity-90 bg-gradient-to-br ${col.btnClass}`}
                    >
                      {col.nextLabel}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
