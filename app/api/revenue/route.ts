import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

async function getRevenueSeries(days: number): Promise<{ day: string; value: number }[]> {
  const since = new Date(Date.now() - days * 86_400_000);

  const orders = await db.order.findMany({
    where: { createdAt: { gte: since }, status: 'COMPLETED' },
    select: { total: true, createdAt: true },
  });

  const byDay: Record<string, number> = {};
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] ?? 0) + Number(o.total);
  }

  const result: { day: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const label =
      days === 7
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({ day: label, value: byDay[key] ?? 0 });
  }
  return result;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const days = Math.min(Number(req.nextUrl.searchParams.get('days') ?? 7), 90);
  const series = await getRevenueSeries(days);
  return NextResponse.json({ series });
}
