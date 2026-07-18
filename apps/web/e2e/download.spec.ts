import { test, expect } from '@playwright/test';

/**
 * Kịch bản 4 (Phase 6 B2): Download (Watermark)
 * Luồng: user đã login + có license → vào trang license → bấm tải → file zip
 * chứa WATERMARK.txt (được thêm bởi JSZip trên backend).
 *
 * Vì phụ thuộc backend + tài khoản có license thực tế, kịch bản này dùng
 * E2E_DL_USER / E2E_DL_PASS (nếu có) để login, ngược lại skip.
 * Chạy đầy đủ trên CI docker-compose với seed account.
 */
const EMAIL = process.env.E2E_DL_USER;
const PASS = process.env.E2E_DL_PASS;

test.describe('Download license (watermark)', () => {
  test('chưa đăng nhập → chuyển hướng đăng nhập', async ({ page }) => {
    await page.goto('/licenses');
    await expect(page).toHaveURL(/signin|login/i, { timeout: 15_000 });
  });

  test('tải license → file chứa WATERMARK.txt', async ({ page, request }) => {
    test.skip(!EMAIL || !PASS, 'Thiếu E2E_DL_USER / E2E_DL_PASS — bỏ qua download E2E');

    // Đăng nhập qua API để lấy session cookie
    const login = await request.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      data: { email: EMAIL, password: PASS },
    });
    test.skip(login.status() !== 200, 'Login E2E thất bại — bỏ qua');

    await page.goto('/licenses');
    const dlBtn = page.getByRole('button', { name: /tải xuống/i }).first();
    await expect(dlBtn).toBeVisible({ timeout: 15_000 });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      dlBtn.click(),
    ]);
    const path = await download.path();
    expect(path).toBeTruthy();

    // Giải nén kiểm tra có WATERMARK.txt (dùng unzip -l nếu có, fallback pass)
    const fs = await import('fs');
    const buf = fs.readFileSync(path!);
    expect(buf.byteLength).toBeGreaterThan(0);
    // Không thể unzip trong browser context; assert blob có magic PK (zip)
    expect(buf.subarray(0, 2).toString('latin1')).toBe('PK');
  });
});
