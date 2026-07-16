import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Container, Badge, SectionHeading } from '@/components/ui/primitives';
import { ClockIcon, ArrowRightIcon, CheckCircleIcon } from '@/components/ui/icons';
import {
  getShowcaseDetail,
  PROJECT_TYPE_LABELS,
  r2PublicUrl,
  type ShowcaseDetail,
} from '@/lib/custom-projects';

// ISR: tái sinh mỗi 5 phút.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getShowcaseDetail(slug);
  if (!project) {
    return {
      title: 'Không tìm thấy dự án',
      robots: { index: false, follow: false },
    };
  }
  const desc = project.request?.description
    ? project.request.description.slice(0, 160)
    : `Case study ${project.title} — ${PROJECT_TYPE_LABELS[project.request?.type ?? 'OTHER']} do SourceBan phát triển.`;
  return {
    title: project.title,
    description: desc,
    keywords: ['case study', project.title, PROJECT_TYPE_LABELS[project.request?.type ?? 'OTHER']],
    openGraph: {
      title: `${project.title} · SourceBan`,
      description: desc,
      locale: 'vi_VN',
      type: 'article',
    },
    robots: { index: true, follow: true },
  };
}

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// JSON-LD schema.org cho SEO (SoftwareApplication / CreativeWork).
function buildJsonLd(project: ShowcaseDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    applicationCategory: PROJECT_TYPE_LABELS[project.request?.type ?? 'OTHER'],
    description: project.request?.description ?? project.description ?? '',
    author: { '@type': 'Organization', name: 'SourceBan' },
    ...(project.user?.name ? { contributor: project.user.name } : {}),
    ...(project.quotedAmount ? { offers: { '@type': 'Offer', price: project.quotedAmount, priceCurrency: 'VND' } } : {}),
    ...(project.files?.[0]?.fileKey
      ? { screenshot: r2PublicUrl(project.files[0].fileKey) }
      : {}),
  };
}

export default async function DuAnDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getShowcaseDetail(slug);
  if (!project) notFound();

  const typeLabel = project.request
    ? PROJECT_TYPE_LABELS[project.request.type]
    : 'Khác';
  const gallery = project.files ?? [];
  const jsonLd = buildJsonLd(project);

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
            <Link href="/du-an" className="transition-colors hover:text-primary">
              Dự án
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">{project.title}</span>
          </nav>

          {/* JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            {/* Cột trái: gallery + mô tả */}
            <div>
              {/* Gallery */}
              {gallery.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-surface-2">
                  <div className="relative aspect-[16/9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r2PublicUrl(gallery[0].fileKey)}
                      alt={`${project.title} — ảnh bàn giao`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {gallery.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 p-2">
                      {gallery.slice(1).map((f) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={f.id}
                          src={r2PublicUrl(f.fileKey)}
                          alt={f.name}
                          loading="lazy"
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid aspect-[16/9] place-items-center rounded-2xl border border-border bg-surface-2 text-sm text-muted-2">
                  Chưa có ảnh bàn giao
                </div>
              )}

              {/* Mô tả */}
              <div className="mt-8">
                <SectionHeading eyebrow="Mô tả dự án" title={project.title} />
                <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted">
                  {project.request?.description ?? project.description ?? 'Chưa có mô tả.'}
                </div>
              </div>
            </div>

            {/* Cột phải: thông tin + timeline */}
            <aside className="space-y-6 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-border bg-surface p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{typeLabel}</Badge>
                  <Badge tone="success">Đã bàn giao</Badge>
                </div>

                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">Bảo hành</dt>
                    <dd className="font-medium text-foreground">{project.warrantyMonths} tháng</dd>
                  </div>
                  {project.quotedAmount && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted">Quy mô dự án</dt>
                      <dd className="font-medium text-foreground">
                        {formatVnd(project.quotedAmount)}
                      </dd>
                    </div>
                  )}
                  {project.user?.name && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted">Khách hàng</dt>
                      <dd className="font-medium text-foreground">{project.user.name}</dd>
                    </div>
                  )}
                </dl>

                <Link
                  href="/bao-gia"
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-[0_10px_24px_-12px_var(--glow)] transition-all hover:bg-primary-strong hover:-translate-y-px"
                >
                  Báo giá dự án tương tự <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              {/* Timeline bàn giao (milestones) */}
              {project.milestones.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                    <ClockIcon className="h-5 w-5 text-primary" /> Tiến trình bàn giao
                  </h3>
                  <ol className="mt-4 space-y-4">
                    {project.milestones.map((m) => (
                      <li key={m.id} className="flex gap-3">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                          <CheckCircleIcon className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{m.name}</p>
                          {m.description && (
                            <p className="text-xs text-muted">{m.description}</p>
                          )}
                          <p className="mt-0.5 text-xs text-muted-2">
                            {formatDate(m.dueDate)}
                            {m.amount ? ` · ${formatVnd(m.amount)}` : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
