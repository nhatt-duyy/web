import Link from 'next/link';
import { Container, SectionHeading } from '@/components/ui/primitives';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { getPosts, type CmsPostSummary } from '@/lib/cms';

function fmtDate(v: string | null) {
  if (!v) return '';
  return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export const metadata = {
  title: 'Blog',
  description: 'Bài viết, hướng dẫn và tin tức mới nhất từ Nhat Duy Market về source code & phát triển phần mềm.',
};

export default async function BlogPage() {
  const posts: CmsPostSummary[] = await getPosts('BLOG');

  return (
    <>
      <Header />
      <main className="py-10">
        <Container>
          <SectionHeading eyebrow="Kiến thức & Tin tức" title="Blog Nhat Duy Market" className="mb-8" />
          {posts.length === 0 ? (
            <p className="text-muted">Chưa có bài viết nào.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="card card-hover group flex flex-col overflow-hidden"
                >
                  {p.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      className="aspect-[16/9] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-primary-soft to-surface-2" />
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    {p.category && (
                      <span className="text-xs font-medium uppercase tracking-wide text-primary">
                        {p.category.name}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                      {p.title}
                    </h3>
                    {p.excerpt && <p className="line-clamp-2 text-sm text-muted">{p.excerpt}</p>}
                    <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted-2">
                      <span>{p.author?.name ?? 'Nhat Duy Market'}</span>
                      {p.publishedAt && (
                        <>
                          <span>·</span>
                          <span>{fmtDate(p.publishedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
