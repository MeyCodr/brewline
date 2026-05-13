'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NavIcon } from '@/components/ui/NavIcon';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';

type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

interface OrderItem { id: string; name: string; qty: number; mods: string | null; unitPrice: number; }
interface Order {
  id: string; number: string; tableNumber: number; status: OrderStatus;
  note: string | null; total: number; placedAt: number; items: OrderItem[];
}

const STATUS_META: Record<OrderStatus, {
  label: string; variant: 'amber' | 'blue' | 'emerald' | 'stone' | 'red';
  next: OrderStatus | null; nextLabel: string; dot: string;
}> = {
  PENDING:   { label: 'Pending',   variant: 'amber',   next: 'PREPARING', nextLabel: 'Start preparing', dot: 'bg-amber-400' },
  PREPARING: { label: 'Preparing', variant: 'blue',    next: 'READY',     nextLabel: 'Mark ready',      dot: 'bg-blue-400' },
  READY:     { label: 'Ready',     variant: 'emerald', next: 'COMPLETED', nextLabel: 'Mark served',     dot: 'bg-emerald-500' },
  COMPLETED: { label: 'Completed', variant: 'stone',   next: null,        nextLabel: '',                dot: 'bg-stone-300' },
  CANCELLED: { label: 'Cancelled', variant: 'red',     next: null,        nextLabel: '',                dot: 'bg-red-400' },
};

const FILTER_OPTS = [
  { id: 'all', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'PREPARING', label: 'Preparing' },
  { id: 'READY', label: 'Ready' },
  { id: 'COMPLETED', label: 'Completed' },
];

/* ─── New Order Modal ──────────────────────────────────────────────── */

interface MenuItemOption { id: string; name: string; price: number; categoryName: string; }
interface TableOption { id: string; number: number; }

interface NewOrderFormProps {
  onClose: () => void;
  onCreated: (order: Order) => void;
}

function NewOrderModal({ onClose, onCreated }: NewOrderFormProps) {
  const [tables, setTables] = useState<TableOption[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tableId, setTableId] = useState('');
  const [note, setNote] = useState('');
  const [cart, setCart] = useState<{ id: string; qty: number; mods: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load tables + menu on mount
  const load = useCallback(async () => {
    if (loaded) return;
    const [tRes, mRes] = await Promise.all([fetch('/api/tables'), fetch('/api/menu')]);
    const [tData, mData] = await Promise.all([tRes.json(), mRes.json()]);
    setTables((tData.tables ?? []).map((t: { id: string; number: number }) => ({ id: t.id, number: t.number })));
    setMenuItems((mData.items ?? []).filter((i: { available: boolean }) => i.available).map((i: { id: string; name: string; price: number; category: { name: string } }) => ({
      id: i.id, name: i.name, price: Number(i.price), categoryName: i.category?.name ?? '',
    })));
    if (tData.tables?.length) setTableId(tData.tables[0].id);
    setLoaded(true);
  }, [loaded]);

  // Run load on render
  if (!loaded) { load(); }

  function addItem(id: string) {
    setCart(prev => {
      const ex = prev.find(c => c.id === id);
      if (ex) return prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id, qty: 1, mods: '' }];
    });
  }
  function removeItem(id: string) { setCart(prev => prev.filter(c => c.id !== id)); }
  function updateMods(id: string, mods: string) { setCart(prev => prev.map(c => c.id === id ? { ...c, mods } : c)); }

  const total = cart.reduce((s, c) => {
    const item = menuItems.find(m => m.id === c.id);
    return s + (item?.price ?? 0) * c.qty;
  }, 0);

  async function handleSubmit() {
    if (!tableId || cart.length === 0) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId,
        note: note || undefined,
        items: cart.map(c => ({ menuItemId: c.id, quantity: c.qty, modifiers: c.mods || undefined })),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const { order } = await res.json();
      onCreated({
        id: order.id,
        number: order.number,
        tableNumber: order.table?.number ?? 0,
        status: order.status,
        note: order.note ?? null,
        total: Number(order.total),
        placedAt: 0,
        items: order.items.map((i: { id: string; menuItem: { name: string }; quantity: number; modifiers?: string; unitPrice: number }) => ({
          id: i.id, name: i.menuItem.name, qty: i.quantity, mods: i.modifiers ?? null, unitPrice: Number(i.unitPrice),
        })),
      });
      onClose();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to create order.');
    }
  }

  // Group items by category for display
  const grouped = menuItems.reduce<Record<string, MenuItemOption[]>>((acc, item) => {
    acc[item.categoryName] = acc[item.categoryName] ?? [];
    acc[item.categoryName].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      {/* Table selector */}
      <div>
        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>Table *</label>
        <select
          value={tableId}
          onChange={e => setTableId(e.target.value)}
          className="w-full px-3 py-2 border rounded-[10px] text-[13.5px] outline-none appearance-none"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
        >
          {tables.map(t => <option key={t.id} value={t.id}>Table {t.number}</option>)}
        </select>
      </div>

      {/* Menu items */}
      <div>
        <div className="text-[12px] font-semibold mb-2" style={{ color: '#57534e' }}>Items *</div>
        <div className="rounded-[12px] border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider sticky top-0" style={{ background: 'var(--canvas-2)', color: 'var(--muted)' }}>{cat}</div>
                {catItems.map(item => {
                  const inCart = cart.find(c => c.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{item.name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>{formatCurrency(item.price)}</div>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => inCart.qty > 1 ? setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: c.qty - 1 } : c)) : removeItem(item.id)}
                            className="w-6 h-6 rounded-md border flex items-center justify-center text-[14px] font-bold transition-colors hover:bg-stone-100"
                            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                          >−</button>
                          <span className="text-[13px] font-semibold w-4 text-center">{inCart.qty}</span>
                          <button
                            onClick={() => addItem(item.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[14px] font-bold text-white transition-opacity hover:opacity-90"
                            style={{ background: 'var(--brand-1)' }}
                          >+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem(item.id)}
                          className="text-[11.5px] font-bold px-2.5 py-1 rounded-lg text-white"
                          style={{ background: 'var(--brand-1)' }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {!loaded && (
              <div className="px-4 py-6 text-center text-[13px]" style={{ color: 'var(--muted)' }}>Loading…</div>
            )}
          </div>
        </div>
      </div>

      {/* Modifiers for cart items */}
      {cart.length > 0 && (
        <div>
          <div className="text-[12px] font-semibold mb-2" style={{ color: '#57534e' }}>Modifiers / notes per item</div>
          <div className="flex flex-col gap-2">
            {cart.map(c => {
              const item = menuItems.find(m => m.id === c.id);
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="text-[13px] font-medium w-4 text-center" style={{ color: 'var(--brand-text)' }}>{c.qty}×</span>
                  <span className="text-[13px] font-medium flex-shrink-0 w-32 truncate">{item?.name}</span>
                  <input
                    value={c.mods}
                    onChange={e => updateMods(c.id, e.target.value)}
                    placeholder="e.g. Oat milk, extra shot"
                    className="flex-1 px-2.5 py-1.5 border rounded-[8px] text-[12px] outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note */}
      <div>
        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>Order note (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. Birthday candle, allergen note…"
          className="w-full px-3 py-2 border rounded-[10px] text-[13.5px] outline-none resize-none"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
          onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-tint)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {error && <div className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-[10px]">{error}</div>}

      {/* Footer */}
      <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-fraunces)' }}>
          Total: {formatCurrency(total)}
        </span>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-[10px] border text-[13px] font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} disabled={saving}>
            Cancel
          </button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !tableId || cart.length === 0}>
            {saving ? 'Placing…' : 'Place order'}
            {!saving && <NavIcon name="arrow-right" size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Orders List ──────────────────────────────────────────────────── */

function printReceipt(order: Order) {
  const w = window.open('', '_blank', 'width=380,height=620');
  if (!w) return;
  const rows = order.items.map(i =>
    `<div class="row"><span>${i.qty}× ${i.name}${i.mods ? ` <small>(${i.mods})</small>` : ''}</span><span>${formatCurrency(i.unitPrice * i.qty)}</span></div>`
  ).join('');
  w.document.write(`<!DOCTYPE html><html><head><title>Receipt ${order.number}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; font-size: 13px; padding: 24px; max-width: 320px; margin: 0 auto; }
      h1 { text-align: center; font-size: 18px; letter-spacing: 3px; margin: 0 0 4px; }
      .sub { text-align: center; font-size: 11px; color: #666; margin-bottom: 12px; }
      hr { border: none; border-top: 1px dashed #999; margin: 12px 0; }
      .row { display: flex; justify-content: space-between; gap: 8px; margin: 4px 0; }
      .total { font-weight: bold; font-size: 15px; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
      .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #666; }
      small { color: #888; }
      @media print { button { display: none; } }
    </style></head><body>
    <h1>BREWLINE</h1>
    <p class="sub">${order.number} &nbsp;·&nbsp; Table ${order.tableNumber}</p>
    <hr/>${rows}
    <div class="row total"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></div>
    <p class="footer">Thank you for dining with us!<br/>${new Date().toLocaleString()}</p>
    <script>window.onload = () => { window.print(); }</script>
    </body></html>`);
  w.document.close();
}

function mapApiOrders(raw: ApiOrder[]): Order[] {
  return raw.map(o => ({
    id: o.id,
    number: o.number,
    tableNumber: o.table.number,
    status: o.status,
    note: o.note ?? null,
    total: Number(o.total),
    placedAt: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000),
    items: o.items.map(i => ({
      id: i.id,
      name: i.menuItem.name,
      qty: i.quantity,
      mods: i.modifiers ?? null,
      unitPrice: Number(i.unitPrice),
    })),
  }));
}

interface ApiOrder {
  id: string; number: string; status: OrderStatus; note: string | null;
  total: string | number; createdAt: string;
  table: { number: number };
  items: { id: string; quantity: number; modifiers?: string | null; unitPrice: string | number; menuItem: { name: string } }[];
}

const POLL_INTERVAL = 15_000;

export function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState('all');
  const [activeId, setActiveId] = useState(initialOrders[0]?.id ?? '');
  const [isPending, startTransition] = useTransition();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const fetchOrders = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/orders?limit=100');
      if (res.ok) {
        const { orders: raw } = await res.json();
        const mapped = mapApiOrders(raw as ApiOrder[]);
        setOrders(mapped);
        setLastUpdated(new Date());
        if (!mapped.find(o => o.id === activeIdRef.current) && mapped.length > 0) {
          setActiveId(mapped[0].id);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const active = orders.find(o => o.id === activeId) ?? filtered[0];

  const counts: Record<string, number> = {
    all: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    PREPARING: orders.filter(o => o.status === 'PREPARING').length,
    READY: orders.filter(o => o.status === 'READY').length,
    COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
  };

  function advance(id: string) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const next = STATUS_META[order.status].next;
    if (!next) return;
    startTransition(async () => {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) setOrders(prev => prev.map(o => o.id === id ? { ...o, status: next } : o));
    });
  }

  async function cancelOrder(id: string) {
    setCancelling(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    setCancelling(false);
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o));
      setCancelTarget(null);
    }
  }

  return (
    <div className="p-8 pb-12 max-w-[1400px] mx-auto w-full">
      {/* Page head */}
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight m-0" style={{ fontFamily: 'var(--font-fraunces)' }}>Orders</h2>
          <p className="text-[13.5px] mt-1 m-0" style={{ color: 'var(--muted)' }}>
            {orders.length} today · updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={fetchOrders} disabled={refreshing}>
            <span style={{ display: 'inline-flex', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>
              <NavIcon name="refresh" size={14} />
            </span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button variant="primary" size="md" onClick={() => setNewOrderOpen(true)}><NavIcon name="plus" size={14} />New order</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTER_OPTS.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all duration-150"
            style={{
              background: filter === t.id ? 'var(--text)' : '#fff',
              color: filter === t.id ? 'var(--canvas)' : '#57534e',
              borderColor: filter === t.id ? 'var(--text)' : 'var(--border)',
            }}
          >
            {t.label} <span className="text-[11px] opacity-60 font-semibold">{counts[t.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Layout */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 380px', alignItems: 'start' }}>
        {/* List */}
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[14px]" style={{ color: 'var(--muted)' }}>No orders found</div>
          )}
          {filtered.map(o => {
            const meta = STATUS_META[o.status];
            return (
              <button
                key={o.id}
                onClick={() => setActiveId(o.id)}
                className="flex items-center gap-3.5 p-4 rounded-[14px] border text-left transition-all duration-150 hover:border-stone-300"
                style={{
                  background: '#fff',
                  borderColor: o.id === activeId ? 'var(--brand-1)' : 'var(--border)',
                  boxShadow: o.id === activeId ? '0 0 0 3px var(--brand-tint)' : 'none',
                }}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-medium" style={{ fontFamily: 'var(--font-fraunces)' }}>{o.number}</span>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>
                    Table {o.tableNumber} · {o.placedAt} min ago · {o.items.reduce((s, i) => s + i.qty, 0)} items
                  </div>
                </div>
                <div className="text-[16px] font-medium flex-shrink-0" style={{ fontFamily: 'var(--font-fraunces)' }}>
                  {formatCurrency(o.total)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {active && (
          <aside
            className="rounded-[18px] border p-5 flex flex-col gap-4 sticky top-[100px]"
            style={{ background: '#fff', borderColor: 'var(--border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.1em] font-semibold" style={{ color: 'var(--muted)' }}>Ticket</div>
                <h3 className="text-[24px] font-semibold tracking-tight my-0.5" style={{ fontFamily: 'var(--font-fraunces)' }}>{active.number}</h3>
                <div className="text-[12.5px]" style={{ color: 'var(--muted)' }}>Table {active.tableNumber} · {active.placedAt} min ago</div>
              </div>
              <Badge variant={STATUS_META[active.status].variant} size="md">{STATUS_META[active.status].label}</Badge>
            </div>

            <div className="flex flex-col gap-3 py-4 border-y" style={{ borderColor: 'var(--border)' }}>
              {active.items.map((it, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-[14px] font-medium min-w-[28px]" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--brand-text)' }}>
                    {it.qty}×
                  </span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold">{it.name}</div>
                    {it.mods && <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>{it.mods}</div>}
                  </div>
                  <div className="text-[13px] font-medium flex-shrink-0" style={{ color: 'var(--muted)' }}>
                    {formatCurrency(it.unitPrice * it.qty)}
                  </div>
                </div>
              ))}
            </div>

            {active.note && (
              <div className="rounded-xl p-3 text-[12.5px]" style={{ background: 'var(--brand-tint)', color: 'var(--brand-text)' }}>
                <strong className="block mb-1 text-[11.5px] uppercase tracking-wide">Note from guest</strong>
                <p className="m-0 leading-relaxed">{active.note}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13px]" style={{ color: 'var(--muted)' }}>
                <span>Subtotal</span><span>{formatCurrency(active.total / 1.06)}</span>
              </div>
              <div className="flex justify-between text-[13px]" style={{ color: 'var(--muted)' }}>
                <span>Tax (6%)</span><span>{formatCurrency(active.total - active.total / 1.06)}</span>
              </div>
              <div className="flex justify-between text-[16px] font-bold pt-2 border-t mt-1" style={{ borderColor: 'var(--border)' }}>
                <span>Total</span><span>{formatCurrency(active.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {STATUS_META[active.status].next ? (
                <Button variant="primary" block onClick={() => advance(active.id)} disabled={isPending}>
                  {STATUS_META[active.status].nextLabel}
                  <NavIcon name="arrow-right" size={14} />
                </Button>
              ) : (
                <Button variant="ghost" block onClick={() => printReceipt(active)}>
                  <NavIcon name="print" size={14} /> Print receipt
                </Button>
              )}
              {(active.status === 'PENDING' || active.status === 'PREPARING') && (
                <button
                  onClick={() => setCancelTarget(active.id)}
                  className="w-full py-2 rounded-[10px] text-[13px] font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                >
                  Cancel order
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* New order modal */}
      <Modal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} title="New order" size="lg">
        <NewOrderModal
          onClose={() => setNewOrderOpen(false)}
          onCreated={(order) => {
            setOrders(prev => [order, ...prev]);
            setActiveId(order.id);
          }}
        />
      </Modal>

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelOrder(cancelTarget)}
        title="Cancel order"
        message="Are you sure you want to cancel this order? This cannot be undone."
        confirmLabel="Cancel order"
        danger
        loading={cancelling}
      />
    </div>
  );
}
