import { Metadata } from 'next';
import { db } from '@/lib/db';
import { KitchenClient } from '@/components/kitchen/KitchenClient';

export const metadata: Metadata = { title: 'Kitchen' };
export const dynamic = 'force-dynamic';

export default async function KitchenPage() {
  const orders = await db.order.findMany({
    where: { status: { in: ['PREPARING', 'READY'] } },
    include: {
      table: { select: { number: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const serialized = orders.map(o => ({
    id: o.id,
    number: o.number,
    tableNumber: o.table.number,
    status: o.status as 'PREPARING' | 'READY',
    note: o.note ?? null,
    placedAt: Math.floor((Date.now() - o.createdAt.getTime()) / 60000),
    items: o.items.map(i => ({
      name: i.menuItem.name,
      qty: i.quantity,
      mods: i.modifiers ?? null,
    })),
  }));

  return <KitchenClient initialOrders={serialized} />;
}
