import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { GuestMenuClient } from '@/components/customer/GuestMenuClient';
import { Metadata } from 'next';

interface Props { params: Promise<{ tableId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tableId } = await params;
  const num = parseInt(tableId, 10);
  return { title: `Table ${num} — Brewline`, description: 'Browse our menu and order from your table.' };
}

export default async function GuestMenuPage({ params }: Props) {
  const { tableId } = await params;
  const tableNum = parseInt(tableId, 10);
  if (isNaN(tableNum)) notFound();

  const [table, items, categories] = await Promise.all([
    db.table.findUnique({ where: { number: tableNum } }),
    db.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    }),
    db.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  if (!table) notFound();

  return (
    <GuestMenuClient
      table={{ id: table.id, number: table.number, seats: table.seats }}
      categories={categories.map(c => ({ id: c.id, name: c.name, icon: c.icon }))}
      items={items.map(i => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        categoryId: i.categoryId,
        imageUrl: i.imageUrl ?? null,
        featured: i.featured,
        available: i.available,
      }))}
    />
  );
}
