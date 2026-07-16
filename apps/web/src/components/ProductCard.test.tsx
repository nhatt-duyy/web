import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '@/components/product-card';

// Mock next/link vì test chạy trong jsdom (không có Next runtime)
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockProduct = {
  id: '1',
  slug: 'demo-source-code',
  title: 'Demo Source Code Next.js',
  description: 'Mô tả ngắn gọn về sản phẩm source code mẫu.',
  price: 250000,
  thumbnail: 'https://example.com/thumb.png',
  fileKey: 'abc',
  categoryId: 'cat-1',
  category: { id: 'cat-1', name: 'Web App', slug: 'web-app' },
  isPublished: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProductCard', () => {
  it('render đúng tiêu đề, giá và link chi tiết', () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Demo Source Code Next.js')).toBeInTheDocument();
    expect(screen.getByText('250.000 ₫')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/demo-source-code');
  });

  it('có alt text cho ảnh thumbnail', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByAltText('Demo Source Code Next.js')).toBeInTheDocument();
  });

  it('không vi phạm a11y', async () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
