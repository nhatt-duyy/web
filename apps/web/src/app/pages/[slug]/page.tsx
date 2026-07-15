import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/primitives';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Markdown from '@/components/markdown';
import { getPostBySlug } from '@/lib/cms';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Không tìm thấy trang' };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
  };
}

export default async function StaticPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="py-10">
        <Container className="max-w-3xl">
          <Link href="/" className="text-sm text-muted hover:text-primary">
            ← Trang chủ
          </Link>
          <article className="mt-6">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{post.title}</h1>
            {post.excerpt && (
              <p className="mt-3 text-lg text-muted">{post.excerpt}</p>
            )}
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
