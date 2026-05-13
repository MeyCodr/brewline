import { Metadata } from 'next';
import { db } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { TablesClient } from '@/components/tables/TablesClient';

export const metadata: Metadata = { title: 'Tables' };
export const dynamic = 'force-dynamic';

export default async function TablesPage() {
  const tables = await db.table.findMany({ orderBy: { number: 'asc' } });

  const serialized = tables.map(t => ({
    id: t.id,
    number: t.number,
    seats: t.seats,
    status: t.status as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'RESERVED',
  }));

  const stats = {
    available: tables.filter(t => t.status === 'AVAILABLE').length,
    occupied:  tables.filter(t => t.status === 'OCCUPIED').length,
    cleaning:  tables.filter(t => t.status === 'CLEANING').length,
  };

  return (
    <>
      <Topbar title="Tables & QR" subtitle="Floor plan and QR codes." />
      <TablesClient tables={serialized} stats={stats} />
    </>
  );
}
