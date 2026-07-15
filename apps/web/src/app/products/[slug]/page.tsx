'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductGrid from '@/components/product-grid';
import { useCartStore } from '@/lib/cart-store';
import useProducts, { type Product } from '@/lib/use-products';
import { Container, Badge, Skeleton, SectionHeading } from '@/components/ui/primitives';
import ReviewForm from '@/components/review-form';
import Reveal from '@/components/ui/reveal';
import {
  CheckIcon,
  CartIcon,
  ArrowRightIcon,
  ShieldIcon,
  CodeIcon,
  DownloadIcon,
  RefreshIcon,
  SparklesIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/ui/icons';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const TRUST_FEATURES = [
  { icon: CodeIcon, label: 'Source code đầy đủ & chuẩn dev' },
  { icon: DownloadIcon, label: 'Tải file ngay sau khi thanh toán' },
  { icon: RefreshIcon, label: 'Cập nhật miễn phí các bản sửa lỗi' },
  { icon: SparklesIcon, label: 'Được kiểm duyệt kỹ trước khi bán' },
];

const TABS = [
  { id: 'description', label: 'Mô tả' },
  { id: 'docs', label: 'Tài liệu' },
  { id: 'changelog', label: 'Changelog' },
  { id: 'reviews', label: 'Đánh giá' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={`${size} ${i <= value ? 'text-amber-400' : 'text-border'}`}
        />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  // Gallery + tier state
  const [activeImage, setActiveImage] = useState(0);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('description');

  useEffect(() => {
    if (!slug) {
      setError('Slug không được cung cấp');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          setError(res.status === 404 ? 'Không tìm thấy sản phẩm' : 'Có lỗi xảy ra khi tải sản phẩm');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProduct(data);
        setActiveImage(0);
        // Mặc định chọn gói đầu tiên (hoặc gói duy nhất)
        setSelectedTierId(data.tiers?.length ? data.tiers[0].id : null);
        setLoading(false);
      })
      .catch(() => {
        setError('Có lỗi xảy ra khi tải sản phẩm');
        setLoading(false);
      });
  }, [slug]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const imgs = product.images && product.images.length ? [...product.images] : [];
    if (product.thumbnail && !imgs.includes(product.thumbnail)) imgs.unshift(product.thumbnail);
    return imgs.length ? imgs : [];
  }, [product]);

  const selectedTier = useMemo(
    () => product?.tiers?.find((t) => t.id === selectedTierId) ?? null,
    [product, selectedTierId],
  );
  const displayPrice = selectedTier ? selectedTier.price : product?.price ?? 0;

  const avgRating = useMemo(() => {
    const reviews = product?.reviews ?? [];
    if (!reviews.length) return 0;
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  }, [product]);

  // Sản phẩm liên quan: cùng danh mục, loại trừ sản phẩm hiện tại
  const { data: related } = useProducts({
    category: product?.category?.slug ?? undefined,
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const relatedProducts = (related ?? []).filter((p) => p.id !== product?.id).slice(0, 4);

  const cartPayload = () => {
    if (!product) return null;
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: displayPrice,
      thumbnail: product.thumbnail,
      tierId: selectedTier?.id ?? null,
      tierName: selectedTier?.name ?? null,
    };
  };

  const addToCart = () => {
    const payload = cartPayload();
    if (!payload) return;
    addItem(payload);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    const payload = cartPayload();
    if (payload) {
      addItem(payload);
      router.push('/cart');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-14rem)] py-10">
          <Container>
            <Skeleton className="mb-6 h-4 w-64" />
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-14rem)] py-10">
          <Container>
            <div className="mx-auto max-w-lg rounded-2xl border border-danger/30 bg-danger/10 p-10 text-center">
              <h2 className="mb-3 text-xl font-semibold text-danger">{error ?? 'Không có dữ liệu'}</h2>
              <Link
                href="/products"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-all hover:bg-primary-strong"
              >
                Quay lại sản phẩm
              </Link>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="py-10">
        <Container>
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-primary">
              Trang chủ
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/products" className="transition-colors hover:text-primary">
              Sản phẩm
            </Link>
            {product.category?.slug && (
              <>
                <span aria-hidden="true">/</span>
                <Link
                  href={`/products?category=${encodeURIComponent(product.category.slug)}`}
                  className="transition-colors hover:text-primary"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="truncate text-foreground">{product.title}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            {/* Gallery */}
            <div>
              <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface-2">
                {galleryImages.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={galleryImages[activeImage]}
                    alt={product.title}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-muted-2">
                    Không có ảnh
                  </div>
                )}
                {product.category?.name && (
                  <Badge tone="soft" className="absolute left-4 top-4 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {product.category.name}
                  </Badge>
                )}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImage((i) => (i - 1 + galleryImages.length) % galleryImages.length)
                      }
                      aria-label="Ảnh trước"
                      className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/80 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActiveImage((i) => (i + 1) % galleryImages.length)}
                      aria-label="Ảnh sau"
                      className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/80 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              {galleryImages.length > 1 && (
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      aria-label={`Xem ảnh ${i + 1}`}
                      aria-pressed={i === activeImage}
                      className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        i === activeImage ? 'border-primary' : 'border-border hover:border-border-strong'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Buy box */}
            <div className="lg:sticky lg:top-24">
              <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {product.title}
              </h1>

              {/* Rating summary */}
              {avgRating > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Stars value={Math.round(avgRating)} />
                  <span className="text-sm text-muted">
                    {avgRating} ({product.reviews?.length ?? 0} đánh giá)
                  </span>
                </div>
              )}

              <div className="mt-5 flex items-baseline gap-3">
                <p className="font-mono text-3xl font-bold text-foreground">
                  {formatPrice(displayPrice)}
                </p>
                <span className="text-sm text-muted">/ gói vĩnh viễn</span>
              </div>

              {/* License tiers */}
              {product.tiers && product.tiers.length > 0 && (
                <div className="mt-5 space-y-2.5">
                  {product.tiers.map((tier) => {
                    const active = tier.id === selectedTierId;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTierId(tier.id)}
                        aria-pressed={active}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                          active
                            ? 'border-primary bg-primary-soft'
                            : 'border-border hover:border-border-strong'
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                            active ? 'border-primary bg-primary text-white' : 'border-border-strong'
                          }`}
                        >
                          {active && <CheckIcon className="h-3.5 w-3.5" />}
                        </span>
                        <span className="flex-1">
                          <span className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{tier.name}</span>
                            <span className="font-mono text-sm font-bold text-foreground">
                              {formatPrice(tier.price)}
                            </span>
                          </span>
                          {tier.description && (
                            <span className="mt-0.5 block text-sm text-muted">{tier.description}</span>
                          )}
                          {tier.features?.length > 0 && (
                            <span className="mt-1.5 flex flex-wrap gap-1.5">
                              {tier.features.map((f) => (
                                <span
                                  key={f}
                                  className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted"
                                >
                                  {f}
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5 text-sm font-medium text-success">
                <ShieldIcon className="h-4 w-4 shrink-0" />
                Bảo hành & hỗ trợ kỹ thuật sau mua
              </div>

              {/* Trust features */}
              <ul className="mt-5 grid gap-2.5">
                {TRUST_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm text-muted">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                      <f.icon className="h-3.5 w-3.5" />
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>

              {product.demoUrl && (
                <a
                  href={product.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5"
                >
                  Xem bản demo trực tiếp <ArrowRightIcon className="h-4 w-4" />
                </a>
              )}

              <div className="mt-7 flex flex-col gap-3">
                <button
                  onClick={handleBuyNow}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-white shadow-[0_12px_30px_-12px_var(--glow)] transition-all hover:-translate-y-px hover:bg-primary-strong"
                >
                  Mua ngay <ArrowRightIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={addToCart}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border-strong font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft"
                >
                  {added ? (
                    <>
                      <CheckIcon className="h-5 w-5 text-success" /> Đã thêm vào giỏ
                    </>
                  ) : (
                    <>
                      <CartIcon className="h-5 w-5" /> Thêm vào giỏ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs: Mô tả / Tài liệu / Changelog / Đánh giá */}
          <div className="mt-14">
            <div role="tablist" aria-label="Chi tiết sản phẩm" className="flex flex-wrap gap-1 border-b border-border">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    tab === t.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-foreground'
                  }`}
                >
                  {t.label}
                  {t.id === 'reviews' && product.reviews?.length ? (
                    <span className="ml-1.5 text-xs text-muted">({product.reviews.length})</span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="py-7">
              {tab === 'description' && (
                <div className="max-w-3xl">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {product.description}
                  </p>
                </div>
              )}

              {tab === 'docs' && (
                <div className="max-w-3xl">
                  {product.docs && product.docs.length > 0 ? (
                    <ul className="space-y-2.5">
                      {product.docs.map((d, i) => (
                        <li key={i}>
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary-soft"
                          >
                            <CodeIcon className="h-4 w-4 text-primary" />
                            {d.title}
                            <ArrowRightIcon className="h-4 w-4 text-muted" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">Chưa có tài liệu cho sản phẩm này.</p>
                  )}
                </div>
              )}

              {tab === 'changelog' && (
                <div className="max-w-3xl">
                  {product.changelog && product.changelog.length > 0 ? (
                    <ol className="relative space-y-5 border-l border-border pl-5">
                      {product.changelog.map((c, i) => (
                        <li key={i} className="relative">
                          <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-primary-soft px-2 py-0.5 font-mono text-sm font-semibold text-primary">
                              v{c.version}
                            </span>
                            <span className="text-xs text-muted">{c.date}</span>
                          </div>
                          <p className="mt-1 text-sm text-muted">{c.notes}</p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted">Chưa có changelog.</p>
                  )}
                </div>
              )}

              {tab === 'reviews' && (
                <div className="max-w-3xl space-y-4">
                  <ReviewForm productId={product.id} />
                  {product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-4">
                        <span className="font-mono text-3xl font-bold text-foreground">
                          {avgRating}
                        </span>
                        <div>
                          <Stars value={Math.round(avgRating)} />
                          <p className="mt-1 text-sm text-muted">
                            {product.reviews.length} đánh giá từ khách hàng
                          </p>
                        </div>
                      </div>
                      {product.reviews.map((r) => (
                        <div key={r.id} className="rounded-xl border border-border p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              {r.user?.name ?? 'Khách hàng'}
                            </span>
                            <Stars value={r.rating} size="h-3.5 w-3.5" />
                          </div>
                          {r.comment && (
                            <p className="mt-2 text-sm leading-relaxed text-muted">{r.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">
                      Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sau khi mua.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <Reveal>
              <section className="mt-20">
                <SectionHeading
                  title="Có thể bạn cũng thích"
                  description="Những source code cùng danh mục được quan tâm."
                  action={
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2"
                    >
                      Xem tất cả <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  }
                />
                <ProductGrid products={relatedProducts} />
              </section>
            </Reveal>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
