'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import useProducts from '@/lib/use-products';
import ProductGrid from '@/components/product-grid';
import { Container, Badge, Skeleton, SectionHeading } from '@/components/ui/primitives';
import {
  SearchIcon,
  ArrowRightIcon,
  ShieldIcon,
  DownloadIcon,
  CodeIcon,
  TagIcon,
} from '@/components/ui/icons';

const CATEGORIES_FALLBACK = [
  { slug: 'nextjs', name: 'Next.js' },
  { slug: 'nestjs', name: 'NestJS' },
  { slug: 'react', name: 'React' },
  { slug: 'vue', name: 'Vue' },
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
  const { data: products, total, loading, error } = useProducts({
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

  // Số liệu trung thực từ API (không bịa). total = tổng sản phẩm thực tế.
  const productCountLabel =
    typeof total === 'number' && total > 0 ? `${total} source code có sẵn` : null;

  return (
    <>
      <Header />

      <main>
        {/* ---------- Hero (macrostructure Workbench: bất đối xứng) ---------- */}
        <section className="relative overflow-hidden workbench-hero">
          <div className="absolute inset-0 -z-10 bg-grid opacity-60" />
          <Container className="relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
            {/* Cột trái: thông điệp + tìm kiếm */}
            <div>
              <Badge tone="soft" className="mb-5 gap-2 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Chợ source code cho developer Việt
              </Badge>

              <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Mua & bán <span className="text-gradient">source code</span> đã qua kiểm duyệt
              </h1>

              <p className="hero-lede mt-5">
                Duyệt kho source theo stack, mua và tải về trong vài phút. Cần gì đó riêng? Gửi yêu
                cầu báo giá và nhận giải pháp custom từ đội ngũ phát triển.
              </p>

              <form
                onSubmit={onSearch}
                className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-surface p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
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
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-strong"
                >
                  Tìm
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href="/products"
                  className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white transition-colors hover:bg-primary-strong"
                >
                  Khám phá sản phẩm <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <Link
                  href="/bao-gia"
                  className="inline-flex h-12 cursor-pointer items-center rounded-xl border border-border-strong px-6 font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft"
                >
                  Cần dự án riêng?
                </Link>
              </div>

              {productCountLabel && (
                <p className="mt-5 text-sm text-muted-2">{productCountLabel} trên Nhat Duy Market.</p>
              )}
            </div>

            {/* Cột phải: sản phẩm nổi bật gần nhất (trọng tâm) */}
            <div className="lg:pl-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow-real">Mới cập nhật</span>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2"
                >
                  Tất cả <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                  Có lỗi khi tải sản phẩm. Vui lòng thử lại sau.
                </div>
              ) : products.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
                  Chưa có sản phẩm nào. Hãy quay lại sau.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {products.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      aria-label={p.title}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-[border-color,background-color] hover:border-border-strong hover:bg-surface-2"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumbnail}
                            alt={p.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-2">
                            Không có ảnh
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-3">
                        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                          {p.title}
                        </h3>
                        <span className="mt-2 font-mono text-sm font-bold text-foreground">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(p.price)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Container>
        </section>

        {/* ---------- Danh mục (nếu có) ---------- */}
        {categories.length > 0 && (
          <section className="py-12">
            <Container>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Duyệt theo công nghệ</h2>
                  <p className="mt-1 text-muted">Chọn đúng stack bạn định dùng.</p>
                </div>
                <Link
                  href="/products"
                  className="hidden items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2 sm:inline-flex"
                >
                  Xem kho <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {categories.map((cat) => (
                  <Link key={cat.slug} href={`/products?category=${encodeURIComponent(cat.slug)}`} className="chip cursor-pointer">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* ---------- Toàn bộ sản phẩm (trọng tâm chính) ---------- */}
        <section className="py-12 lg:py-16">
          <Container>
            <SectionHeading
              title="Kho source code"
              description="Tất cả sản phẩm hiện có trên nền tảng, sắp xếp theo ngày đăng gần nhất."
              action={
                <Link
                  href="/products?sortBy=price&sortOrder=asc"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2"
                >
                  Giá tốt nhất <ArrowRightIcon className="h-4 w-4" />
                </Link>
              }
            />

            <div className="mt-8">
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

        {/* ---------- Quy trình (thực tế, không lặp pattern STEPS/FEATURES) ---------- */}
        <section className="border-t border-border py-12 lg:py-16">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Từ tìm kiếm đến deploy
                </h2>
                <p className="mt-3 text-muted">
                  Quy trình mua bán được giữ tối giản để bạn tập trung vào xây dựng, không phải
                  lo thủ tục.
                </p>
              </div>
              <ol className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: SearchIcon,
                    title: 'Tìm & lọc',
                    desc: 'Duyệt theo công nghệ, danh mục và mức giá.',
                  },
                  {
                    icon: TagIcon,
                    title: 'Thanh toán',
                    desc: 'Qua PayOS, nhận xác nhận qua email tức thì.',
                  },
                  {
                    icon: DownloadIcon,
                    title: 'Tải & chạy',
                    desc: 'Tải file source và tài liệu, triển khai ngay.',
                  },
                ].map((s, i) => (
                  <li key={s.title} className="card p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
                        <s.icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-xs font-semibold text-muted-2">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </section>

        {/* ---------- Tin cậy (điểm thực tế, không phải feature bịa) ---------- */}
        <section className="border-t border-border py-12 lg:py-16">
          <Container>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  icon: ShieldIcon,
                  title: 'Thanh toán qua PayOS',
                  desc: 'Giao dịch được xử lý bởi PayOS, xác nhận qua email sau khi thanh toán.',
                },
                {
                  icon: DownloadIcon,
                  title: 'Tải ngay sau thanh toán',
                  desc: 'File source và tài liệu được mở khóa trên trang đơn hàng của bạn.',
                },
                {
                  icon: CodeIcon,
                  title: 'Source được kiểm duyệt',
                  desc: 'Mỗi bộ source được xem xét trước khi đăng bán trên nền tảng.',
                },
              ].map((f) => (
                <div key={f.title} className="flex gap-3.5 rounded-2xl border border-border bg-surface p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ---------- CTA (không glow-orb) ---------- */}
        <section className="py-12 lg:py-16">
          <Container>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-10 text-center sm:p-14">
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Có source code chất lượng? Đăng bán trên Nhat Duy Market
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted">
                Chia sẻ những dự án bạn đã xây dựng và tiếp cận cộng đồng developer đang tìm giải
                pháp sẵn sàng triển khai.
              </p>
              <Link
                href="/products"
                className="mt-7 inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white transition-colors hover:bg-primary-strong"
              >
                Bắt đầu <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}
