import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight
} from 'lucide-react';

export function Hero() {
  const { banners, setActivePage } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeBanners = banners.filter(b => b.isActive !== false);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeBanners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const banner = activeBanners[currentSlide] || activeBanners[0];

  const handleBannerClick = () => {
    const target = banner.linkUrl || '/books';
    if (target.startsWith('/')) {
      const page = target.replace('/', '');
      setActivePage(page || 'books');
    } else {
      window.location.href = target;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-2 sm:pb-3">
      {/* Full-Width Hero Banner Container with Slightly Smaller Vertical Height on Mobile */}
      <div 
        onClick={handleBannerClick}
        className="w-full h-[155px] xs:h-[185px] sm:h-[270px] md:h-[370px] lg:h-[420px] relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-100 border border-[#E5E5E5] shadow-xs cursor-pointer select-none group flex"
      >
        {/* Banner Pure Direct Image */}
        <img 
          src={banner.imageUrl} 
          alt={banner.title || 'Promotional Banner'} 
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          loading="eager"
        />

        {/* Optional Text Overlay (Only rendered if admin explicitly enabled showText) */}
        {banner.showText && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-6 sm:p-10 flex flex-col justify-center max-w-xl z-10 text-white space-y-2.5">
            {banner.title && (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                {banner.title}
              </h1>
            )}
            {banner.subtitle && (
              <p className="text-white/90 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                {banner.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Optional Action Button Overlay if turned ON by Admin */}
        {banner.showButton !== false && (
          <div className={`absolute z-20 ${
            banner.buttonPosition === 'bottom-center' 
              ? 'bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2' 
              : banner.buttonPosition === 'bottom-right' 
              ? 'bottom-5 sm:bottom-7 right-5 sm:right-7' 
              : 'bottom-5 sm:bottom-7 left-5 sm:left-7'
          }`}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick();
              }}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#D71920]/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-white/20"
            >
              <span>{banner.buttonText || 'Explore Collection'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Slider Controls (Only visible if more than 1 active banner) */}
        {activeBanners.length > 1 && (
          <>
            {/* Prev / Next Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 inset-x-3.5 flex items-center justify-between pointer-events-none z-20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#171717] shadow-md flex items-center justify-center transition-all cursor-pointer pointer-events-auto active:scale-95 border border-[#E5E5E5]/60"
                aria-label="Previous slide"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(prev => (prev + 1) % activeBanners.length);
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#171717] shadow-md flex items-center justify-center transition-all cursor-pointer pointer-events-auto active:scale-95 border border-[#E5E5E5]/60"
                aria-label="Next slide"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Dot Indicators */}
            <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
