import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1).max(10),
});

export async function GET() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const agg = await db.category.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (agg._max.sortOrder ?? 0) + 1;

  const category = await db.category.create({ data: { ...parsed.data, sortOrder } });
  return NextResponse.json({ category }, { status: 201 });
}
