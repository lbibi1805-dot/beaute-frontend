/**
 * Header — sticky top bar with search, nav categories, cart badge, and auth icon.
 */
import { Search, ShoppingBag, User, LogOut, LayoutDashboard } from "lucide-react";
import { useCart } from "../../context/CartContext.tsx";
import { useAuth } from "../../context/AuthContext.tsx";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  resultCount: number | null;
  activeCategory: string | null;
  onCategorySelect: (cat: string | null) => void;
  onLoginClick: () => void;
  onCartClick: () => void;
  onDashboardClick: () => void;
}

const NAV_ITEMS: { label: string; category: string | null }[] = [
  { label: "New",       category: null },
  { label: "Makeup",    category: "Makeup" },
  { label: "Skincare",  category: "Skincare" },
  { label: "Fragrance", category: "Fragrance" },
];

export function Header({
  searchQuery,
  onSearchChange,
  resultCount,
  activeCategory,
  onCategorySelect,
  onLoginClick,
  onCartClick,
  onDashboardClick,
}: HeaderProps) {
  const { totalItems } = useCart();
  const { role, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <h1
            className="text-xl sm:text-2xl tracking-tight text-gray-900 flex-shrink-0 cursor-pointer"
            onClick={() => onCategorySelect(null)}
          >
            BEAUTÉ
          </h1>

          {/* Nav — hidden on small screens */}
          <nav className="hidden md:flex gap-1 flex-shrink-0">
            {NAV_ITEMS.map(({ label, category }) => {
              const isActive = category === activeCategory;
              return (
                <button
                  key={label}
                  onClick={() => onCategorySelect(category)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors min-h-[44px] ${
                    isActive
                      ? "font-semibold text-gray-900 bg-gray-100"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Search */}
          <div className="flex-1 min-w-0 max-w-xl mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              {searchQuery && resultCount !== null && (
                <div className="absolute left-0 right-0 top-full mt-1 text-xs text-gray-500 px-1">
                  {resultCount} {resultCount === 1 ? "item" : "items"} found
                </div>
              )}
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {role === "admin" && (
              <button
                onClick={onDashboardClick}
                className="p-2 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Admin Dashboard"
              >
                <LayoutDashboard className="w-5 h-5 text-gray-700" />
              </button>
            )}

            {role ? (
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={`Sign out (${role})`}
              >
                <LogOut className="w-5 h-5 text-gray-700" />
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="p-2 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Sign in"
              >
                <User className="w-5 h-5 text-gray-700" />
              </button>
            )}

            <button
              onClick={onCartClick}
              className="relative p-2 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Cart"
            >
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gray-900 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
          {NAV_ITEMS.map(({ label, category }) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={label}
                onClick={() => onCategorySelect(category)}
                className={`px-3 py-1 text-xs rounded-full flex-shrink-0 transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
