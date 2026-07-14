'use client';

import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import useProducts from '@/lib/use-products';
import ProductGrid from '@/components/product-grid';

export default function HomePage() {
  const { data: products, total, loading, error } = useProducts({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 8,
    page: 1,
  });

  
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              SourceBan - Nơi mua bán source code chất lượng
            </h1>
            <p className="mb-6 text-lg text-gray-600">
              Khám phá hàng nghìn dự án source code sẵn sàng để bạn mua và sử dụng ngay hôm nay.
            </p>
            <Link
              href="/products"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-md transition-colors"
            >
              Khám phá nguồn hiện có
            </Link>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">
              Sản phẩm nổi bật
            </h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="flex space-x-2">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                <p>Có lỗi xảy ra khi tải sản phẩm. Vui lòng thử lại sau.</p>
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-500 py-12">
                Hiện chưa có sản phẩm nào.
              </p>
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}