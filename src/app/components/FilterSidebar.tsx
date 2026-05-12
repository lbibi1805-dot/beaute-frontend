/**
 * FilterSidebar — Task 4: filter products by brand, category, and price range.
 * Uses Radix Checkbox, Slider, and Collapsible primitives from the SampleUI ui/ library.
 */
import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Slider from "@radix-ui/react-slider";
import { ChevronDown, ChevronUp, Check, SlidersHorizontal } from "lucide-react";
import type { FilterOptions, SearchParams } from "../../api/client";

type SortOption = "price_asc" | "price_desc" | "rating_asc" | "rating_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "price_asc",   label: "Price: Low → High" },
  { value: "price_desc",  label: "Price: High → Low" },
  { value: "rating_asc",  label: "Rating: Low → High" },
  { value: "rating_desc", label: "Rating: High → Low" },
];

interface FilterSidebarProps {
  options: FilterOptions | null;
  filters: SearchParams;
  onFiltersChange: (filters: SearchParams) => void;
}

export function FilterSidebar({ options, filters, onFiltersChange }: FilterSidebarProps) {
  const [brandOpen, setBrandOpen]       = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [priceOpen, setPriceOpen]       = useState(true);

  if (!options) return null;

  const selectedBrands     = new Set(filters.brand?.split(",").map((b) => b.trim()).filter(Boolean) ?? []);
  const selectedCategories = new Set(filters.category?.split(",").map((c) => c.trim()).filter(Boolean) ?? []);
  const priceMin = filters.min_price ?? options.price_range.min;
  const priceMax = filters.max_price ?? options.price_range.max;

  const toggleBrand = (brand: string) => {
    const next = new Set(selectedBrands);
    next.has(brand) ? next.delete(brand) : next.add(brand);
    onFiltersChange({ ...filters, brand: [...next].join(",") || undefined });
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(selectedCategories);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    onFiltersChange({ ...filters, category: [...next].join(",") || undefined });
  };

  const handlePriceChange = ([min, max]: number[]) => {
    onFiltersChange({ ...filters, min_price: min, max_price: max });
  };

  const resetFilters = () => {
    onFiltersChange({ q: filters.q });
  };

  const hasActiveFilters =
    selectedBrands.size > 0 ||
    selectedCategories.size > 0 ||
    filters.min_price != null ||
    filters.max_price != null ||
    filters.sort != null;

  return (
    <aside className="w-full">
      <div className="lg:sticky lg:top-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-gray-900 underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* ── Sort ── */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 py-2 border-b border-gray-200 mb-3">Sort By</h4>
          <select
            value={filters.sort ?? ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, sort: (e.target.value as SortOption) || undefined })
            }
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="">Default order</option>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* ── Brand filter ── */}
        <Collapsible.Root open={brandOpen} onOpenChange={setBrandOpen} className="mb-6">
          <Collapsible.Trigger className="flex items-center justify-between w-full text-sm font-medium text-gray-900 py-2 border-b border-gray-200">
            Brand
            {brandOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Collapsible.Trigger>
          <Collapsible.Content className="pt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
            {options.brands.slice(0, 30).map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                <Checkbox.Root
                  checked={selectedBrands.has(brand)}
                  onCheckedChange={() => toggleBrand(brand)}
                  className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center bg-white data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                >
                  <Checkbox.Indicator>
                    <Check className="w-3 h-3 text-white" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 line-clamp-1">
                  {brand}
                </span>
              </label>
            ))}
          </Collapsible.Content>
        </Collapsible.Root>

        {/* ── Category filter ── */}
        <Collapsible.Root open={categoryOpen} onOpenChange={setCategoryOpen} className="mb-6">
          <Collapsible.Trigger className="flex items-center justify-between w-full text-sm font-medium text-gray-900 py-2 border-b border-gray-200">
            Category
            {categoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Collapsible.Trigger>
          <Collapsible.Content className="pt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
            {options.categories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                <Checkbox.Root
                  checked={selectedCategories.has(cat)}
                  onCheckedChange={() => toggleCategory(cat)}
                  className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center bg-white data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                >
                  <Checkbox.Indicator>
                    <Check className="w-3 h-3 text-white" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{cat}</span>
              </label>
            ))}
          </Collapsible.Content>
        </Collapsible.Root>

        {/* ── Price range filter ── */}
        {options.price_range.max > 0 && (
          <Collapsible.Root open={priceOpen} onOpenChange={setPriceOpen} className="mb-6">
            <Collapsible.Trigger className="flex items-center justify-between w-full text-sm font-medium text-gray-900 py-2 border-b border-gray-200">
              Price Range
              {priceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Collapsible.Trigger>
            <Collapsible.Content className="pt-4">
              <Slider.Root
                min={options.price_range.min}
                max={options.price_range.max}
                step={1}
                value={[priceMin, priceMax]}
                onValueChange={handlePriceChange}
                className="relative flex items-center select-none touch-none w-full h-5"
              >
                <Slider.Track className="bg-gray-200 relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-gray-900 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-gray-900 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-gray-900 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </Slider.Root>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>${priceMin.toFixed(0)}</span>
                <span>${priceMax.toFixed(0)}</span>
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      </div>
    </aside>
  );
}
