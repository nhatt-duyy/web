import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/primitives';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Markdown from '@/components/markdown';
import { getPostBySlug } from '@/lib/cms';

type Params = { params: Promise<{ slug: string }> };

function fmtDate(v: string | null) {
  if (!v) return '';
  return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Không tìm thấy bài viết' };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: 'article',
    },
  };
}

export default async function BlogDetailPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="py-10">
        <Container className="max-w-3xl">
          <Link href="/blog" className="text-sm text-muted hover:text-primary">
            ← Quay lại Blog
          </Link>
          <article className="mt-6">
            {post.category && (
              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                {post.category.name}
              </span>
            )}
            <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{post.title}</h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-2">
              <span>{post.author?.name ?? 'SourceBan'}</span>
              {post.publishedAt && (
                <>
                  <span>·</span>
                  <span>{fmtDate(post.publishedAt)}</span>
                </>
              )}
              <span>·</span>
              <span>{post.viewCount} lượt xem</span>
            </div>

            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt={post.title}
                className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover"
              />
            )}

            <div className="mt-8">
              <Markdown content={post.content} />
            </div>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
