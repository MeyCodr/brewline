import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(6).max(100),
  role:     z.enum(['ADMIN', 'MANAGER', 'STAFF', 'KITCHEN']),
});

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !['ADMIN', 'MANAGER'].includes(role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const staff = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const { name, email, password, role: newRole } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const user = await db.user.create({
    data: { name, email, password: hashed, role: newRole, avatar: initials },
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
