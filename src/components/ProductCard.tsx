import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import {
  Star,
  ShoppingBag,
  Heart,
  Zap,
  ShieldCheck,
  ThumbsUp,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Building2,
} from 'lucide-react';
import { resolveProductDetailsPresentation } from '../utils/storeEnhancementsHelpers';

interface ProductCardProps {
  product: Product;
}

export function renderGreenReviewIcon(
  style: string | undefined,
  size: number = 12
) {
  switch (style || 'heart') {
    case 'verified_shield':
      return <ShieldCheck size={size} className="text-emerald-600 shrink-0" />;
    case 'thumbs_up':
      return <ThumbsUp size={size} fill="currentColor" className="text-emerald-600 shrink-0" />;
    case 'check_badge':
      return <CheckCircle2 size={size} className="text-emerald-600 shrink-0" />;
    case 'sparkles':
      return <Sparkles size={size} fill="currentColor" className="text-emerald-600 shrink-0" />;
    case 'book_love':
      return <BookOpen size={size} className="text-emerald-600 shrink-0" />;
    case 'star':
      return <Star size={size} fill="currentColor" className="text-emerald-600 shrink-0" />;
    case 'heart':
    default:
      return <Heart size={size} fill="currentColor" className="text-emerald-600 shrink-0" />;
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { setActivePage, addToCart, wishlist, toggleWishlist, settings, siteSettings } = useStore();
  const isWishlisted = wishlist.includes(product.id);

  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Auto slideshow rotation between product images if multiple
  useEffect(() => {
    if (!product.images || product.images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImgIdx(prev => (prev + 1) % product.images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [product.images]);

  // Auto rotation between print variants (Paperback / Hardcover / Premium Print) every 3.5 seconds
  useEffect(() => {
    if (!product.variants || product.variants.length <= 1) return;
    const timer = setInterval(() => {
      setVariantIdx(prev => (prev + 1) % product.variants.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [product.variants]);

  const discountPercent = product.previousPrice && product.previousPrice > product.price
    ? Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)
    : 0;

  const currentVariant = product.variants[0] || { id: 'v1', name: 'Standard', price: product.price, stock: product.stock, sku: product.sku };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 15;
  const skeletonAnimClass = settings.skeletonAnimationStyle === 'pulse' ? 'skeleton-pulse' : 'skeleton-shimmer';

  const handleOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, currentVariant.id, 1);
    setActivePage('cart');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, currentVariant.id, 1);
  };

  return (
    <div 
      data-testid="product-card"
      onClick={() => setActivePage('product-detail', product.id)}
      className="bg-white rounded-2xl border border-neutral-200/90 hover:border-[#D71920]/40 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group h-full select-none cursor-pointer active:scale-[0.98]"
    >
      {/* 1:1 Perfectly Square-Rounded Image Thumbnail Box */}
      <div className="p-2 sm:p-2.5 shrink-0">
        <div className="w-full aspect-square relative bg-[#F8F9FA] rounded-xl p-2 flex items-center justify-center overflow-hidden border border-neutral-100">
          {!imgLoaded && settings.enableSkeletonLoading !== false && (
            <div
              aria-hidden="true"
              className={`absolute inset-0 ${skeletonAnimClass} z-0`}
            />
          )}
          <img 
            src={product.images[currentImgIdx] || product.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'} 
            alt={product.title || 'Product'}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              setImgLoaded(true);
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
            }}
            className="relative z-1 h-full w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform duration-300 ease-out"
          />

          {/* Top-Left: Status Badges (Low Stock / Out of Stock / NEW / Discount) */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
            {isOutOfStock ? (
              <span className="bg-red-600 text-white font-extrabold text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-2xs">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="bg-[#E65100] text-white font-extrabold text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-2xs">
                Low Stock
              </span>
            ) : null}

            {discountPercent > 0 ? (
              <span className="bg-[#D71920] text-white font-extrabold text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-2xs">
                {discountPercent}% OFF
              </span>
            ) : null}
          </div>

          {/* Top-Right: Auto-Rotating Edition/Print Badge */}
          <div className="absolute top-1.5 right-1.5 z-10 pointer-events-none">
             <span className="bg-neutral-900/90 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs border border-white/20 transition-all duration-300 truncate flex items-center gap-1">
              {product.variants && product.variants.length > 0 
                ? product.variants[variantIdx % product.variants.length]?.name 
                : (product.edition || 'Paperback')}
            </span>
          </div>

          {/* Bottom-Right: "অরিজিনাল বই" / "অরিজিনাল প্রোডাক্ট" Badge */}
          <div className="absolute bottom-1.5 right-1.5 z-10 pointer-events-none">
            {product.isOriginalBadge !== false && (
              <span className="bg-[#D71920] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm border border-white/20 flex items-center gap-0.5 shrink-0">
                <ShieldCheck size={10} className="text-white shrink-0" />
                <span>{resolveProductDetailsPresentation(product).cardBadgeLabel}</span>
              </span>
            )}
          </div>

          {/* Top-Right Heart Wishlist Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
            className={`absolute top-8 right-1.5 w-7 h-7 rounded-full shadow-2xs transition-all cursor-pointer border z-10 flex items-center justify-center ${
              isWishlisted 
                ? 'bg-[#D71920] text-white border-[#D71920] scale-105' 
                : 'bg-white/95 backdrop-blur-xs border-neutral-200 text-neutral-400 hover:text-[#D71920] hover:bg-white'
            }`}
            aria-label="Add to wishlist"
          >
            <Heart size={12} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Compact Native-App Product Content Body */}
      <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 flex-1 flex flex-col justify-between space-y-1.5 bg-white">
        <div>
          {/* Unit / Type Tag & Configurable Green Review / Replacement Slot */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1 gap-1">
            <span className="text-[#2979FF] font-semibold bg-blue-50 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] shrink-0">
              {product.type === 'book' ? 'Book' : 'Item'}
            </span>

            {(() => {
              if (siteSettings.reviewDisplay === false) return null;
              const cardMode =
                settings.showHomeReviewsSection === false && !settings.productCardReviewSlotMode
                  ? 'off'
                  : settings.productCardReviewSlotMode || 'green_rating';

              if (cardMode === 'off') return null;

              if (cardMode === 'publisher_tag') {
                return (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded truncate max-w-[115px]">
                    <Building2 size={9} className="text-emerald-600 shrink-0" />
                    <span className="truncate">{product.publisher || product.brand || 'Official'}</span>
                  </span>
                );
              }

              if (cardMode === 'verified_badge') {
                return (
                  <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded shrink-0">
                    <ShieldCheck size={10} className="text-emerald-600 shrink-0" />
                    <span>Verified Print</span>
                  </span>
                );
              }

              if (cardMode === 'stock_status') {
                return (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      product.stock > 0
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
                        : 'text-red-600 bg-red-50 border border-red-200'
                    }`}
                  >
                    <CheckCircle2 size={9} className="shrink-0" />
                    <span>{product.stock > 0 ? `In Stock (${product.stock})` : 'Out'}</span>
                  </span>
                );
              }

              return (
                <div
                  data-testid="product-card-green-review"
                  className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50/80 border border-emerald-200/70 px-1.5 py-0.5 rounded-md"
                >
                  {renderGreenReviewIcon(settings.homeReviewIconStyle, 10)}
                  <span className="text-emerald-700 font-extrabold text-[10px] sm:text-xs">
                    {product.rating}
                  </span>
                  <span className="text-emerald-600/80 font-semibold text-[9px]">
                    ({product.reviewCount})
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Title - Strictly Truncated to 1 Single Line */}
          <h3 
            className="font-bold text-[#171717] text-xs sm:text-sm truncate cursor-pointer group-hover:text-[#D71920] transition-colors leading-snug"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Configurable Writer / Author Slot (Show Writer, Replace with another feature, or Turn Off) */}
          {(() => {
            if (siteSettings.authorInfo === false) return null;
            const writerSlotMode = settings.productCardWriterSlotMode || 'writer_name';
            if (writerSlotMode === 'off') return null;

            if (writerSlotMode === 'publisher_name') {
              return (
                <p
                  data-testid="product-card-writer-slot"
                  className="text-[10px] sm:text-[11px] text-neutral-500 truncate mt-0.5"
                >
                  {product.publisher || product.brand || product.category}
                </p>
              );
            }

            if (writerSlotMode === 'category_name') {
              return (
                <p
                  data-testid="product-card-writer-slot"
                  className="text-[10px] sm:text-[11px] text-neutral-500 truncate mt-0.5"
                >
                  {product.category}
                </p>
              );
            }

            if (writerSlotMode === 'edition_info') {
              return (
                <p
                  data-testid="product-card-writer-slot"
                  className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold truncate mt-0.5"
                >
                  {product.edition || currentVariant.name || 'Paperback'} • Original Print
                </p>
              );
            }

            if (writerSlotMode === 'delivery_badge') {
              return (
                <p
                  data-testid="product-card-writer-slot"
                  className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold truncate mt-0.5"
                >
                  ✓ Fast Cash on Delivery
                </p>
              );
            }

            return (
              <p
                data-testid="product-card-writer-slot"
                className="text-[10px] sm:text-[11px] text-neutral-500 truncate mt-0.5"
              >
                {product.type === 'book'
                  ? product.author || product.category
                  : product.brand || product.category}
              </p>
            );
          })()}
        </div>

        {/* Pricing & Native Buttons Row */}
        <div>
          <div className="flex items-center justify-between pt-1 border-t border-neutral-100/90 mb-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-[#171717] tabular-nums">৳{product.price}</span>
              {product.previousPrice && product.previousPrice > product.price && (
                <span className="text-[9px] sm:text-[10px] text-neutral-400 line-through tabular-nums">৳{product.previousPrice}</span>
              )}
            </div>

            {isOutOfStock ? (
              <span className="bg-red-50 text-red-600 font-bold text-[8px] sm:text-[9px] px-1 py-0.5 rounded">
                Out
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-700 font-bold text-[8px] sm:text-[9px] px-1 py-0.5 rounded">
                In Stock
              </span>
            )}
          </div>

          {/* Dual Action Buttons (⚡ Order & 🛒 Cart) */}
          {isOutOfStock ? (
            <button 
              disabled 
              className="w-full py-1 bg-neutral-100 text-neutral-400 font-bold text-[10px] rounded-lg flex items-center justify-center cursor-not-allowed border border-neutral-200"
            >
              Out of Stock
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              <button 
                onClick={handleOrderNow}
                className="bg-[#D71920] hover:bg-[#C5161C] text-white py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-0.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Order Immediately"
              >
                <Zap size={11} />
                <span>Order</span>
              </button>

              <button 
                onClick={handleAddToCart}
                className="border border-[#D71920] text-[#D71920] hover:bg-[#FFF1F2] py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer"
                title="Add to Cart"
              >
                <ShoppingBag size={11} />
                <span>Cart</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
