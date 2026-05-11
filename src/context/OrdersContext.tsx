/**
 * OrdersContext — persists completed orders per user in localStorage.
 * Cart is frontend-only so orders are stored client-side, keyed by username.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { CartItem } from "./CartContext.tsx";

export interface Order {
  order_id: string;
  items: CartItem[];
  total: number;
  placed_at: string; // ISO 8601
  username: string;
}

interface OrdersContextValue {
  orders: Order[];
  addOrder: (items: CartItem[], total: number, username: string) => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

const STORAGE_KEY = "beaute_orders";

function loadAll(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch {}
  return [];
}

export function OrdersProvider({ children, username }: { children: ReactNode; username: string | null }) {
  const [all, setAll] = useState<Order[]>(() => loadAll());

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [all]);

  const addOrder = useCallback((items: CartItem[], total: number, uname: string) => {
    const order: Order = {
      order_id: crypto.randomUUID(),
      items,
      total,
      placed_at: new Date().toISOString(),
      username: uname,
    };
    setAll((prev) => [order, ...prev]);
  }, []);

  // Filter to current user's orders only
  const orders = username ? all.filter((o) => o.username === username) : [];

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
