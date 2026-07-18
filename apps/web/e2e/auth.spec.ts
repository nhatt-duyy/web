import { test, expect } from '@playwright/test';

/**
 * Kịch bản 1 (Phase 6 B2): Auth UI
 * Verify trang login / register render đúng form và điều hướng.
 * Không phụ thuộc backend — chỉ kiểm tra render + navigation client-side.
 */
test.describe('Auth UI', () => {
  test('trang login render form email + password', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mật khẩu/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /google|github/i }),
    ).toHaveCount(2);
  });

  test('link sang trang register hoạt động', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /đăng ký|register/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /đăng ký|tạo tài khoản/i })).toBeVisible();
  });

  test('login sai credentials hiển thị lỗi', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('khongtonTai@example.com');
    await page.getByLabel(/mật khẩu/i).fill('sai-mat-khau-123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    // Backend trả 401 → NextAuth error → form hiện thông báo
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 });
  });
});
