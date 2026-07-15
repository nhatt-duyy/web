import { useState } from 'react';
import apiClient from '../lib/api-client';

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type TierFormValue = {
  id?: string;
  name: string;
  slug: string;
  price: number;
  description?: string;
  sortOrder?: number;
};

export type ProductFormValues = {
  id?: string;
  title: string;
  description: string;
  price: number;
  categoryId: string;
  isPublished: boolean;
  thumbnail: string;
  tiers?: TierFormValue[];
  images?: string[];
  demoUrl?: string;
  language?: string;
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
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [demoUrl, setDemoUrl] = useState(initial?.demoUrl ?? '');
  const [language, setLanguage] = useState(initial?.language ?? '');
  const [tiers, setTiers] = useState<TierFormValue[]>(initial?.tiers ?? []);
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

  const updateTier = (idx: number, patch: Partial<TierFormValue>) => {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };
  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      { name: '', slug: '', price: 0, description: '', sortOrder: prev.length },
    ]);
  };
  const removeTier = (idx: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== idx));
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
      // Gallery + demo + ngôn ngữ (Phase 2)
      images: images.filter((u) => u.trim()) ,
      demoUrl: demoUrl || undefined,
      language: language || undefined,
      // Gửi gói license (đa license); backend thay thế toàn bộ khi có mảng này
      tiers: tiers.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        price: Number(t.price),
        description: t.description || undefined,
        sortOrder: t.sortOrder ?? 0,
      })),
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

      <div>
        <label className="mb-1.5 block text-sm font-medium">Gallery (nhiều ảnh, mỗi URL 1 dòng)</label>
        <textarea
          rows={3}
          value={images.join('\n')}
          onChange={(e) =>
            setImages(e.target.value.split('\n').map((u) => u.trim()).filter(Boolean))
          }
          className="input resize-y"
          placeholder="https://.../1.png\nshttps://.../2.png"
        />
        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((u, i) => (
              <img key={i} src={u} alt={`gallery-${i}`} className="h-16 w-16 rounded-lg border border-border object-cover" />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Link demo</label>
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            className="input"
            placeholder="https://demo.example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Ngôn ngữ (VD: javascript, python)</label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input"
            placeholder="javascript"
          />
        </div>
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

      {/* Editor gói license (đa license Phase 2) */}
      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-sm font-bold">Gói license</h4>
          <button type="button" onClick={addTier} className="chip text-xs">
            + Thêm gói
          </button>
        </div>
        {tiers.length === 0 && (
          <p className="text-sm text-muted-2">Chưa có gói. Mặc định website dùng giá cơ bản bên trên.</p>
        )}
        <div className="space-y-3">
          {tiers.map((t, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-surface p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">Tên gói</label>
                  <input
                    required
                    value={t.name}
                    onChange={(e) => updateTier(idx, { name: e.target.value })}
                    className="input"
                    placeholder="VD: Extended"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Slug</label>
                  <input
                    required
                    value={t.slug}
                    onChange={(e) => updateTier(idx, { slug: e.target.value })}
                    className="input"
                    placeholder="extended"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Giá (VND)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={t.price}
                    onChange={(e) => updateTier(idx, { price: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Thứ tự</label>
                  <input
                    type="number"
                    min={0}
                    value={t.sortOrder ?? idx}
                    onChange={(e) => updateTier(idx, { sortOrder: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium">Mô tả</label>
                  <input
                    value={t.description ?? ''}
                    onChange={(e) => updateTier(idx, { description: e.target.value })}
                    className="input"
                    placeholder="Quyền lợi gói này..."
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeTier(idx)}
                  className="text-xs font-medium text-danger transition-colors hover:text-danger-soft"
                >
                  Xoá gói
                </button>
              </div>
            </div>
          ))}
        </div>
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
