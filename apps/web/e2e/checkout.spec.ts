import { test, expect } from '@playwright/test';

/**
 * Kịch bản 3 (Phase 6 B2): Cart → Checkout
 * - Giỏ hàng trống hiển thị empty state.
 * - Thêm item vào cart (zustand persist localStorage) → item hiển thị.
 * - Vào /checkout khi chưa đăng nhập → redirect sang trang đăng nhập.
 */
test.describe('Cart & Checkout', () => {
  test('giỏ hàng trống hiển thị empty state', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /giỏ hàng/i })).toBeVisible();
    await expect(page.getByText(/giỏ hàng trống/i)).toBeVisible();
  });

  test('thêm item vào cart → hiển thị trong giỏ', async ({ page }) => {
    await page.goto('/');
    // Bơm 1 item vào zustand persist store (key mặc định "cart-storage")
    await page.evaluate(() => {
      const state = {
        state: {
          items: [
            {
              productId: 'e2e-prod-1',
              slug: 'e2e-demo',
              title: 'Sản phẩm E2E',
              price: 199000,
              qty: 1,
              thumbnail: null,
            },
          ],
        },
        version: 0,
      };
      localStorage.setItem('cart-storage', JSON.stringify(state));
    });
    await page.goto('/cart');
    await expect(page.getByText(/sản phẩm e2e/i)).toBeVisible({ timeout: 10_000 });
  });

  test('checkout khi chưa đăng nhập → chuyển hướng đăng nhập', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/signin|login/i, { timeout: 15_000 });
  });
});
