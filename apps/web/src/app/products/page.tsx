'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductGrid from '@/components/product-grid';
import Filters from '@/components/filters';
import useProducts from '@/lib/use-products';
import { Container, Skeleton, EmptyState } from '@/components/ui/primitives';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@/components/ui/icons';

export default function ProductsPage() {
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'price'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const limit = 12;

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) {
          setCategories([]);
          return;
        }
        const data: { id: string; slug: string; name: string }[] = await res.json();
        setCategories(data);
      } catch {
        setCategories([]);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [categorySlug, sortBy, sortOrder]);

  const { data: products, total, loading, error } = useProducts({
    category: categorySlug || undefined,
    sortBy,
    sortOrder,
    limit,
    page,
  });

  const totalPages = Math.ceil(total / limit);

  const goToPreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };
  const goToNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-14rem)] py-10">
          <Container>
            <Skeleton className="mb-6 h-9 w-48" />
            <Skeleton className="mb-8 h-12 w-full max-w-2xl" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-14rem)] py-10">
          <Container>
            <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">Sản phẩm</h1>
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
              Lỗi khi tải sản phẩm: {error.message}
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
      <main className="min-h-[calc(100vh-14rem)] py-10">
        <Container>
          {/* Breadcrumb + title */}
          <nav className="mb-3 flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-primary">
              Trang chủ
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Sản phẩm</span>
          </nav>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Sản phẩm</h1>
              <p className="mt-2 text-muted">
                {total > 0 ? `${total} source code có sẵn` : 'Khám phá bộ sưu tập source code'}
              </p>
            </div>
          </div>

          <Filters
            categories={categories}
            category={categorySlug}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onCategoryChange={setCategorySlug}
            onSortChange={(by, order) => {
              setSortBy(by);
              setSortOrder(order);
            }}
          />

          {products.length > 0 ? (
            <>
              <ProductGrid products={products} />

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <button
                    onClick={goToPreviousPage}
                    disabled={page === 1}
                    aria-label="Trang trước"
                    className="inline-flex h-11 items-center gap-1 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-transparent"
                  >
                    <ChevronLeftIcon className="h-4 w-4" /> Trước
                  </button>
                  <span className="text-sm text-muted">
                    Trang <span className="font-semibold text-foreground">{page}</span> / {totalPages}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={page === totalPages}
                    aria-label="Trang sau"
                    className="inline-flex h-11 items-center gap-1 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-transparent"
                  >
                    Sau <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<SearchIcon className="h-7 w-7" />}
              title="Không có sản phẩm nào phù hợp"
              description="Thử đổi danh mục hoặc bộ sắp xếp để xem thêm lựa chọn."
              action={
                <button
                  onClick={() => {
                    setCategorySlug('');
                    setSortBy('createdAt');
                    setSortOrder('desc');
                  }}
                  className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-all hover:bg-primary-strong"
                >
                  Xóa bộ lọc
                </button>
              }
            />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
