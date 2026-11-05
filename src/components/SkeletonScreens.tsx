import React from 'react';
import { useStore } from '../context/StoreContext';

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  const { settings } = useStore();
  const animClass = settings.skeletonAnimationStyle === 'pulse' ? 'skeleton-pulse' : 'skeleton-shimmer';
  return (
    <div
      aria-hidden="true"
      className={`${animClass} rounded-xl select-none pointer-events-none ${className}`}
    />
  );
}

export function HeroSkeleton() {
  return (
    <div
      data-testid="hero-skeleton"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-2 sm:pb-3"
    >
      <div className="w-full h-[155px] xs:h-[185px] sm:h-[270px] md:h-[370px] lg:h-[420px] relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white dark:bg-[#121722] border border-[#E5E5E5] dark:border-slate-800 shadow-xs p-5 sm:p-10 flex flex-col justify-between">
        <SkeletonBlock className="absolute inset-0 rounded-none" />
        <div className="relative z-10 space-y-3 max-w-md pt-2 sm:pt-6">
          <SkeletonBlock className="h-5 sm:h-7 w-3/4 rounded-lg opacity-80" />
          <SkeletonBlock className="h-3.5 sm:h-4 w-1/2 rounded-md opacity-70" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <SkeletonBlock className="h-9 sm:h-11 w-32 sm:w-40 rounded-xl opacity-90" />
          <div className="flex items-center gap-1.5">
            <SkeletonBlock className="h-2 w-6 rounded-full" />
            <SkeletonBlock className="h-2 w-2 rounded-full" />
            <SkeletonBlock className="h-2 w-2 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryRowSkeleton() {
  return (
    <section
      data-testid="category-row-skeleton"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-3"
    >
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#F0F0F0] dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D71920]" />
          <SkeletonBlock className="h-4 w-28 sm:w-36 rounded-md" />
        </div>
        <SkeletonBlock className="h-3.5 w-16 rounded-md" />
      </div>
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden py-1">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="w-[96px] sm:w-[114px] md:w-[124px] shrink-0 bg-white dark:bg-[#121722] border border-[#E5E5E5] dark:border-slate-800 rounded-2xl p-2 flex flex-col items-center space-y-2"
          >
            <SkeletonBlock className="w-full h-20 sm:h-24 rounded-xl" />
            <SkeletonBlock className="h-3 w-4/5 rounded-md" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      data-testid="product-card-skeleton"
      className="bg-white dark:bg-[#121722] rounded-2xl border border-neutral-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between overflow-hidden h-full"
    >
      <div className="p-2 sm:p-2.5 shrink-0">
        <div className="w-full aspect-square relative rounded-xl overflow-hidden border border-neutral-100 dark:border-slate-800">
          <SkeletonBlock className="w-full h-full rounded-none" />
        </div>
      </div>
      <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-3.5 w-10 rounded-md" />
            <SkeletonBlock className="h-3.5 w-12 rounded-md" />
          </div>
          <SkeletonBlock className="h-4 w-11/12 rounded-md" />
          <SkeletonBlock className="h-3 w-2/3 rounded-md" />
        </div>
        <div className="pt-1.5 border-t border-neutral-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-14 rounded-md" />
            <SkeletonBlock className="h-3.5 w-12 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <SkeletonBlock className="h-7 rounded-lg" />
            <SkeletonBlock className="h-7 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductRowSkeleton({ titleWidth = 'w-48' }: { titleWidth?: string }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4 pb-1.5 border-b border-[#F0F0F0] dark:border-slate-800">
        <SkeletonBlock className={`h-6 sm:h-7 ${titleWidth} rounded-lg`} />
        <SkeletonBlock className="h-4 w-16 rounded-md" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className={idx >= 2 ? 'hidden md:block' : 'block'}>
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SpecialOfferSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
      <div className="bg-white dark:bg-[#121722] border border-[#D71920]/20 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#D71920]/90 to-[#B9151B]/90 px-4 py-2.5 flex items-center justify-between">
          <SkeletonBlock className="h-5 w-32 sm:w-44 rounded-md opacity-40" />
          <SkeletonBlock className="h-6 w-28 sm:w-36 rounded-lg opacity-40" />
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className={`bg-white dark:bg-[#161C28] rounded-xl border border-neutral-200/80 dark:border-slate-800 p-2.5 space-y-2 ${
                idx >= 2 ? 'hidden sm:block' : 'block'
              }`}
            >
              <SkeletonBlock className="w-full h-28 sm:h-32 rounded-lg" />
              <SkeletonBlock className="h-3.5 w-4/5 rounded-md" />
              <SkeletonBlock className="h-2 w-full rounded-full" />
              <div className="flex items-center justify-between pt-1">
                <SkeletonBlock className="h-4 w-12 rounded-md" />
                <SkeletonBlock className="h-6 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePageSkeleton() {
  return (
    <div
      data-testid="home-page-skeleton"
      role="status"
      aria-label="Loading store catalog"
      className="bg-white dark:bg-[#0B0F17] transition-colors pb-12"
    >
      <HeroSkeleton />
      <CategoryRowSkeleton />
      <SpecialOfferSkeleton />
      <ProductRowSkeleton titleWidth="w-56 sm:w-72" />
      <ProductRowSkeleton titleWidth="w-44 sm:w-56" />
      <ProductRowSkeleton titleWidth="w-48 sm:w-64" />
    </div>
  );
}

export function BooksCatalogSkeleton() {
  return (
    <div
      data-testid="catalog-page-skeleton"
      role="status"
      aria-label="Loading books and stationery catalog"
      className="min-h-screen bg-white dark:bg-[#0B0F17] transition-colors pt-3 pb-12 sm:py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Filter & Search Bar Skeleton */}
        <div className="bg-[#F7F7F8] dark:bg-[#121722] p-4 sm:p-5 rounded-2xl border border-[#E5E5E5] dark:border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-8 w-24 rounded-lg" />
              <SkeletonBlock className="h-8 w-20 rounded-lg" />
              <SkeletonBlock className="h-8 w-24 rounded-lg" />
            </div>
            <SkeletonBlock className="h-10 flex-1 max-w-md rounded-xl" />
            <SkeletonBlock className="h-9 w-36 rounded-xl" />
          </div>
          <div className="flex items-center gap-2 overflow-hidden pt-1">
            {Array.from({ length: 7 }).map((_, idx) => (
              <SkeletonBlock key={idx} className="h-7 w-24 shrink-0 rounded-full" />
            ))}
          </div>
        </div>

        {/* Main Grid with Sidebar + Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="hidden md:block md:col-span-3 bg-[#F7F7F8] dark:bg-[#121722] p-5 rounded-3xl border border-[#E5E5E5] dark:border-slate-800 space-y-5">
            <SkeletonBlock className="h-5 w-32 rounded-md" />
            <div className="space-y-2.5 pt-2 border-t border-[#E5E5E5] dark:border-slate-800">
              <SkeletonBlock className="h-3.5 w-28 rounded-md" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-9 w-1/2 rounded-xl" />
                <SkeletonBlock className="h-9 w-1/2 rounded-xl" />
              </div>
              <SkeletonBlock className="h-2 w-full rounded-full" />
            </div>
            <div className="space-y-2 pt-2 border-t border-[#E5E5E5] dark:border-slate-800">
              <SkeletonBlock className="h-3.5 w-24 rounded-md" />
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="h-8 w-full rounded-xl" />
              ))}
            </div>
          </div>

          <div className="md:col-span-9 space-y-4">
            <SkeletonBlock className="h-4 w-48 rounded-md" />
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div
      data-testid="product-detail-skeleton"
      role="status"
      aria-label="Loading product details"
      className="min-h-screen bg-white dark:bg-[#0B0F17] transition-colors pt-2 pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 py-2 border-b border-neutral-100 dark:border-slate-800">
          <SkeletonBlock className="h-7 w-16 rounded-xl" />
          <SkeletonBlock className="h-4 w-24 rounded-md" />
          <SkeletonBlock className="h-4 w-40 rounded-md" />
        </div>

        {/* Main 12-Col Overview Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left 5 Cols: Gallery */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-neutral-50/80 dark:bg-[#121722] rounded-2xl p-6 border border-neutral-200/90 dark:border-slate-800 min-h-[320px] sm:min-h-[380px] flex items-center justify-center">
              <SkeletonBlock className="w-56 sm:w-64 h-72 sm:h-80 rounded-2xl" />
            </div>
            <div className="flex items-center justify-center gap-2.5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Right 7 Cols: Purchase Module */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-2.5">
              <SkeletonBlock className="h-8 sm:h-9 w-3/4 rounded-xl" />
              <SkeletonBlock className="h-4 w-1/2 rounded-md" />
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-4 w-28 rounded-md" />
                <SkeletonBlock className="h-4 w-24 rounded-md" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <SkeletonBlock className="h-6 w-28 rounded-full" />
                <SkeletonBlock className="h-6 w-20 rounded-full" />
                <SkeletonBlock className="h-6 w-24 rounded-full" />
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/90 dark:bg-[#121722] border border-neutral-200/90 dark:border-slate-800 flex items-center justify-between">
              <SkeletonBlock className="h-8 w-28 rounded-lg" />
              <SkeletonBlock className="h-7 w-28 rounded-lg" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <SkeletonBlock className="h-14 rounded-xl" />
              <SkeletonBlock className="h-14 rounded-xl" />
              <SkeletonBlock className="h-14 rounded-xl hidden sm:block" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <SkeletonBlock className="h-12 w-full sm:w-32 rounded-xl" />
              <div className="grid grid-cols-2 gap-2 flex-1">
                <SkeletonBlock className="h-12 rounded-xl" />
                <SkeletonBlock className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <SkeletonBlock className="h-9 rounded-xl" />
              <SkeletonBlock className="h-9 rounded-xl" />
              <SkeletonBlock className="h-9 rounded-xl" />
              <SkeletonBlock className="h-9 rounded-xl" />
            </div>

            <SkeletonBlock className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthorsPageSkeleton() {
  return (
    <div
      data-testid="authors-page-skeleton"
      role="status"
      aria-label="Loading authors directory"
      className="min-h-screen bg-white dark:bg-[#0B0F17] transition-colors py-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="pb-3 border-b border-[#EEEEEE] dark:border-slate-800 flex items-center gap-2.5">
          <SkeletonBlock className="w-8 h-8 rounded-xl" />
          <SkeletonBlock className="h-7 w-56 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#121722] border border-[#E5E5E5] dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center space-y-3"
            >
              <SkeletonBlock className="w-24 h-24 rounded-full" />
              <SkeletonBlock className="h-5 w-36 rounded-md" />
              <SkeletonBlock className="h-3 w-full rounded-md" />
              <SkeletonBlock className="h-3 w-4/5 rounded-md" />
              <div className="w-full pt-4 border-t border-[#EEEEEE] dark:border-slate-800 flex justify-between">
                <SkeletonBlock className="h-4 w-24 rounded-md" />
                <SkeletonBlock className="h-4 w-12 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PublishersPageSkeleton() {
  return (
    <div
      data-testid="publishers-page-skeleton"
      role="status"
      aria-label="Loading publishers directory"
      className="min-h-screen bg-white dark:bg-[#0B0F17] transition-colors py-8 sm:py-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="pb-4 border-b border-[#EEEEEE] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-2xl" />
            <div className="space-y-1.5">
              <SkeletonBlock className="h-6 w-52 rounded-lg" />
              <SkeletonBlock className="h-3.5 w-72 rounded-md" />
            </div>
          </div>
          <SkeletonBlock className="h-10 w-full sm:w-72 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#121722] border border-[#E5E5E5] dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-start gap-4">
                <SkeletonBlock className="w-16 h-16 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-24 rounded-full" />
                  <SkeletonBlock className="h-5 w-3/4 rounded-md" />
                  <SkeletonBlock className="h-3.5 w-1/2 rounded-md" />
                </div>
              </div>
              <SkeletonBlock className="h-3.5 w-full rounded-md" />
              <div className="pt-3.5 border-t border-[#EEEEEE] dark:border-slate-800 flex justify-between">
                <SkeletonBlock className="h-4 w-28 rounded-md" />
                <SkeletonBlock className="h-4 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrdersPageSkeleton() {
  return (
    <div
      data-testid="orders-page-skeleton"
      role="status"
      aria-label="Loading orders and tracking"
      className="min-h-screen bg-white dark:bg-[#0B0F17] transition-colors py-8 sm:py-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-xl" />
            <SkeletonBlock className="h-7 w-56 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-9 w-28 rounded-xl" />
            <SkeletonBlock className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="bg-[#F8F9FA] dark:bg-[#121722] border border-[#E5E5E5] dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="max-w-xl mx-auto flex flex-col items-center space-y-3">
            <SkeletonBlock className="w-12 h-12 rounded-2xl" />
            <SkeletonBlock className="h-6 w-52 rounded-lg" />
            <SkeletonBlock className="h-3.5 w-80 max-w-full rounded-md" />
            <div className="flex gap-2 w-full pt-2">
              <SkeletonBlock className="h-11 flex-1 rounded-2xl" />
              <SkeletonBlock className="h-11 w-28 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
