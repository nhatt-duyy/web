import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';
import ProductForm, { CategoryOption, ProductFormValues } from '../components/product-form';

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string | null;
  categoryId: string;
  isPublished: boolean;
  category: { id: string; name: string; slug: string };
};

type ProductsResponse = {
  data: Product[];
  total: number;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        apiClient.get<ProductsResponse>('/products', { params: { limit: 100 } }),
        apiClient.get<CategoryOption[]>('/categories'),
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tải dữ liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      categoryId: p.categoryId,
      isPublished: p.isPublished,
      thumbnail: p.thumbnail ?? '',
    });
    setShowForm(true);
  };

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Quản lý Sản phẩm</h1>
          <p className="mt-1 text-sm text-muted">{products.length} sản phẩm trong kho</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon />
          Thêm sản phẩm
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {showForm && (
        <ProductForm
          initial={editing}
          categories={categories}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-2">
                  <th className="px-5 py-3 font-medium">Ảnh</th>
                  <th className="px-5 py-3 font-medium">Tên</th>
                  <th className="px-5 py-3 font-medium">Giá</th>
                  <th className="px-5 py-3 font-medium">Danh mục</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-5 py-3">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.title} className="h-11 w-11 rounded-lg border border-border object-cover" />
                      ) : (
                        <span className="grid h-11 w-11 place-items-center rounded-lg bg-surface-2 text-xs text-muted-2">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-muted-2">/{p.slug}</p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium">{formatCurrency(p.price)}</td>
                    <td className="px-5 py-3 text-muted">{categoryName(p.categoryId)}</td>
                    <td className="px-5 py-3">
                      {p.isPublished ? (
                        <span className="chip border-success/30 bg-success/10 text-xs text-success">Đã xuất bản</span>
                      ) : (
                        <span className="chip text-xs text-muted-2">Nháp</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => openEdit(p)} className="font-medium text-primary transition-colors hover:text-primary-strong">
                          Sửa
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="font-medium text-danger transition-colors hover:text-danger-soft">
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted">
                      Chưa có sản phẩm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
