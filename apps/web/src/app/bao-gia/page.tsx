import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import QuoteForm from '@/components/quote-form';
import { Container, SectionHeading } from '@/components/ui/primitives';
import { QuoteIcon, CheckCircleIcon, BoltIcon, ShieldIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Báo giá dịch vụ phát triển phần mềm',
  description:
    'Gửi yêu cầu báo giá cho dịch vụ thiết kế web app, mobile app, phần mềm máy tính, extension và tích hợp API. Nhận tư vấn và báo giá chi tiết từ đội ngũ Nhat Duy Market.',
  keywords: ['báo giá', 'dịch vụ lập trình', 'thuê dev', 'web app', 'mobile app', 'tích hợp API'],
  openGraph: {
    title: 'Báo giá dịch vụ phát triển phần mềm · Nhat Duy Market',
    description:
      'Mô tả nhu cầu của bạn, chúng tôi sẽ liên hệ báo giá chi tiết và tư vấn giải pháp phù hợp.',
    locale: 'vi_VN',
    type: 'website',
  },
};

const BENEFITS = [
  { icon: BoltIcon, title: 'Phản hồi nhanh', desc: 'Nhận báo giá sơ bộ trong 24h làm việc.' },
  { icon: ShieldIcon, title: 'Cam kết bảo hành', desc: 'Bảo hành 3 tháng sau bàn giao.' },
  { icon: CheckCircleIcon, title: 'Quy trình minh bạch', desc: 'Báo giá theo milestone rõ ràng.' },
];

export default function BaoGiaPage() {
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
            <span className="text-foreground">Báo giá</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:items-start">
            {/* Giới thiệu bên trái */}
            <div className="lg:sticky lg:top-28">
              <SectionHeading
                title="Báo giá dịch vụ phát triển"
                description="Điền thông tin dự án, đội ngũ Nhat Duy Market sẽ tư vấn giải pháp và gửi báo giá chi tiết. Hoàn toàn miễn phí, không cam kết."
              />
              <ul className="mt-8 space-y-5">
                {BENEFITS.map((b) => (
                  <li key={b.title} className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <b.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{b.title}</p>
                      <p className="text-sm text-muted">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form bên phải */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-2 text-primary">
                <QuoteIcon className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Form yêu cầu báo giá
                </span>
              </div>
              <QuoteForm />
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
