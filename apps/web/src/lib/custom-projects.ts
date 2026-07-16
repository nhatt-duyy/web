// Định nghĩa types & helper cho module Dịch vụ Custom (Phase 4).
// Đồng bộ với Prisma schema & DTO backend (apps/api).

export type ProjectType =
  | 'WEB_APP'
  | 'MOBILE_APP'
  | 'DESKTOP_APP'
  | 'EXTENSION'
  | 'INTEGRATION'
  | 'OTHER';

/** Label tiếng Việt cho từng loại dự án (theo yêu cầu task). */
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  WEB_APP: 'Web App',
  MOBILE_APP: 'Mobile App',
  DESKTOP_APP: 'Phần mềm máy tính',
  EXTENSION: 'Extension/Add-on',
  INTEGRATION: 'Tích hợp API',
  OTHER: 'Khác',
};

/** Danh sách option cho select. */
export const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = (
  Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]
).map((value) => ({ value, label: PROJECT_TYPE_LABELS[value] }));

export type ProjectStatus =
  | 'NEW'
  | 'QUOTING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'DELIVERED'
  | 'WARRANTY'
  | 'CANCELLED';

/** Label tiếng Việt cho trạng thái dự án (khớp 7 cột Kanban + CANCELLED). */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  NEW: 'Yêu cầu mới',
  QUOTING: 'Đang báo giá',
  CONFIRMED: 'Đã chốt',
  IN_PROGRESS: 'Đang phát triển',
  REVIEW: 'Nghiệm thu',
  DELIVERED: 'Đã bàn giao',
  WARRANTY: 'Bảo hành',
  CANCELLED: 'Đã hủy',
};

/** Class màu badge cho từng trạng thái (Tailwind). */
export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  NEW: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
  QUOTING: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  CONFIRMED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  REVIEW: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  WARRANTY: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/30',
};

/** Thứ tự pipeline 7 bước (bỏ CANCELLED) cho timeline. */
export const PROJECT_PIPELINE: ProjectStatus[] = [
  'NEW',
  'QUOTING',
  'CONFIRMED',
  'IN_PROGRESS',
  'REVIEW',
  'DELIVERED',
  'WARRANTY',
];

export type MilestoneStatus = 'PENDING' | 'INVOICED' | 'PAID' | 'SKIPPED';

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  PENDING: 'Chờ',
  INVOICED: 'Đã gửi hóa đơn',
  PAID: 'Đã thanh toán',
  SKIPPED: 'Bỏ qua',
};

/** Định dạng tiền VND. */
export function formatVnd(amount?: number | null): string {
  if (amount == null) return 'Thỏa thuận';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

/** Dự án của user (GET /api/custom-projects/my). */
export interface MyProject {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  quotedAmount: number | null;
  priority: string;
  deadline: string | null;
  warrantyMonths: number;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string; email: string } | null;
  milestones: {
    id: string;
    name: string;
    amount: number;
    percent: number | null;
    status: MilestoneStatus;
    paidAt: string | null;
  }[];
  _count?: { messages: number; files: number };
}

/** Một item portfolio trả về từ GET /api/custom-projects?showcase=true */
export interface ShowcaseProject {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  status: ProjectStatus;
  isShowcase: boolean;
  quotedAmount: number | null;
  warrantyMonths: number;
  createdAt: string;
  updatedAt: string;
  request: { type: ProjectType } | null;
  user: { name: string } | null;
  files:
    | {
        id: string;
        name: string;
        fileKey: string;
        mimeType: string | null;
      }[]
    | null;
}

/** Detail case study trả về từ GET /api/custom-projects/slug/:slug */
export interface ShowcaseDetail extends Omit<ShowcaseProject, 'files'> {
  request: { type: ProjectType; description: string } | null;
  files: {
    id: string;
    name: string;
    fileKey: string;
    mimeType: string | null;
  }[];
  milestones: {
    id: string;
    name: string;
    description: string | null;
    amount: number;
    percent: number | null;
    dueDate: string | null;
    status: string;
    sortOrder: number;
  }[];
}

/** Body gửi lên POST /api/custom-requests */
export interface CreateRequestPayload {
  type: ProjectType;
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  fileKeys?: string[];
  contactName?: string;
  contactEmail?: string;
}

// URL cơ sở API dùng cho server component fetch trực tiếp (tránh vòng lặp /api proxy).
const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

/** Lấy danh sách portfolio (DELIVERED + isShowcase), filter theo type nếu có. */
export async function getShowcaseProjects(type?: ProjectType): Promise<ShowcaseProject[]> {
  const url = new URL('/custom-projects', API_BASE);
  url.searchParams.set('showcase', 'true');
  if (type) url.searchParams.set('type', type);
  url.searchParams.set('limit', '24');
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = (await res.json()) as ShowcaseProject[];
    return json ?? [];
  } catch {
    return [];
  }
}

/** Lấy detail 1 case study theo slug. Trả null nếu không tồn tại. */
export async function getShowcaseDetail(slug: string): Promise<ShowcaseDetail | null> {
  try {
    const url = `${API_BASE}/custom-projects/slug/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as ShowcaseDetail;
  } catch {
    return null;
  }
}

/** Build URL ảnh public R2 từ fileKey (theo pattern backend R2_PUBLIC_URL). */
export function r2PublicUrl(fileKey: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? '';
  if (!base) return fileKey; // fallback: giả định fileKey đã là URL
  return `${base.replace(/\/$/, '')}/${fileKey}`;
}
