import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const STATUS_FLOW: Record<string, string | null> = {
  PREPARING: 'READY',
  READY:     'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
};

const updateSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']).optional(),
  note: z.string().max(500).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      table: true,
      items: { include: { menuItem: true } },
    },
  });

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const existing = await db.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (parsed.data.status) {
    const allowed = STATUS_FLOW[existing.status];
    const canCancel = parsed.data.status === 'CANCELLED' &&
      existing.status === 'PREPARING';
    if (parsed.data.status !== allowed && !canCancel) {
      return NextResponse.json({ error: `Cannot transition from ${existing.status} to ${parsed.data.status}` }, { status: 422 });
    }
  }

  const order = await db.order.update({
    where: { id },
    data: parsed.data,
    include: {
      table: { select: { number: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (order.status !== 'PREPARING') {
    return NextResponse.json({ error: 'Only orders being prepared can be deleted' }, { status: 422 });
  }

  await db.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
