import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchBar from '@/components/search-bar';

const pushMock = vi.fn();

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const searchParamsMock = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: (href: string) => pushMock(href) }),
  useSearchParams: () => searchParamsMock,
}));

describe('SearchBar', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('render ô input với aria-label tìm kiếm', () => {
    render(<SearchBar />);
    const input = screen.getByLabelText('Tìm kiếm sản phẩm');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'search');
  });

  it('chuyển hướng đến /products?q= khi submit form có từ khóa', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByLabelText('Tìm kiếm sản phẩm') as HTMLInputElement;
    await user.type(input, 'nextjs');
    await user.type(input, '{Enter}');
    expect(pushMock).toHaveBeenCalledWith('/products?q=nextjs');
  });

  it('không vi phạm a11y', async () => {
    const { container } = render(<SearchBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
