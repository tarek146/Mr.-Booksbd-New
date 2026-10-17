import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { PenTool } from 'lucide-react';

export function StationeryPage() {
  const { products, categories, searchQuery, setSearchQuery } = useStore();
  const [selectedCat, setSelectedCat] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');

  const stationeryCategories = categories.filter(c => c.type === 'stationery');
  const items = products.filter(p => p.type === 'stationery');

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCat === 'all' || item.category === selectedCat;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  return (
    <div className="min-h-screen bg-white transition-colors py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#D71920] text-white rounded-xl flex items-center justify-center shadow-sm">
              <PenTool size={16} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#171717] tracking-tight">
              Stationery & Office Supplies
            </h1>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#F7F7F8] p-4 rounded-2xl border border-[#E5E5E5] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button 
              onClick={() => setSelectedCat('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === 'all' 
                  ? 'bg-[#D71920] text-white shadow-sm' 
                  : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#D71920]'
              }`}
            >
              All Items ({items.length})
            </button>
            {stationeryCategories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCat(cat.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCat === cat.name 
                    ? 'bg-[#D71920] text-white shadow-sm' 
                    : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#D71920]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
            <span className="text-xs text-[#5F6368] font-medium">
              Showing <strong>{sortedItems.length}</strong> items
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#777777]">Sort:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#171717] focus:outline-none focus:border-[#D71920]"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {sortedItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {sortedItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-[#F7F7F8] rounded-3xl p-12 text-center border border-[#E5E5E5] max-w-md mx-auto my-12">
            <PenTool size={40} className="mx-auto text-[#777777] mb-3" />
            <h3 className="font-bold text-base text-[#171717]">No Items Found</h3>
            <p className="text-xs text-[#5F6368] mt-1 mb-4">
              We couldn't find any stationery matching your selection.
            </p>
            <button 
              onClick={() => { setSelectedCat('all'); setSearchQuery(''); }}
              className="px-5 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
