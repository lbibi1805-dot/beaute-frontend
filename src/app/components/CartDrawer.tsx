/**
 * CartDrawer — slide-over panel showing cart contents.
 */
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext.tsx";
import { ImageWithFallback } from "./figma/ImageWithFallback.tsx";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { items, totalItems, subtotal, removeItem, updateQty } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-base font-semibold text-gray-900">Cart ({totalItems})</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <ShoppingBag className="w-12 h-12" />
              <p className="text-sm">Your cart is empty</p>
            </div>
          ) : (
            items.map(({ product, qty }) => (
              <div key={product.product_id} className="flex gap-4 items-start">
                <div className="w-16 h-16 flex-shrink-0 bg-[#FCE4EC] rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={product.image_url}
                    alt={product.product_title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{product.brand_name}</p>
                  <p className="text-sm text-gray-900 line-clamp-2">{product.product_title}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {product.price > 0 ? `$${(product.price * qty).toFixed(2)}` : "—"}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeItem(product.product_id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQty(product.product_id, qty - 1)}
                      className="px-2 py-1 hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-sm w-6 text-center">{qty}</span>
                    <button
                      onClick={() => updateQty(product.product_id, qty + 1)}
                      className="px-2 py-1 hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => { onClose(); onCheckout(); }}
              className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
