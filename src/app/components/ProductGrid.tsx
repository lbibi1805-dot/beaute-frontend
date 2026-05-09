import { ProductCard } from "./ProductCard";
import type { Product } from "../../api/client";

interface ProductGridProps {
  products: Product[];
  total: number;
  onProductClick: (product: Product) => void;
  loading: boolean;
}

export function ProductGrid({ products, total, onProductClick, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="py-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl text-gray-900">Shop All</h2>
        <p className="text-sm text-gray-500 mt-1">{total} products</p>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500 py-12 text-center">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              onClick={() => onProductClick(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
