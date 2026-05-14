import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { db } from '@/lib/db';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  const pendingCount = await db.order.count({
    where: { status: { in: ['PREPARING', 'READY'] } },
  });

  return (
    <SessionProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--canvas)' }}>
        <Sidebar pendingCount={pendingCount} userRole={(session.user as { role?: string }).role} />
        <main className="flex-1 min-w-0 flex flex-col">{children}</main>
      </div>
    </SessionProvider>
  );
}
