'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useCartStore } from '@/lib/cart-store';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const cart = useCartStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Slug không được cung cấp');
      setLoading(false);
      return;
    }

    fetch(`/api/products/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setError('Không tìm thấy sản phẩm');
          } else {
            setError('Có lỗi xảy ra khi tải sản phẩm');
          }
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

  const handleBuyNow = () => {
    if (product) {
      cart.addItem({
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
      });
      // Redirect to cart page (to be implemented in task 4.1)
      router.push('/cart');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-14rem)] py-8">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full border-4 border-t-2 border-b-2 border-indigo-600 w-12 h-12"></div>
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
          <div className="max-w-2xl mx-auto p-6 text-center bg-red-50 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 mb-4">{error}</h2>
            <a href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-md">
              Về trang chủ
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-14rem)] py-8">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full border-4 border-t-2 border-b-2 border-indigo-600 w-12 h-12"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Image */}
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="flex h-96 items-center justify-center bg-gray-300">
                <span className="text-gray-500">Không có ảnh</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{product.title}</h1>
            {product.category ? (
              <span className="inline-flex items-center px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                {product.category.name}
              </span>
            ) : null}
            <p className="text-xl font-semibold text-indigo-600">{formatPrice(product.price)}</p>
            <p className="whitespace-pre-line text-gray-700">{product.description}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
              >
                Mua ngay
              </button>
              <button
                onClick={() => {
                  cart.addItem({
                    id: product.id,
                    slug: product.slug,
                    title: product.title,
                    price: product.price,
                    thumbnail: product.thumbnail,
                  });
                  // Optional: show a toast or just update cart icon
                  alert('Đã thêm vào giỏ hàng');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-md"
              >
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}