import { useState } from 'react';
import apiClient from '../lib/api-client';

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type ProductFormValues = {
  id?: string;
  title: string;
  description: string;
  price: number;
  categoryId: string;
  isPublished: boolean;
  thumbnail: string;
};

type ProductFormProps = {
  initial?: ProductFormValues | null;
  categories: CategoryOption[];
  onSaved: () => void;
  onCancel: () => void;
};

const ProductForm = ({ initial, categories, onSaved, onCancel }: ProductFormProps) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [isPublished, setIsPublished] = useState<boolean>(initial?.isPublished ?? true);
  const [thumbnail, setThumbnail] = useState(initial?.thumbnail ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setUploading(true);
    setError(null);
    try {
      // Lấy URL đã ký từ backend (admin guard) rồi PUT file trực tiếp lên R2.
      const { data } = await apiClient.post('/storage/presign-upload', {
        fileName: selected.name,
        contentType: selected.type,
      });
      await apiClient.put(data.url, selected, {
        headers: { 'Content-Type': selected.type },
      });
      // Ưu tiên publicUrl; nếu chưa cấu hình R2_PUBLIC_URL thì lưu key để web proxy sau.
      setThumbnail(data.publicUrl ?? data.key);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      title,
      description,
      price: Number(price),
      categoryId,
      isPublished,
      thumbnail: thumbnail || undefined,
    };
    try {
      if (initial?.id) {
        await apiClient.patch(`/products/${initial.id}`, payload);
      } else {
        await apiClient.post('/products', payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lưu sản phẩm thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <h3 className="font-display text-lg font-bold">
        {initial?.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      </h3>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Tiêu đề</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="VD: Web bán hàng đa năng"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Mô tả</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="input resize-y"
          placeholder="Mô tả ngắn gọn về source code..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Giá (VND)</label>
          <input
            type="number"
            required
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Danh mục</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Ảnh thumbnail</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-muted-2 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary-soft/70"
        />
        <input
          type="text"
          placeholder="Hoặc dán URL ảnh trực tiếp"
          value={thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
          className="input mt-2"
        />
        {uploading && <p className="mt-2 text-sm text-muted">Đang upload...</p>}
        {thumbnail && (
          <img src={thumbnail} alt="preview" className="mt-2 h-24 w-24 rounded-lg border border-border object-cover" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublished"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 rounded border-border bg-surface text-primary accent-[var(--primary)]"
        />
        <label htmlFor="isPublished" className="text-sm">
          Xuất bản (hiển thị trên website)
        </label>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting || uploading} className="btn-primary">
          {submitting ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Hủy
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
