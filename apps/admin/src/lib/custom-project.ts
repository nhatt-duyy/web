// Types & helpers cho module Dịch vụ Custom (Phase 4 — Mục 3 Kanban Board).
// Đồng bộ enum ProjectStatus với Prisma backend (không sửa backend/schema).

export type ProjectStatus =
  | 'NEW'
  | 'QUOTING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'DELIVERED'
  | 'WARRANTY'
  | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ProjectFileKind = 'DELIVERABLE' | 'SOURCE' | 'DOC' | 'OTHER';

export interface CustomProjectUser {
  id: string;
  name: string;
  email: string;
}

export interface Milestone {
  id: string;
  name: string;
  amount: number;
  percent: number;
  status: string;
  paidAt?: string;
}

export interface ProjectMessage {
  id: string;
  content: string;
  isFromStaff: boolean;
  createdAt: string;
  sender: { name: string };
}

export interface ProjectFile {
  id: string;
  name: string;
  fileKey: string;
  kind: ProjectFileKind;
  size?: number;
}

export interface CustomProject {
  id: string;
  requestId: string;
  userId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  quotedAmount?: number;
  deadline?: string;
  warrantyMonths: number;
  isShowcase: boolean;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  user: CustomProjectUser;
  assignee?: CustomProjectUser | null;
  milestones?: Milestone[];
  messages?: ProjectMessage[];
  files?: ProjectFile[];
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
}

// Thứ tự cột Kanban (CANCELLED không hiện trên board).
export const BOARD_COLUMNS: ProjectStatus[] = [
  'NEW',
  'QUOTING',
  'CONFIRMED',
  'IN_PROGRESS',
  'REVIEW',
  'DELIVERED',
  'WARRANTY',
];

export const ProjectStatusLabels: Record<ProjectStatus, string> = {
  NEW: 'Mới',
  QUOTING: 'Đang báo giá',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  REVIEW: 'Đang nghiệm thu',
  DELIVERED: 'Đã bàn giao',
  WARRANTY: 'Bảo hành',
  CANCELLED: 'Đã huỷ',
};

// Style mỗi cột (bg header + border trái) đồng bộ design system.
export const ProjectStatusStyles: Record<ProjectStatus, { header: string; accent: string }> = {
  NEW: { header: 'bg-surface-2 text-muted', accent: 'border-l-slate-400' },
  QUOTING: { header: 'bg-primary-soft text-primary', accent: 'border-l-primary' },
  CONFIRMED: { header: 'bg-info/10 text-info', accent: 'border-l-info' },
  IN_PROGRESS: { header: 'bg-warning/10 text-warning', accent: 'border-l-warning' },
  REVIEW: { header: 'bg-violet-500/10 text-violet-400', accent: 'border-l-violet-500' },
  DELIVERED: { header: 'bg-success/10 text-success', accent: 'border-l-success' },
  WARRANTY: { header: 'bg-amber-500/10 text-amber-400', accent: 'border-l-amber-500' },
  CANCELLED: { header: 'bg-danger-soft text-danger', accent: 'border-l-danger' },
};

export const priorityLabels: Record<ProjectPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

export const priorityStyles: Record<ProjectPriority, string> = {
  LOW: 'bg-surface-2 text-muted',
  MEDIUM: 'bg-primary-soft text-primary',
  HIGH: 'bg-warning/10 text-warning',
  URGENT: 'bg-danger-soft text-danger',
};

// Format tiền VND — tái dùng Intl vi-VN (không có đơn vị, chỉ số).
export const formatCurrency = (amount?: number): string => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format ngày ngắn gọn tiếng Việt.
export const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
