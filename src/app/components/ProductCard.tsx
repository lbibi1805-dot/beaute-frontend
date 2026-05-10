import { Star, Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Product } from "../../api/client";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
    >
      <div className="relative aspect-square bg-[#FCE4EC] overflow-hidden">
        <ImageWithFallback
          src={product.image_url || ""}
          alt={product.product_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.brand_name}</p>
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{product.product_title || product.product_name}</h3>

        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < Math.floor(product.avg_rating)
                  ? "fill-gray-900 text-gray-900"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">({product.review_count})</span>
        </div>

        <p className="text-gray-900">
          {product.price > 0 ? `$${product.price.toFixed(2)}` : "Price not listed"}
        </p>
      </div>
    </div>
  );
}
