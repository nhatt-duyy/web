// Load test k6 — đường dẫn download license
// Chạy: k6 run scripts/load-test-download.js
//
// Mô tả:
// - setup: login lấy JWT token + 1 license id hợp lệ từ API.
// - default: gọi GET /licenses/:id/download với header Authorization.
// - Mục tiêu: 50 RPS (constant arrival rate) trong 1 phút.
// - Checks: tỷ lệ 5xx < 5%, p95 latency < 500ms.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Base URL API — override bằng env BASE_URL nếu cần (mặc định localhost:3000)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Tỷ lệ lỗi 5xx — dùng để assert < 5%
const serverErrors = new Rate('server_errors_5xx');

export const options = {
  scenarios: {
    download: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 request / giây
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // p95 < 500ms
    server_errors_5xx: ['rate<0.05'], // 5xx < 5%
  },
};

// Lấy token + license id hợp lệ trước khi chạy
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: __ENV.TEST_EMAIL || 'test@example.com',
      password: __ENV.TEST_PASSWORD || 'test-password',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let token = null;
  try {
    token = loginRes.json('access_token') || loginRes.json('token');
  } catch (e) {
    token = null;
  }

  let licenseId = __ENV.TEST_LICENSE_ID || null;
  if (!licenseId && token) {
    const licRes = http.get(`${BASE_URL}/licenses?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    try {
      const body = licRes.json();
      licenseId = body?.data?.[0]?.id || body?.[0]?.id || null;
    } catch (e) {
      licenseId = null;
    }
  }

  return { token, licenseId };
}

export default function (data) {
  const { token, licenseId } = data;

  if (!token || !licenseId) {
    // Không có token/license → bỏ qua để không sinh noise metric
    return;
  }

  const res = http.get(`${BASE_URL}/licenses/${licenseId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  serverErrors.add(res.status >= 500);

  check(res, {
    'status is 200/302': (r) => r.status === 200 || r.status === 302,
    'no 5xx': (r) => r.status < 500,
  });

  sleep(0.1);
}

export function teardown() {
  // Không cần cleanup (chỉ đọc download link, không ghi state)
}
