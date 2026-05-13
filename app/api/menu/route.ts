import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  price: z.number().positive().max(9999),
  categoryId: z.string().min(1),
  imageUrl: z.string().refine(
    v => v.startsWith('/uploads/') || /^https?:\/\//i.test(v),
    'Must be a valid URL or an uploaded image path'
  ).optional().nullable(),
  featured: z.boolean().optional().default(false),
  available: z.boolean().optional().default(true),
});

export async function GET() {
  const items = await db.menuItem.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
  });
  const categories = await db.category.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ items, categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const item = await db.menuItem.create({ data: parsed.data, include: { category: true } });
  return NextResponse.json({ item }, { status: 201 });
}
