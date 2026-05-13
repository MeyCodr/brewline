'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardSub } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

type RevSeries = { day: string; value: number }[];

interface Props {
  userName: string;
  stats: {
    totalRevenue: number;
    ordersCount: number;
    avgTicket: number;
    tablesOccupied: number;
    tablesTotal: number;
    pending: number;
    ready: number;
  };
  topSellers: { name: string; qty: number; imageUrl?: string | null }[];
  revenue7d: RevSeries;
  revenue30d: RevSeries;
  revenue90d: RevSeries;
}

function RevenueChart({ data }: { data: { day: string; value: number }[] }) {
  const w = 560, h = 200, p = 24;
  if (data.length === 0) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 200 }}>
        <text x={w / 2} y={h / 2} textAnchor="middle" fontSize="13" fill="var(--muted)" fontFamily="Inter">No data yet</text>
      </svg>
    );
  }
  const max = Math.max(...data.map(d => d.value), 1);
  const span = Math.max(data.length - 1, 1);
  const x = (i: number) => p + (i * (w - p * 2)) / span;
  const y = (v: number) => h - p - ((v / max) * (h - p * 2));
  const linePath = data.map((d, i) => (i === 0 ? 'M' : 'L') + x(i) + ' ' + y(d.value)).join(' ');
  const areaPath = linePath + ` L ${x(data.length - 1)} ${h - p} L ${x(0)} ${h - p} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
      <defs>
        <linearGradient id="rev-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-1)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--brand-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={p} x2={w - p} y1={p + (h - p * 2) * f} y2={p + (h - p * 2) * f}
          stroke="var(--border)" strokeDasharray="3 4" />
      ))}
      <path d={areaPath} fill="url(#rev-grad)" />
      <path d={linePath} fill="none" stroke="var(--brand-1)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="#fff" stroke="var(--brand-1)" strokeWidth="2" />
          <text x={x(i)} y={h - 6} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="Inter">{d.day}</text>
        </g>
      ))}
    </svg>
  );
}

function StatCard({ label, value, delta, deltaPos, accent, sub, icon }: {
  label: string; value: string; delta?: string; deltaPos?: boolean;
  accent: string; sub?: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[18px] p-5 border transition-transform duration-150 hover:-translate-y-0.5"
      style={{ background: '#fff', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center justify-between mb-[18px]">
        <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center ${accent}`}>
          {icon}
        </div>
        {delta != null && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${deltaPos ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
              style={{ transform: deltaPos ? 'rotate(0)' : 'rotate(180deg)' }}>
              <path d="M7 14l5-5 5 5" />
            </svg>
            {delta}
          </span>
        )}
      </div>
      <div className="text-[30px] font-medium leading-none tracking-tight" style={{ fontFamily: 'var(--font-fraunces)' }}>
        {value}
      </div>
      <div className="text-[12.5px] font-medium mt-1.5" style={{ color: 'var(--muted)' }}>{label}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: '#a8a29e' }}>{sub}</div>}
    </div>
  );
}

function HourlyBars() {
  const hours = [
    { h: '7a', v: 14 }, { h: '8a', v: 32 }, { h: '9a', v: 48 }, { h: '10a', v: 41 },
    { h: '11a', v: 36 }, { h: '12p', v: 52 }, { h: '1p', v: 47 }, { h: '2p', v: 31 },
    { h: '3p', v: 28 }, { h: '4p', v: 22 }, { h: '5p', v: 18 },
  ];
  return (
    <div className="flex items-end gap-2" style={{ height: 180, paddingTop: 12 }}>
      {hours.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
          <div className="flex-1 w-full flex items-end">
            <div
              className="w-full rounded-t-[6px] rounded-b-[2px]"
              style={{
                height: `${(b.v / 60) * 100}%`,
                minHeight: 4,
                background: 'linear-gradient(180deg, var(--brand-1), var(--brand-2))',
              }}
            />
          </div>
          <div className="text-[10.5px] font-medium" style={{ color: 'var(--muted)' }}>{b.h}</div>
        </div>
      ))}
    </div>
  );
}

export function DashboardClient({ userName, stats, topSellers, revenue7d, revenue30d, revenue90d }: Props) {
  const [revPeriod, setRevPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const revData = revPeriod === '7d' ? revenue7d : revPeriod === '30d' ? revenue30d : revenue90d;
  const revTotal = revData.reduce((s, d) => s + d.value, 0);
  const revLabel = revPeriod === '7d' ? 'Last 7 days' : revPeriod === '30d' ? 'Last 30 days' : 'Last 90 days';

  return (
    <div className="flex flex-col gap-5 p-8 pb-12 max-w-[1400px] mx-auto w-full">
      {/* Hero */}
      <div
        className="relative rounded-[22px] overflow-hidden min-h-[240px]"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(28,25,23,0.85) 0%, rgba(28,25,23,0.55) 45%, rgba(28,25,23,0.15) 100%)' }} />
        <div className="relative p-8 text-white max-w-[640px]" style={{ padding: '32px 36px' }}>
          <div className="text-[12px] uppercase tracking-[0.08em] opacity-85">Friday morning · Bar 1 is open</div>
          <h2 className="text-[36px] font-medium leading-tight mt-1.5 mb-2 tracking-tight" style={{ fontFamily: 'var(--font-fraunces)' }}>
            Good morning, {userName}.
          </h2>
          <p className="text-[14px] opacity-85 max-w-[460px]">A calm start — beans ground for the rush.</p>
          <div className="flex gap-7 mt-5 items-center">
            {[
              { num: stats.ordersCount, label: 'Orders today' },
              null,
              { num: formatCurrency(stats.totalRevenue), label: 'Revenue' },
              null,
              { num: `${Math.round(stats.avgTicket / 60) || 4} min`, label: 'Avg ticket' },
            ].map((item, i) =>
              item === null ? (
                <div key={i} className="w-px h-9 opacity-25 bg-white" />
              ) : (
                <div key={i}>
                  <div className="text-[26px] font-medium" style={{ fontFamily: 'var(--font-fraunces)' }}>{item.num}</div>
                  <div className="text-[11px] opacity-70 uppercase tracking-[0.06em]">{item.label}</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Today's revenue" value={formatCurrency(stats.totalRevenue)} delta="12.4%" deltaPos accent="bg-amber-50 text-amber-700"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard label="Orders" value={String(stats.ordersCount)} delta="6" deltaPos accent="bg-blue-50 text-blue-700"
          sub={`${stats.pending} pending · ${stats.ready} ready`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
        />
        <StatCard label="Avg. ticket" value={formatCurrency(stats.avgTicket)} accent="bg-emerald-50 text-emerald-700"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>}
        />
        <StatCard label="Tables in use" value={`${stats.tablesOccupied} / ${stats.tablesTotal}`} delta={`${Math.round((stats.tablesOccupied / Math.max(stats.tablesTotal, 1)) * 100)}%`} deltaPos accent="bg-violet-50 text-violet-600"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 10h18M5 10v8M19 10v8M3 6h18l-1 4H4l-1-4z"/></svg>}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Revenue</CardTitle>
              <CardSub>{revLabel} · {formatCurrency(revTotal)} total</CardSub>
            </div>
            <div className="flex bg-stone-100 rounded-[10px] p-[3px]">
              {(['7d', '30d', '90d'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setRevPeriod(t)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: revPeriod === t ? '#fff' : 'transparent',
                    color: revPeriod === t ? 'var(--text)' : 'var(--muted)',
                    boxShadow: revPeriod === t ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </CardHeader>
          <RevenueChart data={revData} />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Hourly volume</CardTitle>
              <CardSub>Orders by hour · today</CardSub>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full" style={{ background: 'var(--brand-tint)', color: 'var(--brand-text)' }}>
              Peak 12p
            </span>
          </CardHeader>
          <HourlyBars />
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* Top sellers */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top sellers</CardTitle>
              <CardSub>This week</CardSub>
            </div>
            <Link href="/orders" className="text-[12px] font-semibold no-underline hover:underline" style={{ color: 'var(--brand-text)' }}>View all →</Link>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {topSellers.map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[14px] font-medium w-6" style={{ fontFamily: 'var(--font-fraunces)', color: '#a8a29e' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div
                  className="w-10 h-10 rounded-[10px] flex-shrink-0 overflow-hidden"
                  style={{ background: 'var(--canvas-2)', boxShadow: 'var(--shadow-sm)' }}
                >
                  {it.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{it.name}</div>
                  <div className="h-1 rounded-sm overflow-hidden mt-1" style={{ background: 'var(--canvas-2)' }}>
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${((it.qty / Math.max(topSellers[0]?.qty ?? 1, 1)) * 100)}%`,
                        background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2))',
                      }}
                    />
                  </div>
                </div>
                <span className="text-[16px] font-medium" style={{ fontFamily: 'var(--font-fraunces)' }}>{it.qty}</span>
              </div>
            ))}
            {topSellers.length === 0 && (
              <p className="text-[13px] text-center py-4" style={{ color: 'var(--muted)' }}>No data yet</p>
            )}
          </div>
        </Card>

        {/* On the floor */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>On the floor</CardTitle>
              <CardSub>Live status</CardSub>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" style={{ boxShadow: '0 0 0 4px rgba(16,185,129,0.18)' }} />
          </CardHeader>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { num: stats.pending, label: 'In prep', color: 'var(--amber-600, #d97706)' },
              { num: stats.ready, label: 'Ready', color: 'var(--emerald-600, #059669)' },
              { num: '4:12', label: 'Avg prep', color: 'var(--text)' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-3.5 text-center" style={{ background: 'var(--canvas-2)' }}>
                <div className="text-[24px] font-medium leading-none" style={{ fontFamily: 'var(--font-fraunces)', color: s.color }}>{s.num}</div>
                <div className="text-[11px] font-medium mt-1" style={{ color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { name: 'Maya Chen',    role: 'Barista · Bar 1', avatar: 'MC', status: 'on' },
              { name: 'Tomás Vidal',  role: 'Kitchen · Lead',  avatar: 'TV', status: 'on' },
              { name: 'Ren Park',     role: 'Floor',           avatar: 'RP', status: 'on' },
              { name: 'Aisha Bello',  role: 'Barista · Bar 2', avatar: 'AB', status: 'break' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: 'var(--canvas-2)', color: '#57534e' }}>
                  {s.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{s.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--muted)' }}>{s.role}</div>
                </div>
                <span className={`text-[10.5px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide ${s.status === 'on' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                  {s.status === 'on' ? 'On shift' : 'Break'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
