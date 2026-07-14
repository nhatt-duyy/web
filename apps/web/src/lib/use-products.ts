'use client';

import { useEffect, useState } from 'react';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string | null;
  fileKey: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  data: Product[];
  total: number;
}

interface UseProductsOptions {
  sortBy?: 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  page?: number;
  // category?: string; // not required for this task
}

interface UseProductsReturn {
  data: Product[];
  total: number;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch products from the public API endpoint.
 * @param options - Query parameters for filtering, sorting, pagination.
 * @returns Object containing data, total count, loading state, and error.
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    sortBy = 'createdAt',
    sortOrder = 'desc',
    limit = 8,
    page = 1,
  } = options;

  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build query string
        const params = new URLSearchParams();
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        params.append('limit', limit.toString());
        params.append('page', page.toString());

        const response = await fetch(`/api/products?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        if (isMounted) {
          setData(result.data);
          setTotal(result.total);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('An unknown error occurred'));
          setData([]); // fallback to empty array
          setTotal(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [sortBy, sortOrder, limit, page]);

  return { data, total, loading, error };
}