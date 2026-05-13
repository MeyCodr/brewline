'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Item { id: string; name: string; description: string; price: number; categoryId: string; imageUrl: string | null; featured: boolean; available: boolean; }
interface Category { id: string; name: string; icon: string; }
interface CartEntry { id: string; qty: number; }

interface Props {
  table: { id: string; number: number; seats: number };
  categories: Category[];
  items: Item[];
}

export function GuestMenuClient({ table, categories, items }: Props) {
  const [cat, setCat] = useState(categories[0]?.id ?? '');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');

  const catItems = items.filter(i => i.categoryId === cat);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => {
    const item = items.find(i => i.id === c.id);
    return s + (item?.price ?? 0) * c.qty;
  }, 0);

  function addToCart(id: string) {
    setCart(prev => {
      const ex = prev.find(c => c.id === id);
      if (ex) return prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id, qty: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    setCart(prev => {
      const next = prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0);
      return next;
    });
  }

  async function placeOrder() {
    setPlacing(true);
    setOrderError('');
    try {
      const res = await fetch('/api/guest-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: table.id,
          note: note.trim() || undefined,
          items: cart.map(c => ({ menuItemId: c.id, quantity: c.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setOrderNumber(data.order.number);
        setCart([]);
        setNote('');
      }
    } catch {
      setOrderError('Network error. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAFAF7', fontFamily: 'var(--font-inter)' }}>
      {/* Hero */}
      <div
        className="relative h-[150px]"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(28,25,23,0.2), rgba(28,25,23,0.8))' }} />
        <div className="relative h-full flex flex-col justify-end text-white" style={{ padding: '20px 18px 16px' }}>
          <div className="text-[10px] uppercase tracking-[0.1em] opacity-80">Welcome to</div>
          <div className="text-[26px] font-medium leading-none mt-0.5" style={{ fontFamily: 'var(--font-fraunces)' }}>Brewline</div>
          <div className="text-[11px] opacity-80 mt-0.5">
            Table {table.number} · {new Date().toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '16px 18px 8px' }}>
        <div className="text-[22px] font-semibold" style={{ fontFamily: 'var(--font-fraunces)' }}>Our menu</div>
        <div className="text-[12px] mt-0.5" style={{ color: '#78716c' }}>Tap to add — we'll bring it to your table</div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto" style={{ padding: '8px 18px 4px' }}>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[12px] font-semibold flex-shrink-0 transition-all"
            style={{
              background: cat === c.id ? '#1c1917' : '#fff',
              color: cat === c.id ? '#fff' : '#57534e',
              borderColor: cat === c.id ? '#1c1917' : 'var(--border)',
            }}
          >
            <span>{c.icon}</span>{c.name}
          </button>
        ))}
      </div>

      {/* Section title */}
      <div className="text-[18px] font-semibold" style={{ fontFamily: 'var(--font-fraunces)', padding: '14px 18px 6px' }}>
        {categories.find(c => c.id === cat)?.name}
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2.5" style={{ padding: '0 18px' }}>
        {catItems.map(it => {
          const inCart = cart.find(c => c.id === it.id);
          return (
            <div
              key={it.id}
              className="flex gap-3 bg-white p-2.5 rounded-[14px] border"
              style={{ opacity: it.available ? 1 : 0.55, borderColor: 'var(--border)' }}
            >
              <div
                className="relative w-20 h-20 rounded-[10px] flex-shrink-0 overflow-hidden"
                style={{ background: 'var(--canvas-2)' }}
              >
                {it.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                )}
                {it.featured && (
                  <span className="absolute top-1.5 left-1.5 bg-white/95 rounded-full flex items-center justify-center text-[10px] z-10" style={{ color: 'var(--brand-text)', width: 18, height: 18 }}>★</span>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="text-[13.5px] font-semibold">{it.name}</div>
                <div className="text-[11.5px] leading-snug mt-0.5 flex-1" style={{ color: '#78716c' }}>{it.description}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[14px] font-medium" style={{ fontFamily: 'var(--font-fraunces)' }}>{formatCurrency(it.price)}</span>
                  {it.available ? (
                    inCart ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => changeQty(it.id, -1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[14px] font-bold"
                          style={{ background: '#f5f5f4', color: '#1c1917' }}
                        >−</button>
                        <span className="text-[13px] font-bold w-4 text-center">{inCart.qty}</span>
                        <button
                          onClick={() => addToCart(it.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[14px] font-bold text-white"
                          style={{ background: '#1c1917' }}
                        >+</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(it.id)}
                        className="text-white px-3.5 py-1.5 rounded-full text-[11.5px] font-bold"
                        style={{ background: '#1c1917' }}
                      >Add</button>
                    )
                  ) : (
                    <span className="text-[11px] font-semibold" style={{ color: '#a8a29e' }}>Sold out</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {catItems.length === 0 && (
          <p className="text-center py-8 text-[14px]" style={{ color: '#a8a29e' }}>No items in this category</p>
        )}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-4 right-4 rounded-[14px] flex items-center justify-between gap-2.5 px-4 py-3 text-white cursor-pointer"
          style={{ background: '#1c1917', boxShadow: '0 10px 30px -8px rgba(0,0,0,0.4)', zIndex: 40 }}
        >
          <span className="text-[12px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>{cartCount}</span>
          <span className="text-[13px] font-bold flex-1 text-center">View cart</span>
          <span className="text-[15px] font-medium" style={{ fontFamily: 'var(--font-fraunces)' }}>{formatCurrency(cartTotal)}</span>
        </button>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40"
            style={{ zIndex: 50 }}
            onClick={() => { if (!placing) setCartOpen(false); }}
          />
          <div
            className="fixed bottom-0 left-0 right-0 rounded-t-[24px] bg-white flex flex-col"
            style={{ zIndex: 51, maxHeight: '85vh' }}
          >
            {/* Drawer handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#e7e5e4' }} />
            </div>

            {/* Success state */}
            {orderNumber ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-3xl">✓</div>
                <div className="text-[22px] font-semibold text-center" style={{ fontFamily: 'var(--font-fraunces)' }}>Order placed!</div>
                <div className="text-[13px] text-center" style={{ color: '#78716c' }}>
                  Order <span className="font-bold text-[#1c1917]">#{orderNumber}</span> sent to the kitchen.<br />We'll bring it to Table {table.number}.
                </div>
                <button
                  onClick={() => { setOrderNumber(null); setCartOpen(false); }}
                  className="mt-2 w-full py-3.5 rounded-[14px] text-white text-[14px] font-bold"
                  style={{ background: '#1c1917' }}
                >
                  Back to menu
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#f5f5f4' }}>
                  <span className="text-[17px] font-semibold" style={{ fontFamily: 'var(--font-fraunces)' }}>Your cart</span>
                  <button onClick={() => setCartOpen(false)} className="text-[20px] leading-none" style={{ color: '#78716c' }}>×</button>
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
                  {cart.map(entry => {
                    const item = items.find(i => i.id === entry.id);
                    if (!item) return null;
                    return (
                      <div key={entry.id} className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-[10px] flex-shrink-0 overflow-hidden"
                          style={{ background: '#f5f5f4' }}
                        >
                          {item.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold truncate">{item.name}</div>
                          <div className="text-[12px]" style={{ color: '#78716c' }}>{formatCurrency(item.price)} each</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => changeQty(entry.id, -1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[16px] font-bold"
                            style={{ background: '#f5f5f4', color: '#1c1917' }}
                          >−</button>
                          <span className="text-[14px] font-bold w-5 text-center">{entry.qty}</span>
                          <button
                            onClick={() => changeQty(entry.id, 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[16px] font-bold text-white"
                            style={{ background: '#1c1917' }}
                          >+</button>
                        </div>
                        <span className="text-[14px] font-medium w-16 text-right flex-shrink-0" style={{ fontFamily: 'var(--font-fraunces)' }}>
                          {formatCurrency(item.price * entry.qty)}
                        </span>
                      </div>
                    );
                  })}

                  {/* Note */}
                  <div className="mt-1">
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>Special requests</label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Allergies, extra shots, no ice…"
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2 border rounded-[10px] text-[13px] outline-none resize-none"
                      style={{ borderColor: '#e7e5e4', color: '#1c1917' }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: '#f5f5f4' }}>
                  <div className="flex justify-between mb-4">
                    <span className="text-[14px] font-semibold">Total</span>
                    <span className="text-[18px] font-medium" style={{ fontFamily: 'var(--font-fraunces)' }}>{formatCurrency(cartTotal)}</span>
                  </div>
                  {orderError && (
                    <div className="mb-3 px-3 py-2 bg-red-50 text-red-600 text-[12px] rounded-[10px] border border-red-100">{orderError}</div>
                  )}
                  <button
                    onClick={placeOrder}
                    disabled={placing}
                    className="w-full py-3.5 rounded-[14px] text-white text-[14px] font-bold transition-opacity"
                    style={{ background: '#1c1917', opacity: placing ? 0.7 : 1 }}
                  >
                    {placing ? 'Placing order…' : `Place order · Table ${table.number}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
