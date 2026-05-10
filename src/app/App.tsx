import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { AuthProvider } from "../context/AuthContext.tsx";
import { CartProvider } from "../context/CartContext.tsx";
import { Header } from "./components/Header.tsx";
import { ProductGrid } from "./components/ProductGrid.tsx";
import { ProductDetail } from "./components/ProductDetail.tsx";
import { FilterSidebar } from "./components/FilterSidebar.tsx";
import { LoginModal } from "./components/LoginModal.tsx";
import { CartDrawer } from "./components/CartDrawer.tsx";
import { CheckoutModal } from "./components/CheckoutModal.tsx";
import { AdminDashboard } from "./components/AdminDashboard.tsx";
import {
  searchProducts,
  getFilterOptions,
  type Product,
  type SearchParams,
  type FilterOptions,
} from "../api/client.ts";

function AppInner() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<Product | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters]       = useState<SearchParams>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Overlay states
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loginOpen, setLoginOpen]       = useState(false);
  const [cartOpen, setCartOpen]         = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  useEffect(() => {
    getFilterOptions()
      .then(setFilterOptions)
      .catch(() => setFilterOptions(null));
  }, []);

  const fetchProducts = useCallback((params: SearchParams) => {
    setLoading(true);
    searchProducts(params)
      .then(({ count, products }) => {
        setTotal(count);
        setProducts(products);
      })
      .catch(() => { setProducts([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchProducts(filters), 300);
    return () => clearTimeout(timeout);
  }, [filters, fetchProducts]);

  const handleSearchChange = (q: string) => {
    setFilters((prev) => ({ ...prev, q: q || undefined }));
  };

  const handleFiltersChange = (next: SearchParams) => {
    setFilters(next);
    setMobileFiltersOpen(false);
  };

  const handleCategorySelect = (cat: string | null) => {
    setActiveCategory(cat);
    setFilters((prev) => ({ q: prev.q, category: cat ?? undefined }));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header
        searchQuery={filters.q ?? ""}
        onSearchChange={handleSearchChange}
        resultCount={filters.q ? total : null}
        activeCategory={activeCategory}
        onCategorySelect={handleCategorySelect}
        onLoginClick={() => setLoginOpen(true)}
        onCartClick={() => setCartOpen(true)}
        onDashboardClick={() => setDashboardOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile filter toggle */}
        <div className="lg:hidden flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <p className="text-sm text-gray-500">{loading ? "Loading…" : `${total} products`}</p>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex gap-8">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar options={filterOptions} filters={filters} onFiltersChange={handleFiltersChange} />
          </div>
          <div className="flex-1 min-w-0">
            <ProductGrid products={products} total={total} onProductClick={setSelected} loading={loading} />
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative ml-auto w-80 max-w-full h-full bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <FilterSidebar options={filterOptions} filters={filters} onFiltersChange={handleFiltersChange} />
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      {selected && (
        <ProductDetail product={selected} onClose={() => setSelected(null)} onProductClick={setSelected} />
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => setCheckoutOpen(true)}
      />

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      {dashboardOpen && <AdminDashboard onClose={() => setDashboardOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </AuthProvider>
  );
}
