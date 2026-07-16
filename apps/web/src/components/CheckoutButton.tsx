'use client';

interface CheckoutButtonProps {
  onCheckout: () => void;
  label?: string;
  disabled?: boolean;
}

export default function CheckoutButton({
  onCheckout,
  label = 'Thanh toán',
  disabled = false,
}: CheckoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onCheckout}
      disabled={disabled}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
