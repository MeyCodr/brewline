import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createTableSchema = z.object({
  number: z.number().int().positive(),
  seats: z.number().int().positive().max(20),
});

export async function GET() {
  const tables = await db.table.findMany({
    include: {
      orders: {
        where: { status: { in: ['PENDING', 'PREPARING', 'READY'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { number: 'asc' },
  });
  return NextResponse.json({ tables });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const existing = await db.table.findUnique({ where: { number: parsed.data.number } });
  if (existing) {
    return NextResponse.json({ error: 'Table number already exists' }, { status: 409 });
  }

  const table = await db.table.create({ data: parsed.data });
  return NextResponse.json({ table }, { status: 201 });
}
