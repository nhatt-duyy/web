'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductGrid from '@/components/product-grid';
import Filters from '@/components/filters';
import useProducts from '@/lib/use-products';

export default function ProductsPage() {
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'price'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const limit = 12;

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) {
          console.error('Failed to fetch categories');
          setCategories([]);
          return;
        }
        const data: { id: string; slug: string; name: string }[] = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
    }

    fetchCategories();
  }, []);

  // When category or sort changes, reset page to 1
  useEffect(() => {
    setPage(1);
  }, [categorySlug, sortBy, sortOrder]);

  const {
    data: products,
    total,
    loading,
    error,
  } = useProducts({
    category: categorySlug || undefined,
    sortBy,
    sortOrder,
    limit,
    page,
  });

  const totalPages = Math.ceil(total / limit);

  // Pagination handlers
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
        <main className="min-h-[calc(100vh-14rem)] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Sản phẩm</h1>
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-500">Đang tải sản phẩm...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-14rem)] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Sản phẩm</h1>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">
                Lỗi khi tải sản phẩm: {error.message}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-14rem)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Sản phẩm</h1>

          {/* Filters */}
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

          {/* Product Grid */}
          <div className="mt-8">
            {products.length > 0 ? (
              <>
                <ProductGrid products={products} />
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                    <button
                      onClick={goToPreviousPage}
                      disabled={page === 1}
                      className={`disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-md text-sm font-medium ${
                        page === 1
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Trước
                    </button>
                    <span className="text-sm text-gray-600">
                      Trang {page} của {totalPages}
                    </span>
                    <button
                      onClick={goToNextPage}
                      disabled={page === totalPages}
                      className={`disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-md text-sm font-medium ${
                        page === totalPages
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center py-12 text-gray-500">
                Không có sản phẩm nào phù hợp với bộ lọc.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}