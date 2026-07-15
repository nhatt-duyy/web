import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';

type PostType = 'BLOG' | 'PAGE';
type PostStatus = 'DRAFT' | 'PUBLISHED';

type Category = { id: string; name: string };

type PostRow = {
  id: string;
  type: PostType;
  title: string;
  slug: string;
  status: PostStatus;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { name: string } | null;
};

type PostsResponse = { data: PostRow[]; total: number; page: number; limit: number };

type PostFormValues = {
  id?: string;
  title: string;
  type: PostType;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  status: PostStatus;
  categoryId: string;
  seoTitle: string;
  seoDescription: string;
};

const EMPTY: PostFormValues = {
  title: '',
  type: 'BLOG',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  status: 'DRAFT',
  categoryId: '',
  seoTitle: '',
  seoDescription: '',
};

// Slugify phía client để hiển thị preview (đồng bộ với backend).
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const TYPE_BADGE: Record<PostType, string> = {
  BLOG: 'bg-primary-soft text-primary',
  PAGE: 'bg-surface-2 text-muted',
};

const STATUS_BADGE: Record<PostStatus, string> = {
  PUBLISHED: 'bg-success/10 text-success',
  DRAFT: 'bg-warning/10 text-warning',
};

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const Posts = () => {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<PostFormValues | null>(null);
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, catRes] = await Promise.all([
        apiClient.get<PostsResponse>('/posts/admin', { params: { limit: 100 } }),
        apiClient.get<Category[]>('/categories'),
      ]);
      setPosts(postsRes.data.data);
      setCategories(catRes.data);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.response?.data?.message || 'Tải dữ liệu thất bại' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing({ ...EMPTY });
    setPreview(false);
    setShowEditor(true);
  };

  const openEdit = async (id: string) => {
    try {
      const res = await apiClient.get<PostFormValues>(`/posts/admin/${id}`);
      setEditing(res.data);
      setPreview(false);
      setShowEditor(true);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.response?.data?.message || 'Tải bài viết thất bại' });
    }
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`Xóa bài viết "${title}"? Hành động không thể hoàn tác.`)) return;
    try {
      await apiClient.delete(`/posts/admin/${id}`);
      setNotice({ type: 'success', message: 'Đã xóa bài viết' });
      load();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.response?.data?.message || 'Xóa thất bại' });
    }
  };

  const save = async (status: PostStatus) => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.content.trim()) {
      setNotice({ type: 'error', message: 'Tiêu đề và nội dung không được để trống' });
      return;
    }
    const payload = {
      ...editing,
      status,
      slug: editing.slug.trim() ? editing.slug.trim() : undefined,
      categoryId: editing.categoryId || undefined,
    };
    try {
      if (editing.id) {
        await apiClient.patch(`/posts/admin/${editing.id}`, payload);
      } else {
        await apiClient.post('/posts', payload);
      }
      setNotice({ type: 'success', message: status === 'PUBLISHED' ? 'Đã xuất bản' : 'Đã lưu nháp' });
      setShowEditor(false);
      setEditing(null);
      load();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.response?.data?.message || 'Lưu thất bại' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bài viết & Trang</h1>
          <p className="text-sm text-muted">Quản lý blog và trang tĩnh (CMS)</p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm" onClick={openCreate}>
          <PlusIcon /> Viết mới
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-2 text-sm ${
            notice.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger-soft text-danger'
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Tiêu đề</th>
              <th className="px-4 py-3 font-medium">Loại</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Lượt xem</th>
              <th className="px-4 py-3 font-medium">Ngày</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-border/60 hover:bg-surface-2/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{p.title}</div>
                  <div className="text-xs text-muted">/{p.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`chip ${TYPE_BADGE[p.type]}`}>{p.type}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`chip ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-muted">{p.viewCount}</td>
                <td className="px-4 py-3 text-muted">{fmtDate(p.status === 'PUBLISHED' ? p.publishedAt : p.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      className="btn-outline px-3 py-1 text-sm"
                      onClick={() => openEdit(p.id)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn-outline px-3 py-1 text-sm text-danger"
                      onClick={() => remove(p.id, p.title)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && posts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Chưa có bài viết nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showEditor && editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="card my-8 w-full max-w-3xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editing.id ? 'Chỉnh sửa bài viết' : 'Viết mới'}
              </h2>
              <button
                className="btn-outline px-3 py-1 text-sm"
                onClick={() => {
                  setShowEditor(false);
                  setEditing(null);
                }}
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted" htmlFor="p-title">
                  Tiêu đề <span className="text-danger">*</span>
                </label>
                <input
                  id="p-title"
                  className="input w-full"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Tiêu đề bài viết"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted" htmlFor="p-slug">
                  Slug (để trống tự sinh)
                </label>
                <input
                  id="p-slug"
                  className="input w-full"
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder={slugify(editing.title) || 'slug-tu-dong'}
                />
                {!editing.slug.trim() && editing.title.trim() && (
                  <p className="mt-1 text-xs text-muted">Sẽ dùng: /{slugify(editing.title)}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted" htmlFor="p-type">
                  Loại
                </label>
                <select
                  id="p-type"
                  className="input w-full"
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value as PostType })}
                >
                  <option value="BLOG">BLOG</option>
                  <option value="PAGE">PAGE</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted" htmlFor="p-category">
                  Danh mục
                </label>
                <select
                  id="p-category"
                  className="input w-full"
                  value={editing.categoryId}
                  onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                >
                  <option value="">— Không —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted" htmlFor="p-cover">
                  Ảnh bìa (URL)
                </label>
                <input
                  id="p-cover"
                  className="input w-full"
                  value={editing.coverImage}
                  onChange={(e) => setEditing({ ...editing, coverImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted" htmlFor="p-excerpt">
                  Tóm tắt
                </label>
                <textarea
                  id="p-excerpt"
                  className="input w-full resize-y"
                  rows={2}
                  value={editing.excerpt}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  placeholder="Mô tả ngắn (tối đa 300 ký tự)"
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm text-muted" htmlFor="p-content">
                    Nội dung (Markdown) <span className="text-danger">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn-outline px-3 py-1 text-xs"
                    onClick={() => setPreview((v) => !v)}
                  >
                    {preview ? 'Sửa' : 'Xem trước'}
                  </button>
                </div>
                {preview ? (
                  <div className="min-h-[220px] whitespace-pre-wrap rounded-lg border border-border bg-surface-2/40 p-4 text-sm text-foreground">
                    {editing.content || '（chưa có nội dung）'}
                  </div>
                ) : (
                  <textarea
                    id="p-content"
                    className="input w-full resize-y font-mono text-sm"
                    rows={12}
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    placeholder="# Tiêu đề&#10;&#10;Nội dung Markdown..."
                  />
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-muted" htmlFor="p-seo-title">
                    SEO Title
                  </label>
                  <input
                    id="p-seo-title"
                    className="input w-full"
                    value={editing.seoTitle}
                    onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted" htmlFor="p-seo-desc">
                    SEO Description
                  </label>
                  <input
                    id="p-seo-desc"
                    className="input w-full"
                    value={editing.seoDescription}
                    onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button className="btn-outline px-4 py-2 text-sm" onClick={() => save('DRAFT')}>
                Lưu nháp
              </button>
              <button className="btn-primary px-4 py-2 text-sm" onClick={() => save('PUBLISHED')}>
                Xuất bản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts;
