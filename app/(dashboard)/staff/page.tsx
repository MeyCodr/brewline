import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { StaffClient } from '@/components/staff/StaffClient';

export const metadata: Metadata = { title: 'Staff' };
export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!['ADMIN', 'MANAGER'].includes(role ?? '')) redirect('/dashboard');

  const staff = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <>
      <Topbar title="Staff" subtitle="Manage team accounts and roles." />
      <StaffClient
        initialStaff={staff}
        currentUserId={session!.user.id!}
        isAdmin={role === 'ADMIN'}
      />
    </>
  );
}
