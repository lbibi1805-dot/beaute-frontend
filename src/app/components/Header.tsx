import { Search, ShoppingBag, User, Heart } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  resultCount: number | null;
}

export function Header({ searchQuery, onSearchChange, resultCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl tracking-tight text-gray-900">BEAUTÉ</h1>
            <nav className="hidden md:flex gap-6">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">New</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Makeup</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Skincare</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Fragrance</a>
            </nav>
          </div>

          <div className="flex-1 max-w-2xl mx-2 sm:mx-6 lg:mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              {searchQuery && resultCount !== null && (
                <div className="absolute left-0 right-0 top-full mt-1 text-xs text-gray-500 px-3">
                  {resultCount} {resultCount === 1 ? "item" : "items"} found
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Heart className="w-5 h-5 text-gray-700" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <User className="w-5 h-5 text-gray-700" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <ShoppingBag className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
