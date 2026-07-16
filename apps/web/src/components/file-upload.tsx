'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useApi } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { CheckCircleIcon, ArrowUpRightIcon, CloseIcon } from '@/components/ui/icons';

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadedFile {
  name: string;
  fileKey: string;
  size: number;
}

interface FileUploadProps {
  /** fileKeys đã upload thành công, truyền ra ngoài qua onChange. */
  onChange: (keys: string[]) => void;
  className?: string;
}

/**
 * Upload file đính kèm yêu cầu báo giá qua presigned PUT R2.
 * Lưu ý: backend presign-upload yêu cầu role ADMIN/STAFF, nên chỉ bật khi khách đã login
 * (được xem là staff/admin). Khách vãng lai sẽ thấy trạng thái disabled + hướng dẫn.
 */
export default function FileUpload({ onChange, className }: FileUploadProps) {
  const { status } = useSession();
  const api = useApi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ name: string; size: number }[]>([]);

  const canUpload = status === 'authenticated';

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setError(null);
    if (files.length + picked.length > MAX_FILES) {
      setError(`Chỉ được đính kèm tối đa ${MAX_FILES} file.`);
      return;
    }
    const oversized = picked.find((f) => f.size > MAX_SIZE);
    if (oversized) {
      setError(`File "${oversized.name}" vượt quá 10MB.`);
      return;
    }
    if (!canUpload) {
      setError('Vui lòng đăng nhập để đính kèm file (tính năng upload yêu cầu tài khoản).');
      return;
    }

    setUploading(true);
    const newPending = picked.map((f) => ({ name: f.name, size: f.size }));
    setPending((p) => [...p, ...newPending]);

    try {
      const uploaded: UploadedFile[] = [];
      for (const file of picked) {
        // 1. Lấy presigned URL
        const presignRes = await api('/files/presign-upload', {
          method: 'POST',
          body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' }),
        });
        if (!presignRes.ok) {
          const errJson = await presignRes.json().catch(() => null);
          throw new Error(errJson?.message ?? `Không tạo được link upload cho ${file.name}`);
        }
        const { url, key } = (await presignRes.json()) as { url: string; key: string };
        // 2. PUT file trực tiếp lên R2
        const putRes = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });
        if (!putRes.ok) throw new Error(`Upload ${file.name} thất bại.`);
        uploaded.push({ name: file.name, fileKey: key, size: file.size });
        setPending((p) => p.filter((x) => x.name !== file.name));
      }
      const merged = [...files, ...uploaded];
      setFiles(merged);
      onChange(merged.map((f) => f.fileKey));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload thất bại.');
      setPending([]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeFile = (key: string) => {
    const merged = files.filter((f) => f.fileKey !== key);
    setFiles(merged);
    onChange(merged.map((f) => f.fileKey));
  };

  const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={!canUpload || uploading}
          onChange={handleSelect}
          className="hidden"
          id="quote-file-input"
          aria-label="Chọn file đính kèm"
        />
        <label
          htmlFor="quote-file-input"
          aria-disabled={!canUpload || uploading}
          className={cn(
            'inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong px-4 text-sm font-medium transition-colors',
            canUpload && !uploading
              ? 'text-muted hover:border-primary hover:text-foreground'
              : 'cursor-not-allowed text-muted-2 opacity-60',
          )}
        >
          <ArrowUpRightIcon className="h-4 w-4" />
          {uploading ? 'Đang tải lên…' : `Đính kèm file (tối đa ${MAX_FILES} file, 10MB/file)`}
        </label>
        {!canUpload && (
          <p className="text-xs text-warning">Đăng nhập để đính kèm file mô tả yêu cầu.</p>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {(files.length > 0 || pending.length > 0) && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.fileKey}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" />
                <span className="truncate text-foreground">{f.name}</span>
                <span className="shrink-0 text-xs text-muted">({formatSize(f.size)})</span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(f.fileKey)}
                aria-label={`Xoá ${f.name}`}
                className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
          {pending.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="truncate text-muted">{p.name}</span>
                <span className="shrink-0 text-xs text-muted">({formatSize(p.size)})</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
