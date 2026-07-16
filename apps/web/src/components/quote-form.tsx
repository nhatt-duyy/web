'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuote } from '@/lib/use-quote';
import FileUpload from '@/components/file-upload';
import { Button, Input, Select, Textarea } from '@/components/ui/primitives';
import { type ProjectType, PROJECT_TYPE_OPTIONS, type CreateRequestPayload } from '@/lib/custom-projects';
import { CheckCircleIcon } from '@/components/ui/icons';

// Các khoảng ngân sách gợi ý (VND).
const BUDGET_RANGES = [
  { value: '', label: 'Thỏa thuận / chưa rõ' },
  { value: '5000000', label: 'Dưới 5 triệu' },
  { value: '15000000', label: '5 – 15 triệu' },
  { value: '30000000', label: '15 – 30 triệu' },
  { value: '50000000', label: '30 – 50 triệu' },
  { value: '100000000', label: 'Trên 50 triệu' },
];

export default function QuoteForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { submit, loading, error, success } = useQuote();

  const [type, setType] = useState<ProjectType>('WEB_APP');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetCustom, setBudgetCustom] = useState('');
  const [deadline, setDeadline] = useState('');
  const [fileKeys, setFileKeys] = useState<string[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Lỗi validate từng trường
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isLoggedIn = status === 'authenticated';
  // Khách vãng lai mới hiện trường tên/email
  const showContact = !isLoggedIn;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!type) errs.type = 'Vui lòng chọn loại dự án';
    if (title.trim().length < 5 || title.trim().length > 200)
      errs.title = 'Tiêu đề phải từ 5 đến 200 ký tự';
    if (description.trim().length < 20 || description.trim().length > 5000)
      errs.description = 'Mô tả phải từ 20 đến 5000 ký tự';

    const budgetNum = budgetCustom ? Number(budgetCustom) : budget ? Number(budget) : 0;
    if (budgetCustom && (isNaN(budgetNum) || budgetNum < 0))
      errs.budget = 'Ngân sách phải là số dương (VND)';

    if (showContact) {
      if (contactName.trim().length < 2) errs.contactName = 'Vui lòng nhập tên liên hệ';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
        errs.contactEmail = 'Email không hợp lệ';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const budgetNum = budgetCustom
      ? Number(budgetCustom)
      : budget
        ? Number(budget)
        : undefined;

    const payload: CreateRequestPayload = {
      type,
      title: title.trim(),
      description: description.trim(),
      ...(budgetNum ? { budget: budgetNum } : {}),
      ...(deadline ? { deadline: new Date(deadline).toISOString() } : {}),
      ...(fileKeys.length ? { fileKeys } : {}),
    };

    if (showContact) {
      payload.contactName = contactName.trim();
      payload.contactEmail = contactEmail.trim();
    }

    const created = await submit(payload);
    if (created) {
      router.push('/du-an?sent=1');
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
        <CheckCircleIcon className="mx-auto h-10 w-10 text-success" />
        <h3 className="mt-3 font-display text-xl font-semibold">Đã gửi yêu cầu thành công</h3>
        <p className="mt-2 text-sm text-muted">
          Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
        </p>
        <Button className="mt-5" variant="outline" onClick={() => router.push('/du-an')}>
          Xem dự án đã thực hiện
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Loại dự án */}
      <div className="space-y-1.5">
        <label htmlFor="type" className="text-sm font-medium text-foreground">
          Loại dự án <span className="text-danger">*</span>
        </label>
        <Select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as ProjectType)}
          className="w-full"
        >
          {PROJECT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        {fieldErrors.type && <p className="text-xs text-danger">{fieldErrors.type}</p>}
      </div>

      {/* Tiêu đề */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Tiêu đề yêu cầu <span className="text-danger">*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Xây dựng web bán hàng đa chi nhánh"
          maxLength={200}
          aria-invalid={!!fieldErrors.title}
        />
        <div className="flex justify-between">
          {fieldErrors.title ? (
            <p className="text-xs text-danger">{fieldErrors.title}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted">{title.length}/200</span>
        </div>
      </div>

      {/* Mô tả */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Mô tả chi tiết <span className="text-danger">*</span>
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả chức năng, mục tiêu, đối tượng người dùng, công nghệ mong muốn…"
          rows={6}
          maxLength={5000}
          aria-invalid={!!fieldErrors.description}
        />
        <div className="flex justify-between">
          {fieldErrors.description ? (
            <p className="text-xs text-danger">{fieldErrors.description}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted">{description.length}/5000</span>
        </div>
      </div>

      {/* Ngân sách */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="budget-range" className="text-sm font-medium text-foreground">
            Khoảng ngân sách
          </label>
          <Select
            id="budget-range"
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              setBudgetCustom('');
            }}
            className="w-full"
          >
            {BUDGET_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="budget-custom" className="text-sm font-medium text-foreground">
            Hoặc nhập chính xác (VND)
          </label>
          <Input
            id="budget-custom"
            type="number"
            inputMode="numeric"
            value={budgetCustom}
            onChange={(e) => setBudgetCustom(e.target.value)}
            placeholder="VD: 12000000"
            disabled={!!budget}
            aria-invalid={!!fieldErrors.budget}
          />
          {fieldErrors.budget && <p className="text-xs text-danger">{fieldErrors.budget}</p>}
        </div>
      </div>

      {/* Deadline */}
      <div className="space-y-1.5">
        <label htmlFor="deadline" className="text-sm font-medium text-foreground">
          Hạn bàn giao mong muốn
        </label>
        <Input
          id="deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full sm:max-w-xs"
        />
      </div>

      {/* Upload file */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground">Tài liệu đính kèm</span>
        <FileUpload onChange={setFileKeys} />
      </div>

      {/* Thông tin liên hệ (chỉ khách vãng lai) */}
      {showContact && (
        <div className="grid gap-4 rounded-xl border border-border bg-surface-2/40 p-4 sm:grid-cols-2">
          <p className="text-sm text-muted sm:col-span-2">
            Bạn chưa đăng nhập — vui lòng để lại thông tin liên hệ để chúng tôi phản hồi.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="contactName" className="text-sm font-medium text-foreground">
              Tên liên hệ <span className="text-danger">*</span>
            </label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nguyễn Văn A"
              aria-invalid={!!fieldErrors.contactName}
            />
            {fieldErrors.contactName && (
              <p className="text-xs text-danger">{fieldErrors.contactName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contactEmail" className="text-sm font-medium text-foreground">
              Email <span className="text-danger">*</span>
            </label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="ban@example.com"
              aria-invalid={!!fieldErrors.contactEmail}
            />
            {fieldErrors.contactEmail && (
              <p className="text-xs text-danger">{fieldErrors.contactEmail}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? 'Đang gửi…' : 'Gửi yêu cầu báo giá'}
        </Button>
        {isLoggedIn && (
          <span className="text-xs text-muted">
            Yêu cầu được gửi dưới tên tài khoản {session?.user?.name ?? session?.user?.email}.
          </span>
        )}
      </div>
    </form>
  );
}
