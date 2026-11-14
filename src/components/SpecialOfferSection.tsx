import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Flame, ChevronLeft, ChevronRight, Zap, Clock } from 'lucide-react';
import { resolveProductImageFitMode } from '../utils/productImageLayoutHelpers';
import {
  filterActiveSpecialOfferItems,
  resolveSectionTargetEndTime,
  formatCountdownParts,
  getSpecialOfferItemStatus,
  formatCompactDuration,
} from '../utils/specialOfferHelpers';

export function SpecialOfferSection() {
  const { products, settings, homeConfig, setActivePage, startDirectCheckout } = useStore();
  const specialOfferConfig = settings.specialOffer;
  const imageFitMode = resolveProductImageFitMode(settings, homeConfig);

  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Live 1-second tick so expired deals vanish immediately without page reload
  useEffect(() => {
    setNow(Date.now());
    if (!specialOfferConfig?.enabled) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [
    specialOfferConfig?.enabled,
    specialOfferConfig?.endTime,
    specialOfferConfig?.autoRemoveExpired,
    specialOfferConfig?.items,
  ]);

  // Filter out expired or future-scheduled offer items automatically
  const activeConfigItems = filterActiveSpecialOfferItems(specialOfferConfig, now);
  const targetEndTime = resolveSectionTargetEndTime(
    specialOfferConfig,
    activeConfigItems,
    now
  );
  const timeLeft = formatCountdownParts(targetEndTime, now);

  // Map active offer items against store products
  const offerProducts = activeConfigItems
    .map(item => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) return null;
      const variant = prod.variants[0] || { price: prod.price };
      const originalPrice = variant.price || prod.price;
      const discountPrice = Math.round(
        originalPrice * (1 - (item.discountPercentage || 20) / 100)
      );
      const timingStatus = getSpecialOfferItemStatus(item, specialOfferConfig, now);

      return {
        ...prod,
        discountPercentage: item.discountPercentage,
        soldPercentage: item.soldPercentage,
        onlinePaymentOnly: item.onlinePaymentOnly,
        originalPrice,
        discountPrice,
        hasCustomTimer: timingStatus.usesCustomEndTime && timingStatus.remainingMs > 0,
        remainingLabel: formatCompactDuration(timingStatus.remainingMs),
      };
    })
    .filter(Boolean) as Array<any>;

  const offersCount = offerProducts.length;

  // Keep slide index within bounds as expired items drop off
  useEffect(() => {
    if (offersCount > 0 && currentIndex >= offersCount) {
      setCurrentIndex(0);
    }
  }, [offersCount, currentIndex]);

  // Unconditional Auto-Slide Effect
  useEffect(() => {
    if (offersCount <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % offersCount);
    }, 3200);
    return () => clearInterval(timer);
  }, [offersCount]);

  // Unconditional Scroll Position Effect
  useEffect(() => {
    if (sliderRef.current && offersCount > 0) {
      const cardWidth = sliderRef.current.querySelector('.offer-card')?.clientWidth || 180;
      sliderRef.current.scrollTo({
        left: currentIndex * (cardWidth + 12),
        behavior: 'smooth',
      });
    }
  }, [currentIndex, offersCount]);

  // Hide entire section cleanly once disabled or all deal timers have expired
  if (!specialOfferConfig || !specialOfferConfig.enabled || offersCount === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? offersCount - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % offersCount);
  };

  return (
    <section
      data-testid="special-offer-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5"
    >
      <div className="bg-white border border-[#D71920]/25 rounded-2xl sm:rounded-3xl shadow-md overflow-hidden">
        {/* Sleek Compact Header Banner */}
        <div className="bg-gradient-to-r from-[#D71920] to-[#B9151B] px-3.5 sm:px-5 py-2 sm:py-2.5 flex flex-row items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <Flame size={16} fill="currentColor" />
            </div>
            <h2 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-white truncate">
              {specialOfferConfig.title || 'Special Offer'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Countdown Timer */}
            <div
              data-testid="special-offer-countdown"
              className="flex items-center gap-1 bg-black/25 backdrop-blur-xs px-2 sm:px-2.5 py-1 rounded-lg border border-white/20 text-[11px] font-bold"
            >
              <span className="text-white/80 hidden sm:inline text-[10px]">Ends in:</span>
              <div className="flex items-center gap-0.5 font-mono font-black text-amber-300 text-[11px] sm:text-xs tabular-nums">
                <span className="px-1 py-0.2 rounded bg-black/40">
                  {String(timeLeft.totalHours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="px-1 py-0.2 rounded bg-black/40">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="px-1 py-0.2 rounded bg-black/40">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Slider Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 hover:bg-white text-white hover:text-[#D71920] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={handleNext}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 hover:bg-white text-white hover:text-[#D71920] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Next Slide"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Product Cards Row Slider */}
        <div className="p-2.5 sm:p-4 bg-neutral-50/40">
          <div
            ref={sliderRef}
            className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-0.5 px-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {offerProducts.map((p, idx) => (
              <div
                key={p.id + idx}
                data-testid={`special-offer-card-${p.id}`}
                className="offer-card w-[155px] sm:w-[175px] md:w-[190px] shrink-0 snap-start bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image & Discount Badge */}
                  <div
                    onClick={() => setActivePage('product-detail', p.id)}
                    className={`relative w-full aspect-square bg-neutral-100 overflow-hidden cursor-pointer flex items-center justify-center ${
                      imageFitMode === 'contain' ? 'p-2' : ''
                    }`}
                  >
                    <img
                      src={
                        p.images[0] ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'
                      }
                      alt={p.title}
                      className={`w-full h-full ${
                        imageFitMode === 'contain'
                          ? 'object-contain'
                          : 'object-cover object-center'
                      } group-hover:scale-105 transition-transform duration-300`}
                    />

                    {/* Discount Badge */}
                    <div className="absolute top-1.5 left-1.5 bg-[#D71920] text-white font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-sm">
                      -{p.discountPercentage}%
                    </div>

                    {p.onlinePaymentOnly && (
                      <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                        Online Pay
                      </div>
                    )}

                    {/* Optional Per-Product Remaining Time Pill */}
                    {specialOfferConfig.showItemCountdown !== false && p.hasCustomTimer && (
                      <div
                        data-testid={`special-offer-item-timer-${p.id}`}
                        className="absolute bottom-1.5 left-1.5 bg-neutral-900/80 backdrop-blur-xs text-white text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1 tabular-nums shadow-xs"
                      >
                        <Clock size={9} className="text-amber-300 shrink-0" />
                        <span>{p.remainingLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Sold Bar */}
                  <div className="p-2 sm:p-2.5 space-y-1.5">
                    <h3
                      onClick={() => setActivePage('product-detail', p.id)}
                      className="font-bold text-[11px] sm:text-xs text-neutral-900 group-hover:text-[#D71920] transition-colors line-clamp-1 cursor-pointer"
                      title={p.title}
                    >
                      {p.title}
                    </h3>

                    {/* Sold Progress */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500">
                        <span className="text-[#D71920] flex items-center gap-0.5">
                          <Flame size={10} fill="currentColor" /> Sold
                        </span>
                        <span className="text-neutral-700 font-mono text-[9px]">
                          {p.soldPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#D71920] to-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${p.soldPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price & Order Now Button */}
                <div className="p-2 sm:p-2.5 pt-0 space-y-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-[#D71920] tabular-nums">
                      ৳{p.discountPrice}
                    </span>
                    <span className="text-[10px] text-neutral-400 line-through tabular-nums font-medium">
                      ৳{p.originalPrice}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      startDirectCheckout(p, p.variants[0]?.id || 'v1', 1);
                    }}
                    className="w-full py-1.5 px-2 bg-gradient-to-r from-[#D71920] to-[#B9151B] hover:from-[#B9151B] hover:to-[#921015] text-white rounded-lg text-[10px] sm:text-[11px] font-black flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
                  >
                    <Zap size={12} fill="currentColor" />
                    <span>Order Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          {offerProducts.length > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              {offerProducts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === i
                      ? 'w-4 bg-[#D71920]'
                      : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
