import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Play, ChevronLeft, ChevronRight, X, Heart, Eye, ShoppingCart, Film } from 'lucide-react';
import { Reel } from '../types';
import { extractYouTubeVideoId, isDirectVideoUrl } from '../utils/videoReelHelpers';

export function ReelsSection() {
  const { reels, products, setActivePage, addToCart } = useStore();
  const activeReels = reels.filter(r => r.isActive !== false);

  const [activeModalReel, setActiveModalReel] = useState<Reel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (activeReels.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatVideoEmbed = (url: string) => {
    if (!url) return null;
    const cleanUrl = url.trim();

    // YouTube / YouTube Shorts
    const ytId = extractYouTubeVideoId(cleanUrl);
    if (ytId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&rel=0&playsinline=1`}
          title="Video Reel"
          className="w-full h-full rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Direct MP4 / Video link
    return (
      <video
        src={cleanUrl}
        controls
        autoPlay
        playsInline
        preload="auto"
        className="w-full h-full object-cover rounded-2xl"
      />
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#F0F0F0]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#D71920]/10 text-[#D71920] flex items-center justify-center">
            <Film size={15} />
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#171717] tracking-tight">
            Book Reels & Video Reviews
          </h2>
        </div>
        <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full">
          Watch Shorts
        </span>
      </div>

      {/* Single Line Horizontal Reels Slider */}
      <div className="relative group/reels">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-neutral-200 shadow-lg flex items-center justify-center text-neutral-800 hover:bg-[#D71920] hover:text-white transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/reels:opacity-100 cursor-pointer"
          aria-label="Scroll Left"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-neutral-200 shadow-lg flex items-center justify-center text-neutral-800 hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/reels:opacity-100 cursor-pointer"
          aria-label="Scroll Right"
        >
          <ChevronRight size={16} />
        </button>

        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {activeReels.map(reel => {
            const linkedProduct = reel.productId ? products.find(p => p.id === reel.productId) : null;
            const ytId = extractYouTubeVideoId(reel.videoUrl);
            const effectiveThumb = reel.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');
            const isDirect = isDirectVideoUrl(reel.videoUrl);

            return (
              <div
                key={reel.id}
                onClick={() => setActiveModalReel(reel)}
                className="w-[140px] sm:w-[160px] md:w-[175px] h-[240px] sm:h-[270px] shrink-0 snap-start relative rounded-2xl overflow-hidden cursor-pointer group/card shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-200/80 bg-neutral-950"
              >
                {/* Thumbnail Background / Video Preview */}
                {effectiveThumb ? (
                  <img
                    src={effectiveThumb}
                    alt={reel.title}
                    className="w-full h-full object-cover opacity-90 group-hover/card:scale-105 group-hover/card:opacity-100 transition-all duration-300"
                  />
                ) : isDirect ? (
                  <video
                    src={reel.videoUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover opacity-90 group-hover/card:scale-105 group-hover/card:opacity-100 transition-all duration-300"
                    onMouseEnter={(e) => {
                      try { e.currentTarget.play(); } catch {}
                    }}
                    onMouseLeave={(e) => {
                      try {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      } catch {}
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center p-3 text-center text-neutral-400">
                    <Film size={26} className="text-[#D71920] mb-2" />
                    <span className="text-[10px] font-bold text-white line-clamp-2">{reel.title}</span>
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-white flex items-center justify-center shadow-lg group-hover/card:scale-110 group-hover/card:bg-[#D71920] transition-all">
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>

                {/* Views & Likes Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold text-white z-10">
                  <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs border border-white/20 flex items-center gap-1">
                    <Eye size={11} /> {reel.viewsCount || 1200}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs border border-white/20 flex items-center gap-1 text-rose-300">
                    <Heart size={10} fill="currentColor" /> {reel.likesCount || 340}
                  </span>
                </div>

                {/* Bottom Content: Title & Buy Button */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1.5 z-10">
                  <h3 className="text-white font-bold text-xs line-clamp-2 leading-snug drop-shadow-md">
                    {reel.title}
                  </h3>

                  {linkedProduct && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(linkedProduct, linkedProduct.variants[0]?.id || 'v1', 1);
                        setActivePage('checkout');
                      }}
                      className="w-full py-1 px-2 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-lg text-[10px] font-black flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
                    >
                      <ShoppingCart size={11} />
                      <span>Buy ৳{linkedProduct.price}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Reel Play Modal */}
      {activeModalReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-black rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col h-[80vh] max-h-[640px]">
            {/* Header bar */}
            <div className="p-3 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between z-20">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <h4 className="text-xs font-bold text-white truncate">{activeModalReel.title}</h4>
              </div>
              <button
                onClick={() => setActiveModalReel(null)}
                className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Container */}
            <div className="flex-1 w-full bg-black relative flex items-center justify-center">
              {formatVideoEmbed(activeModalReel.videoUrl)}
            </div>

            {/* Modal Bottom Action Bar */}
            {activeModalReel.productId && (
              <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-3 z-20">
                {(() => {
                  const p = products.find(prod => prod.id === activeModalReel.productId);
                  if (!p) return null;
                  return (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover border border-neutral-700 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{p.title}</div>
                          <div className="text-xs font-black text-[#D71920]">৳{p.price}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(p, p.variants[0]?.id || 'v1', 1);
                          setActiveModalReel(null);
                          setActivePage('checkout');
                        }}
                        className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                      >
                        <ShoppingCart size={13} />
                        <span>Order Now</span>
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
