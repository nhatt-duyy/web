import ProductCard from './product-card';

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

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
