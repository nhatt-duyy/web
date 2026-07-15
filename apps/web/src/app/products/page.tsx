'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductGrid from '@/components/product-grid';
import Filters, { type LanguageOption } from '@/components/filters';
import useProducts from '@/lib/use-products';
import useSearch, { type SearchProduct } from '@/lib/use-search';
import { Container, Skeleton, EmptyState } from '@/components/ui/primitives';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@/components/ui/icons';

// Chuyển document MeiliSearch về đúng shape ProductCard mong đợi
function toProductCard(p: SearchProduct) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    price: p.price,
    thumbnail: p.thumbnail,
    fileKey: null,
    categoryId: p.categoryId,
    category: { id: p.categoryId, name: p.categoryName, slug: '' },
    isPublished: p.isPublished,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.createdAt).toISOString(),
  };
}

function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query tìm kiếm từ URL (?q=)
  const q = searchParams.get('q') ?? '';

  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [language, setLanguage] = useState<string>(''); // '' = tất cả ngôn ngữ
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | '_text_match'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const limit = 12;

  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data: { id: string; slug: string; name: string }[] = await res.json();
          setCategories(data);
        }
      } catch {
        /* ignore */
      }
      try {
        const res = await fetch('/api/products/languages');
        if (res.ok) {
          const data: LanguageOption[] = await res.json();
          setLanguages(data);
        }
      } catch {
        /* ignore */
      }
    }
    fetchFilters();
  }, []);

  // Reset trang khi đổi bất kỳ bộ lọc nào
  useEffect(() => {
    setPage(1);
  }, [q, categorySlug, language, sortBy, sortOrder, minPrice, maxPrice]);

  // Luôn gọi 2 hook (rules of hooks); chọn kết quả theo chế độ
  const productsQuery = useProducts({
    category: categorySlug || undefined,
    sortBy: sortBy === '_text_match' ? 'createdAt' : (sortBy as 'createdAt' | 'price'),
    sortOrder,
    limit,
    page,
  });

  const searchQuery = useSearch({
    q,
    category: categorySlug || undefined,
    language: language || undefined,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    limit,
    page,
  });

  const isSearch = q.trim().length > 0;
  const { data: rawData, total, loading, error } = isSearch ? searchQuery : productsQuery;
  const products = isSearch ? (rawData as SearchProduct[]).map(toProductCard) : (rawData as any[]);

  const totalPages = Math.ceil(total / limit);

  const goToPreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };
  const goToNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const resetFilters = () => {
    setCategorySlug('');
    setLanguage('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    router.push('/products');
  };

  const skeleton = (
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
  );

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
                {isSearch
                  ? `Kết quả cho "${q}" — ${total} source code`
                  : total > 0
                    ? `${total} source code có sẵn`
                    : 'Khám phá bộ sưu tập source code'}
              </p>
            </div>
          </div>

          <Filters
            categories={categories}
            category={categorySlug}
            languages={languages}
            language={language}
            sortBy={sortBy}
            sortOrder={sortOrder}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onCategoryChange={setCategorySlug}
            onLanguageChange={setLanguage}
            onSortChange={(by, order) => {
              setSortBy(by);
              setSortOrder(order);
            }}
            onPriceChange={(min, max) => {
              setMinPrice(min);
              setMaxPrice(max);
            }}
          />

          {loading ? (
            skeleton
          ) : error ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
              Lỗi khi tải sản phẩm: {error.message}
            </div>
          ) : products.length > 0 ? (
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
              description={
                isSearch
                  ? 'Thử từ khoá khác hoặc bỏ bớt bộ lọc.'
                  : 'Thử đổi danh mục hoặc bộ sắp xếp để xem thêm lựa chọn.'
              }
              action={
                <button
                  onClick={resetFilters}
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

export default function ProductsPageExport() {
  return (
    <Suspense fallback={null}>
      <ProductsPage />
    </Suspense>
  );
}
