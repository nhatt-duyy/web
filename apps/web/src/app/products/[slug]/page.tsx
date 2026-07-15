'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductGrid from '@/components/product-grid';
import { useCartStore } from '@/lib/cart-store';
import useProducts from '@/lib/use-products';
import { Container, Badge, Skeleton, SectionHeading } from '@/components/ui/primitives';
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
} from '@/components/ui/icons';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const TRUST_FEATURES = [
  { icon: CodeIcon, label: 'Source code đầy đủ & chuẩn dev' },
  { icon: DownloadIcon, label: 'Tải file ngay sau khi thanh toán' },
  { icon: RefreshIcon, label: 'Cập nhật miễn phí các bản sửa lỗi' },
  { icon: SparklesIcon, label: 'Được kiểm duyệt kỹ trước khi bán' },
];

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError('Slug không được cung cấp');
      setLoading(false);
      return;
    }
    fetch(`/api/products/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          setError(res.status === 404 ? 'Không tìm thấy sản phẩm' : 'Có lỗi xảy ra khi tải sản phẩm');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProduct(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Có lỗi xảy ra khi tải sản phẩm');
        setLoading(false);
      });
  }, [slug]);

  // Sản phẩm liên quan: cùng danh mục, loại trừ sản phẩm hiện tại
  const { data: related } = useProducts({
    category: product?.category?.slug ?? undefined,
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const relatedProducts = related.filter((p) => p.id !== product?.id).slice(0, 4);

  const addToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (product) {
      addItem({
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
      });
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
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface-2">
              {product.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.thumbnail}
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
            </div>

            {/* Buy box */}
            <div className="lg:sticky lg:top-24">
              <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {product.title}
              </h1>

              <div className="mt-5 flex items-baseline gap-3">
                <p className="font-mono text-3xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </p>
                <span className="text-sm text-muted">/ gói vĩnh viễn</span>
              </div>

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

              {/* Description */}
              <div className="mt-8 rounded-2xl border border-border bg-surface/60 p-5">
                <h2 className="mb-2 font-display text-sm font-semibold text-muted">Mô tả sản phẩm</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {product.description}
                </p>
              </div>
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
