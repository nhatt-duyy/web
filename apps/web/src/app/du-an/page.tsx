import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PortfolioCard from '@/components/portfolio-card';
import PortfolioFilters from '@/components/portfolio-filters';
import { Container, Skeleton, EmptyState } from '@/components/ui/primitives';
import { SearchIcon } from '@/components/ui/icons';
import {
  getShowcaseProjects,
  type ProjectType,
  PROJECT_TYPE_LABELS,
} from '@/lib/custom-projects';

// ISR: tái sinh trang mỗi 5 phút để cập nhật portfolio mới.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Dự án đã thực hiện',
  description:
    'Portfolio các dự án phần mềm đã bàn giao bởi Nhat Duy Market: web app, mobile app, phần mềm máy tính, extension và tích hợp API cho khách hàng.',
  keywords: ['dự án', 'portfolio', 'case study', 'web app', 'mobile app', 'Nhat Duy Market'],
  openGraph: {
    title: 'Dự án đã thực hiện · Nhat Duy Market',
    description:
      'Khám phá các dự án phần mềm thực tế chúng tôi đã thiết kế và phát triển cho khách hàng.',
    locale: 'vi_VN',
    type: 'website',
  },
  alternates: { canonical: '/du-an' },
};

function PortfolioGrid({ projects }: { projects: ReturnType<typeof getShowcaseProjects> extends Promise<infer T> ? T : never }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<SearchIcon className="h-7 w-7" />}
        title="Chưa có dự án nào trong mục này"
        description="Hãy chọn loại dự án khác hoặc quay lại sau. Chúng tôi đang cập nhật portfolio."
        action={
          <Link
            href="/bao-gia"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-all hover:bg-primary-strong"
          >
            Gửi yêu cầu báo giá
          </Link>
        }
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((p) => (
        <PortfolioCard key={p.id} project={p} />
      ))}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Component đếm số lượng theo type (dùng để hiển thị chip filter). Tính từ toàn bộ
// showcase (không filter) để chip luôn đúng tổng, việc filter grid do server fetch.
async function buildCounts(): Promise<Record<string, number>> {
  const all = await getShowcaseProjects();
  const map: Record<string, number> = { '': all.length };
  for (const p of all) {
    const t = (p.request?.type ?? 'OTHER') as ProjectType;
    map[t] = (map[t] ?? 0) + 1;
  }
  return map;
}

export default async function DuAnPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const typeParam = sp.type as ProjectType | undefined;
  const isValidType = typeParam && typeParam in PROJECT_TYPE_LABELS;

  const [projects, counts] = await Promise.all([
    getShowcaseProjects(isValidType ? typeParam : undefined),
    buildCounts(),
  ]);

  const headingType = isValidType ? PROJECT_TYPE_LABELS[typeParam] : null;

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-14rem)] py-10">
        <Container>
          <nav className="mb-3 flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-primary">
              Trang chủ
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Dự án</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {headingType ? `Dự án: ${headingType}` : 'Dự án đã thực hiện'}
            </h1>
            <p className="mt-2 text-muted">
              {headingType
                ? `Các case study ${headingType.toLowerCase()} đã bàn giao.`
                : 'Những dự án phần mềm thực tế Nhat Duy Market đã thiết kế, phát triển và bàn giao.'}
            </p>
          </div>

          <div className="mb-8">
            <Suspense fallback={<div className="h-9" />}>
              <PortfolioFilters counts={counts} />
            </Suspense>
          </div>

          <Suspense fallback={<LoadingGrid />}>
            <PortfolioGrid projects={projects} />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </>
  );
}
