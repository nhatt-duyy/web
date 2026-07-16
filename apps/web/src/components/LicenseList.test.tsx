import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import LicenseList from '@/components/LicenseList';

const mockLicenses = [
  { id: 'l1', productName: 'Demo Source Code', keyMasked: 'XXXX-XXXX-1234', status: 'active' as const },
  { id: 'l2', productName: 'Admin Dashboard', keyMasked: 'XXXX-XXXX-5678', status: 'expired' as const },
];

describe('LicenseList', () => {
  it('render danh sách license', () => {
    render(<LicenseList licenses={mockLicenses} />);
    expect(screen.getByText('Demo Source Code')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('hiển thị trạng thái tiếng Việt', () => {
    render(<LicenseList licenses={mockLicenses} />);
    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument();
    expect(screen.getByText('Hết hạn')).toBeInTheDocument();
  });

  it('hiển thị thông báo khi không có license', () => {
    render(<LicenseList licenses={[]} />);
    expect(screen.getByText('Bạn chưa có license nào.')).toBeInTheDocument();
  });

  it('không vi phạm a11y', async () => {
    const { container } = render(<LicenseList licenses={mockLicenses} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
