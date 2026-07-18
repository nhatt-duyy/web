import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import PortfolioCard from '@/components/portfolio-card';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockProject = {
  id: 'p1',
  slug: 'website-ban-hang',
  title: 'Website bán hàng đa nền tảng',
  description:
    'Dự án custom development xây dựng website bán hàng với đầy đủ tính năng quản lý đơn hàng, kho hàng và tích hợp cổng thanh toán.',
  status: 'done' as const,
  isShowcase: true,
  quotedAmount: 15000000,
  warrantyMonths: 12,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  request: { type: 'WEB_APP' as const },
  user: { name: 'Công ty ABC' },
  files: [{ id: 'f1', name: 'thumb.png', fileKey: 'deliverables/thumb.png', mimeType: 'image/png' }],
};

describe('PortfolioCard', () => {
  it('render tiêu đề, badge loại dự án và link detail', () => {
    render(<PortfolioCard project={mockProject} />);
    expect(screen.getByText('Website bán hàng đa nền tảng')).toBeInTheDocument();
    // PROJECT_TYPE_LABELS['WEB_APP'] = 'Web App'
    expect(screen.getByText('Web App')).toBeInTheDocument();
    expect(screen.getByText('Khách hàng: Công ty ABC')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/du-an/website-ban-hang');
  });

  it('hiển thị fallback khi không có thumbnail', () => {
    render(<PortfolioCard project={{ ...mockProject, files: null }} />);
    expect(screen.getByText('Chưa có ảnh bàn giao')).toBeInTheDocument();
  });

  it('không vi phạm a11y', async () => {
    const { container } = render(<PortfolioCard project={mockProject} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
