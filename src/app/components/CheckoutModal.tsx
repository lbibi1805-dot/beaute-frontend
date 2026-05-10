/**
 * CheckoutModal — success confirmation after checkout.
 */
import { CheckCircle } from "lucide-react";
import { useCart } from "../../context/CartContext.tsx";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const { items, subtotal, clearCart } = useCart();

  if (!open) return null;

  const handleContinue = () => {
    clearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleContinue} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order placed!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Thank you for your purchase. Your {items.length} item{items.length !== 1 ? "s" : ""} totalling{" "}
          <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span> are on their way.
        </p>
        <button
          onClick={handleContinue}
          className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
