import Link from 'next/link';

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

export default function ProductCard({ product }: ProductCardProps) {
  // Format price as VND
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block hover:shadow-lg transition-shadow duration-300"
    >
      <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Thumbnail */}
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Không có ảnh</span>
          </div>
        )}

        {/* Category badge */}
        {product.category && product.category.name ? (
          <div className="absolute top-3 left-3 flex flex items-center space-x-2 rounded-full px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800">
            <span className="dot w-1 h-1 bg-indigo-600 rounded-full"></span>
            <span>{product.category.name}</span>
          </div>
        ) : null}

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
            {product.title}
          </h3>
          <p className="mb-3 line-clamp-3 text-sm text-gray-600">
            {product.description}
          </p>
          <div className="mt-4 flex items-baseline">
            <span className="font-bold text-xl text-indigo-600">
              {formatPrice(product.price)}
            </span>
            {/* Optional: add a "Mua ngay" button */}
            {/* <button className="ml-auto px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
              Mua ngay
            </button> */}
          </div>
        </div>
      </div>
    </Link>
  );
}