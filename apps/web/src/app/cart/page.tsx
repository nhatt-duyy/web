'use client';

import { useCartStore } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { items, updateQty, removeItem } = useCartStore((s) => ({
    items: s.items,
    updateQty: s.updateQty,
    removeItem: s.removeItem,
  }));
  const router = useRouter();

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] py-12">
        <div className="mx-auto max-w-4xl px-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
              <p className="text-muted-foreground">
                Hãy đi mua sắm để thêm sản phẩm vào giỏ hàng.
              </p>
              <Link href="/products" className="inline-block mt-6 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 border-b pb-6">
                    <div className="flex-shrink-0 h-24 w-24">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          className="rounded-lg object-cover"
                          width={200}
                          height={200}
                        />
                      ) : (
                        <div className="flex h-full flex h-full w-full items-center justify-center rounded-lg border border-dashed bg-muted">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-semibold">
                          <Link href={`/products/${item.slug}`} className="hover:underline">
                            {item.title}
                          </Link>
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex items-baseline gap-4">
                        <span className="text-lg font-medium">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.price)}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <button
                            onClick={() => {
                              if (item.qty > 1) {
                                updateQty(item.id, item.qty - 1);
                              } else {
                                updateQty(item.id, 0); // will remove
                              }
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent hover:text-accent-foreground"
                          >
                            −
                          </button>
                          <span className="w-[3rem] text-center">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent hover:text-accent-foreground"
                          >
                            +
                          </button>
                        </div>
                        <span className="ml-auto text-lg font-medium">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.price * item.qty)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row sm:justify-between">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tổng cộng:</p>
                  <p className="text-2xl font-bold mt-1">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(total)}
                  </p>
                </div>
                <Link
                  href="/checkout"
                  className="mt-6 sm:mt-0 inline-flex h-10 w-full flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto"
                >
                  Thanh toán
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}