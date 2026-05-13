import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { generateOrderNumber } from '@/lib/utils';

const createOrderSchema = z.object({
  tableId: z.string().min(1),
  note: z.string().max(500).optional(),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().positive(),
    modifiers: z.string().max(200).optional(),
  })).min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);

  const orders = await db.order.findMany({
    where: status && status !== 'all' ? { status: status as 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' } : {},
    include: {
      table: { select: { number: true } },
      items: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { tableId, note, items } = parsed.data;

  const menuItems = await db.menuItem.findMany({
    where: { id: { in: items.map(i => i.menuItemId) }, available: true },
  });

  if (menuItems.length !== items.length) {
    return NextResponse.json({ error: 'One or more items unavailable' }, { status: 400 });
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
      items: {
        create: items.map(i => {
          const mi = menuItems.find(m => m.id === i.menuItemId)!;
          return { menuItemId: i.menuItemId, quantity: i.quantity, unitPrice: mi.price, modifiers: i.modifiers };
        }),
      },
    },
    include: {
      table: { select: { number: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ order }, { status: 201 });
}
