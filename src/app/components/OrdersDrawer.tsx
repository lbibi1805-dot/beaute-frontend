/**
 * OrdersDrawer — slide-over panel showing the current user's order history.
 * Only rendered when the user is logged in.
 */
import { X, Package, ShoppingBag } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback.tsx";
import { useOrders } from "../../context/OrdersContext.tsx";

interface OrdersDrawerProps {
  open: boolean;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrdersDrawer({ open, onClose }: OrdersDrawerProps) {
  const { orders } = useOrders();

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
            <Package className="w-5 h-5" />
            <h2 className="text-base font-semibold text-gray-900">My Orders</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <ShoppingBag className="w-12 h-12" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.order_id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Order header */}
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Order placed</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(order.placed_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {order.items.map(({ product, qty }) => (
                    <div key={product.product_id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-12 h-12 flex-shrink-0 bg-[#FCE4EC] rounded-lg overflow-hidden">
                        <ImageWithFallback
                          src={product.image_url}
                          alt={product.product_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{product.brand_name}</p>
                        <p className="text-sm text-gray-900 line-clamp-1">
                          {product.product_title || product.product_name}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {qty}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 flex-shrink-0">
                        {product.price > 0 ? `$${(product.price * qty).toFixed(2)}` : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
