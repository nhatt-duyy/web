'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import useProducts from '@/lib/use-products';
import ProductGrid from '@/components/product-grid';
import { Container, Badge, Skeleton, SectionHeading } from '@/components/ui/primitives';
import Reveal from '@/components/ui/reveal';
import {
  SearchIcon,
  ArrowRightIcon,
  ShieldIcon,
  BoltIcon,
  SparklesIcon,
  CodeIcon,
  StarIcon,
  QuoteIcon,
  TagIcon,
  DownloadIcon,
} from '@/components/ui/icons';

const STATS = [
  { value: '1.200+', label: 'Source code' },
  { value: '50K+', label: 'Lượt tải' },
  { value: '4.9/5', label: 'Đánh giá' },
  { value: '24/7', label: 'Hỗ trợ' },
];

const FEATURES = [
  {
    icon: ShieldIcon,
    title: 'Thanh toán an toàn',
    desc: 'Tích hợp PayOS & Stripe, bảo mật tuyệt đối cho mọi giao dịch.',
  },
  {
    icon: BoltIcon,
    title: 'Tải ngay sau mua',
    desc: 'Nhận file source tức thì, không chờ đợi, bắt đầu dự án ngay.',
  },
  {
    icon: SparklesIcon,
    title: 'Source chuẩn dev',
    desc: 'Được kiểm duyệt kỹ, clean code, dễ mở rộng và bảo trì.',
  },
  {
    icon: CodeIcon,
    title: 'Đa dạng công nghệ',
    desc: 'Next.js, NestJS, React, Vue... đủ mọi stack bạn cần.',
  },
];

const STEPS = [
  {
    icon: SearchIcon,
    step: '01',
    title: 'Tìm kiếm',
    desc: 'Duyệt hàng nghìn source code hoặc lọc theo công nghệ, danh mục và mức giá.',
  },
  {
    icon: TagIcon,
    step: '02',
    title: 'Mua với vài click',
    desc: 'Thanh toán qua PayOS an toàn, nhận xác nhận tức thì qua email.',
  },
  {
    icon: DownloadIcon,
    step: '03',
    title: 'Tải & triển khai',
    desc: 'Tải file source, đọc tài liệu và triển khai dự án của bạn ngay hôm nay.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Nguyễn Minh Tuấn',
    role: 'Fullstack Developer · Hồ Chí Minh',
    quote:
      'Mình tìm được bộ source Next.js + NestJS chuẩn chỉnh trong 5 phút. Tải về là chạy được luôn, tiết kiệm cả tuần dev.',
  },
  {
    name: 'Trần Thị Lan',
    role: 'Founder · Hà Nội',
    quote:
      'Nhat Duy Market giúp team mình ship tính năng nhanh gấp 2 lần. Kho source được kiểm duyệt kỹ nên yên tâm dùng cho khách hàng.',
  },
  {
    name: 'Lê Hoàng Anh',
    role: 'Freelancer · Đà Nẵng',
    quote:
      'Giao diện mượt, thanh toán PayOS nhanh. Mình cũng bán được vài bộ source tự viết và có thu nhập thụ động ổn.',
  },
];

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const { data: products, loading, error } = useProducts({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 8,
    page: 1,
  });

  useEffect(() => {
    let mounted = true;
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { slug: string; name: string }[]) => {
        if (mounted) setCategories(Array.isArray(data) ? data.slice(0, 8) : []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : '/products');
  };

  return (
    <>
      <Header />

      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid opacity-70" />
          <div
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-70 blur-2xl animate-float"
            style={{ background: 'radial-gradient(circle at center, var(--glow), transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-10 -z-10 h-80 w-80 rounded-full opacity-50 blur-2xl"
            style={{ background: 'radial-gradient(circle at center, var(--glow-accent), transparent 70%)' }}
          />
          <Container className="relative py-20 sm:py-28 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <Badge tone="soft" className="mb-6 gap-2 px-3 py-1">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
                  Chợ source code số 1 Việt Nam
                </Badge>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  Mua & bán <span className="text-gradient">source code</span> chất lượng cao
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
                  Hàng nghìn dự án sẵn sàng để bạn tải về và triển khai ngay. Thanh toán an toàn,
                  hỗ trợ tận tâm từ đội ngũ developer Việt.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <form
                  onSubmit={onSearch}
                  className="mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-[0_20px_50px_-30px_rgb(var(--shadow-color)/0.6)] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                >
                  <SearchIcon className="ml-2 h-5 w-5 shrink-0 text-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm source code, công nghệ, tính năng..."
                    aria-label="Tìm kiếm source code"
                    className="h-11 flex-1 bg-transparent px-1 text-foreground outline-none placeholder:text-muted-2"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white shadow-[0_10px_24px_-12px_var(--glow)] transition-all hover:bg-primary-strong hover:-translate-y-px"
                  >
                    Tìm
                  </button>
                </form>
              </Reveal>

              <Reveal delay={320}>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/products"
                    className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-[0_12px_30px_-12px_var(--glow)] transition-all hover:bg-primary-strong hover:-translate-y-px"
                  >
                    Khám phá sản phẩm <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/products?sortBy=price&sortOrder=asc"
                    className="inline-flex h-12 cursor-pointer items-center rounded-xl border border-border-strong px-6 font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft"
                  >
                    Xem giá tốt
                  </Link>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ---------- Stats ---------- */}
        <section className="border-y border-border bg-surface/40">
          <Container className="grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 60}>
                <div className="text-center">
                  <div className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    {s.value}
                  </div>
                  <div className="mt-1 text-sm text-muted">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </Container>
        </section>

        {/* ---------- Categories ---------- */}
        {categories.length > 0 && (
          <section className="py-12">
            <Container>
              <Reveal>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Duyệt theo danh mục</h2>
                  <p className="mt-1 text-muted">Tìm đúng stack bạn cần trong tích tắc.</p>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?category=${encodeURIComponent(cat.slug)}`}
                      className="chip cursor-pointer"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            </Container>
          </section>
        )}

        {/* ---------- Featured products ---------- */}
        <section className="py-20">
          <Container>
            <Reveal>
              <SectionHeading
                eyebrow="Được yêu thích"
                title="Sản phẩm nổi bật"
                description="Những source code được yêu thích nhất tuần này."
                action={
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2"
                  >
                    Xem tất cả <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                }
              />
            </Reveal>

            <div className="mt-10">
              {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
                  Có lỗi xảy ra khi tải sản phẩm. Vui lòng thử lại sau.
                </div>
              ) : products.length === 0 ? (
                <p className="py-12 text-center text-muted">Hiện chưa có sản phẩm nào.</p>
              ) : (
                <ProductGrid products={products} />
              )}
            </div>
          </Container>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="border-y border-border bg-surface/40 py-20">
          <Container>
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="Cách hoạt động"
                title="Từ ý tưởng đến deploy chỉ trong 3 bước"
                description="Quy trình mua bán source code được tối giản để bạn tập trung vào việc xây dựng."
              />
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.step} delay={i * 80}>
                  <div className="card h-full p-7">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                        <s.icon className="h-6 w-6" />
                      </div>
                      <span className="font-mono text-sm font-semibold text-muted-2">{s.step}</span>
                    </div>
                    <h3 className="mb-2 font-display text-lg font-semibold">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ---------- Features ---------- */}
        <section className="py-20">
          <Container>
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="Tại sao Nhat Duy Market"
                title="Tại sao chọn Nhat Duy Market?"
                description="Chúng tôi xây dựng nền tảng mua bán source code tin cậy nhất cho developer Việt."
              />
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 70}>
                  <div className="card card-hover h-full p-6">
                    <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-display text-lg font-semibold">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ---------- Testimonials ---------- */}
        <section className="border-t border-border bg-surface/40 py-20">
          <Container>
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="Khách hàng nói gì"
                title="Được hàng nghìn developer tin dùng"
                description="Trải nghiệm thực tế từ cộng đồng phát triển phần mềm Việt Nam."
              />
            </Reveal>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 80}>
                  <figure className="card flex h-full flex-col p-7">
                    <QuoteIcon className="h-8 w-8 text-primary/40" />
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-strong text-sm font-semibold text-white">
                        {t.name.charAt(0)}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{t.name}</div>
                        <div className="text-xs text-muted">{t.role}</div>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ---------- Seller CTA ---------- */}
        <section className="py-20">
          <Container>
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-primary/10 via-surface to-accent/10 p-10 text-center sm:p-16">
                <div className="glow-orb pointer-events-none absolute -right-20 -top-20 h-64 w-64 opacity-60" />
                <div className="relative">
                  <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-[0_12px_30px_-12px_var(--glow)]">
                    <StarIcon className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Có source code chất lượng? Bán ngay hôm nay
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-muted">
                    Tham gia cộng đồng developer, kiếm thêm thu nhập từ những dự án bạn đã xây dựng.
                  </p>
                  <Link
                    href="/products"
                    className="mt-7 inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-[0_12px_30px_-12px_var(--glow)] transition-all hover:bg-primary-strong hover:-translate-y-px"
                  >
                    Bắt đầu bán <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}
