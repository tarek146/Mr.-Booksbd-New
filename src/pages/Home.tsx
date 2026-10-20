import React, { useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { FeaturedAuthorsSection } from '../components/FeaturedAuthorsSection';
import { 
  Star, 
  ArrowRight, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export function Home() {
  const { products, categories, reviews, setActivePage, setSelectedCategoryFilter } = useStore();
  
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const booksScrollRef = useRef<HTMLDivElement>(null);
  const stationeryScrollRef = useRef<HTMLDivElement>(null);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);

  const featuredBooks = products.filter(p => p.type === 'book');
  const featuredStationery = products.filter(p => p.type === 'stationery');
  
  // Filter categories enabled for homepage display (showOnHome !== false)
  const homeCategories = categories.filter(c => c.showOnHome !== false);

  // Dynamic Category Product Rows for categories with showOnHome !== false and having products
  const categoryProductSections = categories
    .filter(cat => cat.showOnHome !== false)
    .map(cat => ({
      category: cat,
      items: products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase())
    }))
    .filter(sec => sec.items.length > 0);

  const catScrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollCategoryProducts = (catId: string, direction: 'left' | 'right') => {
    const el = catScrollRefs.current[catId];
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.8;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white transition-colors pb-12">
      {/* 1. Hero Banner Section (Full width hero) */}
      <Hero />

      {/* 2. Popular Categories Section (Compact Small Cards, Single Row Horizontal Slider) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-3 bg-white">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D71920]" />
            <h2 className="text-xs sm:text-sm font-bold text-[#171717] tracking-tight">
              Our Categories
            </h2>
          </div>
          <button 
            onClick={() => setActivePage('books')} 
            className="text-[11px] font-bold text-[#D71920] hover:text-[#B9151B] flex items-center gap-0.5 group cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Compact Small Category Cards Horizontal Slider */}
        <div className="relative group/cat-slider">
          <button 
            onClick={() => scrollContainer(categoryScrollRef, 'left')}
            className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/cat-slider:opacity-100 cursor-pointer active:scale-90"
            aria-label="Scroll Categories Left"
          >
            <ChevronLeft size={16} />
          </button>

          <button 
            onClick={() => scrollContainer(categoryScrollRef, 'right')}
            className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/cat-slider:opacity-100 cursor-pointer active:scale-90"
            aria-label="Scroll Categories Right"
          >
            <ChevronRight size={16} />
          </button>

          <div 
            ref={categoryScrollRef}
            className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {homeCategories.map(cat => (
              <div 
                key={cat.id}
                onClick={() => { setSelectedCategoryFilter(cat.name); setActivePage(cat.type === 'stationery' ? 'stationery' : 'books'); }}
                className="w-[96px] sm:w-[114px] md:w-[124px] shrink-0 snap-start bg-white border border-[#E5E5E5] hover:border-[#D71920]/70 rounded-2xl p-2 text-center cursor-pointer shadow-2xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between items-center overflow-hidden"
              >
                {/* Picture Thumbnail */}
                <div className="w-full h-20 sm:h-24 md:h-26 rounded-xl overflow-hidden bg-neutral-100 relative mb-1.5">
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FFF1F2] text-[#D71920] font-black flex items-center justify-center text-sm">
                      {cat.name[0]}
                    </div>
                  )}
                </div>

                {/* Category Name Label */}
                <div className="w-full px-0.5 shrink-0">
                  <h3 className="font-bold text-[11px] sm:text-xs text-[#171717] group-hover:text-[#D71920] transition-colors truncate leading-tight">
                    {cat.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Bestselling Books Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4 pb-1 border-b border-[#F0F0F0]">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-[#171717] tracking-tight">
              Bestselling Books
            </h2>
          </div>
          <button 
            onClick={() => setActivePage('books')}
            className="text-xs font-bold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer shrink-0"
          >
            <span>All Books</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="relative group/books-slider">
          <button 
            onClick={() => scrollContainer(booksScrollRef, 'left')}
            className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/books-slider:opacity-100 cursor-pointer active:scale-90"
            aria-label="Scroll Books Left"
          >
            <ChevronLeft size={18} />
          </button>

          <button 
            onClick={() => scrollContainer(booksScrollRef, 'right')}
            className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/books-slider:opacity-100 cursor-pointer active:scale-90"
            aria-label="Scroll Books Right"
          >
            <ChevronRight size={18} />
          </button>

          <div 
            ref={booksScrollRef}
            className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredBooks.map(product => (
              <div 
                key={product.id} 
                className="w-[calc(50%-6px)] md:w-[calc(20%-12px)] shrink-0 snap-start flex flex-col"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Category Product Rows (Controlled by Admin 'Show on Homepage' Toggle) */}
      {categoryProductSections.map(({ category, items }) => (
        <section key={category.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-1 border-b border-[#F0F0F0]">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-[#171717] tracking-tight uppercase">
                {category.name}
              </h2>
            </div>
            <button 
              onClick={() => { setSelectedCategoryFilter(category.name); setActivePage(category.type === 'stationery' ? 'stationery' : 'books'); }}
              className="text-xs font-bold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer shrink-0"
            >
              <span>View All ({items.length})</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => scrollCategoryProducts(category.id, 'left')}
              className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:hover:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll Left"
            >
              <ChevronLeft size={18} />
            </button>

            <button 
              onClick={() => scrollCategoryProducts(category.id, 'right')}
              className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:hover:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll Right"
            >
              <ChevronRight size={18} />
            </button>

            <div 
              ref={el => { catScrollRefs.current[category.id] = el; }}
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {items.map(product => (
                <div 
                  key={product.id} 
                  className="w-[calc(50%-6px)] md:w-[calc(20%-12px)] shrink-0 snap-start flex flex-col"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* 4. Stationery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4 pb-1 border-b border-[#F0F0F0]">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-[#171717] tracking-tight">
              Premium Stationery
            </h2>
          </div>
          <button 
            onClick={() => setActivePage('stationery')}
            className="text-xs font-bold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer shrink-0"
          >
            <span>All Stationery</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="relative group/stationery-slider">
          <button 
            onClick={() => scrollContainer(stationeryScrollRef, 'left')}
            className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/stationery-slider:opacity-100 cursor-pointer active:scale-90"
            aria-label="Scroll Stationery Left"
          >
            <ChevronLeft size={18} />
          </button>

          <button 
            onClick={() => scrollContainer(stationeryScrollRef, 'right')}
            className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/stationery-slider:opacity-100 cursor-pointer active:scale-90"
            aria-label="Scroll Stationery Right"
          >
            <ChevronRight size={18} />
          </button>

          <div 
            ref={stationeryScrollRef}
            className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredStationery.map(product => (
              <div 
                key={product.id} 
                className="w-[calc(50%-6px)] md:w-[calc(20%-12px)] shrink-0 snap-start flex flex-col"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Verified Customer Reviews & Testimonials */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-1 border-b border-[#F0F0F0]">
            <h2 className="text-lg sm:text-2xl font-black text-[#171717] tracking-tight">
              What Book Lovers Say About MR. BOOKS
            </h2>
          </div>

          <div className="relative group/reviews-slider">
            <button 
              onClick={() => scrollContainer(reviewsScrollRef, 'left')}
              className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/reviews-slider:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll Reviews Left"
            >
              <ChevronLeft size={18} />
            </button>

            <button 
              onClick={() => scrollContainer(reviewsScrollRef, 'right')}
              className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/reviews-slider:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll Reviews Right"
            >
              <ChevronRight size={18} />
            </button>

            <div 
              ref={reviewsScrollRef}
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {reviews.map((rev) => (
                <div key={rev.id} className="w-[calc(85%-8px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-10px)] shrink-0 snap-start p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-2 shadow-2xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center text-emerald-600">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-xs text-[#171717] leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#EEEEEE]">
                    <div className="font-bold text-xs text-[#171717]">{rev.userName}</div>
                    <div className="text-[10px] text-[#5F6368]">{rev.isVerifiedPurchase ? 'Verified Purchase' : 'Customer Review'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Writer / Featured Authors Section */}
      <FeaturedAuthorsSection />
    </div>
  );
}
