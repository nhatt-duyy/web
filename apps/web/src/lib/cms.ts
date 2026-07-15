// Helper lấy dữ liệu CMS (Posts) từ backend NestJS cho server component.
// Web proxy /api/* → backend, nhưng server component fetch trực tiếp API_URL để tránh vòng lặp.

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

export type CmsPostSummary = {
  id: string;
  type: 'BLOG' | 'PAGE';
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  viewCount: number;
  author: { name: string } | null;
  category: { name: string; slug: string } | null;
};

export type CmsPostDetail = CmsPostSummary & {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export async function getPosts(type?: 'BLOG' | 'PAGE'): Promise<CmsPostSummary[]> {
  const url = new URL('/posts', API_BASE);
  if (type) url.searchParams.set('type', type);
  url.searchParams.set('limit', '24');
  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: CmsPostSummary[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<CmsPostDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as CmsPostDetail;
  } catch {
    return null;
  }
}
