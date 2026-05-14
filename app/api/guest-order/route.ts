import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { generateOrderNumber } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  tableId: z.string().min(1),
  note: z.string().max(500).optional(),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'guest';
  const { ok } = rateLimit(`guest-order:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { tableId, note, items } = parsed.data;

  const table = await db.table.findUnique({ where: { id: tableId } });
  if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

  const menuItems = await db.menuItem.findMany({
    where: { id: { in: items.map(i => i.menuItemId) }, available: true },
  });

  if (menuItems.length !== items.length) {
    return NextResponse.json({ error: 'One or more items are unavailable' }, { status: 400 });
  }

  const total = items.reduce((sum, i) => {
    const mi = menuItems.find(m => m.id === i.menuItemId)!;
    return sum + Number(mi.price) * i.quantity;
  }, 0);

  const order = await db.order.create({
    data: {
      number: generateOrderNumber(),
      tableId,
      note,
      total,
      status: 'PREPARING',
      items: {
        create: items.map(i => {
          const mi = menuItems.find(m => m.id === i.menuItemId)!;
          return { menuItemId: i.menuItemId, quantity: i.quantity, unitPrice: mi.price };
        }),
      },
    },
    select: { number: true, total: true },
  });

  return NextResponse.json({ order }, { status: 201 });
}
