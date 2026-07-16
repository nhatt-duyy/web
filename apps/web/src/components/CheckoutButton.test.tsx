import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import CheckoutButton from '@/components/CheckoutButton';

describe('CheckoutButton', () => {
  it('render nút với label mặc định', () => {
    render(<CheckoutButton onCheckout={() => {}} />);
    expect(screen.getByRole('button', { name: 'Thanh toán' })).toBeInTheDocument();
  });

  it('gọi onCheckout khi click', async () => {
    const onCheckout = vi.fn();
    render(<CheckoutButton onCheckout={onCheckout} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it('bị disabled khi truyền disabled', async () => {
    const onCheckout = vi.fn();
    render(<CheckoutButton onCheckout={onCheckout} disabled />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onCheckout).not.toHaveBeenCalled();
  });

  it('không vi phạm a11y', async () => {
    const { container } = render(<CheckoutButton onCheckout={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
