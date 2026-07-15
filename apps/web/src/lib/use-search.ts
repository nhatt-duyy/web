import { useEffect, useState } from 'react';

// Document trả về từ MeiliSearch (đồng bộ với ProductDoc backend)
export interface SearchProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail: string | null;
  categoryId: string;
  categoryName: string;
  isPublished: boolean;
  language: string | null;
  images: string[];
  createdAt: number;
}

interface UseSearchOptions {
  q?: string;
  category?: string;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'createdAt' | '_text_match';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

/**
 * Hook tìm kiếm sản phẩm đa tiêu chí qua MeiliSearch (proxy /api/search/products).
 */
export default function useSearch({
  q = '',
  category,
  language,
  minPrice,
  maxPrice,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  limit = 12,
  page = 1,
}: UseSearchOptions = {}) {
  const [data, setData] = useState<SearchProduct[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (category) params.append('category', category);
        if (language) params.append('language', language);
        if (typeof minPrice === 'number') params.append('minPrice', String(minPrice));
        if (typeof maxPrice === 'number') params.append('maxPrice', String(maxPrice));
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        params.append('limit', String(limit));
        params.append('page', String(page));

        const response = await fetch(`/api/search/products?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Tìm kiếm thất bại: ${response.status}`);
        }

        const result = await response.json();
        if (isMounted) {
          setData(result.data ?? []);
          setTotal(result.total ?? 0);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Lỗi tìm kiếm'));
          setData([]);
          setTotal(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSearch();
    return () => {
      isMounted = false;
    };
  }, [q, category, language, minPrice, maxPrice, sortBy, sortOrder, limit, page]);

  return { data, total, loading, error };
}
