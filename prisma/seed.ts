import { PrismaClient, UserRole, TableStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Users
  const adminHash = await bcrypt.hash('admin123', 12);
  const staffHash = await bcrypt.hash('staff123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@brewline.cafe' },
    update: {},
    create: {
      email: 'admin@brewline.cafe',
      name: 'Admin User',
      password: adminHash,
      role: UserRole.ADMIN,
      avatar: 'AU',
    },
  });

  await prisma.user.upsert({
    where: { email: 'maya@brewline.cafe' },
    update: {},
    create: {
      email: 'maya@brewline.cafe',
      name: 'Maya Chen',
      password: staffHash,
      role: UserRole.STAFF,
      avatar: 'MC',
    },
  });

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { id: 'cat-espresso' }, update: {}, create: { id: 'cat-espresso', name: 'Espresso', icon: '☕', sortOrder: 1 } }),
    prisma.category.upsert({ where: { id: 'cat-slow' }, update: {}, create: { id: 'cat-slow', name: 'Slow Bar', icon: '⏳', sortOrder: 2 } }),
    prisma.category.upsert({ where: { id: 'cat-tea' }, update: {}, create: { id: 'cat-tea', name: 'Tea', icon: '🍵', sortOrder: 3 } }),
    prisma.category.upsert({ where: { id: 'cat-bakery' }, update: {}, create: { id: 'cat-bakery', name: 'Bakery', icon: '🥐', sortOrder: 4 } }),
    prisma.category.upsert({ where: { id: 'cat-kitchen' }, update: {}, create: { id: 'cat-kitchen', name: 'Kitchen', icon: '🍳', sortOrder: 5 } }),
  ]);
  const [espresso, slow, tea, bakery, kitchen] = categories;

  // Menu Items
  const menuItems = [
    { id: 'mi-1',  name: 'Flat White',             description: 'Double ristretto, silky steamed milk, micro-foam.', price: 5.25, categoryId: espresso.id, featured: true,  imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80' },
    { id: 'mi-2',  name: 'Cortado',                description: 'Equal parts espresso and warm milk. Bold and balanced.', price: 4.50, categoryId: espresso.id, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&q=80' },
    { id: 'mi-3',  name: 'Iced Latte',             description: 'House blend over ice with cold whole milk.', price: 5.75, categoryId: espresso.id, featured: true,  imageUrl: 'https://images.unsplash.com/photo-1542181961-9590d0c79dab?w=600&q=80' },
    { id: 'mi-4',  name: 'Espresso',               description: 'A single shot of our seasonal Ethiopian roast.', price: 3.25, categoryId: espresso.id, imageUrl: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80' },
    { id: 'mi-5',  name: 'Cold Brew',              description: '18-hour steep. Chocolate, dried fig, brown sugar.', price: 5.50, categoryId: slow.id,     imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80' },
    { id: 'mi-6',  name: 'Pour Over — Yirgacheffe', description: 'Bergamot, peach, jasmine. Hand-poured.', price: 6.50, categoryId: slow.id,     featured: true,  imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80' },
    { id: 'mi-7',  name: 'Iced Matcha Latte',      description: 'Ceremonial-grade matcha, oat milk.', price: 6.25, categoryId: tea.id,      featured: true,  imageUrl: 'https://images.unsplash.com/photo-1536013455834-71e25b6e6e5b?w=600&q=80' },
    { id: 'mi-8',  name: 'Hojicha',                description: 'Roasted Japanese green tea. Earthy & nutty.', price: 4.75, categoryId: tea.id,      available: false, imageUrl: 'https://images.unsplash.com/photo-1536013455834-71e25b6e6e5b?w=600&q=80' },
    { id: 'mi-9',  name: 'Almond Croissant',       description: 'Twice-baked, marzipan, slow-fermented dough.', price: 5.00, categoryId: bakery.id,   featured: true,  imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80' },
    { id: 'mi-10', name: 'Salted Cookie',           description: 'Brown butter, sea salt, dark chocolate chunks.', price: 4.25, categoryId: bakery.id,   imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80' },
    { id: 'mi-11', name: 'Olive Oil Cake',          description: 'Citrus zest, rosemary, dusting of icing sugar.', price: 5.50, categoryId: bakery.id,   imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80' },
    { id: 'mi-12', name: 'Avocado Toast',           description: 'Sourdough, smashed avo, chili crisp, lime.', price: 12.50, categoryId: kitchen.id,  featured: true,  imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80' },
    { id: 'mi-13', name: 'Egg & Gruyère Sandwich',  description: 'Soft scramble, melted gruyère, brioche.', price: 11.00, categoryId: kitchen.id,  imageUrl: 'https://images.unsplash.com/photo-1539252554935-80c8cb8a3b3e?w=600&q=80' },
    { id: 'mi-14', name: 'Coconut Granola Bowl',    description: 'Toasted oats, yogurt, seasonal fruit, honey.', price: 9.50, categoryId: kitchen.id,  imageUrl: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600&q=80' },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: { available: true, featured: false, sortOrder: 0, ...item },
    });
  }

  // Tables
  const tableData = [
    { number: 1, seats: 2 }, { number: 2, seats: 2 },
    { number: 3, seats: 4 }, { number: 4, seats: 4 },
    { number: 5, seats: 2 }, { number: 6, seats: 6 },
    { number: 7, seats: 4 }, { number: 8, seats: 2 },
    { number: 9, seats: 4 }, { number: 10, seats: 8 },
    { number: 11, seats: 2 }, { number: 12, seats: 4 },
  ];

  const statusMap: TableStatus[] = [
    TableStatus.OCCUPIED, TableStatus.AVAILABLE, TableStatus.OCCUPIED, TableStatus.AVAILABLE,
    TableStatus.AVAILABLE, TableStatus.OCCUPIED, TableStatus.AVAILABLE, TableStatus.AVAILABLE,
    TableStatus.AVAILABLE, TableStatus.CLEANING, TableStatus.AVAILABLE, TableStatus.OCCUPIED,
  ];

  for (let i = 0; i < tableData.length; i++) {
    const t = tableData[i];
    await prisma.table.upsert({
      where: { number: t.number },
      update: {},
      create: { number: t.number, seats: t.seats, status: statusMap[i] },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
