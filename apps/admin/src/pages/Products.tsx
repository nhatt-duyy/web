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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Quản lý Sản phẩm</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Thêm sản phẩm
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

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

      {loading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-accent/50">
                  <td className="px-6 py-4">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.title} className="h-12 w-12 object-cover rounded border border-border" />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{p.title}</td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">{formatCurrency(p.price)}</td>
                  <td className="px-6 py-4 text-sm">{categoryName(p.categoryId)}</td>
                  <td className="px-6 py-4 text-sm">
                    {p.isPublished ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Đã xuất bản</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Nháp</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm flex space-x-2">
                    <button onClick={() => openEdit(p)} className="text-primary hover:underline">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-destructive hover:underline">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                    Chưa có sản phẩm
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Products;
