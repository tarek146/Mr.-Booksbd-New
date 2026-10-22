import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';
import { BookPreviewPage, Product } from '../types';
import {
  computePageSlideNavigation,
  getEffectiveBookPreviewPages,
  toBanglaDigits,
} from '../utils/bookPreviewHelpers';
import { isValidImageUrl } from '../utils/imageCompressor';

interface BookPageReaderProps {
  product: Product;
}

type PaperTheme = 'cream' | 'sepia' | 'night';

export function BookPageReader({ product }: BookPageReaderProps) {
  const pages: BookPreviewPage[] = getEffectiveBookPreviewPages(product);
  const totalPages = pages.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('cream');
  const [fontScale, setFontScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const touchStartX = useRef<number | null>(null);

  // Reset to page 1 when switching products
  useEffect(() => {
    setCurrentIndex(0);
    setSlideDirection('next');
  }, [product.id]);

  const safeIndex = Math.max(0, Math.min(totalPages - 1, currentIndex));
  const currentPage = pages[safeIndex] || pages[0];

  const goToPage = (targetIndex: number) => {
    const nav = computePageSlideNavigation(safeIndex, targetIndex, totalPages);
    if (nav.direction !== 'none') {
      setSlideDirection(nav.direction);
      setCurrentIndex(nav.nextIndex);
    }
  };

  const handleNextPage = () => {
    if (safeIndex < totalPages - 1) {
      goToPage(safeIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (safeIndex > 0) {
      goToPage(safeIndex - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = touchStartX.current - endX;
    touchStartX.current = null;

    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0 && safeIndex < totalPages - 1) {
        handleNextPage();
      } else if (deltaX < 0 && safeIndex > 0) {
        handlePrevPage();
      }
    }
  };

  const themeStyles: Record<
    PaperTheme,
    {
      paperBg: string;
      textPrimary: string;
      textSecondary: string;
      border: string;
      headerBorder: string;
      badgeBg: string;
    }
  > = {
    cream: {
      paperBg: 'bg-gradient-to-br from-[#FFFDF7] via-[#FDFBF3] to-[#F7F2E4]',
      textPrimary: 'text-[#1F1A17]',
      textSecondary: 'text-[#6E6256]',
      border: 'border-[#E6DEC8]',
      headerBorder: 'border-[#EBE3CF]',
      badgeBg: 'bg-[#F5EFE0] text-[#5C4E3C]',
    },
    sepia: {
      paperBg: 'bg-gradient-to-br from-[#F8F1E0] via-[#F3E9D2] to-[#EADBC0]',
      textPrimary: 'text-[#2B2118]',
      textSecondary: 'text-[#6B5744]',
      border: 'border-[#DECBA8]',
      headerBorder: 'border-[#E3D3B4]',
      badgeBg: 'bg-[#E9DAC0] text-[#4A3828]',
    },
    night: {
      paperBg: 'bg-gradient-to-br from-[#181A20] via-[#14161B] to-[#101216]',
      textPrimary: 'text-[#E6E4DF]',
      textSecondary: 'text-[#9CA3AF]',
      border: 'border-[#2B303C]',
      headerBorder: 'border-[#252934]',
      badgeBg: 'bg-[#252934] text-[#D1D5DB]',
    },
  };

  const activeTheme = themeStyles[paperTheme];
  const hasValidPageImage =
    currentPage &&
    isValidImageUrl(currentPage.imageUrl) &&
    !failedImages[currentPage.id];

  const pageTurnVariants = {
    enter: (dir: 'next' | 'prev') => ({
      rotateY: dir === 'next' ? 24 : -24,
      x: dir === 'next' ? 56 : -56,
      scale: 0.97,
      opacity: 0,
    }),
    center: {
      rotateY: 0,
      x: 0,
      scale: 1,
      opacity: 1,
    },
    exit: (dir: 'next' | 'prev') => ({
      rotateY: dir === 'next' ? -26 : 26,
      x: dir === 'next' ? -56 : 56,
      scale: 0.97,
      opacity: 0,
    }),
  };

  const renderBookCanvas = (inModal = false) => (
    <div className="space-y-3">
      {/* Optional Admin "বই সম্পর্কে কিছু লেখা" (Book Intro Callout) */}
      {product.previewIntro && product.previewIntro.trim() && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF5F5] via-[#FFFDF9] to-[#FFF5F5] border border-[#D71920]/20 text-xs text-neutral-800 leading-relaxed shadow-2xs">
          <div className="flex items-center gap-1.5 font-black text-[#D71920] text-[11px] uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>বই সম্পর্কে কিছু কথা</span>
          </div>
          <p className="whitespace-pre-line text-neutral-700 font-medium leading-relaxed">
            {product.previewIntro}
          </p>
        </div>
      )}

      {/* Top Reader Toolbar: Page Tabs + Theme & Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-100/90 p-2 rounded-2xl border border-neutral-200/80">
        {/* Page Number Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {pages.map((p, idx) => {
            const isCurrent = idx === safeIndex;
            return (
              <button
                key={p.id || idx}
                type="button"
                onClick={() => goToPage(idx)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-[#D71920] text-white shadow-xs scale-102'
                    : 'bg-white text-neutral-700 hover:bg-[#FFF1F2] hover:text-[#D71920] border border-neutral-200'
                }`}
              >
                <BookOpen size={11} />
                <span>পৃষ্ঠা {toBanglaDigits(idx + 1)}</span>
              </button>
            );
          })}
        </div>

        {/* Paper Theme, Font Scale & Fullscreen Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Paper Theme Switcher */}
          <div className="flex items-center gap-1 bg-white px-1.5 py-1 rounded-xl border border-neutral-200">
            <button
              type="button"
              onClick={() => setPaperTheme('cream')}
              title="Cream Book Paper"
              aria-label="Cream Book Paper"
              className={`w-4 h-4 rounded-full bg-[#FDFBF3] border cursor-pointer transition-transform ${
                paperTheme === 'cream' ? 'ring-2 ring-[#D71920] scale-110 border-[#D71920]' : 'border-neutral-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setPaperTheme('sepia')}
              title="Classic Sepia Paper"
              aria-label="Classic Sepia Paper"
              className={`w-4 h-4 rounded-full bg-[#EADBC0] border cursor-pointer transition-transform ${
                paperTheme === 'sepia' ? 'ring-2 ring-[#D71920] scale-110 border-[#D71920]' : 'border-neutral-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setPaperTheme('night')}
              title="Night Reading Mode"
              aria-label="Night Reading Mode"
              className={`w-4 h-4 rounded-full bg-[#181A20] border cursor-pointer transition-transform ${
                paperTheme === 'night' ? 'ring-2 ring-[#D71920] scale-110 border-[#D71920]' : 'border-neutral-400'
              }`}
            />
          </div>

          {/* Zoom / Font Size Controls */}
          <div className="hidden sm:flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-xl border border-neutral-200">
            <button
              type="button"
              onClick={() => setFontScale(prev => Math.max(0.85, Number((prev - 0.1).toFixed(2))))}
              className="p-1 text-neutral-600 hover:text-[#D71920] cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              type="button"
              onClick={() => setFontScale(prev => Math.min(1.35, Number((prev + 0.1).toFixed(2))))}
              className="p-1 text-neutral-600 hover:text-[#D71920] cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!inModal)}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FFF1F2] text-neutral-800 hover:text-[#D71920] border border-neutral-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            {inModal ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{inModal ? 'ছোট করুন' : 'বড় করে পড়ুন'}</span>
          </button>
        </div>
      </div>

      {/* 3D Physical Book Frame with Spine & Stacked Paper Edges */}
      <div
        className="relative select-none"
        style={{ perspective: '1500px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative flex items-stretch rounded-2xl overflow-hidden shadow-[4px_0_0_#f3efe4,8px_0_0_#e5dfd0,12px_0_0_#d5cec0,0_16px_36px_rgba(0,0,0,0.14)] border border-[#D8CEB8]">
          {/* Left Hardcover Book Spine Binding */}
          <div className="w-3 sm:w-4 bg-gradient-to-r from-[#7A0E13] via-[#D71920] to-[#8F1016] shrink-0 relative flex flex-col justify-between py-6 items-center">
            <div className="w-full h-[2px] bg-amber-300/60" />
            <div className="w-[1px] flex-1 my-2 bg-white/20" />
            <div className="w-full h-[2px] bg-amber-300/60" />
          </div>

          {/* Animated Book Page Surface */}
          <div className={`relative flex-1 overflow-hidden ${activeTheme.paperBg}`}>
            {/* Realistic Inner Book Spine Crease Shadow on Left */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 z-10"
              style={{
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 35%, rgba(0,0,0,0) 100%)',
              }}
            />

            {/* Top-Right Hanging Bookmark Ribbon */}
            <div className="pointer-events-none absolute top-0 right-5 sm:right-7 z-20">
              <div className="bg-gradient-to-b from-[#D71920] to-[#9E1116] text-white text-[9px] font-black px-2 py-1.5 rounded-b-lg shadow-md flex items-center gap-1 tracking-wide">
                <span>📖 পৃষ্ঠা {toBanglaDigits(safeIndex + 1)}/{toBanglaDigits(totalPages)}</span>
              </div>
            </div>

            {/* Side Floating Page Turn Buttons (Left / Right) */}
            {safeIndex > 0 && (
              <button
                type="button"
                onClick={handlePrevPage}
                aria-label="আগের পৃষ্ঠা"
                title="আগের পৃষ্ঠা (Previous Page)"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-[#D71920] text-neutral-800 hover:text-white border border-neutral-300 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {safeIndex < totalPages - 1 && (
              <button
                type="button"
                onClick={handleNextPage}
                aria-label="পরের পৃষ্ঠা"
                title="পরের পৃষ্ঠা (Next Page)"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-[#D71920] text-neutral-800 hover:text-white border border-neutral-300 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            )}

            {/* Page Flip / Slide Animated Container */}
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={currentPage?.id || `page-${safeIndex}`}
                custom={slideDirection}
                variants={pageTurnVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformOrigin: 'left center' }}
                className={`px-6 sm:px-11 py-5 sm:py-7 ${
                  inModal ? 'min-h-[460px] sm:min-h-[560px]' : 'min-h-[300px] sm:min-h-[360px]'
                } flex flex-col justify-between`}
              >
                {/* Book Page Running Header */}
                <div>
                  <div
                    className={`flex items-center justify-between gap-2 pb-2.5 mb-4 border-b ${activeTheme.headerBorder} pr-16`}
                  >
                    <span className={`text-[11px] font-bold truncate ${activeTheme.textSecondary}`}>
                      {product.title} {product.author ? `• ${product.author}` : ''}
                    </span>
                  </div>

                  {/* Page Chapter / Section Title */}
                  {currentPage?.title && (
                    <div className="mb-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${activeTheme.badgeBg}`}
                      >
                        <FileText size={11} />
                        <span>{currentPage.title}</span>
                      </span>
                    </div>
                  )}

                  {/* Page Body: Either Uploaded PDF/Image Page OR Formatted Literary Text Page */}
                  {hasValidPageImage ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden bg-white border border-neutral-200/80 shadow-xs flex items-center justify-center p-1.5 sm:p-2">
                        <img
                          src={currentPage.imageUrl}
                          alt={currentPage.title || `${product.title} - Page ${safeIndex + 1}`}
                          onError={() =>
                            setFailedImages(prev => ({ ...prev, [currentPage.id]: true }))
                          }
                          style={{
                            transform: `scale(${fontScale})`,
                            transformOrigin: 'top center',
                          }}
                          className={`${
                            inModal ? 'max-h-[62vh]' : 'max-h-[380px] sm:max-h-[440px]'
                          } w-auto object-contain rounded-lg transition-transform duration-200`}
                        />
                      </div>

                      {currentPage.content && currentPage.content.trim() && (
                        <p
                          style={{ fontSize: `${Math.round(13.5 * fontScale)}px` }}
                          className={`leading-[1.85] whitespace-pre-line font-medium ${activeTheme.textPrimary} pt-1`}
                        >
                          {currentPage.content}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-1">
                      <div
                        style={{ fontSize: `${Math.round(14 * fontScale)}px` }}
                        className={`leading-[1.9] whitespace-pre-line font-serif tracking-wide ${activeTheme.textPrimary}`}
                      >
                        {currentPage?.content || 'পৃষ্ঠার তথ্য লোড হচ্ছে...'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Classic Book Page Footer */}
                <div
                  className={`mt-6 pt-3 border-t ${activeTheme.headerBorder} flex items-center justify-between text-[11px] ${activeTheme.textSecondary}`}
                >
                  <span className="font-semibold">
                    {product.publisher || 'MR. BOOKS Authentic Preview'}
                  </span>
                  <span className="font-black tracking-widest">
                    — পৃষ্ঠা {toBanglaDigits(safeIndex + 1)} —
                  </span>
                  <span className="text-[10px] font-bold text-[#D71920]">
                    {safeIndex < totalPages - 1 ? 'স্লাইড করুন →' : 'প্রিভিউ সমাপ্ত'}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Page Slider & Prev/Next Bar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={safeIndex <= 0}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF1F2] disabled:opacity-40 disabled:pointer-events-none text-neutral-800 hover:text-[#D71920] border border-neutral-200 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-95"
        >
          <ChevronLeft size={15} />
          <span>আগের পৃষ্ঠা</span>
        </button>

        {/* Page Indicator Dots */}
        <div className="flex items-center gap-1.5">
          {pages.map((p, idx) => (
            <button
              key={p.id || idx}
              type="button"
              onClick={() => goToPage(idx)}
              aria-label={`Go to page ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === safeIndex
                  ? 'w-6 bg-[#D71920]'
                  : 'w-2 bg-neutral-300 hover:bg-neutral-400'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={safeIndex >= totalPages - 1}
          className="px-3.5 py-2 rounded-xl bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
        >
          <span>পরের পৃষ্ঠা</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {renderBookCanvas(false)}

      {/* Fullscreen Book Reader Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center shrink-0 border border-[#D71920]/20">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base text-neutral-900 truncate">
                    {product.title} — একটু পড়ে দেখুন
                  </h3>
                  <p className="text-[11px] text-neutral-500 truncate">
                    পৃষ্ঠা স্লাইড করে বইটির ভেতরের অংশ পড়ুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                aria-label="Close Fullscreen Reader"
                className="p-2 rounded-xl bg-neutral-100 hover:bg-[#FFF1F2] text-neutral-600 hover:text-[#D71920] cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {renderBookCanvas(true)}
          </div>
        </div>
      )}
    </>
  );
}
