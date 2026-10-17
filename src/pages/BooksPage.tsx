import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { AnimatedSearchInput } from '../components/AnimatedSearchInput';
import { 
  BookOpen, 
  X, 
  Filter, 
  SlidersHorizontal, 
  Search, 
  Check, 
  Sparkles, 
  PenTool, 
  Tag, 
  RotateCcw,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export function BooksPage() {
  const { products, categories, searchQuery, setSearchQuery, selectedCategoryFilter, setSelectedCategoryFilter } = useStore();

  // Local filter states for advanced shop page
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'book' | 'stationery'>('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [discountOnly, setDiscountOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Filter products based on all conditions
  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      // Type filter
      if (productTypeFilter !== 'all' && item.type !== productTypeFilter) return false;

      // Category filter
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesAuthor = item.author ? item.author.toLowerCase().includes(q) : false;
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesBrand = item.brand ? item.brand.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesAuthor && !matchesCategory && !matchesBrand) return false;
      }

      // Price filter
      if (item.price < minPrice || item.price > maxPrice) return false;

      // In Stock filter
      if (inStockOnly && item.stock <= 0) return false;

      // Discounted / Sale filter
      if (discountOnly && (!item.previousPrice || item.previousPrice <= item.price)) return false;

      return true;
    });
  }, [products, productTypeFilter, selectedCategoryFilter, searchQuery, minPrice, maxPrice, inStockOnly, discountOnly]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [filteredProducts, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategoryFilter('all');
    setSearchQuery('');
    setProductTypeFilter('all');
    setMinPrice(0);
    setMaxPrice(3000);
    setInStockOnly(false);
    setDiscountOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters = 
    selectedCategoryFilter !== 'all' || 
    searchQuery !== '' || 
    productTypeFilter !== 'all' || 
    minPrice > 0 || 
    maxPrice < 3000 || 
    inStockOnly || 
    discountOnly;

  return (
    <div className="min-h-screen bg-white transition-colors pt-3 pb-12 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Quick Search, Filter & Type Bar */}
        <div className="bg-[#F7F7F8] p-4 sm:p-5 rounded-2xl border border-[#E5E5E5] space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Type Switcher Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5E5E5] shadow-2xs self-stretch md:self-auto shrink-0">
              <button
                onClick={() => setProductTypeFilter('all')}
                className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  productTypeFilter === 'all'
                    ? 'bg-[#D71920] text-white shadow-2xs'
                    : 'text-[#171717] hover:bg-neutral-100'
                }`}
              >
                All Shop ({products.length})
              </button>
              <button
                onClick={() => setProductTypeFilter('book')}
                className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  productTypeFilter === 'book'
                    ? 'bg-[#D71920] text-white shadow-2xs'
                    : 'text-[#171717] hover:bg-neutral-100'
                }`}
              >
                <BookOpen size={13} />
                <span>Books</span>
              </button>
              <button
                onClick={() => setProductTypeFilter('stationery')}
                className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  productTypeFilter === 'stationery'
                    ? 'bg-[#D71920] text-white shadow-2xs'
                    : 'text-[#171717] hover:bg-neutral-100'
                }`}
              >
                <PenTool size={13} />
                <span>Stationery</span>
              </button>
            </div>

            {/* Quick Search Bar with Auto-Sliding Suggestions */}
            <div className="flex-1 max-w-md">
              <AnimatedSearchInput 
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
                showSubmitButton={false}
              />
            </div>

            {/* Mobile Filter Toggle Button & Sort Selector */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="md:hidden flex-1 sm:flex-none px-3.5 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#171717] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:border-[#D71920]"
              >
                <SlidersHorizontal size={14} className="text-[#D71920]" />
                <span>Filters {hasActiveFilters && '•'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#777777] hidden sm:inline">Sort:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#171717] focus:outline-none focus:border-[#D71920] shadow-2xs"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button 
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === 'all' 
                  ? 'bg-[#D71920] text-white shadow-2xs' 
                  : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#D71920]'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.name)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.name 
                    ? 'bg-[#D71920] text-white shadow-2xs' 
                    : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#D71920]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Summary Pills */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap text-xs bg-[#FFF1F2]/60 p-3 rounded-2xl border border-[#D71920]/20">
            <span className="font-bold text-[#D71920] flex items-center gap-1">
              <Filter size={13} /> Active Filters:
            </span>

            {selectedCategoryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-[#D71920] text-xs font-bold border border-[#D71920]/30 shadow-2xs">
                Category: {selectedCategoryFilter}
                <X size={12} className="cursor-pointer hover:scale-125" onClick={() => setSelectedCategoryFilter('all')} />
              </span>
            )}

            {productTypeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-[#D71920] text-xs font-bold border border-[#D71920]/30 shadow-2xs capitalize">
                Type: {productTypeFilter}
                <X size={12} className="cursor-pointer hover:scale-125" onClick={() => setProductTypeFilter('all')} />
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-[#D71920] text-xs font-bold border border-[#D71920]/30 shadow-2xs">
                Search: "{searchQuery}"
                <X size={12} className="cursor-pointer hover:scale-125" onClick={() => setSearchQuery('')} />
              </span>
            )}

            {(minPrice > 0 || maxPrice < 3000) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-[#D71920] text-xs font-bold border border-[#D71920]/30 shadow-2xs">
                Price: ৳{minPrice} - ৳{maxPrice}
                <X size={12} className="cursor-pointer hover:scale-125" onClick={() => { setMinPrice(0); setMaxPrice(3000); }} />
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-emerald-700 text-xs font-bold border border-emerald-300 shadow-2xs">
                In Stock Only
                <X size={12} className="cursor-pointer hover:scale-125" onClick={() => setInStockOnly(false)} />
              </span>
            )}

            {discountOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-blue-700 text-xs font-bold border border-blue-300 shadow-2xs">
                On Sale Only
                <X size={12} className="cursor-pointer hover:scale-125" onClick={() => setDiscountOnly(false)} />
              </span>
            )}

            <button 
              onClick={handleResetFilters}
              className="text-xs text-[#D71920] underline font-bold ml-auto flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} /> Clear All
            </button>
          </div>
        )}

        {/* Main Shop Content Grid with Sidebar Filters on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Desktop Left Sidebar Filters (3 cols) */}
          <div className="hidden md:block md:col-span-3 bg-[#F7F7F8] p-5 rounded-3xl border border-[#E5E5E5] space-y-6 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <h3 className="font-black text-sm text-[#171717] flex items-center gap-2">
                <Filter size={15} className="text-[#D71920]" />
                Filter Products
              </h3>
              {hasActiveFilters && (
                <button 
                  onClick={handleResetFilters} 
                  className="text-[11px] text-[#D71920] hover:underline font-bold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Filter 1: Price Range */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                Price Range (BDT)
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min={0}
                  max={maxPrice}
                  value={minPrice} 
                  onChange={e => setMinPrice(Number(e.target.value))}
                  className="w-1/2 p-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-mono font-bold text-[#171717]"
                  placeholder="Min ৳"
                />
                <span className="text-xs text-neutral-400">-</span>
                <input 
                  type="number" 
                  min={minPrice}
                  max={5000}
                  value={maxPrice} 
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-1/2 p-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-mono font-bold text-[#171717]"
                  placeholder="Max ৳"
                />
              </div>
              <input 
                type="range" 
                min={0} 
                max={3000} 
                step={50}
                value={maxPrice} 
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#D71920] cursor-pointer"
              />
            </div>

            {/* Filter 2: Categories Checklist */}
            <div className="space-y-2.5 pt-2 border-t border-[#E5E5E5]">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                Category
              </label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    selectedCategoryFilter === 'all' 
                      ? 'bg-[#D71920] text-white' 
                      : 'text-[#5F6368] hover:bg-white'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] opacity-80">({products.length})</span>
                </button>
                {categories.map(c => {
                  const count = products.filter(p => p.category === c.name).length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategoryFilter(c.name)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        selectedCategoryFilter === c.name 
                          ? 'bg-[#D71920] text-white font-bold' 
                          : 'text-[#5F6368] hover:bg-white'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] opacity-75 shrink-0 ml-1">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter 3: Checkbox Status Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#E5E5E5] text-xs font-semibold text-[#171717]">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={inStockOnly} 
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="rounded text-[#D71920] focus:ring-[#D71920] cursor-pointer"
                />
                <span>In Stock Items Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={discountOnly} 
                  onChange={e => setDiscountOnly(e.target.checked)}
                  className="rounded text-[#D71920] focus:ring-[#D71920] cursor-pointer"
                />
                <span>Discounted & Sale Items</span>
              </label>
            </div>
          </div>

          {/* Right Product Grid (9 cols on Desktop / 12 on Mobile) */}
          <div className="md:col-span-9 space-y-4">
            
            <div className="flex items-center justify-between text-xs text-[#5F6368] px-1">
              <span>Showing <strong>{sortedProducts.length}</strong> items in store catalog</span>
            </div>

            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {sortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-[#F7F7F8] rounded-3xl p-10 sm:p-14 text-center border border-[#E5E5E5] max-w-md mx-auto my-8">
                <BookOpen size={40} className="mx-auto text-[#777777] mb-3" />
                <h3 className="font-bold text-base text-[#171717]">No Items Match Your Filter</h3>
                <p className="text-xs text-[#5F6368] mt-1 mb-5">
                  Try clearing your search term, adjusting price slider, or selecting a different category.
                </p>
                <button 
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <RotateCcw size={14} /> Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Slide-Over Filter Drawer Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end transition-opacity">
          <div className="w-full max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                <h3 className="font-black text-base text-[#171717] flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-[#D71920]" />
                  Filter & Sort
                </h3>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Type selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                  Product Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setProductTypeFilter('all')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      productTypeFilter === 'all' ? 'bg-[#D71920] text-white' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setProductTypeFilter('book')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      productTypeFilter === 'book' ? 'bg-[#D71920] text-white' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    Books
                  </button>
                  <button
                    onClick={() => setProductTypeFilter('stationery')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      productTypeFilter === 'stationery' ? 'bg-[#D71920] text-white' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    Stationery
                  </button>
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-3 pt-3 border-t border-[#E5E5E5]">
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                  Price Limit (Up to ৳{maxPrice})
                </label>
                <input 
                  type="range" 
                  min={0} 
                  max={3000} 
                  step={50}
                  value={maxPrice} 
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#D71920]"
                />
              </div>

              {/* Category Filter */}
              <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                  Categories
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                      selectedCategoryFilter === 'all' ? 'bg-[#D71920] text-white' : 'bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategoryFilter(c.name)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                        selectedCategoryFilter === c.name ? 'bg-[#D71920] text-white font-bold' : 'bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-3 border-t border-[#E5E5E5] text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 rounded-xl">
                  <input 
                    type="checkbox" 
                    checked={inStockOnly} 
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="rounded text-[#D71920]"
                  />
                  <span>In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 rounded-xl">
                  <input 
                    type="checkbox" 
                    checked={discountOnly} 
                    onChange={e => setDiscountOnly(e.target.checked)}
                    className="rounded text-[#D71920]"
                  />
                  <span>Discounted Sale Items</span>
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E5E5E5] space-y-2">
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-[#D71920] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Apply Filters ({sortedProducts.length} Items)
              </button>
              <button 
                onClick={handleResetFilters}
                className="w-full py-2 bg-white text-neutral-600 text-xs font-bold rounded-xl border border-neutral-200 cursor-pointer"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
