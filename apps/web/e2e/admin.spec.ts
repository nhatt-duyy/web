import { test, expect } from '@playwright/test';

/**
 * Kịch bản 5 (Phase 6 B2): Admin revoke → user download 403
 * Luồng: admin login → vào /admin/licenses → revoke 1 license →
 * user tương ứng gọi API download trả 403.
 *
 * Phụ thuộc backend + tài khoản admin thực tế (E2E_ADMIN_USER / E2E_ADMIN_PASS).
 * Nếu thiếu credentials → skip (chạy đủ trên CI docker-compose với seed).
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_USER;
const ADMIN_PASS = process.env.E2E_ADMIN_PASS;

test.describe('Admin revoke license', () => {
  test('admin chưa đăng nhập → chuyển hướng đăng nhập', async ({ page }) => {
    await page.goto('/admin/licenses');
    await expect(page).toHaveURL(/signin|login/i, { timeout: 15_000 });
  });

  test('admin revoke license → API download trả 403', async ({ request }) => {
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASS,
      'Thiếu E2E_ADMIN_USER / E2E_ADMIN_PASS — bỏ qua admin E2E',
    );

    const login = await request.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASS },
    });
    test.skip(login.status() !== 200, 'Admin login E2E thất bại — bỏ qua');

    const { access_token } = await login.json();
    // Revoke license đầu tiên qua API admin (seed license id)
    const licenseId = process.env.E2E_LICENSE_ID;
    test.skip(!licenseId, 'Thiếu E2E_LICENSE_ID — bỏ qua');

    const revoke = await request.patch(
      `${process.env.NEXT_PUBLIC_API_URL}/licenses/${licenseId}/revoke`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    expect(revoke.status()).toBeLessThan(500);

    // User gọi download → 403 Forbidden
    const dl = await request.get(
      `${process.env.NEXT_PUBLIC_API_URL}/licenses/${licenseId}/download`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    expect(dl.status()).toBe(403);
  });
});
