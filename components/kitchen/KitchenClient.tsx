'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';

type KDSStatus = 'PREPARING' | 'READY';

interface KDSItem { name: string; qty: number; mods: string | null; }
interface KDSOrder {
  id: string; number: string; tableNumber: number;
  status: KDSStatus; note: string | null; placedAt: number; items: KDSItem[];
}

const POLL_INTERVAL = 5_000;
const KDS_STATUSES: KDSStatus[] = ['PREPARING', 'READY'];

const COLS: {
  key: KDSStatus; label: string;
  next: KDSStatus | 'COMPLETED'; nextLabel: string;
  color: string; dimColor: string; borderColor: string; dotColor: string;
  btnGradient: string;
}[] = [
  {
    key: 'PREPARING', label: 'In the Kitchen',    next: 'READY',     nextLabel: 'Mark Ready',
    color: '#60a5fa', dimColor: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.18)',
    dotColor: '#3b82f6', btnGradient: 'linear-gradient(135deg,#3b82f6,#2563eb)',
  },
  {
    key: 'READY',     label: 'Ready for Pickup',  next: 'COMPLETED', nextLabel: 'Served ✓',
    color: '#34d399', dimColor: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.18)',
    dotColor: '#10b981', btnGradient: 'linear-gradient(135deg,#10b981,#059669)',
  },
];

export function KitchenClient({ initialOrders }: { initialOrders: KDSOrder[] }) {
  const [orders, setOrders]   = useState(initialOrders);
  const [now, setNow]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNow(fmt());
    const id = setInterval(() => setNow(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders?limit=100');
    if (!res.ok) return;
    const { orders: raw } = await res.json() as {
      orders: Array<{
        id: string; number: string; status: string; note: string | null; createdAt: string;
        table: { number: number };
        items: Array<{ quantity: number; modifiers?: string | null; menuItem: { name: string } }>;
      }>;
    };
    setOrders(
      raw
        .filter(o => KDS_STATUSES.includes(o.status as KDSStatus))
        .map(o => ({
          id: o.id,
          number: o.number,
          tableNumber: o.table.number,
          status: o.status as KDSStatus,
          note: o.note ?? null,
          placedAt: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60_000),
          items: o.items.map(i => ({ name: i.menuItem.name, qty: i.quantity, mods: i.modifiers ?? null })),
        })),
    );
  }, []);

  useEffect(() => {
    const id = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchOrders]);

  function advance(id: string) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const col = COLS.find(c => c.key === order.status);
    if (!col) return;

    setOrders(prev =>
      col.next === 'COMPLETED'
        ? prev.filter(o => o.id !== id)
        : prev.map(o => o.id === id ? { ...o, status: col.next as KDSStatus } : o),
    );

    startTransition(async () => {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: col.next }),
      });
    });
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0c0a09', color: '#f5f5f4' }}>

      {/* ── Header ── */}
      <header style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111110' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px' }}>

          {/* Left — brand + live dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ position: 'relative', display: 'flex', width: 10, height: 10, flexShrink: 0 }}>
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: '#10b981', opacity: 0.6,
                animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
              }} />
              <span style={{ position: 'relative', width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            </span>
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.35, lineHeight: 1, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                Brewline · Station 1
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                Kitchen Display
              </div>
            </div>
          </div>

          {/* Right — stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {[
              { value: orders.length,                                        label: 'Active' },
              { value: orders.filter(o => o.status === 'PREPARING').length, label: 'In Kitchen' },
              { value: orders.filter(o => o.status === 'READY').length,     label: 'Ready' },
            ].map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '0 28px',
                borderLeft: i === 0 ? '1px solid rgba(255,255,255,0.08)' : undefined,
                borderRight: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-jetbrains)', letterSpacing: '-0.02em' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.35, marginTop: 5, fontFamily: 'var(--font-display)' }}>
                  {s.label}
                </div>
              </div>
            ))}
            {now && (
              <div style={{ textAlign: 'center', paddingLeft: 28 }}>
                <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.02em' }}>
                  {now}
                </div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.35, marginTop: 5, fontFamily: 'var(--font-display)' }}>
                  Local time
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Columns ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {COLS.map((col, ci) => {
          const colOrders = orders.filter(o => o.status === col.key);
          return (
            <div key={col.key} style={{
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              borderRight: ci === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>

              {/* Column label */}
              <div style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 24px', background: col.dimColor,
                borderBottom: `1px solid ${col.borderColor}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: col.dotColor, boxShadow: `0 0 8px ${col.dotColor}`,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: col.color, fontFamily: 'var(--font-display)' }}>
                    {col.label}
                  </span>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                  background: col.borderColor, color: col.color, fontFamily: 'var(--font-jetbrains)',
                }}>
                  {colOrders.length}
                </span>
              </div>

              {/* Tickets */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {colOrders.length === 0 && (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 16, minHeight: 200,
                  }}>
                    <div style={{ textAlign: 'center', opacity: 0.25 }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>—</div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-display)' }}>No tickets</div>
                    </div>
                  </div>
                )}

                {colOrders.map(o => {
                  const urgent = o.placedAt >= 10 && col.key === 'PREPARING';
                  return (
                    <div
                      key={o.id}
                      className={urgent ? 'animate-urgent' : ''}
                      style={{
                        background: '#181614',
                        border: `1px solid ${urgent ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 16,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top accent stripe */}
                      <div style={{ height: 3, background: urgent ? '#ef4444' : col.dotColor }} />

                      <div style={{ padding: '14px 16px' }}>

                        {/* Card header: order number + time */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-jetbrains)', color: '#f5f5f4', letterSpacing: '0.02em' }}>
                              {o.number}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 5, opacity: 0.4, letterSpacing: '0.08em', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                              Table {o.tableNumber}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: '4px 9px', borderRadius: 8,
                            background: urgent ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.06)',
                            color: urgent ? '#f87171' : '#78716c',
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontFamily: 'var(--font-jetbrains)',
                          }}>
                            ⏱ {o.placedAt}m
                          </span>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 }} />

                        {/* Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                          {o.items.map((it, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <span style={{
                                fontSize: 14, fontWeight: 700, minWidth: 28, paddingTop: 1,
                                color: col.color, fontFamily: 'var(--font-jetbrains)',
                              }}>
                                {it.qty}×
                              </span>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, color: '#e7e5e4', fontFamily: 'var(--font-display)' }}>
                                  {it.name}
                                </div>
                                {it.mods && (
                                  <div style={{ fontSize: 11, marginTop: 2, fontStyle: 'italic', color: '#57534e', fontFamily: 'var(--font-display)' }}>
                                    {it.mods}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Note */}
                        {o.note && (
                          <div style={{
                            borderRadius: 10, padding: '7px 10px', marginBottom: 12,
                            fontSize: 12, fontStyle: 'italic',
                            background: 'rgba(245,158,11,0.08)',
                            border: '1px solid rgba(245,158,11,0.14)',
                            color: '#fbbf24', fontFamily: 'var(--font-display)',
                          }}>
                            📝 {o.note}
                          </div>
                        )}

                        {/* Action button */}
                        <button
                          onClick={() => advance(o.id)}
                          disabled={isPending}
                          style={{
                            width: '100%', padding: '10px 0',
                            borderRadius: 10, border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
                            fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', fontFamily: 'var(--font-display)',
                            background: col.btnGradient,
                            opacity: isPending ? 0.5 : 1,
                            transition: 'opacity 0.15s, transform 0.1s',
                          }}
                          onMouseEnter={e => { if (!isPending) (e.target as HTMLButtonElement).style.opacity = '0.85'; }}
                          onMouseLeave={e => { (e.target as HTMLButtonElement).style.opacity = isPending ? '0.5' : '1'; }}
                        >
                          {col.nextLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
