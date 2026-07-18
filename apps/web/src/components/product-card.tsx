import Link from 'next/link';
import { Badge } from '@/components/ui/primitives';
import { ArrowRightIcon } from '@/components/ui/icons';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string | null;
  fileKey: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductCardProps {
  product: Product;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={product.title}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-16px_rgb(15_23_42/0.18)] transition-[border-color,box-shadow,background-color] duration-300 hover:border-border-strong hover:bg-surface-2 hover:shadow-[0_18px_40px_-28px_rgb(var(--shadow-color)/0.4)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-2">
            Không có ảnh
          </div>
        )}

        {product.category?.name && (
          <Badge tone="soft" className="absolute left-3 top-3 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {product.category.name}
          </Badge>
        )}

        <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-foreground opacity-0 shadow-sm backdrop-blur transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowRightIcon className="h-4 w-4" />
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-display text-base font-semibold text-foreground transition-colors group-hover:text-primary">
          {product.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-lg font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Xem chi tiết
          </span>
        </div>
      </div>
    </Link>
  );
}
