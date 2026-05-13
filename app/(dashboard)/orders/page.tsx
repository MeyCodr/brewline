import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { OrdersClient } from '@/components/orders/OrdersClient';

export const metadata: Metadata = { title: 'Orders' };
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  await auth();

  const orders = await db.order.findMany({
    include: {
      table: { select: { number: true } },
      items: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const serialized = orders.map(o => ({
    id: o.id,
    number: o.number,
    tableNumber: o.table.number,
    status: o.status,
    note: o.note ?? null,
    total: Number(o.total),
    placedAt: Math.floor((Date.now() - o.createdAt.getTime()) / 60000),
    items: o.items.map(i => ({
      id: i.id,
      name: i.menuItem.name,
      qty: i.quantity,
      mods: i.modifiers ?? null,
      unitPrice: Number(i.unitPrice),
    })),
  }));

  return (
    <>
      <Topbar title="Orders" subtitle="Tickets from the floor and QR menu." />
      <OrdersClient initialOrders={serialized} />
    </>
  );
}
