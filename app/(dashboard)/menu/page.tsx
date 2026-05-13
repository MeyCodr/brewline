import { Metadata } from 'next';
import { db } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { MenuClient } from '@/components/menu/MenuClient';

export const metadata: Metadata = { title: 'Menu' };
export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const [items, categories] = await Promise.all([
    db.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    }),
    db.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  const serialized = {
    items: items.map(i => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: Number(i.price),
      categoryId: i.categoryId,
      categoryName: i.category.name,
      imageUrl: i.imageUrl ?? null,
      featured: i.featured,
      available: i.available,
    })),
    categories: categories.map(c => ({ id: c.id, name: c.name, icon: c.icon })),
  };

  return (
    <>
      <Topbar title="Menu" subtitle="Items, categories and availability." />
      <MenuClient initialData={serialized} />
    </>
  );
}
