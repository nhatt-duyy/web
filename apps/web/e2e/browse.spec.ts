import { test, expect } from '@playwright/test';

/**
 * Kịch bản 2 (Phase 6 B2): Browse
 * Verify luồng duyệt sản phẩm: trang chủ → danh sách sản phẩm → (nếu có) mở chi tiết.
 * Không ép backend có data — nếu list rỗng (chưa seed) vẫn pass ở mức render trang.
 */
test.describe('Browse', () => {
  test('trang chủ render hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('trang sản phẩm render khu vực lọc + danh sách', async ({ page }) => {
    await page.goto('/products');
    // Heading hoặc container lọc phải xuất hiện
    await expect(
      page.getByRole('heading', { name: /sản phẩm/i }).or(
        page.getByPlaceholder(/tìm kiếm/i),
      ),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('click vào sản phẩm đầu tiên mở trang chi tiết', async ({ page }) => {
    await page.goto('/products');
    // Đợi list render (có hoặc không có data)
    const cards = page.locator('a[href^="/products/"]');
    await page.waitForTimeout(2000);
    const count = await cards.count();
    test.skip(count === 0, 'Chưa có sản phẩm nào được seed — bỏ qua bước mở chi tiết');
    await cards.first().click();
    await expect(page).toHaveURL(/\/products\/.+/);
  });
});
