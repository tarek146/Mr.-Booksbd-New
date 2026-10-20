import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Flame, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export function SpecialOfferSection() {
  const { products, settings, addToCart, setActivePage } = useStore();
  const specialOfferConfig = settings.specialOffer;

  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 18, minutes: 50, seconds: 30 });

  // 1. Unconditional Timer Effect
  useEffect(() => {
    if (!specialOfferConfig?.endTime) return;

    const interval = setInterval(() => {
      const diff = specialOfferConfig.endTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const totalSecs = Math.floor(diff / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [specialOfferConfig?.endTime]);

  // Compute offer products safely
  const offerProducts = (specialOfferConfig?.items || []).map(item => {
    const prod = products.find(p => p.id === item.productId);
    if (!prod) return null;
    const variant = prod.variants[0] || { price: prod.price };
    const originalPrice = variant.price || prod.price;
    const discountPrice = Math.round(originalPrice * (1 - (item.discountPercentage || 20) / 100));

    return {
      ...prod,
      discountPercentage: item.discountPercentage,
      soldPercentage: item.soldPercentage,
      onlinePaymentOnly: item.onlinePaymentOnly,
      originalPrice,
      discountPrice
    };
  }).filter(Boolean) as any[];

  const offersCount = offerProducts.length;

  // 2. Unconditional Auto-Slide Effect
  useEffect(() => {
    if (offersCount <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % offersCount);
    }, 3200);
    return () => clearInterval(timer);
  }, [offersCount]);

  // 3. Unconditional Scroll Position Effect
  useEffect(() => {
    if (sliderRef.current && offersCount > 0) {
      const cardWidth = sliderRef.current.querySelector('.offer-card')?.clientWidth || 180;
      sliderRef.current.scrollTo({
        left: currentIndex * (cardWidth + 12),
        behavior: 'smooth'
      });
    }
  }, [currentIndex, offersCount]);

  // Early Return AFTER ALL HOOKS HAVE BEEN DECLARED
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
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
            {/* Countdown timer */}
            <div className="flex items-center gap-1 bg-black/25 backdrop-blur-xs px-2 sm:px-2.5 py-1 rounded-lg border border-white/20 text-[11px] font-bold">
              <span className="text-white/80 hidden sm:inline text-[10px]">Ends in:</span>
              <div className="flex items-center gap-0.5 font-mono font-black text-amber-300 text-[11px] sm:text-xs">
                <span className="px-1 py-0.2 rounded bg-black/40">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span>:</span>
                <span className="px-1 py-0.2 rounded bg-black/40">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span>:</span>
                <span className="px-1 py-0.2 rounded bg-black/40">{String(timeLeft.seconds).padStart(2, '0')}</span>
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
                className="offer-card w-[155px] sm:w-[175px] md:w-[190px] shrink-0 snap-start bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image & Discount Badge */}
                  <div 
                    onClick={() => setActivePage('product-detail', p.id)}
                    className="relative w-full h-32 sm:h-36 bg-neutral-100 overflow-hidden cursor-pointer"
                  >
                    <img 
                      src={p.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'} 
                      alt={p.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        <span className="text-neutral-700 font-mono text-[9px]">{p.soldPercentage}%</span>
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
                      addToCart(p, p.variants[0]?.id || 'v1', 1);
                      setActivePage('checkout');
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
          <div className="flex items-center justify-center gap-1 pt-2">
            {offerProducts.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === i ? 'w-4 bg-[#D71920]' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
