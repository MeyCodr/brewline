import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  name:   z.string().min(2).max(80).optional(),
  role:   z.enum(['ADMIN', 'MANAGER', 'STAFF', 'KITCHEN']).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const sessionRole = (session?.user as { role?: string })?.role;
  if (!session || sessionRole !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Prevent deactivating yourself
  if (parsed.data.active === false && session.user.id === id)
    return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 422 });

  // Prevent removing the last admin
  if (parsed.data.role && parsed.data.role !== 'ADMIN' && target.role === 'ADMIN') {
    const adminCount = await db.user.count({ where: { role: 'ADMIN', active: true } });
    if (adminCount <= 1)
      return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 422 });
  }

  const user = await db.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true },
  });

  return NextResponse.json({ user });
}
