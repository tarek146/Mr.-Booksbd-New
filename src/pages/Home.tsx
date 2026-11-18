import React, { useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Hero } from '../components/Hero';
import { SpecialOfferSection } from '../components/SpecialOfferSection';
import { ReelsSection } from '../components/ReelsSection';
import { ProductCard, renderGreenReviewIcon } from '../components/ProductCard';
import { FeaturedAuthorsSection } from '../components/FeaturedAuthorsSection';
import { HomePageSkeleton } from '../components/SkeletonScreens';
import { shouldShowSkeletonScreen } from '../utils/instantStoreCache';
import { buildEnrichedPublishersList } from '../utils/publisherAndDeliveryHelpers';
import {
  resolveHomeReviewsSlotMode,
  resolveHomeAuthorsSlotMode,
  resolveNewArrivalsTitle,
  resolveBestSellingTitle,
  resolveAllBooksTitle,
  resolveAllBooksLimit,
} from '../utils/homeConfigHelpers';
import {
  getNewArrivalsBooks,
  getBestSellingBooks,
  getHomeAllBooks,
  getHomeStationeryItems,
} from '../utils/homeCatalogHelpers';
import {
  getHomeVisibleCategorySliderItems,
  getHomeCategoryProductSections,
} from '../utils/categoryHomeHelpers';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  Building2,
  BookOpen,
  CheckCircle2,
  Phone,
} from 'lucide-react';

export function Home() {
  const {
    products,
    categories,
    publishers,
    reviews,
    orders,
    isLoading,
    isStoreHydrated,
    settings,
    homeConfig,
    siteSettings,
    setActivePage,
    setSelectedCategoryFilter,
    setSelectedSeriesFilter,
  } = useStore();

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const newArrivalsScrollRef = useRef<HTMLDivElement>(null);
  const bestSellingScrollRef = useRef<HTMLDivElement>(null);
  const stationeryScrollRef = useRef<HTMLDivElement>(null);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const catScrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const newArrivals = useMemo(
    () => getNewArrivalsBooks(products, homeConfig.newArrivalsLimit ?? 10),
    [products, homeConfig.newArrivalsLimit]
  );

  const bestSellingBooks = useMemo(
    () => getBestSellingBooks(products, orders, homeConfig.bestSellingLimit ?? 10),
    [products, orders, homeConfig.bestSellingLimit]
  );

  const allBooksData = useMemo(
    () => getHomeAllBooks(products, resolveAllBooksLimit(homeConfig)),
    [products, homeConfig]
  );

  const featuredStationery = useMemo(
    () => getHomeStationeryItems(products),
    [products]
  );

  const homeCategories = useMemo(
    () => getHomeVisibleCategorySliderItems(categories),
    [categories]
  );

  const bookCategorySections = useMemo(() => {
    if (homeConfig.enableCategoryProductSections === false) return [];
    return getHomeCategoryProductSections(categories, products, 'book');
  }, [categories, products, homeConfig.enableCategoryProductSections]);

  const stationeryCategorySections = useMemo(() => {
    if (homeConfig.enableCategoryProductSections === false) return [];
    return getHomeCategoryProductSections(categories, products, 'stationery');
  }, [categories, products, homeConfig.enableCategoryProductSections]);

  const navigateToAllBooks = () => {
    setSelectedCategoryFilter('all');
    setSelectedSeriesFilter('');
    setActivePage('books');
  };

  const scrollCategoryProducts = (catId: string, direction: 'left' | 'right') => {
    const el = catScrollRefs.current[catId];
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const scrollContainer = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right'
  ) => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.8;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!isStoreHydrated || shouldShowSkeletonScreen(isLoading, settings.enableSkeletonLoading)) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="bg-white transition-colors pb-14">
      {/* Hero Banner */}
      <Hero />

      {/* Compact Quick Categories Navigation Strip (Browse by Category without flooding Home with product rows) */}
      {homeConfig.showCategoriesStrip !== false && homeCategories.length > 0 && (
        <section
          data-testid="home-categories-strip"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-3 bg-white"
        >
          <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-neutral-200/70">
            <h2 className="text-sm sm:text-base font-bold text-[#171717] tracking-tight">
              Browse Categories
            </h2>
            <button
              type="button"
              onClick={navigateToAllBooks}
              className="text-xs font-semibold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>All Books</span>
              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="relative group/cat-slider">
            <button
              type="button"
              onClick={() => scrollContainer(categoryScrollRef, 'left')}
              className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/cat-slider:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll Categories Left"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
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
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setSelectedSeriesFilter('');
                    setSelectedCategoryFilter(cat.name);
                    setActivePage(cat.type === 'stationery' ? 'stationery' : 'books');
                  }}
                  className="w-[96px] sm:w-[114px] md:w-[122px] shrink-0 snap-start bg-white border border-[#E5E5E5] hover:border-[#D71920]/70 rounded-xl p-2 text-center cursor-pointer shadow-2xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between items-center overflow-hidden"
                >
                  <div className="w-full h-20 sm:h-24 rounded-lg overflow-hidden bg-neutral-100 relative mb-1.5">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#FFF1F2] text-[#D71920] font-black flex items-center justify-center text-sm">
                        {cat.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="w-full px-0.5 shrink-0">
                    <span className="block font-semibold text-[11px] sm:text-xs text-[#171717] group-hover:text-[#D71920] transition-colors truncate leading-tight">
                      {cat.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 1. Offer Section (Special Offer Deals — controlled by Admin Special Offer & Home Visibility) */}
      {homeConfig.showOfferSection !== false && (
        <div data-testid="home-offer-section-wrapper">
          <SpecialOfferSection />
        </div>
      )}

      {/* 2. New Arrivals Collection */}
      {homeConfig.showNewArrivalsSection !== false && newArrivals.length > 0 && (
        <section
          data-testid="home-new-arrivals-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
        >
          <div className="flex items-baseline justify-between gap-4 mb-3.5 pb-2 border-b border-neutral-200/80">
            <h2
              data-testid="home-new-arrivals-heading"
              className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight"
            >
              {resolveNewArrivalsTitle(homeConfig)}
            </h2>
            <button
              type="button"
              onClick={navigateToAllBooks}
              className="text-xs font-semibold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>View All</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="relative group/new-arrivals-slider">
            <button
              type="button"
              onClick={() => scrollContainer(newArrivalsScrollRef, 'left')}
              className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/new-arrivals-slider:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll New Arrivals Left"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => scrollContainer(newArrivalsScrollRef, 'right')}
              className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/new-arrivals-slider:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll New Arrivals Right"
            >
              <ChevronRight size={18} />
            </button>

            <div
              ref={newArrivalsScrollRef}
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {newArrivals.map(product => (
                <div
                  key={product.id}
                  className="w-[calc(50%-6px)] sm:w-[calc(33.333%-10px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] shrink-0 snap-start flex flex-col"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Best Selling Books */}
      {homeConfig.showBestSellingSection !== false && bestSellingBooks.length > 0 && (
        <section
          data-testid="home-bestselling-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
        >
          <div className="flex items-baseline justify-between gap-4 mb-3.5 pb-2 border-b border-neutral-200/80">
            <h2
              data-testid="home-bestselling-heading"
              className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight"
            >
              {resolveBestSellingTitle(homeConfig)}
            </h2>
            <button
              type="button"
              onClick={navigateToAllBooks}
              className="text-xs font-semibold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>View All</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="relative group/books-slider">
            <button
              type="button"
              onClick={() => scrollContainer(bestSellingScrollRef, 'left')}
              className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/books-slider:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll Best Selling Books Left"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => scrollContainer(bestSellingScrollRef, 'right')}
              className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/books-slider:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll Best Selling Books Right"
            >
              <ChevronRight size={18} />
            </button>

            <div
              ref={bestSellingScrollRef}
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {bestSellingBooks.map(product => (
                <div
                  key={product.id}
                  className="w-[calc(50%-6px)] sm:w-[calc(33.333%-10px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] shrink-0 snap-start flex flex-col"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. All Books (Capped at 20–25 Books on Home, Full Library via View All) */}
      {homeConfig.showAllBooksSection !== false && allBooksData.items.length > 0 && (
        <section
          data-testid="home-all-books-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
        >
          <div className="flex items-baseline justify-between gap-4 mb-4 pb-2 border-b border-neutral-200/80">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h2
                data-testid="home-all-books-heading"
                className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight"
              >
                {resolveAllBooksTitle(homeConfig)}
              </h2>
              <span className="text-xs text-neutral-500 tabular-nums">
                · {allBooksData.items.length} of {allBooksData.totalBooksCount} books
              </span>
            </div>
            <button
              type="button"
              data-testid="home-all-books-view-all-top-btn"
              onClick={navigateToAllBooks}
              className="text-xs font-semibold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>View All ({allBooksData.totalBooksCount})</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div
            data-testid="home-all-books-grid"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
          >
            {allBooksData.items.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {allBooksData.hasMoreBooks && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                data-testid="home-all-books-view-all-btn"
                onClick={navigateToAllBooks}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-neutral-200 hover:border-[#D71920] bg-white text-xs sm:text-sm font-semibold text-[#171717] hover:text-[#D71920] transition-colors cursor-pointer group"
              >
                <span>View All Books ({allBooksData.totalBooksCount})</span>
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            </div>
          )}
        </section>
      )}

      {/* 5. Admin-Selected Book Category Product Sections (Rendered cleanly by Serial Order) */}
      {bookCategorySections.length > 0 && (
        <div data-testid="home-book-category-rows-section">
          {bookCategorySections.map(({ category, visibleItems, totalCount, hasMore, remainingCount }) => (
            <section
              key={category.id}
              data-testid={`home-category-section-${category.id}`}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3 pb-2 border-b border-neutral-200/80">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                    {category.name}
                  </h2>
                  <span className="text-xs text-neutral-500 tabular-nums">
                    · {visibleItems.length} of {totalCount}
                  </span>
                </div>
                <button
                  type="button"
                  data-testid={`home-category-seemore-${category.id}`}
                  onClick={() => {
                    setSelectedSeriesFilter('');
                    setSelectedCategoryFilter(category.name);
                    setActivePage('books');
                  }}
                  className="text-xs font-semibold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>See More</span>
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => scrollCategoryProducts(category.id, 'left')}
                  className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:hover:opacity-100 cursor-pointer active:scale-90"
                  aria-label={`Scroll ${category.name} Left`}
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => scrollCategoryProducts(category.id, 'right')}
                  className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:hover:opacity-100 cursor-pointer active:scale-90"
                  aria-label={`Scroll ${category.name} Right`}
                >
                  <ChevronRight size={18} />
                </button>

                <div
                  ref={el => {
                    catScrollRefs.current[category.id] = el;
                  }}
                  className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {visibleItems.map(product => (
                    <div
                      key={product.id}
                      className="w-[calc(50%-6px)] sm:w-[calc(33.333%-10px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] shrink-0 snap-start flex flex-col"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>

              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeriesFilter('');
                      setSelectedCategoryFilter(category.name);
                      setActivePage('books');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-neutral-200 hover:border-[#D71920] bg-white text-xs font-semibold text-[#171717] hover:text-[#D71920] transition-colors cursor-pointer group"
                  >
                    <span>See More ({remainingCount} remaining)</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* 6. Dedicated Stationery Row & Stationery Category Sections (Always Strictly Below All Books & Above Testimonials) */}
      {homeConfig.showStationerySection !== false && featuredStationery.length > 0 && (
        <section
          data-testid="home-stationery-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
        >
          <div className="flex items-baseline justify-between gap-4 mb-3.5 pb-2 border-b border-neutral-200/80">
            <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
              Stationery Collection
            </h2>
            <button
              type="button"
              onClick={() => {
                setSelectedSeriesFilter('');
                setSelectedCategoryFilter('all');
                setActivePage('stationery');
              }}
              className="text-xs font-semibold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>See More ({featuredStationery.length})</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="relative group/stationery-slider">
            <button
              type="button"
              onClick={() => scrollContainer(stationeryScrollRef, 'left')}
              className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/stationery-slider:opacity-100 cursor-pointer active:scale-90"
              aria-label="Scroll Stationery Left"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => scrollContainer(stationeryScrollRef, 'right')}
              className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/stationery-slider:opacity-100 cursor-pointer active:scale-90"
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
                  className="w-[calc(50%-6px)] sm:w-[calc(33.333%-10px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] shrink-0 snap-start flex flex-col"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {homeConfig.showStationerySection !== false && stationeryCategorySections.length > 0 && (
        <div data-testid="home-stationery-category-rows-section">
          {stationeryCategorySections.map(({ category, visibleItems, totalCount, hasMore, remainingCount }) => (
            <section
              key={category.id}
              data-testid={`home-category-section-${category.id}`}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3 pb-2 border-b border-neutral-200/80">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                    {category.name}
                  </h2>
                  <span className="text-xs text-neutral-500 tabular-nums">
                    · {visibleItems.length} of {totalCount}
                  </span>
                </div>
                <button
                  type="button"
                  data-testid={`home-category-seemore-${category.id}`}
                  onClick={() => {
                    setSelectedSeriesFilter('');
                    setSelectedCategoryFilter(category.name);
                    setActivePage('stationery');
                  }}
                  className="text-xs font-semibold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>See More</span>
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>

              <div className="relative">
                <div
                  className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {visibleItems.map(product => (
                    <div
                      key={product.id}
                      className="w-[calc(50%-6px)] sm:w-[calc(33.333%-10px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] shrink-0 snap-start flex flex-col"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>

              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeriesFilter('');
                      setSelectedCategoryFilter(category.name);
                      setActivePage('stationery');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-neutral-200 hover:border-[#D71920] bg-white text-xs font-semibold text-[#171717] hover:text-[#D71920] transition-colors cursor-pointer group"
                  >
                    <span>See More ({remainingCount} remaining)</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Verified Customer Reviews & Testimonials (Controlled by Firebase siteSettings.reviewDisplay & homeConfig.showReviews) */}
      {(() => {
        if (siteSettings.reviewDisplay === false || homeConfig.showReviews === false) {
          return null;
        }
        const slotMode = resolveHomeReviewsSlotMode(homeConfig, settings);

        if (slotMode === 'off') {
          return null;
        }

        if (slotMode === 'trust_features') {
          return (
            <section
              data-testid="home-reviews-replacement-trust"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3.5 pb-2 border-b border-neutral-200/80">
                <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                  Why Book Lovers Trust MR. BOOKS
                </h2>
                <span className="text-xs font-medium text-emerald-700">Verified Store</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    icon: <ShieldCheck size={18} className="text-emerald-600" />,
                    title: '100% Authentic Print Books',
                    desc: 'Direct from official publishers with crisp paper & original binding guarantee.',
                    note: 'Original Copy',
                  },
                  {
                    icon: <Truck size={18} className="text-emerald-600" />,
                    title: 'Fastest Nationwide Delivery',
                    desc: 'Express doorstep delivery in Dhaka, Outside Dhaka, Sub Area & Sundarban Courier.',
                    note: 'Cash on Delivery',
                  },
                  {
                    icon: <CheckCircle2 size={18} className="text-emerald-600" />,
                    title: 'Bubble-Wrap Safe Packaging',
                    desc: 'Multi-layer protective packaging so every hardcover & paperback arrives mint.',
                    note: 'Zero Damage',
                  },
                  {
                    icon: <BookOpen size={18} className="text-emerald-600" />,
                    title: '7-Day Easy Replacement',
                    desc: 'Instant replacement guarantee for any printing or binding defect on arrival.',
                    note: 'Reader Protection',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-neutral-200 flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700">{item.note}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#171717]">{item.title}</h3>
                      <p className="text-xs text-[#5F6368] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (slotMode === 'publishers_spotlight') {
          const enrichedPublishers = buildEnrichedPublishersList(publishers, products);
          return (
            <section
              data-testid="home-reviews-replacement-publishers"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3.5 pb-2 border-b border-neutral-200/80">
                <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                  Official Publications & Partner Houses
                </h2>
                <button
                  type="button"
                  onClick={() => setActivePage('publishers')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#D71920] hover:text-[#B51218] transition-colors cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {enrichedPublishers.slice(0, 6).map(pub => (
                  <button
                    key={pub.id}
                    type="button"
                    onClick={() => setActivePage('publishers')}
                    className="p-3.5 rounded-xl bg-white border border-neutral-200 hover:border-emerald-400 flex flex-col items-center text-center gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-center overflow-hidden">
                      {pub.logoUrl ? (
                        <img src={pub.logoUrl} alt={pub.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={20} className="text-emerald-600" />
                      )}
                    </div>
                    <div className="w-full">
                      <div className="font-semibold text-xs text-[#171717] truncate group-hover:text-emerald-700">
                        {pub.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
                        {pub.booksCount || 0} Books
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        }

        if (slotMode === 'reading_benefits') {
          return (
            <section
              data-testid="home-reviews-replacement-benefits"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
            >
              <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="text-[11px] font-semibold text-emerald-700">
                    Reader First Experience
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                    Look Inside Pages Before You Order Any Book
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5F6368]">
                    Preview sample pages on every book detail page, enjoy instant Cash on Delivery,
                    and get dedicated book curator assistance anytime.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={navigateToAllBooks}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <BookOpen size={14} />
                    <span>Browse Books</span>
                  </button>
                  {settings.callNumber && (
                    <a
                      href={`tel:${settings.callNumber}`}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-50 text-[#171717] border border-neutral-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Phone size={13} className="text-emerald-600" />
                      <span>Hotline: {settings.callNumber}</span>
                    </a>
                  )}
                </div>
              </div>
            </section>
          );
        }

        if (reviews.length === 0) return null;

        return (
          <section
            data-testid="home-reviews-section"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
          >
            <div className="flex items-baseline justify-between mb-3.5 pb-2 border-b border-neutral-200/80">
              <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                What Book Lovers Say About MR. BOOKS
              </h2>
            </div>

            <div className="relative group/reviews-slider">
              <button
                type="button"
                onClick={() => scrollContainer(reviewsScrollRef, 'left')}
                className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/reviews-slider:opacity-100 cursor-pointer active:scale-90"
                aria-label="Scroll Reviews Left"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => scrollContainer(reviewsScrollRef, 'right')}
                className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/reviews-slider:opacity-100 cursor-pointer active:scale-90"
                aria-label="Scroll Reviews Right"
              >
                <ChevronRight size={18} />
              </button>

              <div
                ref={reviewsScrollRef}
                className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {reviews.map(rev => (
                  <div
                    key={rev.id}
                    className="w-[calc(85%-8px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-10px)] shrink-0 snap-start p-4 rounded-xl bg-white border border-neutral-200 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div
                        data-testid="home-review-green-icons"
                        className="flex items-center gap-1 text-emerald-600"
                      >
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <span key={i} className="inline-flex">
                            {renderGreenReviewIcon(
                              homeConfig.reviewIconStyle || settings.homeReviewIconStyle,
                              13
                            )}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-[#171717] leading-relaxed">"{rev.comment}"</p>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#171717]">{rev.userName}</span>
                      <span className="text-[11px] text-[#5F6368]">
                        {rev.isVerifiedPurchase ? 'Verified Purchase' : 'Customer Review'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Writer / Featured Authors Section (Controlled by Firebase siteSettings.authorInfo & homeConfig.showAuthors) */}
      {(() => {
        if (siteSettings.authorInfo === false || homeConfig.showAuthors === false) {
          return null;
        }
        const writerSlotMode = resolveHomeAuthorsSlotMode(homeConfig, settings);

        if (writerSlotMode === 'off') {
          return null;
        }

        if (writerSlotMode === 'publishers_spotlight') {
          const enrichedPublishers = buildEnrichedPublishersList(publishers, products);
          return (
            <section
              data-testid="home-writers-replacement-publishers"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3.5 pb-2 border-b border-neutral-200/80">
                <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                  Official Publications & Partner Houses
                </h2>
                <button
                  type="button"
                  onClick={() => setActivePage('publishers')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#D71920] hover:text-[#B51218] transition-colors cursor-pointer"
                >
                  <span>All Publishers ({enrichedPublishers.length})</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {enrichedPublishers.slice(0, 6).map(pub => (
                  <button
                    key={pub.id}
                    type="button"
                    onClick={() => setActivePage('publishers')}
                    className="p-3.5 rounded-xl bg-white border border-neutral-200 hover:border-[#D71920]/40 flex flex-col items-center text-center gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#FFF1F2] border border-[#D71920]/20 flex items-center justify-center overflow-hidden">
                      {pub.logoUrl ? (
                        <img src={pub.logoUrl} alt={pub.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={20} className="text-[#D71920]" />
                      )}
                    </div>
                    <div className="w-full">
                      <div className="font-semibold text-xs text-[#171717] truncate group-hover:text-[#D71920]">
                        {pub.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
                        {pub.booksCount || 0} Books
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        }

        if (writerSlotMode === 'bestsellers_showcase') {
          const topBooks = getBestSellingBooks(products, orders, 5);
          return (
            <section
              data-testid="home-writers-replacement-bestsellers"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3.5 pb-2 border-b border-neutral-200/80">
                <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                  Reader Favorites & Top Bestselling Books
                </h2>
                <button
                  type="button"
                  onClick={navigateToAllBooks}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#D71920] hover:text-[#B51218] transition-colors cursor-pointer"
                >
                  <span>Browse All Books</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {topBooks.map(book => (
                  <ProductCard key={book.id} product={book} />
                ))}
              </div>
            </section>
          );
        }

        if (writerSlotMode === 'trust_features') {
          return (
            <section
              data-testid="home-writers-replacement-trust"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3.5 pb-2 border-b border-neutral-200/80">
                <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                  Why Book Lovers Trust MR. BOOKS
                </h2>
                <span className="text-xs font-medium text-emerald-700">Verified Store</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    icon: <ShieldCheck size={18} className="text-emerald-600" />,
                    title: '100% Authentic Print Books',
                    desc: 'Direct from official publishers with crisp paper & original binding guarantee.',
                    note: 'Original Copy',
                  },
                  {
                    icon: <Truck size={18} className="text-emerald-600" />,
                    title: 'Fastest Nationwide Delivery',
                    desc: 'Express doorstep delivery in Dhaka, Outside Dhaka, Sub Area & Sundarban Courier.',
                    note: 'Cash on Delivery',
                  },
                  {
                    icon: <CheckCircle2 size={18} className="text-emerald-600" />,
                    title: 'Bubble-Wrap Safe Packaging',
                    desc: 'Multi-layer protective packaging so every hardcover & paperback arrives mint.',
                    note: 'Zero Damage',
                  },
                  {
                    icon: <BookOpen size={18} className="text-emerald-600" />,
                    title: '7-Day Easy Replacement',
                    desc: 'Instant replacement guarantee for any printing or binding defect on arrival.',
                    note: 'Reader Protection',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-neutral-200 flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700">{item.note}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#171717]">{item.title}</h3>
                      <p className="text-xs text-[#5F6368] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (writerSlotMode === 'reading_benefits') {
          return (
            <section
              data-testid="home-writers-replacement-benefits"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
            >
              <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="text-[11px] font-semibold text-emerald-700">
                    Reader First Experience
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#171717] tracking-tight">
                    Look Inside Pages Before You Order Any Book
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5F6368]">
                    Preview sample pages on every book detail page, enjoy instant Cash on Delivery,
                    and get dedicated book curator assistance anytime.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={navigateToAllBooks}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <BookOpen size={14} />
                    <span>Browse Books</span>
                  </button>
                  {settings.callNumber && (
                    <a
                      href={`tel:${settings.callNumber}`}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-50 text-[#171717] border border-neutral-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Phone size={13} className="text-emerald-600" />
                      <span>Hotline: {settings.callNumber}</span>
                    </a>
                  )}
                </div>
              </div>
            </section>
          );
        }

        return <FeaturedAuthorsSection />;
      })()}

      {/* Book Reels & Video Reviews Section */}
      <ReelsSection />
    </div>
  );
}
