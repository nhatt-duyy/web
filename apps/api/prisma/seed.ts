// apps/api/prisma/seed.ts
// Seed dữ liệu demo (danh mục + sản phẩm) để xem giao diện.
// Chạy qua: pnpm prisma:seed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tạo thumbnail SVG (data-URI) để không phụ thuộc mạng / R2.
function thumb(title: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="600" height="450" fill="url(#g)"/>
  <text x="50%" y="50%" fill="#ffffff" font-family="monospace" font-size="34" font-weight="700"
    text-anchor="middle" dominant-baseline="middle">&lt;/&gt; ${title}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const categories = [
  { slug: 'web', name: 'Web App' },
  { slug: 'mobile', name: 'Mobile App' },
  { slug: 'ecommerce', name: 'E-commerce' },
  { slug: 'ai', name: 'AI & Tool' },
  { slug: 'game', name: 'Game & Mini-game' },
];

const products: {
  title: string;
  price: number;
  category: string;
  from: string;
  to: string;
}[] = [
  { title: 'Shopify Clone', price: 1200000, category: 'ecommerce', from: '#6366f1', to: '#8b5cf6' },
  { title: 'Food Delivery App', price: 1500000, category: 'mobile', from: '#f97316', to: '#ef4444' },
  { title: 'Chatbot AI CRM', price: 990000, category: 'ai', from: '#06b6d4', to: '#3b82f6' },
  { title: 'Blog Platform', price: 690000, category: 'web', from: '#10b981', to: '#14b8a6' },
  { title: 'Todo+ Kanban', price: 490000, category: 'web', from: '#8b5cf6', to: '#d946ef' },
  { title: 'Flappy Bird Clone', price: 350000, category: 'game', from: '#f59e0b', to: '#f43f5e' },
  { title: 'Marketplace Template', price: 1800000, category: 'ecommerce', from: '#3b82f6', to: '#6366f1' },
  { title: 'Fitness Tracker', price: 1300000, category: 'mobile', from: '#ec4899', to: '#f43f5e' },
  { title: 'Image Generator SaaS', price: 2100000, category: 'ai', from: '#0ea5e9', to: '#6366f1' },
  { title: 'Portfolio Starter', price: 290000, category: 'web', from: '#22c55e', to: '#84cc16' },
  { title: 'Quiz Mini-game', price: 250000, category: 'game', from: '#a855f7', to: '#6366f1' },
  { title: 'Booking System', price: 1600000, category: 'web', from: '#14b8a6', to: '#0ea5e9' },
];

async function main() {
  console.log('Đang seed dữ liệu demo...');

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { slug: c.slug, name: c.name },
    });
    catMap[c.slug] = created.id;
  }

  for (const p of products) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: p.title,
        description: `Source code hoàn chỉnh ${p.title} — chuẩn dev, dễ tùy biến, tài liệu rõ ràng. Phù hợp để học tập hoặc triển khai nhanh dự án thực tế.`,
        price: p.price,
        thumbnail: thumb(p.title, p.from, p.to),
        isPublished: true,
        categoryId: catMap[p.category],
      },
    });
  }

  const [c, n] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);
  console.log(`Seed xong: ${c} danh mục, ${n} sản phẩm.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
