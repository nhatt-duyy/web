'use client';

import { useState } from 'react';
import { useApi } from '@/lib/api-client';
import { type CreateRequestPayload } from '@/lib/custom-projects';

interface SubmitState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: CreateRequestPayload | null;
}

/**
 * Hook gửi yêu cầu báo giá (POST /api/custom-requests).
 * Tự động đính kèm token nếu đã login (useApi). Khách vãng lai gửi contactName/Email.
 */
export function useQuote() {
  const api = useApi();
  const [state, setState] = useState<SubmitState>({
    loading: false,
    error: null,
    success: false,
    data: null,
  });

  const submit = async (payload: CreateRequestPayload) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api('/custom-requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Cố gắng parse message lỗi tiếng Việt từ backend.
        let message = 'Gửi yêu cầu thất bại, vui lòng thử lại.';
        try {
          const errJson = await res.json();
          if (errJson?.message) {
            message = Array.isArray(errJson.message)
              ? errJson.message.join('. ')
              : String(errJson.message);
          }
        } catch {
          /* giữ message mặc định */
        }
        setState({ loading: false, error: message, success: false, data: null });
        return null;
      }

      const created = (await res.json()) as CreateRequestPayload;
      setState({ loading: false, error: null, success: true, data: created });
      return created;
    } catch (err) {
      setState({
        loading: false,
        error: 'Không thể kết nối máy chủ, vui lòng kiểm tra mạng.',
        success: false,
        data: null,
      });
      return null;
    }
  };

  const reset = () => setState({ loading: false, error: null, success: false, data: null });

  return { ...state, submit, reset };
}
