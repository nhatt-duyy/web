// apps/api/prisma/seed.ts
// Seed dữ liệu demo (danh mục + sản phẩm) để xem giao diện.
// Chạy qua: pnpm prisma:seed
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
  lang: string;
}[] = [
  { title: 'Shopify Clone', price: 1200000, category: 'ecommerce', from: '#6366f1', to: '#8b5cf6', lang: 'JavaScript' },
  { title: 'Food Delivery App', price: 1500000, category: 'mobile', from: '#f97316', to: '#ef4444', lang: 'Dart' },
  { title: 'Chatbot AI CRM', price: 990000, category: 'ai', from: '#06b6d4', to: '#3b82f6', lang: 'Python' },
  { title: 'Blog Platform', price: 690000, category: 'web', from: '#10b981', to: '#14b8a6', lang: 'PHP' },
  { title: 'Todo+ Kanban', price: 490000, category: 'web', from: '#8b5cf6', to: '#d946ef', lang: 'TypeScript' },
  { title: 'Flappy Bird Clone', price: 350000, category: 'game', from: '#f59e0b', to: '#f43f5e', lang: 'JavaScript' },
  { title: 'Marketplace Template', price: 1800000, category: 'ecommerce', from: '#3b82f6', to: '#6366f1', lang: 'TypeScript' },
  { title: 'Fitness Tracker', price: 1300000, category: 'mobile', from: '#ec4899', to: '#f43f5e', lang: 'Swift' },
  { title: 'Image Generator SaaS', price: 2100000, category: 'ai', from: '#0ea5e9', to: '#6366f1', lang: 'Python' },
  { title: 'Portfolio Starter', price: 290000, category: 'web', from: '#22c55e', to: '#84cc16', lang: 'JavaScript' },
  { title: 'Quiz Mini-game', price: 250000, category: 'game', from: '#a855f7', to: '#6366f1', lang: 'JavaScript' },
  { title: 'Booking System', price: 1600000, category: 'web', from: '#14b8a6', to: '#0ea5e9', lang: 'TypeScript' },
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

  // User STAFF (nhân viên hỗ trợ) để test RBAC Phase 3
  const staffHash = await bcrypt.hash('Staff@123456', 10);
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@sourceban.com' },
    update: { isActive: true },
    create: {
      email: 'staff@sourceban.com',
      name: 'Nhân viên hỗ trợ',
      passwordHash: staffHash,
      role: 'STAFF',
    },
  });

  // User ADMIN để test Admin Panel Phase 3
  const adminHash = await bcrypt.hash('Admin@123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sourceban.com' },
    update: { isActive: true },
    create: {
      email: 'admin@sourceban.com',
      name: 'Quản trị viên',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  for (const p of products) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const product = await prisma.product.upsert({
      where: { slug },
      update: { language: p.lang },
      create: {
        slug,
        title: p.title,
        description: `Source code hoàn chỉnh ${p.title} — chuẩn dev, dễ tùy biến, tài liệu rõ ràng. Phù hợp để học tập hoặc triển khai nhanh dự án thực tế.`,
        price: p.price,
        thumbnail: thumb(p.title, p.from, p.to),
        isPublished: true,
        categoryId: catMap[p.category],
        language: p.lang,
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

  // Bài viết CMS mẫu (1 blog + 1 trang FAQ) — Phase 3
  const posts = [
    {
      type: 'BLOG' as const,
      title: 'Cách chọn gói license phù hợp khi mua source code',
      slug: 'chon-goi-license-phu-hop',
      excerpt: 'Regular hay Extended? Hướng dẫn nhanh để không mua dư hoặc thiếu.',
      content:
        '# Chọn gói license phù hợp\n\nKhi mua source code trên **SourceBan**, bạn thường gặp 2 gói:\n\n- **Regular**: dành cho 1 dự án cá nhân/nhỏ.\n- **Extended**: dùng cho nhiều dự án hoặc khách hàng.\n\n> Chọn Extended nếu bạn làm freelancer hoặc agency.\n\n## Tóm lại\n\nXác định số dự án trước khi mua để tối ưu chi phí.',
      status: 'PUBLISHED' as const,
      categorySlug: 'web',
      publishedAt: new Date('2026-02-01'),
    },
    {
      type: 'PAGE' as const,
      title: 'Câu hỏi thường gặp (FAQ)',
      slug: 'faq',
      excerpt: 'Các thắc mắc về thanh toán, tải source và hỗ trợ.',
      content:
        '# FAQ\n\n## Thanh toán\nChúng tôi hỗ trợ **PayOS** (Việt Nam) và Stripe (quốc tế).\n\n## Tải source\nMỗi license được tải tối đa 5 lần, tự động reset sau 30 ngày.\n\n## Hỗ trợ\nGửi ticket tại trang Dashboard, đội ngũ sẽ phản hồi sớm.',
      status: 'PUBLISHED' as const,
      categorySlug: null,
      publishedAt: new Date('2026-01-15'),
    },
  ];
  for (const p of posts) {
    const catId = p.categorySlug
      ? (await prisma.category.findUnique({ where: { slug: p.categorySlug } }))?.id ?? null
      : null;
    await prisma.post.upsert({
      where: { slug: p.slug },
      update: { status: p.status, content: p.content },
      create: {
        type: p.type,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        status: p.status,
        categoryId: catId,
        authorId: staffUser.id,
        publishedAt: p.publishedAt,
      },
    });
  }

  // Ticket mẫu được gán cho staff — Phase 3
  await prisma.ticket.upsert({
    where: { id: 'seed-ticket-1' },
    update: { assignedToId: staffUser.id, status: 'REPLIED', reply: 'Chào bạn, lỗi này do cache, vui lòng xóa cache và thử lại.' },
    create: {
      id: 'seed-ticket-1',
      userId: demoUser.id,
      subject: 'Không tải được file sau khi thanh toán',
      message: 'Em đã thanh toán xong nhưng bấm tải vẫn báo lỗi. Nhờ anh hỗ trợ.',
      status: 'REPLIED',
      priority: 'HIGH',
      assignedToId: staffUser.id,
      reply: 'Chào bạn, lỗi này do cache, vui lòng xóa cache và thử lại.',
    },
  });

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

  // ===== SEED: Module Dịch vụ Custom (Phase 4) =====
  const req1 = await prisma.customProjectRequest.upsert({
    where: { id: 'seed-req-1' },
    update: {},
    create: {
      id: 'seed-req-1',
      userId: demoUser.id,
      type: 'WEB_APP',
      title: 'Website đặt món nhà hàng online',
      description:
        'Cần làm website đặt món cho chuỗi nhà hàng 3 chi nhánh, tích hợp menu động, giỏ hàng, thanh toán và quản lý đơn từ đầu bếp. Ưu tiên Next.js + PostgreSQL.',
      budget: 30000000,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      status: 'QUOTING',
    },
  });

  const req2 = await prisma.customProjectRequest.upsert({
    where: { id: 'seed-req-2' },
    update: {},
    create: {
      id: 'seed-req-2',
      userId: demoUser.id,
      type: 'MOBILE_APP',
      title: 'App di động quản lý kho bằng barcode',
      description:
        'App Android/iOS quét mã barcode để nhập xuất kho, đồng bộ thời gian thực với web admin. Cần báo giá trọn gói.',
      budget: 45000000,
      status: 'NEW',
    },
  });

  const showcaseReq = await prisma.customProjectRequest.upsert({
    where: { id: 'seed-req-showcase' },
    update: {},
    create: {
      id: 'seed-req-showcase',
      userId: demoUser.id,
      type: 'WEB_APP',
      title: 'SaaS CRM nhỏ cho agency',
      description:
        'Xây dựng SaaS CRM quản lý khách hàng, pipeline bán hàng, báo cáo doanh thu cho agency marketing. Tích hợp email outreach và automation cơ bản.',
      budget: 80000000,
      status: 'DELIVERED',
    },
  });

  const showcasedProject = await prisma.customProject.upsert({
    where: { id: 'seed-project-showcase' },
    update: { status: 'DELIVERED', isShowcase: true },
    create: {
      id: 'seed-project-showcase',
      requestId: showcaseReq.id,
      userId: demoUser.id,
      assigneeId: staffUser.id,
      title: 'SaaS CRM nhỏ cho agency',
      description:
        'Xây dựng SaaS CRM quản lý khách hàng, pipeline bán hàng, báo cáo doanh thu cho agency marketing. Tích hợp email outreach và automation cơ bản.',
      status: 'DELIVERED',
      quotedAmount: 80000000,
      priority: 'HIGH',
      warrantyMonths: 3,
      isShowcase: true,
      slug: 'saas-crm-agency',
    },
  });

  const milestones = [
    { name: 'Đặt cọc 30%', amount: 24000000, percent: 30, status: 'PAID' as const, sortOrder: 0 },
    { name: 'Giữa kỳ 40%', amount: 32000000, percent: 40, status: 'PAID' as const, sortOrder: 1 },
    { name: 'Bàn giao 30%', amount: 24000000, percent: 30, status: 'PAID' as const, sortOrder: 2 },
  ];
  for (const m of milestones) {
    await prisma.milestone.upsert({
      where: { id: `seed-ms-${showcasedProject.id}-${m.sortOrder}` },
      update: { status: m.status },
      create: {
        id: `seed-ms-${showcasedProject.id}-${m.sortOrder}`,
        projectId: showcasedProject.id,
        name: m.name,
        amount: m.amount,
        percent: m.percent,
        status: m.status,
        sortOrder: m.sortOrder,
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (10 - m.sortOrder * 3)),
      },
    });
  }

  await prisma.projectMessage.upsert({
    where: { id: 'seed-msg-1' },
    update: {},
    create: {
      id: 'seed-msg-1',
      projectId: showcasedProject.id,
      senderId: staffUser.id,
      content: 'Chào bạn, dự án CRM đã hoàn thiện phase 1, mời bạn xem bản demo.',
      isFromStaff: true,
    },
  });
  await prisma.projectMessage.upsert({
    where: { id: 'seed-msg-2' },
    update: {},
    create: {
      id: 'seed-msg-2',
      projectId: showcasedProject.id,
      senderId: demoUser.id,
      content: 'Cảm ơn, giao diện rất ổn. Mình duyệt bàn giao nhé.',
      isFromStaff: false,
    },
  });

  await prisma.projectFile.upsert({
    where: { id: 'seed-file-1' },
    update: {},
    create: {
      id: 'seed-file-1',
      projectId: showcasedProject.id,
      uploaderId: staffUser.id,
      kind: 'DELIVERABLE',
      name: 'CRM-Demo-Overview.png',
      fileKey: thumb('CRM Demo', '#3b82f6', '#6366f1'),
      version: 1,
      size: 12345,
    },
  });

  await prisma.customProject.upsert({
    where: { id: 'seed-project-req1' },
    update: { status: 'QUOTING' },
    create: {
      id: 'seed-project-req1',
      requestId: req1.id,
      userId: demoUser.id,
      assigneeId: staffUser.id,
      title: 'Website đặt món nhà hàng online',
      description: req1.description,
      status: 'QUOTING',
      quotedAmount: 30000000,
      priority: 'MEDIUM',
      warrantyMonths: 3,
      isShowcase: false,
    },
  });

  const [c, n] = await Promise.all([prisma.category.count(), prisma.product.count()]);
  const [tierCount, reviewCount, couponCount, postCount, ticketCount, userCount, projectCount, reqCount] =
    await Promise.all([
      prisma.licenseTier.count(),
      prisma.review.count(),
      prisma.coupon.count(),
      prisma.post.count(),
      prisma.ticket.count(),
      prisma.user.count(),
      prisma.customProject.count(),
      prisma.customProjectRequest.count(),
    ]);
  console.log(
    `Seed xong: ${userCount} user, ${c} danh mục, ${n} sản phẩm, ${tierCount} gói license, ${reviewCount} review, ${couponCount} coupon, ${postCount} bài viết, ${ticketCount} ticket, ${reqCount} yêu cầu custom, ${projectCount} dự án custom.`,
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
