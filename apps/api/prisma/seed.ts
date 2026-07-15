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

  // User demo để tạo review mẫu
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@sourceban.com' },
    update: {},
    create: {
      email: 'demo@sourceban.com',
      name: 'Khách demo',
      passwordHash: null,
      role: 'CUSTOMER',
    },
  });

  for (const p of products) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const product = await prisma.product.upsert({
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
        demoUrl: `https://demo.sourceban.com/${slug}`,
        images: [thumb(p.title, p.from, p.to)],
        docs: [{ title: 'Hướng dẫn cài đặt', url: `https://docs.sourceban.com/${slug}` }],
        changelog: [{ version: '1.0.0', date: '2026-01-01', notes: 'Phiên bản đầu tiên' }],
      },
    });

    // Tạo 2 gói license (Regular / Extended) cho mỗi sản phẩm
    const tiers = [
      {
        slug: 'regular',
        name: 'Regular',
        price: p.price,
        description: 'Dùng cho 1 dự án cá nhân/nhỏ.',
        features: ['1 domain', 'Cập nhật 6 tháng', 'Hỗ trợ qua email'],
      },
      {
        slug: 'extended',
        name: 'Extended',
        price: Math.round(p.price * 1.8),
        description: 'Dùng cho nhiều dự án / khách hàng.',
        features: ['Unlimited domains', 'Cập nhật trọn đời', 'Hỗ trợ ưu tiên', 'Source code đầy đủ'],
      },
    ];
    for (const t of tiers) {
      await prisma.licenseTier.upsert({
        where: { productId_slug: { productId: product.id, slug: t.slug } },
        update: { price: t.price, name: t.name, description: t.description, features: t.features },
        create: { ...t, productId: product.id, sortOrder: t.slug === 'regular' ? 0 : 1 },
      });
    }
  }

  // Review mẫu (APPROVED) cho vài sản phẩm
  const reviewSamples = [
    { title: 'Shopify Clone', rating: 5, comment: 'Code sạch, dễ hiểu, chạy mượt.' },
    { title: 'Food Delivery App', rating: 4, comment: 'Tính năng ổn, tài liệu hơi ngắn.' },
    { title: 'Chatbot AI CRM', rating: 5, comment: 'Rất hài lòng, hỗ trợ nhiệt tình.' },
    { title: 'Blog Platform', rating: 4, comment: 'Đáp ứng đúng nhu cầu.' },
  ];
  for (const r of reviewSamples) {
    const slug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const prod = await prisma.product.findUnique({ where: { slug } });
    if (!prod) continue;
    await prisma.review.upsert({
      where: { productId_userId: { productId: prod.id, userId: demoUser.id } },
      update: {},
      create: {
        productId: prod.id,
        userId: demoUser.id,
        rating: r.rating,
        comment: r.comment,
        status: 'APPROVED',
      },
    });
  }

  // Coupon mẫu
  const coupons = [
    { code: 'WELCOME10', type: 'PERCENT' as const, value: 10, maxDiscount: 200000, minOrder: 0 },
    { code: 'SALE50K', type: 'FIXED' as const, value: 50000, minOrder: 300000 },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  const [c, n] = await Promise.all([prisma.category.count(), prisma.product.count()]);
  const [tierCount, reviewCount, couponCount] = await Promise.all([
    prisma.licenseTier.count(),
    prisma.review.count(),
    prisma.coupon.count(),
  ]);
  console.log(
    `Seed xong: ${c} danh mục, ${n} sản phẩm, ${tierCount} gói license, ${reviewCount} review, ${couponCount} coupon.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
