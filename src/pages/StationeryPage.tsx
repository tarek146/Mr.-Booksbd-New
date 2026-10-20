import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { AnimatedSearchInput } from '../components/AnimatedSearchInput';
import { 
  PenTool, 
  Filter, 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Check 
} from 'lucide-react';

export function StationeryPage() {
  const { products, categories, searchQuery, setSearchQuery, selectedCategoryFilter, setSelectedCategoryFilter } = useStore();

  // Local filter states for stationery page
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [discountOnly, setDiscountOnly] = useState<boolean>(false);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Filter stationery products
  const stationeryItems = useMemo(() => {
    return products.filter(item => {
      // Must be stationery type
      if (item.type !== 'stationery') return false;

      // Category filter
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesBrand = item.brand ? item.brand.toLowerCase().includes(q) : false;
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesBrand && !matchesDesc) return false;
      }

      // Price filter
      if (item.price < minPrice || item.price > maxPrice) return false;

      // In stock
      if (inStockOnly && item.stock <= 0) return false;

      // Discount
      if (discountOnly && (!item.previousPrice || item.previousPrice <= item.price)) return false;

      // Rating
      if (ratingFilter > 0 && item.rating < ratingFilter) return false;

      return true;
    });
  }, [products, selectedCategoryFilter, searchQuery, minPrice, maxPrice, inStockOnly, discountOnly, ratingFilter]);

  // Sort filtered items
  const sortedItems = useMemo(() => {
    return [...stationeryItems].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [stationeryItems, sortBy]);

  const allStationeryCount = products.filter(p => p.type === 'stationery').length;
  const stationeryCategories = categories.filter(c => c.type === 'stationery');

  const handleResetFilters = () => {
    setSelectedCategoryFilter('all');
    setSearchQuery('');
    setMinPrice(0);
    setMaxPrice(3000);
    setInStockOnly(false);
    setDiscountOnly(false);
    setRatingFilter(0);
    setSortBy('featured');
  };

  const hasActiveFilters = 
    selectedCategoryFilter !== 'all' || 
    searchQuery !== '' || 
    minPrice > 0 || 
    maxPrice < 3000 || 
    inStockOnly || 
    discountOnly || 
    ratingFilter > 0;

  return (
    <div className="min-h-screen bg-white transition-colors pt-3 pb-16 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Unified Compact Header & Filter Box */}
        <div className="bg-[#F7F7F8] p-4 sm:p-5 rounded-2xl border border-[#E5E5E5] space-y-4">
          
          {/* Row 1: Title & Quick Stats + Search & Sort */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Icon & Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#D71920] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0">
                <PenTool size={18} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#171717] tracking-tight">
                  Stationery & Office Supplies
                </h1>
                <p className="text-[11px] text-[#5F6368] font-medium">
                  {allStationeryCount} items available in store
                </p>
              </div>
            </div>

            {/* Right: Search Bar & Sort */}
            <div className="flex items-center gap-3 flex-1 max-w-xl justify-end">
              <div className="flex-1 max-w-xs">
                <AnimatedSearchInput 
                  value={searchQuery}
                  onChange={(val) => setSearchQuery(val)}
                  showSubmitButton={false}
                />
              </div>

              {/* Mobile Filter Button */}
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="md:hidden px-3.5 py-2 bg-white border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#171717] flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-[#D71920] shrink-0"
              >
                <SlidersHorizontal size={14} className="text-[#D71920]" />
                <span>Filters {hasActiveFilters && '•'}</span>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#777777] hidden sm:inline">Sort:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#171717] focus:outline-none focus:border-[#D71920] shadow-2xs cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Category Chips inside the same unified box */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#E5E5E5] pb-1 scrollbar-none">
            <button 
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === 'all' 
                  ? 'bg-[#D71920] text-white shadow-2xs' 
                  : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#D71920]'
              }`}
            >
              All Stationery ({allStationeryCount})
            </button>
            {stationeryCategories.map(cat => {
              const count = products.filter(p => p.type === 'stationery' && p.category === cat.name).length;
              return (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.name)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    selectedCategoryFilter === cat.name 
                      ? 'bg-[#D71920] text-white shadow-2xs' 
                      : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#D71920]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
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

            {ratingFilter > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-amber-700 text-xs font-bold border border-amber-300 shadow-2xs">
                {ratingFilter}+ Stars
                <X size={12} className="cursor-pointer hover:scale-125" onClick={() => setRatingFilter(0)} />
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

        {/* Main Content Layout with Desktop Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Desktop Left Sidebar Filters (3 cols) */}
          <div className="hidden md:block md:col-span-3 bg-[#F7F7F8] p-5 rounded-3xl border border-[#E5E5E5] space-y-6 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <h3 className="font-black text-sm text-[#171717] flex items-center gap-2">
                <Filter size={15} className="text-[#D71920]" />
                Stationery Filters
              </h3>
              {hasActiveFilters && (
                <button 
                  onClick={handleResetFilters} 
                  className="text-[11px] text-[#D71920] hover:underline font-bold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Price Range Filter */}
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

            {/* Categories Checkbox List */}
            <div className="space-y-2.5 pt-3 border-t border-[#E5E5E5]">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                Categories
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    selectedCategoryFilter === 'all' 
                      ? 'bg-[#D71920] text-white' 
                      : 'text-[#5F6368] hover:bg-white'
                  }`}
                >
                  <span>All Stationery</span>
                  <span className="text-[10px] opacity-80">({allStationeryCount})</span>
                </button>
                {stationeryCategories.map(c => {
                  const count = products.filter(p => p.type === 'stationery' && p.category === c.name).length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategoryFilter(c.name)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
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

            {/* Availability & Offers Toggles */}
            <div className="space-y-3 pt-3 border-t border-[#E5E5E5]">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                Availability & Offers
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-[#171717] font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={inStockOnly} 
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#D71920] cursor-pointer"
                  />
                  <span>In Stock Only</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-[#171717] font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={discountOnly} 
                    onChange={e => setDiscountOnly(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#D71920] cursor-pointer"
                  />
                  <span>On Sale / Discounted</span>
                </label>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                Minimum Rating
              </label>
              <div className="space-y-1.5">
                {[4.5, 4.0, 3.5].map(stars => (
                  <button
                    key={stars}
                    onClick={() => setRatingFilter(ratingFilter === stars ? 0 : stars)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      ratingFilter === stars 
                        ? 'bg-[#D71920] text-white' 
                        : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#D71920]'
                    }`}
                  >
                    <span>⭐ {stars} Stars & Above</span>
                    {ratingFilter === stars && <Check size={13} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid Area (9 cols) */}
          <div className="md:col-span-9 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5F6368]">
                Showing <strong>{sortedItems.length}</strong> stationery items
              </span>
            </div>

            {sortedItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {sortedItems.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-[#F7F7F8] rounded-3xl p-12 text-center border border-[#E5E5E5] max-w-md mx-auto my-12">
                <PenTool size={48} className="mx-auto text-[#777777] mb-3" />
                <h3 className="font-bold text-base text-[#171717]">No Stationery Items Found</h3>
                <p className="text-xs text-[#5F6368] mt-1 mb-5">
                  We couldn't find any stationery matching your filter criteria. Try adjusting price or categories.
                </p>
                <button 
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end md:hidden animate-fade-in">
            <div className="w-full max-w-xs bg-white h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                  <h3 className="font-black text-base text-[#171717] flex items-center gap-2">
                    <Filter size={18} className="text-[#D71920]" />
                    Stationery Filters
                  </h3>
                  <button 
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-full bg-neutral-100 text-[#171717] hover:bg-neutral-200"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Price Range */}
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
                      className="w-1/2 p-2.5 bg-[#F7F7F8] border border-[#E5E5E5] rounded-xl text-xs font-mono font-bold"
                      placeholder="Min ৳"
                    />
                    <span className="text-xs text-neutral-400">-</span>
                    <input 
                      type="number" 
                      min={minPrice}
                      max={5000}
                      value={maxPrice} 
                      onChange={e => setMaxPrice(Number(e.target.value))}
                      className="w-1/2 p-2.5 bg-[#F7F7F8] border border-[#E5E5E5] rounded-xl text-xs font-mono font-bold"
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
                    className="w-full accent-[#D71920]"
                  />
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Categories
                  </label>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setSelectedCategoryFilter('all'); setIsMobileFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                        selectedCategoryFilter === 'all' ? 'bg-[#D71920] text-white' : 'bg-[#F7F7F8] text-[#171717]'
                      }`}
                    >
                      <span>All Stationery</span>
                      <span>({allStationeryCount})</span>
                    </button>
                    {stationeryCategories.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCategoryFilter(c.name); setIsMobileFilterOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                          selectedCategoryFilter === c.name ? 'bg-[#D71920] text-white font-bold' : 'bg-[#F7F7F8] text-[#171717]'
                        }`}
                      >
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability & Offers */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Availability & Offers
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={inStockOnly} 
                        onChange={e => setInStockOnly(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#D71920]"
                      />
                      <span>In Stock Only</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={discountOnly} 
                        onChange={e => setDiscountOnly(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#D71920]"
                      />
                      <span>On Sale / Discounted</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] flex gap-3">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 py-3 bg-[#F7F7F8] hover:bg-neutral-200 text-[#171717] rounded-xl text-xs font-bold transition-all"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Apply ({sortedItems.length})
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
