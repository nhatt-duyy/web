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
    <form onSubmit={handleSubmit} className="space-y-4 bg-popover p-6 rounded-lg shadow-md max-w-2xl">
      <h3 className="text-lg font-bold text-foreground">
        {initial?.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      </h3>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Tiêu đề</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-input focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Mô tả</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-input focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Giá (VND)</label>
          <input
            type="number"
            required
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-3 py-2 border border-input focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Danh mục</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-input focus:ring-2 focus:ring-primary"
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
        <label className="block text-sm font-medium text-foreground mb-1">Ảnh thumbnail</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="w-full text-sm"
        />
        <input
          type="text"
          placeholder="Hoặc dán URL ảnh trực tiếp"
          value={thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
          className="mt-2 w-full px-3 py-2 border border-input focus:ring-2 focus:ring-primary"
        />
        {uploading && <p className="text-sm text-muted-foreground mt-1">Đang upload...</p>}
        {thumbnail && (
          <img src={thumbnail} alt="preview" className="mt-2 h-24 w-24 object-cover rounded border border-border" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublished"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        <label htmlFor="isPublished" className="text-sm text-foreground">
          Xuất bản (hiển thị trên website)
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border hover:bg-accent/50"
        >
          Hủy
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
