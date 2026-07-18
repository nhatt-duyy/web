import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import ProductGrid from '@/components/product-grid';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockProducts = [
  {
    id: '1',
    slug: 'demo-1',
    title: 'Demo Source Code 1',
    description: 'Mô tả sản phẩm 1.',
    price: 250000,
    thumbnail: 'https://example.com/1.png',
    fileKey: 'abc',
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Web App', slug: 'web-app' },
    isPublished: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    slug: 'demo-2',
    title: 'Demo Source Code 2',
    description: 'Mô tả sản phẩm 2.',
    price: 350000,
    thumbnail: null,
    fileKey: null,
    categoryId: null,
    category: null,
    isPublished: true,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('ProductGrid', () => {
  it('render đúng số lượng ProductCard từ danh sách', () => {
    render(<ProductGrid products={mockProducts} />);
    expect(screen.getByText('Demo Source Code 1')).toBeInTheDocument();
    expect(screen.getByText('Demo Source Code 2')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('render thông báo khi danh sách rỗng', () => {
    const { container } = render(<ProductGrid products={[]} />);
    // Grid rỗng vẫn render div bao ngoài mà không có card nào
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelector('div.grid')).toBeInTheDocument();
  });

  it('không vi phạm a11y', async () => {
    const { container } = render(<ProductGrid products={mockProducts} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
