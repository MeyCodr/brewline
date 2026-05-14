import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = { title: 'Dashboard' };
export const revalidate = 30;

async function getRevenueSeries(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const orders = await db.order.findMany({
    where: { createdAt: { gte: since }, status: 'COMPLETED' },
    select: { total: true, createdAt: true },
  });
  const byDay: Record<string, number> = {};
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] ?? 0) + Number(o.total);
  }
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const label = days === 7
      ? d.toLocaleDateString('en-US', { weekday: 'short' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { day: label, value: byDay[key] ?? 0 };
  });
}

export default async function DashboardPage() {
  const session = await auth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orders, tables, topItems, revenue7d, revenue30d, revenue90d] = await Promise.all([
    db.order.findMany({ where: { createdAt: { gte: today } }, orderBy: { createdAt: 'desc' } }),
    db.table.findMany({ orderBy: { number: 'asc' } }),
    db.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true },
      where: { order: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    getRevenueSeries(7),
    getRevenueSeries(30),
    getRevenueSeries(90),
  ]);

  const topItemIds = topItems.map(t => t.menuItemId);
  const topMenuItems = await db.menuItem.findMany({ where: { id: { in: topItemIds } } });

  const topSellers = topItems.map(t => ({
    name: topMenuItems.find(m => m.id === t.menuItemId)?.name ?? 'Unknown',
    qty: t._sum.quantity ?? 0,
    imageUrl: topMenuItems.find(m => m.id === t.menuItemId)?.imageUrl ?? null,
  }));

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <Topbar title="Today's overview" subtitle="A live snapshot of the cafe." />
      <DashboardClient
        userName={session?.user?.name?.split(' ')[0] ?? 'there'}
        stats={{
          totalRevenue,
          ordersCount: orders.length,
          avgTicket: orders.length ? totalRevenue / orders.length : 0,
          tablesOccupied: tables.filter(t => t.status === 'OCCUPIED').length,
          tablesTotal: tables.length,
          pending: orders.filter(o => o.status === 'PREPARING').length,
          ready: orders.filter(o => o.status === 'READY').length,
        }}
        topSellers={topSellers}
        revenue7d={revenue7d}
        revenue30d={revenue30d}
        revenue90d={revenue90d}
      />
    </>
  );
}
