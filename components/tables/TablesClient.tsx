'use client';

import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NavIcon } from '@/components/ui/NavIcon';
import { Modal } from '@/components/ui/Modal';

/* ── QR canvas helpers ─────────────────────────────────────────────── */

function drawQR(tableNumber: number): HTMLCanvasElement {
  const GRID = 21, CELL = 16, PAD = 20, FOOTER = 52;
  const size = GRID * CELL + PAD * 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size + FOOTER;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Data cells
  ctx.fillStyle = '#1c1917';
  for (let i = 0; i < GRID * GRID; i++) {
    const col = i % GRID, row = Math.floor(i / GRID);
    const s = (i * 9301 + tableNumber * 49297) % 233280;
    if ((s / 233280) > 0.5) ctx.fillRect(PAD + col * CELL, PAD + row * CELL, CELL, CELL);
  }

  // Finder patterns (top-left, top-right, bottom-left)
  const finder = (ox: number, oy: number) => {
    ctx.fillStyle = '#1c1917'; ctx.fillRect(PAD + ox, PAD + oy, 7 * CELL, 7 * CELL);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(PAD + ox + CELL, PAD + oy + CELL, 5 * CELL, 5 * CELL);
    ctx.fillStyle = '#1c1917'; ctx.fillRect(PAD + ox + 2 * CELL, PAD + oy + 2 * CELL, 3 * CELL, 3 * CELL);
  };
  finder(0, 0);
  finder((GRID - 7) * CELL, 0);
  finder(0, (GRID - 7) * CELL);

  // Label
  ctx.fillStyle = '#1c1917';
  ctx.font = `bold 13px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('BREWLINE', size / 2, size + 22);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText(`Table ${String(tableNumber).padStart(2, '0')}  ·  /menu/${String(tableNumber).padStart(2, '0')}`, size / 2, size + 42);
  return canvas;
}

function downloadQR(tableNumber: number) {
  const a = document.createElement('a');
  a.download = `table-${String(tableNumber).padStart(2, '0')}-qr.png`;
  a.href = drawQR(tableNumber).toDataURL('image/png');
  a.click();
}

function printSingleQR(tableNumber: number) {
  const dataUrl = drawQR(tableNumber).toDataURL('image/png');
  const w = window.open('', '_blank', 'width=420,height=520');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Table ${tableNumber} QR</title>
    <style>body{margin:24px;display:flex;flex-direction:column;align-items:center;font-family:system-ui}
    img{width:300px;height:auto;border:1px solid #e7e5e4;border-radius:12px;padding:12px}
    p{margin:8px 0 0;font-size:14px;font-weight:600}
    @media print{button{display:none}}</style></head><body>
    <img src="${dataUrl}" alt="QR Table ${tableNumber}"/>
    <p>Table ${tableNumber}</p>
    <script>window.onload=()=>window.print();</script></body></html>`);
  w.document.close();
}

function printAllQR(tables: { number: number }[]) {
  const items = tables.map(t => {
    const dataUrl = drawQR(t.number).toDataURL('image/png');
    return `<div class="item"><img src="${dataUrl}" alt="T${t.number}"/><p>Table ${t.number}</p></div>`;
  }).join('');
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>All QR Codes — Brewline</title>
    <style>*{box-sizing:border-box}body{font-family:system-ui;padding:20px}
    h1{text-align:center;font-size:20px;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    .item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px;border:1px solid #e7e5e4;border-radius:12px}
    .item img{width:160px;height:auto}
    .item p{margin:0;font-size:13px;font-weight:600}
    @media print{button{display:none}@page{size:A4;margin:12mm}}</style></head>
    <body><h1>Brewline — Table QR Codes</h1>
    <div class="grid">${items}</div>
    <script>window.onload=()=>setTimeout(()=>window.print(),300);</script></body></html>`);
  w.document.close();
}

type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'RESERVED';

interface Table { id: string; number: number; seats: number; status: TableStatus; }
interface Props {
  tables: Table[];
  stats: { available: number; occupied: number; cleaning: number };
}

const TABLE_STATUS_META: Record<TableStatus, { variant: 'amber' | 'emerald' | 'blue' | 'stone'; cls: string; label: string }> = {
  OCCUPIED:  { variant: 'amber',   cls: 'bg-amber-50  border-amber-300  text-amber-700',                        label: 'Occupied'  },
  AVAILABLE: { variant: 'emerald', cls: 'bg-white      border-[var(--border)] text-[var(--text)]',              label: 'Available' },
  CLEANING:  { variant: 'blue',    cls: 'bg-blue-50   border-blue-300   text-blue-700',                         label: 'Cleaning'  },
  RESERVED:  { variant: 'stone',   cls: 'bg-stone-50  border-stone-300  text-stone-600',                        label: 'Reserved'  },
};

const STATUS_TRANSITIONS: Record<TableStatus, { next: TableStatus; label: string }[]> = {
  AVAILABLE: [{ next: 'OCCUPIED', label: 'Mark occupied' }, { next: 'RESERVED', label: 'Mark reserved' }],
  OCCUPIED:  [{ next: 'CLEANING', label: 'Mark cleaning' }, { next: 'AVAILABLE', label: 'Mark available' }],
  CLEANING:  [{ next: 'AVAILABLE', label: 'Mark available' }],
  RESERVED:  [{ next: 'OCCUPIED', label: 'Mark occupied' }, { next: 'AVAILABLE', label: 'Mark available' }],
};

function QRPattern({ seed }: { seed: number }) {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const s = (i * 9301 + seed * 49297) % 233280;
    return (s / 233280) > 0.5;
  });
  return (
    <div className="relative w-[168px] h-[168px] mx-auto bg-white rounded-[10px] p-2" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="relative w-full h-full grid" style={{ gridTemplateColumns: 'repeat(21, 1fr)' }}>
        {cells.map((on, i) => (
          <span key={i} className="aspect-square" style={{ background: on ? '#1c1917' : 'transparent' }} />
        ))}
        {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }].map((pos, i) => (
          <div key={i} className="absolute w-8 h-8" style={{ ...pos as React.CSSProperties, background: '#1c1917' }}>
            <div className="absolute" style={{ inset: 5, background: '#fff' }} />
            <div className="absolute z-10" style={{ inset: 10, background: '#1c1917' }} />
          </div>
        ))}
        <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', padding: 4, borderRadius: 8 }}>
          <Logo size={26} />
        </div>
      </div>
    </div>
  );
}

export function TablesClient({ tables: initialTables }: Props) {
  const [tables, setTables] = useState(initialTables);
  const [active, setActive] = useState(initialTables[0]?.id ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ number: '', seats: '4' });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const table = tables.find(t => t.id === active) ?? tables[0];
  const stats = {
    available: tables.filter(t => t.status === 'AVAILABLE').length,
    occupied:  tables.filter(t => t.status === 'OCCUPIED').length,
    cleaning:  tables.filter(t => t.status === 'CLEANING').length,
  };

  async function updateStatus(id: string, status: TableStatus) {
    setUpdatingStatus(true);
    setTables(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    const res = await fetch(`/api/tables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdatingStatus(false);
    if (!res.ok) {
      const original = initialTables.find(t => t.id === id)?.status ?? 'AVAILABLE';
      setTables(prev => prev.map(t => t.id === id ? { ...t, status: original } : t));
    }
  }

  async function handleAddTable() {
    const num = parseInt(addForm.number, 10);
    const seats = parseInt(addForm.seats, 10);
    if (!num || !seats) { setAddError('Please fill all fields.'); return; }
    if (tables.some(t => t.number === num)) { setAddError(`Table ${num} already exists.`); return; }
    setSaving(true);
    setAddError('');
    const res = await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: num, seats }),
    });
    setSaving(false);
    if (res.ok) {
      const { table: newTable } = await res.json();
      setTables(prev => [...prev, { ...newTable, status: newTable.status as TableStatus }].sort((a, b) => a.number - b.number));
      setAddOpen(false);
      setAddForm({ number: '', seats: '4' });
    } else {
      const data = await res.json();
      setAddError(data.error ?? 'Failed to add table.');
    }
  }

  const gridAreas = ['t1 t2 t3 t4', 't5 t6 t6 t7', 't8 t9 t10 t10', 't11 t11 t12 t12'];

  return (
    <div className="p-8 pb-12 max-w-[1400px] mx-auto w-full">
      {/* Page head */}
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight m-0" style={{ fontFamily: 'var(--font-fraunces)' }}>Tables &amp; QR</h2>
          <p className="text-[13.5px] mt-1 m-0" style={{ color: 'var(--muted)' }}>
            {tables.length} tables · {stats.occupied} occupied · {stats.available} available · {stats.cleaning} resetting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={() => printAllQR(tables)}><NavIcon name="download" size={14} />Print all QR codes</Button>
          <Button variant="primary" size="md" onClick={() => setAddOpen(true)}><NavIcon name="plus" size={14} />Add table</Button>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 380px', alignItems: 'start' }}>
        {/* Floor plan */}
        <section className="bg-white border rounded-[18px] p-5" style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold m-0" style={{ fontFamily: 'var(--font-fraunces)' }}>Floor plan</h3>
            <div className="flex gap-3.5">
              {[
                { cls: 'bg-amber-400', label: 'Occupied' },
                { cls: 'bg-emerald-500', label: 'Available' },
                { cls: 'bg-blue-400', label: 'Resetting' },
              ].map(l => (
                <span key={l.label} className="inline-flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--muted)' }}>
                  <span className={`w-2 h-2 rounded-full ${l.cls}`} />{l.label}
                </span>
              ))}
            </div>
          </div>

          <div
            className="relative rounded-[14px] p-6 overflow-hidden"
            style={{
              background: 'repeating-linear-gradient(45deg, var(--canvas) 0, var(--canvas) 10px, var(--canvas-2) 10px, var(--canvas-2) 20px)',
              minHeight: 480,
            }}
          >
            <div className="absolute text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ top: 8, left: '50%', transform: 'translateX(-50%)', color: 'var(--muted)' }}>Window</div>
            <div className="absolute text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ right: 12, top: '50%', transform: 'rotate(90deg) translateX(50%)', transformOrigin: 'right', color: 'var(--muted)' }}>Bar</div>
            <div className="absolute text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ bottom: 8, right: 16, color: 'var(--muted)' }}>Kitchen</div>

            <div
              className="grid gap-3.5 h-[460px] p-2"
              style={{
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)',
                gridTemplateAreas: gridAreas.map(r => `"${r}"`).join(' '),
              }}
            >
              {tables.slice(0, 12).map(t => {
                const meta = TABLE_STATUS_META[t.status];
                return (
                  <button
                    key={t.id}
                    onClick={() => setActive(t.id)}
                    className={`relative rounded-[14px] border-2 flex flex-col items-center justify-center gap-0.5 font-semibold text-[13px] transition-all duration-150 hover:-translate-y-0.5 ${meta.cls}`}
                    style={{
                      gridArea: `t${t.number}`,
                      boxShadow: t.id === active ? '0 0 0 4px var(--brand-tint)' : undefined,
                      borderColor: t.id === active ? 'var(--brand-1)' : undefined,
                    }}
                  >
                    <span className="text-[22px] font-medium leading-none" style={{ fontFamily: 'var(--font-fraunces)' }}>{t.number}</span>
                    <span className="text-[10.5px] opacity-70 font-medium">{t.seats} seats</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Detail panel */}
        {table && (
          <aside className="bg-white border rounded-[18px] p-5 flex flex-col gap-4 sticky top-[100px]" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.1em] font-semibold" style={{ color: 'var(--muted)' }}>Table</div>
                <h3 className="text-[24px] font-semibold tracking-tight my-0.5" style={{ fontFamily: 'var(--font-fraunces)' }}>No. {table.number}</h3>
                <div className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{table.seats} seats</div>
              </div>
              <Badge variant={TABLE_STATUS_META[table.status].variant} size="md">{TABLE_STATUS_META[table.status].label}</Badge>
            </div>

            {/* Status actions */}
            <div className="flex flex-col gap-1.5">
              {STATUS_TRANSITIONS[table.status].map(({ next, label }) => (
                <button
                  key={next}
                  onClick={() => updateStatus(table.id, next)}
                  disabled={updatingStatus}
                  className="flex items-center gap-2 px-3 py-2 rounded-[10px] border text-[13px] font-medium text-left transition-colors hover:bg-stone-50 disabled:opacity-50"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${next === 'OCCUPIED' ? 'bg-amber-400' : next === 'AVAILABLE' ? 'bg-emerald-500' : next === 'CLEANING' ? 'bg-blue-400' : 'bg-stone-300'}`} />
                  {label}
                </button>
              ))}
            </div>

            {/* QR code */}
            <div className="rounded-[14px] p-5 text-center" style={{ background: 'var(--canvas)' }}>
              <QRPattern seed={table.number} />
              <div className="mt-3.5">
                <div className="text-[12px]" style={{ color: 'var(--muted)' }}>Scan to order</div>
                <div className="text-[12.5px] font-semibold mt-0.5" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                  /menu/{String(table.number).padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" block size="sm" onClick={() => downloadQR(table.number)}><NavIcon name="download" size={13} />Download</Button>
              <Button variant="ghost" block size="sm" onClick={() => printSingleQR(table.number)}><NavIcon name="print" size={13} />Print</Button>
            </div>

            {/* Recent activity */}
            <div className="pt-3.5 border-t" style={{ borderColor: 'var(--border)' }}>
              <h4 className="text-[11px] uppercase tracking-[0.1em] font-semibold m-0 mb-2.5" style={{ color: 'var(--muted)' }}>
                Recent activity
              </h4>
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {[
                  { time: '11:42', event: 'Order #A-0247 placed · 3 items' },
                  { time: '11:28', event: `Seated · party of ${table.seats}` },
                  { time: '10:55', event: 'Bussed & reset' },
                ].map((a, i) => (
                  <li key={i} className="flex gap-2.5 items-baseline text-[12.5px]" style={{ color: '#57534e' }}>
                    <span className="text-[11px] min-w-[38px]" style={{ fontFamily: 'var(--font-jetbrains)', color: 'var(--muted)' }}>{a.time}</span>
                    {a.event}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>

      {/* Add Table modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setAddError(''); }} title="Add table" size="sm">
        <div>
          <label className="block mb-3">
            <span className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>Table number *</span>
            <input
              type="number"
              min="1"
              value={addForm.number}
              onChange={e => setAddForm(p => ({ ...p, number: e.target.value }))}
              className="w-full px-3 py-2 border rounded-[10px] text-[13.5px] outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
              placeholder="e.g. 13"
              onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-tint)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </label>
          <label className="block mb-4">
            <span className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>Seats *</span>
            <select
              value={addForm.seats}
              onChange={e => setAddForm(p => ({ ...p, seats: e.target.value }))}
              className="w-full px-3 py-2 border rounded-[10px] text-[13.5px] outline-none appearance-none"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
            >
              {[2, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} seats</option>)}
            </select>
          </label>
          {addError && (
            <div className="mb-3 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-[10px]">{addError}</div>
          )}
          <div className="flex gap-2 justify-end border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => { setAddOpen(false); setAddError(''); }}
              className="px-4 py-2 rounded-[10px] border text-[13px] font-semibold"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              disabled={saving}
            >
              Cancel
            </button>
            <Button variant="primary" onClick={handleAddTable} disabled={saving || !addForm.number}>
              {saving ? 'Adding…' : 'Add table'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
