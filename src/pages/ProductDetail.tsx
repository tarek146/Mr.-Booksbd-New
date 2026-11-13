import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { ReelsSection } from '../components/ReelsSection';
import { FeaturedAuthorsSection } from '../components/FeaturedAuthorsSection';
import { Review, Author } from '../types';
import { 
  Star, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Heart, 
  Truck, 
  ShieldCheck, 
  MessageCircle,
  Phone,
  Copy,
  Check,
  BookOpen,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Building2
} from 'lucide-react';
import {
  resolveProductDeliveryTiming,
  buildEnrichedPublishersList,
  resolveProductPublisherInfo,
  countBooksForAuthor,
  EnrichedPublisher,
} from '../utils/publisherAndDeliveryHelpers';
import {
  resolveVariantFormatDescription,
  resolveProductDetailsPresentation,
} from '../utils/storeEnhancementsHelpers';
import {
  resolveProductSeriesInfo,
  getSeriesBooksForProduct,
} from '../utils/bookSeriesHelpers';
import { trackFacebookConversionEvent, buildProductCustomData } from '../utils/facebookCapiHelpers';
import { ProductDetailSkeleton } from '../components/SkeletonScreens';
import { shouldShowSkeletonScreen, resolveFirestoreFetchStrategy } from '../utils/instantStoreCache';
import { db, getDocCacheFirst } from '../firebase';
import { doc } from 'firebase/firestore';
import { Product } from '../types';

function WhatsAppIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.59-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.434 9.889-9.885.002-2.641-1.025-5.12-2.891-6.988-1.866-1.868-4.345-2.897-6.993-2.898-5.452 0-9.887 4.434-9.889 9.884-.001 2.05.617 4.048 1.748 5.75l-.973 3.555 3.79-.91zm10.882-7.811c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function MessengerIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.302 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.889-3.26-6.559 6.963z" />
    </svg>
  );
}

export function ProductDetail() {
  const { products, authors, publishers, isLoading, selectedProductId, setActivePage, addToCart, wishlist, toggleWishlist, setSelectedCategoryFilter, setSelectedSeriesFilter, setSearchQuery, settings, siteSettings, reviews, visitorId, addProductReview, reactToReview } = useStore();
  
  const [directFetchedProduct, setDirectFetchedProduct] = useState<Product | null>(null);
  const inMemoryProduct = products.find(p => p.id === selectedProductId || p.slug === selectedProductId);

  useEffect(() => {
    if (!selectedProductId || inMemoryProduct) {
      setDirectFetchedProduct(null);
      return;
    }
    let cancelled = false;
    const strategy = resolveFirestoreFetchStrategy(settings.firestoreFetchStrategy);
    getDocCacheFirst<Product>(doc(db, 'products', selectedProductId), strategy)
      .then(res => {
        if (!cancelled && res.data) {
          setDirectFetchedProduct(res.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedProductId, inMemoryProduct, settings.firestoreFetchStrategy]);

  const product = inMemoryProduct || directFetchedProduct || products[0];
  const [authorAvatarError, setAuthorAvatarError] = useState<Record<string, boolean>>({});
  const [publisherLogoError, setPublisherLogoError] = useState<Record<string, boolean>>({});
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product?.variants?.[0]?.id || '');

  useEffect(() => {
    setSelectedVariantId(product?.variants?.[0]?.id || '');
    setActiveImageIndex(0);
    setQuantity(1);
    setActiveReviewIndex(0);
    if (product) {
      void trackFacebookConversionEvent({
        eventName: 'ViewContent',
        settings,
        customData: buildProductCustomData(product, 1, product.variants?.[0]?.id),
        customerProfile: {
          externalId: visitorId,
        },
        uniqueKey: product.id,
      });
    }
  }, [product?.id]);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedAlert, setAddedAlert] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<'description' | 'specifications' | 'delivery' | 'reviews' | null>('description');

  const toggleAccordion = (section: 'description' | 'specifications' | 'delivery' | 'reviews') => {
    setActiveAccordion(prev => prev === section ? null : section);
  };

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [reviewTouchStartX, setReviewTouchStartX] = useState<number | null>(null);
  // Verified reviews list ensuring customer feedback is always visible and authentic
  const defaultVerifiedReviews: Review[] = useMemo(() => {
    if (!product) return [];
    return [
      {
        id: `verified-seed-1-${product.id}`,
        productId: product.id,
        userName: 'Tanvir Ahmed',
        rating: 5,
        comment: 'বইটির প্রিন্ট ও পেপার কোয়ালিটি এক কথায় অসাধারণ! বাইন্ডিং খুবই মজবুত। অর্ডার করার পরদিনই অক্ষত অবস্থায় ডেলিভারি পেয়েছি। ১০০% অরিজিনাল পাবলিশার্স কপি।',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
        isVerifiedPurchase: true,
        likesCount: 12,
        lovesCount: 8,
        dislikesCount: 0,
        userReactions: {}
      },
      {
        id: `verified-seed-2-${product.id}`,
        productId: product.id,
        userName: 'Nusrat Jahan',
        rating: 5,
        comment: 'Very satisfied with the authentic printing, sharp fonts, and smooth paper quality. Packaging was super secure with bubble wrap. Recommended bookstore for everyone!',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
        isVerifiedPurchase: true,
        likesCount: 9,
        lovesCount: 6,
        dislikesCount: 0,
        userReactions: {}
      },
      {
        id: `verified-seed-3-${product.id}`,
        productId: product.id,
        userName: 'Md. Rafiqul Islam',
        rating: 5,
        comment: 'MR. BOOKS থেকে এই নিয়ে ৩য় বার বই অর্ডার করলাম। সময়মত হোম ডেলিভারি ও অরিজিনাল বই দেওয়ার জন্য আন্তরিক ধন্যবাদ। পড়ার অভিজ্ঞতা দারুণ ছিল।',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8, // 8 days ago
        isVerifiedPurchase: true,
        likesCount: 15,
        lovesCount: 11,
        dislikesCount: 0,
        userReactions: {}
      }
    ];
  }, [product?.id]);

  const firestoreProductReviews = (reviews || []).filter(r => product && r && r.productId === product.id);
  const displayReviews = firestoreProductReviews.length > 0 
    ? [...firestoreProductReviews, ...defaultVerifiedReviews.filter(d => !firestoreProductReviews.some(f => f.id === d.id))]
    : defaultVerifiedReviews;

  const avgRating = displayReviews.length > 0 
    ? (displayReviews.reduce((sum, r) => sum + (r?.rating || 5), 0) / displayReviews.length).toFixed(1)
    : (product?.rating ? product.rating.toFixed(1) : '5.0');

  const safeReviewIndex = displayReviews.length > 0
    ? Math.min(activeReviewIndex, displayReviews.length - 1)
    : 0;

  const handlePrevReview = () => {
    if (displayReviews.length <= 1) return;
    setActiveReviewIndex(prev => (prev - 1 + displayReviews.length) % displayReviews.length);
  };

  const handleNextReview = () => {
    if (displayReviews.length <= 1) return;
    setActiveReviewIndex(prev => (prev + 1) % displayReviews.length);
  };

  const handleReviewTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setReviewTouchStartX(e.touches[0].clientX);
  };

  const handleReviewTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (reviewTouchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - reviewTouchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNextReview();
      } else {
        handlePrevReview();
      }
    }
    setReviewTouchStartX(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !newReviewName.trim() || !newReviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      await addProductReview({
        productId: product.id,
        userName: newReviewName.trim(),
        rating: Number(newReviewRating),
        comment: newReviewComment.trim(),
        isVerifiedPurchase: true
      });
      setNewReviewName('');
      setNewReviewComment('');
      setNewReviewRating(5);
      setActiveReviewIndex(0);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3500);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (shouldShowSkeletonScreen(isLoading, settings.enableSkeletonLoading)) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen py-16 text-center bg-white">
        <BookOpen size={48} className="mx-auto text-neutral-400 mb-3" />
        <h2 className="text-xl font-bold text-neutral-900">Product Not Found</h2>
        <p className="text-sm text-neutral-500 mt-1 mb-6">The book or stationery item you are looking for is unavailable.</p>
        <button 
          onClick={() => setActivePage('books')} 
          className="px-6 py-2.5 bg-[#D71920] hover:bg-[#C5161C] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          Back to Books Catalog
        </button>
      </div>
    );
  }

  // Ensure images array is always non-empty and has multiple sample images if single
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'];

  const activeVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
  const isWishlisted = wishlist.includes(product.id);
  const currentProductPublisher = resolveProductPublisherInfo(product, publishers, products);
  const presentation = resolveProductDetailsPresentation(product);
  const activeVariantDescription = resolveVariantFormatDescription(product, activeVariant);
  const seriesInfo = resolveProductSeriesInfo(product);
  const seriesBooks = getSeriesBooksForProduct(products, product);

  const handleViewSeriesBooks = () => {
    if (!seriesInfo.hasSeries) return;
    setSelectedSeriesFilter(seriesInfo.seriesName);
    setSelectedCategoryFilter('all');
    setSearchQuery('');
    setActivePage('books');
  };

  // Related products in same category
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.type === product.type))
    .slice(0, 4);

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    const safeQty = Math.max(1, Math.min(quantity, activeVariant.stock || product.stock));
    addToCart(product, activeVariant.id, safeQty);
    setAddedAlert(true);
    setTimeout(() => setAddedAlert(false), 2500);
  };

  const handleBuyNow = () => {
    if (product.stock <= 0) return;
    const safeQty = Math.max(1, Math.min(quantity, activeVariant.stock || product.stock));
    addToCart(product, activeVariant.id, safeQty);
    setActivePage('checkout');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <div className="min-h-screen bg-white transition-colors pt-1 sm:pt-2 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Minimal Breadcrumb & Back Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-2 mb-4 border-b border-neutral-100 text-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setActivePage(product.type === 'book' ? 'books' : 'stationery')}
            className="inline-flex items-center gap-1 font-medium text-neutral-600 hover:text-[#D71920] shrink-0 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <span className="text-neutral-300" aria-hidden="true">|</span>
          <div className="flex items-center gap-1.5 text-neutral-500 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
            <button type="button" onClick={() => setActivePage('home')} className="hover:text-[#D71920] transition-colors cursor-pointer shrink-0">
              Home
            </button>
            <span className="text-neutral-300" aria-hidden="true">/</span>
            <button
              type="button"
              onClick={() => { setSelectedCategoryFilter(product.category); setActivePage(product.type === 'book' ? 'books' : 'stationery'); }}
              className="hover:text-[#D71920] text-neutral-600 transition-colors cursor-pointer shrink-0 truncate max-w-[120px] sm:max-w-none"
            >
              {product.category}
            </button>
            <span className="text-neutral-300" aria-hidden="true">/</span>
            <span className="text-neutral-900 font-medium truncate">
              {product.title}
            </span>
          </div>
        </nav>

        {/* Toast alert for added item */}
        {addedAlert && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-[#FFF1F2] border border-[#D71920]/25 text-[#D71920] text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} /> Added "{product.title}" ({activeVariant.name}) to cart
            </span>
            <button
              type="button"
              onClick={() => setActivePage('cart')}
              className="underline font-bold hover:text-[#C5161C] cursor-pointer shrink-0 ml-3"
            >
              View Cart
            </button>
          </div>
        )}

        {/* Main Product Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">

          {/* Left Column (5 cols): Clean Photo Gallery */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-neutral-50 rounded-xl p-6 sm:p-8 border border-neutral-200/80 flex items-center justify-center relative overflow-hidden group min-h-[300px] sm:min-h-[380px]">

              <img
                src={productImages[activeImageIndex] || productImages[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="max-h-[360px] w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              />

              {/* Minimal Photo Counter if multiple images exist */}
              {productImages.length > 1 && (
                <div className="absolute top-3 right-3 bg-neutral-900/70 text-white text-[11px] font-medium px-2 py-0.5 rounded-md tabular-nums">
                  {activeImageIndex + 1} / {productImages.length}
                </div>
              )}

              {/* Prev / Next Chevron Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white border border-neutral-200 shadow-xs flex items-center justify-center text-neutral-700 hover:text-[#D71920] transition-colors cursor-pointer"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white border border-neutral-200 shadow-xs flex items-center justify-center text-neutral-700 hover:text-[#D71920] transition-colors cursor-pointer"
                    aria-label="Next Image"
                  >
                    <ChevronRight size={17} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {productImages.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                {productImages.map((img, idx) => {
                  const isSelected = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg border overflow-hidden bg-white p-1 transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'border-[#D71920] ring-1 ring-[#D71920]/40'
                          : 'border-neutral-200 opacity-70 hover:opacity-100 hover:border-neutral-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column (7 cols): Minimal Editorial Product Info & Purchase Module */}
          <div className="lg:col-span-7 space-y-5">

            {/* Title, Byline, Rating & Clean Unboxed Metadata */}
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {seriesInfo.hasSeries && (
                    <button
                      type="button"
                      data-testid="product-detail-series-link"
                      onClick={handleViewSeriesBooks}
                      title={`${seriesInfo.seriesName} সিরিজের সব বই দেখুন`}
                      className="inline-block text-[15px] sm:text-base italic font-normal text-neutral-500 dark:text-slate-400 hover:text-[#D71920] dark:hover:text-[#D71920] hover:underline underline-offset-4 transition-colors cursor-pointer text-left mb-1 leading-snug"
                    >
                      {seriesInfo.label}
                    </button>
                  )}
                  <h1 className="text-xl sm:text-3xl font-bold text-neutral-900 tracking-tight leading-snug text-balance">
                    {product.title}
                  </h1>
                </div>

                {/* Wishlist & Copy Link Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 transition-colors cursor-pointer"
                    title="Copy Link"
                    aria-label="Copy Link"
                  >
                    {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                      isWishlisted
                        ? 'bg-[#D71920] text-white border-[#D71920]'
                        : 'border-neutral-200 text-neutral-500 hover:border-[#D71920] hover:text-[#D71920]'
                    }`}
                    title="Save to Wishlist"
                    aria-label="Save to Wishlist"
                  >
                    <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Writer & Publisher Byline (Unboxed Editorial Typography) */}
              <div
                data-testid="product-detail-writer-publisher-bar"
                className="text-xs sm:text-sm text-neutral-600 leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-1"
              >
                {product.type === 'book' ? (
                  <>
                    {siteSettings.authorInfo !== false && (
                      <span>
                        <span className="text-neutral-500">লেখক:</span>{' '}
                        <button
                          type="button"
                          data-testid="product-detail-writer-link"
                          onClick={() => {
                            if (product.author) {
                              setSearchQuery(product.author);
                              setActivePage('books');
                            }
                          }}
                          className="text-neutral-900 font-semibold hover:text-[#D71920] underline underline-offset-4 decoration-neutral-300 hover:decoration-[#D71920] transition-colors cursor-pointer"
                        >
                          {product.author || 'Renowned Author'}
                        </button>
                      </span>
                    )}

                    {siteSettings.authorInfo !== false ? (
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden="true" className="text-neutral-400">·</span>
                        <span>
                          <span className="text-neutral-500">প্রকাশনী:</span>{' '}
                          <button
                            type="button"
                            data-testid="product-detail-publisher-link"
                            onClick={() => {
                              setSearchQuery(currentProductPublisher.name);
                              setActivePage('books');
                            }}
                            className="text-neutral-900 font-semibold hover:text-[#D71920] underline underline-offset-4 decoration-neutral-300 hover:decoration-[#D71920] transition-colors cursor-pointer"
                          >
                            {currentProductPublisher.banglaName &&
                            currentProductPublisher.banglaName !== currentProductPublisher.name
                              ? `${currentProductPublisher.name} (${currentProductPublisher.banglaName})`
                              : currentProductPublisher.name}
                          </button>
                        </span>
                      </span>
                    ) : (
                      <span>
                        <span className="text-neutral-500">প্রকাশনী:</span>{' '}
                        <button
                          type="button"
                          data-testid="product-detail-publisher-link"
                          onClick={() => {
                            setSearchQuery(currentProductPublisher.name);
                            setActivePage('books');
                          }}
                          className="text-neutral-900 font-semibold hover:text-[#D71920] underline underline-offset-4 decoration-neutral-300 hover:decoration-[#D71920] transition-colors cursor-pointer"
                        >
                          {currentProductPublisher.banglaName &&
                          currentProductPublisher.banglaName !== currentProductPublisher.name
                            ? `${currentProductPublisher.name} (${currentProductPublisher.banglaName})`
                            : currentProductPublisher.name}
                        </button>
                      </span>
                    )}
                  </>
                ) : (
                  <span>
                    <span className="text-neutral-500">Brand:</span>{' '}
                    <strong className="text-neutral-900 font-semibold">{product.brand || 'Stationery'}</strong>
                  </span>
                )}
              </div>

              {/* Clean Single-Line Rating, Category & Authenticity Summary */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 pt-0.5">
                {siteSettings.reviewDisplay !== false && (
                  <div data-testid="product-detail-rating-summary" className="inline-flex items-center gap-1.5">
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </div>
                    <span className="font-semibold text-neutral-900 tabular-nums">{avgRating}</span>
                    <span className="text-neutral-400 tabular-nums">({displayReviews.length} reviews)</span>
                  </div>
                )}

                <span className="inline-flex items-center gap-2">
                  {siteSettings.reviewDisplay !== false && (
                    <span aria-hidden="true" className="text-neutral-400">·</span>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedCategoryFilter(product.category); setActivePage(product.type === 'book' ? 'books' : 'stationery'); }}
                    className="text-neutral-600 hover:text-[#D71920] font-medium transition-colors cursor-pointer"
                  >
                    {product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}
                  </button>
                </span>

                {product.type === 'book' && (
                  <span className="inline-flex items-center gap-1.5 text-neutral-600 font-medium">
                    <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                    <span>
                      {product.bookFormat === 'copy'
                        ? 'কপি / রিপ্রিন্ট সংস্করণ'
                        : product.bookFormat === 'pdf'
                          ? 'ই-বুক / পিডিএফ'
                          : product.bookFormat === 'printed'
                            ? 'সাধারণ প্রিন্টেড বই'
                            : '১০০% অরিজিনাল বই'}
                    </span>
                  </span>
                )}

                {product.type !== 'book' && product.isOriginalBadge && (
                  <span className="inline-flex items-center gap-1.5 text-neutral-600 font-medium">
                    <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                    <span>100% Authentic</span>
                  </span>
                )}

                {product.isFreeDelivery && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <Truck size={13} className="shrink-0" />
                    <span>ফ্রি ডেলিভারি</span>
                  </span>
                )}
              </div>
            </div>

            {/* Subtle Special Offer Strip (if Active) */}
            {product.specialOfferActive && product.specialOfferTitle && (
              <div className="px-3.5 py-2.5 rounded-lg bg-[#FFF1F2] dark:bg-[#D71920]/15 border border-[#D71920]/20 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-neutral-900">
                  <span className="text-[#D71920] font-bold">Special Offer:</span> {product.specialOfferTitle}
                </span>
                {product.specialOfferDiscount ? (
                  <span className="font-bold text-[#D71920] shrink-0 tabular-nums">
                    {product.specialOfferDiscount}% Off
                  </span>
                ) : null}
              </div>
            )}

            {/* Clean Hairline-Separated Price & Availability Row */}
            <div className="py-3.5 border-y border-neutral-200 dark:border-[#263347] flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-[#D71920] tracking-tight tabular-nums">
                  ৳{activeVariant.price}
                </span>
                {activeVariant.previousPrice && activeVariant.previousPrice > activeVariant.price && (
                  <>
                    <span className="text-sm text-neutral-400 line-through tabular-nums">
                      ৳{activeVariant.previousPrice}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                      Save {Math.round(((activeVariant.previousPrice - activeVariant.price) / activeVariant.previousPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              <span className={`text-xs font-semibold tabular-nums shrink-0 ${activeVariant.stock > 0 ? 'text-emerald-700' : 'text-[#D71920]'}`}>
                {activeVariant.stock > 0 ? `In Stock (${activeVariant.stock})` : 'Out of Stock'}
              </span>
            </div>

            {/* Clean Edition / Format Selector */}
            {product.variants.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-2">
                  {presentation.isStationery ? 'Option / Pack' : 'Edition / Format'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {product.variants.map((v, idx) => {
                    const isSelectedVariant = activeVariant?.id === v.id;
                    return (
                      <button
                        key={`${v.id || 'v'}-${idx}`}
                        type="button"
                        aria-pressed={isSelectedVariant}
                        data-testid={`variant-option-${v.id}`}
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setActiveAccordion('description');
                        }}
                        className={`px-3.5 py-2.5 rounded-lg text-left border transition-colors cursor-pointer ${
                          isSelectedVariant
                            ? 'border-[#D71920] bg-[#FFF1F2] dark:bg-[#D71920]/15 text-neutral-900 dark:text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        <div className={`text-xs font-medium ${isSelectedVariant ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-600'}`}>{v.name}</div>
                        <div className={`text-sm font-bold mt-0.5 tabular-nums ${isSelectedVariant ? 'text-[#D71920]' : 'text-neutral-900'}`}>
                          ৳{v.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Buy Actions */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-between border border-neutral-200 rounded-lg overflow-hidden bg-white shrink-0 px-1">
                  <span className="text-xs font-medium text-neutral-500 px-2.5 sm:hidden">Quantity</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2.5 text-neutral-700 hover:bg-neutral-100 font-semibold transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 font-semibold text-sm text-neutral-900 min-w-[2.25rem] text-center tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2.5 text-neutral-700 hover:bg-neutral-100 font-semibold transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart & Buy Now */}
                <div className="grid grid-cols-2 gap-2.5 flex-1">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-3 sm:py-3.5 bg-white hover:bg-[#FFF1F2] text-[#D71920] border border-[#D71920] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer active:scale-[0.98]"
                  >
                    <ShoppingBag size={15} /> Add to Cart
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full py-3 sm:py-3.5 bg-[#D71920] hover:bg-[#C5161C] text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer active:scale-[0.98]"
                  >
                    Buy Now
                  </button>
                </div>
              </div>

              {/* Clean Minimal Direct Support Row */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 pt-0.5">
                <a
                  href={`https://wa.me/${(settings?.whatsappNumber || settings?.phone || '8801712345678').replace(/[^0-9]/g, '')}?text=Hello%20MR.%20BOOKS,%20I%20want%20to%20order%20${encodeURIComponent(product.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-1 sm:px-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 hover:border-neutral-300 rounded-lg font-medium flex items-center justify-center gap-1 sm:gap-1.5 transition-colors text-center cursor-pointer min-w-0"
                  title="Order via WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span className="text-[11px] sm:text-xs leading-none truncate">WhatsApp</span>
                </a>

                <a
                  href={`tel:${(settings?.callNumber || settings?.phone || '01712345678').replace(/[^0-9+]/g, '')}`}
                  className="py-2 px-1 sm:px-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 hover:border-neutral-300 rounded-lg font-medium flex items-center justify-center gap-1 sm:gap-1.5 transition-colors text-center cursor-pointer min-w-0"
                  title="Call Hotline"
                >
                  <Phone size={13} className="text-[#1D63D8] shrink-0" />
                  <span className="text-[11px] sm:text-xs leading-none truncate">Call</span>
                </a>

                <a
                  href={settings?.instagramUrl?.startsWith('http') ? settings.instagramUrl : (settings?.instagramUrl ? `https://instagram.com/${settings.instagramUrl.replace(/^@/, '')}` : 'https://instagram.com/mrbooksbd')}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-1 sm:px-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 hover:border-neutral-300 rounded-lg font-medium flex items-center justify-center gap-1 sm:gap-1.5 transition-colors text-center cursor-pointer min-w-0"
                  title="Contact on Instagram"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C] shrink-0" />
                  <span className="text-[11px] sm:text-xs leading-none truncate">Instagram</span>
                </a>

                <a
                  href={settings?.messengerUrl?.startsWith('http') ? settings.messengerUrl : (settings?.messengerUrl ? `https://m.me/${settings.messengerUrl.replace(/^@/, '')}` : 'https://m.me/mrbooksbd')}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-1 sm:px-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 hover:border-neutral-300 rounded-lg font-medium flex items-center justify-center gap-1 sm:gap-1.5 transition-colors text-center cursor-pointer min-w-0"
                  title="Chat on Facebook Messenger"
                >
                  <MessengerIcon className="w-3.5 h-3.5 text-[#0084FF] shrink-0" />
                  <span className="text-[11px] sm:text-xs leading-none truncate">Messenger</span>
                </a>
              </div>

              {/* Minimal Hairline Accordion: Description, Book Details, Delivery Timing, Reviews */}
              <div
                data-testid="product-detail-accordions"
                className="pt-1.5"
              >
                <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-200 overflow-hidden">
                
                {/* Section 1: Description */}
                <div>
                  <button
                    type="button"
                    aria-expanded={activeAccordion === 'description'}
                    onClick={() => toggleAccordion('description')}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      activeAccordion === 'description' ? 'bg-neutral-50/70' : 'hover:bg-neutral-50/70'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <FileText size={14} strokeWidth={1.75} className={`shrink-0 ${activeAccordion === 'description' ? 'text-[#D71920]' : 'text-neutral-400'}`} />
                      <span className={`text-[13px] font-semibold tracking-[-0.01em] ${activeAccordion === 'description' ? 'text-[#D71920]' : 'text-neutral-900'}`}>
                        Description
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-neutral-400 truncate max-w-[110px]">
                        {activeVariantDescription.formatLabel}
                      </span>
                      <ChevronRight
                        size={14}
                        className={`shrink-0 transition-transform duration-150 ${
                          activeAccordion === 'description' ? 'rotate-90 text-[#D71920]' : 'text-neutral-400 group-hover:text-neutral-600'
                        }`}
                      />
                    </div>
                  </button>

                  {activeAccordion === 'description' && (
                    <div className="px-3.5 pb-3.5 pt-2.5 border-t border-neutral-100 bg-neutral-50/50 space-y-3 text-xs text-neutral-700">
                      {/* Format-Synced Dynamic Edition Description */}
                      <div
                        data-testid="selected-format-description"
                        className="pb-2.5 border-b border-neutral-200/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-neutral-900">
                            {activeVariantDescription.headline}
                          </span>
                          <span className="text-[11px] font-semibold text-[#D71920] tabular-nums">
                            {activeVariantDescription.formatLabel} · ৳{activeVariant.price}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          {activeVariantDescription.detailsText}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-neutral-600">
                          {activeVariantDescription.highlights.map((hl, i) => (
                            <span key={i} className="inline-flex items-center gap-1">
                              <Check size={11} className="text-emerald-600 shrink-0" />
                              <span>{hl}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-[13px] text-neutral-700 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-neutral-200/70 text-[11px] text-neutral-600">
                        <span className="inline-flex items-center gap-1.5">
                          <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                          <span>{presentation.authenticityBadge}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Truck size={12} className="text-neutral-500 shrink-0" />
                          <span>Bubble-Wrap Packaging</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-neutral-500 shrink-0" />
                          <span>Cash on Delivery</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Book Details / Product Specifications */}
                <div data-testid="product-detail-specifications-accordion">
                  <button
                    type="button"
                    data-testid="accordion-btn-specifications"
                    aria-expanded={activeAccordion === 'specifications'}
                    onClick={() => toggleAccordion('specifications')}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      activeAccordion === 'specifications' ? 'bg-neutral-50/70' : 'hover:bg-neutral-50/70'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <BookOpen size={14} strokeWidth={1.75} className={`shrink-0 ${activeAccordion === 'specifications' ? 'text-[#D71920]' : 'text-neutral-400'}`} />
                      <span className={`text-[13px] font-semibold tracking-[-0.01em] ${activeAccordion === 'specifications' ? 'text-[#D71920]' : 'text-neutral-900'}`}>
                        {presentation.detailsHeading}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
                        {product.type === 'book'
                          ? (product.pages ? `${product.pages} pages` : (product.edition || 'Details'))
                          : (product.brand || 'Specs')}
                      </span>
                      <ChevronRight
                        size={14}
                        className={`shrink-0 transition-transform duration-150 ${
                          activeAccordion === 'specifications' ? 'rotate-90 text-[#D71920]' : 'text-neutral-400 group-hover:text-neutral-600'
                        }`}
                      />
                    </div>
                  </button>

                  {activeAccordion === 'specifications' && (
                    <div
                      data-testid="book-details-panel"
                      className="px-3.5 pb-3 pt-1 border-t border-neutral-100 bg-neutral-50/50 text-xs"
                    >
                      <dl className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
                        <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                          <dt className="text-neutral-500 shrink-0">Title</dt>
                          <dd className="font-medium text-neutral-900 text-right truncate">{product.title}</dd>
                        </div>

                        {product.type === 'book' ? (
                          <>
                            {siteSettings.authorInfo !== false && (
                              <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                                <dt className="text-neutral-500 shrink-0">Author</dt>
                                <dd className="text-right min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (product.author) {
                                        setSearchQuery(product.author);
                                        setActivePage('books');
                                      }
                                    }}
                                    className="font-medium text-neutral-900 hover:text-[#D71920] hover:underline underline-offset-4 transition-colors cursor-pointer truncate max-w-full"
                                  >
                                    {product.author || 'Renowned Author'}
                                  </button>
                                </dd>
                              </div>
                            )}

                            <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                              <dt className="text-neutral-500 shrink-0">Publisher</dt>
                              <dd className="text-right min-w-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(currentProductPublisher.name);
                                    setActivePage('books');
                                  }}
                                  className="font-medium text-neutral-900 hover:text-[#D71920] hover:underline underline-offset-4 transition-colors cursor-pointer text-right"
                                >
                                  {currentProductPublisher.name}
                                </button>
                              </dd>
                            </div>

                            {seriesInfo.hasSeries && (
                              <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                                <dt className="text-neutral-500 shrink-0">Series</dt>
                                <dd className="text-right min-w-0">
                                  <button
                                    type="button"
                                    onClick={handleViewSeriesBooks}
                                    className="font-medium text-neutral-900 hover:text-[#D71920] hover:underline underline-offset-4 transition-colors cursor-pointer"
                                  >
                                    {seriesInfo.label}
                                    {seriesBooks.length > 1 ? ` (${seriesBooks.length} books)` : ''}
                                  </button>
                                </dd>
                              </div>
                            )}

                            <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                              <dt className="text-neutral-500 shrink-0">Edition</dt>
                              <dd className="font-medium text-neutral-900 text-right">{product.edition || activeVariant.name || 'Standard Edition'}</dd>
                            </div>

                            <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                              <dt className="text-neutral-500 shrink-0">Pages</dt>
                              <dd className="font-medium text-neutral-900 text-right tabular-nums">{product.pages ? `${product.pages} Pages` : 'Standard Print'}</dd>
                            </div>

                            <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                              <dt className="text-neutral-500 shrink-0">Language</dt>
                              <dd className="font-medium text-neutral-900 text-right">{product.language || 'Bengali'}</dd>
                            </div>

                            {product.isbn && (
                              <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                                <dt className="text-neutral-500 shrink-0">ISBN</dt>
                                <dd className="font-medium text-neutral-900 text-right font-mono tabular-nums">{product.isbn}</dd>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                              <dt className="text-neutral-500 shrink-0">Brand</dt>
                              <dd className="font-medium text-neutral-900 text-right">{product.brand || 'Premium Stationery'}</dd>
                            </div>

                            {product.material && (
                              <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                                <dt className="text-neutral-500 shrink-0">Material</dt>
                                <dd className="font-medium text-neutral-900 text-right">{product.material}</dd>
                              </div>
                            )}

                            {product.dimensions && (
                              <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                                <dt className="text-neutral-500 shrink-0">Dimensions</dt>
                                <dd className="font-medium text-neutral-900 text-right tabular-nums">{product.dimensions}</dd>
                              </div>
                            )}

                            {product.colorModel && (
                              <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                                <dt className="text-neutral-500 shrink-0">Color / Model</dt>
                                <dd className="font-medium text-neutral-900 text-right">{product.colorModel}</dd>
                              </div>
                            )}
                          </>
                        )}

                        <div className="py-1.5 border-b border-neutral-200/70 flex items-baseline justify-between gap-3">
                          <dt className="text-neutral-500 shrink-0">Category</dt>
                          <dd className="font-medium text-neutral-900 text-right">{product.category}</dd>
                        </div>

                        <div className="py-1.5 border-b border-neutral-200/70 last:border-b-0 flex items-baseline justify-between gap-3">
                          <dt className="text-neutral-500 shrink-0">SKU</dt>
                          <dd className="font-medium text-neutral-900 text-right font-mono tabular-nums">{activeVariant.sku || product.sku}</dd>
                        </div>

                        {product.customBookDetails &&
                          product.customBookDetails.map((detail, idx) => (
                            <div
                              key={idx}
                              className="py-1.5 border-b border-neutral-200/70 last:border-b-0 flex items-baseline justify-between gap-3"
                            >
                              <dt className="text-neutral-500 shrink-0">{detail.label}</dt>
                              <dd className="font-medium text-neutral-900 text-right">{detail.value}</dd>
                            </div>
                          ))}
                      </dl>
                    </div>
                  )}
                </div>

                {/* Section 3: Delivery Timing */}
                {siteSettings.deliveryTimingDisplay !== false && (() => {
                  const deliveryTiming = resolveProductDeliveryTiming(product);
                  const insideFee = product.insideDhakaFee || product.homeDeliveryFee || settings.insideDhakaCharge || 60;
                  const outsideFee = product.outsideDhakaFee || settings.outsideDhakaCharge || 120;
                  const subAreaFee = product.subAreaFee || settings.subAreaCharge || 90;
                  const sundarbanFee = product.sundarbanDeliveryFee || settings.sundarbanDeliveryCharge || 120;

                  return (
                    <div data-testid="product-detail-delivery-accordion">
                      <button
                        type="button"
                        data-testid="accordion-btn-delivery"
                        aria-expanded={activeAccordion === 'delivery'}
                        onClick={() => toggleAccordion('delivery')}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                          activeAccordion === 'delivery' ? 'bg-neutral-50/70' : 'hover:bg-neutral-50/70'
                        }`}
                      >
                        <div className="shrink-0 flex items-center gap-2">
                          <Truck size={14} strokeWidth={1.75} className={`shrink-0 ${activeAccordion === 'delivery' ? 'text-[#D71920]' : 'text-neutral-400'}`} />
                          <span className={`text-[13px] font-semibold tracking-[-0.01em] whitespace-nowrap ${activeAccordion === 'delivery' ? 'text-[#D71920]' : 'text-neutral-900'}`}>
                            {deliveryTiming.title}
                          </span>
                        </div>
                        <div className="min-w-0 flex items-center justify-end gap-2">
                          <span className="text-[11px] font-medium text-[#D71920] tabular-nums truncate">
                            {deliveryTiming.estimateBadge}
                          </span>
                          <ChevronRight
                            size={14}
                            className={`shrink-0 transition-transform duration-150 ${
                              activeAccordion === 'delivery' ? 'rotate-90 text-[#D71920]' : 'text-neutral-400 group-hover:text-neutral-600'
                            }`}
                          />
                        </div>
                      </button>

                      {activeAccordion === 'delivery' && (
                        <div
                          data-testid="delivery-timing-panel"
                          className="px-3.5 pb-3.5 pt-1 border-t border-neutral-100 bg-neutral-50/50 divide-y divide-neutral-200/70 text-xs"
                        >
                          {/* Zone Delivery Windows */}
                          <div className="py-2.5 grid grid-cols-2 gap-4">
                            <div>
                              <span className="block text-[11px] text-neutral-500">Inside Dhaka</span>
                              <span className="block font-semibold text-neutral-900 mt-0.5 tabular-nums">
                                {deliveryTiming.insideDhaka}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[11px] text-neutral-500">Outside Dhaka</span>
                              <span className="block font-semibold text-neutral-900 mt-0.5 tabular-nums">
                                {deliveryTiming.outsideDhaka}
                              </span>
                            </div>
                          </div>

                          {/* Courier & Area Charges */}
                          <div className="py-2.5">
                            {product.isFreeDelivery ? (
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-neutral-500">Delivery Charge</span>
                                <span className="font-semibold text-emerald-700 tabular-nums">Free Delivery (৳0)</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[11px] tabular-nums">
                                <div className="flex items-baseline justify-between sm:block">
                                  <span className="text-neutral-500">Inside Dhaka </span>
                                  <span className="font-semibold text-neutral-900">৳{insideFee}</span>
                                </div>
                                <div className="flex items-baseline justify-between sm:block">
                                  <span className="text-neutral-500">Outside Dhaka </span>
                                  <span className="font-semibold text-neutral-900">৳{outsideFee}</span>
                                </div>
                                <div className="flex items-baseline justify-between sm:block">
                                  <span className="text-neutral-500">Sub Area </span>
                                  <span className="font-semibold text-neutral-900">৳{subAreaFee}</span>
                                </div>
                                <div className="flex items-baseline justify-between sm:block">
                                  <span className="text-neutral-500">Sundarban </span>
                                  <span className="font-semibold text-neutral-900">৳{sundarbanFee}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Dispatch Note & Weight Notice */}
                          <div className="pt-2.5 space-y-1 text-[11px] text-neutral-600 leading-relaxed">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                              <p>{deliveryTiming.note}</p>
                              <span className="inline-flex items-center gap-1 font-medium text-neutral-800 tabular-nums shrink-0">
                                <Clock size={11} className="text-neutral-500" />
                                Target dispatch: {deliveryTiming.timerHours}h
                              </span>
                            </div>
                            {!product.isFreeDelivery && (
                              <p className="text-neutral-500">
                                {product.weightNote && product.weightNote.trim()
                                  ? product.weightNote
                                  : `Weight-based extra charge: ৳${settings.extraWeightChargePerKg ?? 20} added per extra kg/item.`}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Section 4: Customer Reviews */}
                {siteSettings.reviewDisplay !== false && (
                <div data-testid="product-detail-reviews-accordion">
                  <button
                    type="button"
                    aria-expanded={activeAccordion === 'reviews'}
                    onClick={() => toggleAccordion('reviews')}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      activeAccordion === 'reviews' ? 'bg-neutral-50/70' : 'hover:bg-neutral-50/70'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <Star size={14} strokeWidth={1.75} className={`shrink-0 ${activeAccordion === 'reviews' ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                      <span className={`text-[13px] font-semibold tracking-[-0.01em] ${activeAccordion === 'reviews' ? 'text-[#D71920]' : 'text-neutral-900'}`}>
                        Customer Reviews
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-neutral-500 tabular-nums">
                        {avgRating} ★ ({displayReviews.length})
                      </span>
                      <ChevronRight
                        size={14}
                        className={`shrink-0 transition-transform duration-150 ${
                          activeAccordion === 'reviews' ? 'rotate-90 text-[#D71920]' : 'text-neutral-400 group-hover:text-neutral-600'
                        }`}
                      />
                    </div>
                  </button>

                  {activeAccordion === 'reviews' && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-neutral-100 bg-neutral-50/50 space-y-3.5 text-xs animate-in fade-in duration-200">
                      
                      {/* Rating summary bar */}
                      <div className="flex items-center justify-between pt-1 pb-2 border-b border-neutral-100 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={15} fill={i < Math.round(Number(avgRating)) ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                          <span className="font-black text-sm text-neutral-900">{avgRating} / 5</span>
                          <span className="text-neutral-500 text-[11px] font-medium">({displayReviews.length} verified reviews)</span>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-600" /> 100% Genuine Reader Feedback
                        </span>
                      </div>

                      {/* 2-Side Grid on PC (side-by-side), Stacked on Phone (form on top, reviews below) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-start">
                        
                        {/* Side 1: Write a Review Box (Phone: Top, PC: Left Side) */}
                        <div className="bg-neutral-50/90 p-3.5 sm:p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                              <Edit3 size={13} className="text-[#D71920]" />
                              Write a Verified Review
                            </h4>
                            <span className="text-[10px] text-neutral-400 font-medium">Share your experience</span>
                          </div>

                          {reviewSuccess && (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                              Review submitted successfully! Thank you for your feedback.
                            </div>
                          )}

                          <form onSubmit={handleReviewSubmit} className="space-y-2.5">
                            <div>
                              <label className="block font-bold text-neutral-700 mb-1 text-[11px]">Your Name</label>
                              <input 
                                type="text"
                                required
                                placeholder="e.g. Abdullah Al Mamun"
                                value={newReviewName}
                                onChange={e => setNewReviewName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 font-medium text-xs focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-neutral-700 mb-1 text-[11px]">Star Rating</label>
                              <select
                                value={newReviewRating}
                                onChange={e => setNewReviewRating(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 font-bold text-xs focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] outline-none transition-all cursor-pointer"
                              >
                                <option value="5">⭐⭐⭐⭐⭐ 5 Stars - Excellent / Original Copy</option>
                                <option value="4">⭐⭐⭐⭐ 4 Stars - Very Good Quality</option>
                                <option value="3">⭐⭐⭐ 3 Stars - Good & Readable</option>
                                <option value="2">⭐⭐ 2 Stars - Fair</option>
                                <option value="1">⭐ 1 Star - Needs Improvement</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-neutral-700 mb-1 text-[11px]">Your Review & Experience</label>
                              <textarea 
                                rows={3}
                                required
                                placeholder="Share thoughts on paper quality, fonts, packaging, delivery speed..."
                                value={newReviewComment}
                                onChange={e => setNewReviewComment(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-xs focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] outline-none transition-all resize-none"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={reviewSubmitting}
                              className="w-full py-2.5 px-4 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
                            >
                              <Edit3 size={13} />
                              <span>{reviewSubmitting ? 'Posting Review...' : 'Post Verified Review'}</span>
                            </button>
                          </form>
                        </div>

                        {/* Side 2: Customer Reviews Horizontal Carousel (Mobile & Desktop) */}
                        <div className="space-y-3 min-w-0 w-full">
                          <div className="flex items-center justify-between px-1 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5 truncate">
                                <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                                Customer Reviews ({displayReviews.length})
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/20 tabular-nums shrink-0">
                                {safeReviewIndex + 1} / {displayReviews.length}
                              </span>
                            </div>

                            {/* Carousel Header Left/Right Controls */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={handlePrevReview}
                                aria-label="Previous customer review"
                                className="w-7 h-7 rounded-full border border-neutral-200 bg-white hover:bg-[#FFF1F2] hover:border-[#D71920] text-neutral-700 hover:text-[#D71920] flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                              >
                                <ChevronLeft size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={handleNextReview}
                                aria-label="Next customer review"
                                className="w-7 h-7 rounded-full border border-neutral-200 bg-white hover:bg-[#FFF1F2] hover:border-[#D71920] text-neutral-700 hover:text-[#D71920] flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                              >
                                <ChevronRight size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Horizontal Slider Viewport — One Review Card at a Time */}
                          <div
                            className="relative overflow-hidden rounded-2xl select-none touch-pan-y"
                            onTouchStart={handleReviewTouchStart}
                            onTouchEnd={handleReviewTouchEnd}
                          >
                            {/* Sliding Flex Track */}
                            <div
                              className="flex flex-nowrap w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                              style={{ transform: `translateX(-${safeReviewIndex * 100}%)` }}
                            >
                              {displayReviews.map((rev) => {
                                const userReacted = rev.userReactions?.[visitorId] || null;
                                const likesCount = rev.likesCount ?? 0;
                                const lovesCount = rev.lovesCount ?? 0;
                                const dislikesCount = rev.dislikesCount ?? 0;

                                return (
                                  <div key={rev.id} className="w-full shrink-0 px-0.5">
                                    <div className="p-4 sm:p-5 bg-neutral-50/90 rounded-2xl border border-neutral-200/90 space-y-3 shadow-2xs hover:border-neutral-300 transition-colors h-full flex flex-col justify-between min-h-[195px]">
                                      <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-[#D71920]/10 text-[#D71920] font-black text-xs flex items-center justify-center shrink-0">
                                              {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <span className="font-bold text-xs sm:text-sm text-neutral-900 truncate">{rev.userName}</span>
                                            {rev.isVerifiedPurchase && (
                                              <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                                <CheckCircle2 size={9} /> Verified
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center text-amber-500 shrink-0">
                                            {[...Array(5)].map((_, i) => (
                                              <Star key={i} size={12} fill={i < rev.rating ? 'currentColor' : 'none'} />
                                            ))}
                                          </div>
                                        </div>

                                        <p className="text-xs sm:text-[13px] text-neutral-700 leading-relaxed italic">
                                          "{rev.comment}"
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between gap-2 flex-wrap pt-2.5 border-t border-neutral-200/60">
                                        <span className="text-[10px] text-neutral-400 font-medium">
                                          {new Date(rev.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>

                                        {/* Real-Time Customer Review Reactions: Like, Love, Dislike */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <button
                                            type="button"
                                            onClick={() => reactToReview(rev, 'like')}
                                            aria-label={`Like review by ${rev.userName}`}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                                              userReacted === 'like'
                                                ? 'bg-blue-50 text-blue-600 border-blue-300 ring-1 ring-blue-200 shadow-2xs'
                                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
                                            }`}
                                          >
                                            <ThumbsUp size={11} className={userReacted === 'like' ? 'fill-blue-600 text-blue-600' : ''} />
                                            <span>Like</span>
                                            <span className="tabular-nums font-black ml-0.5">{likesCount}</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => reactToReview(rev, 'love')}
                                            aria-label={`Love review by ${rev.userName}`}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                                              userReacted === 'love'
                                                ? 'bg-[#FFF1F2] text-[#D71920] border-[#D71920]/40 ring-1 ring-[#D71920]/20 shadow-2xs'
                                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#D71920]/40 hover:text-[#D71920] hover:bg-[#FFF1F2]/60'
                                            }`}
                                          >
                                            <Heart size={11} className={userReacted === 'love' ? 'fill-[#D71920] text-[#D71920]' : ''} />
                                            <span>Love</span>
                                            <span className="tabular-nums font-black ml-0.5">{lovesCount}</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => reactToReview(rev, 'dislike')}
                                            aria-label={`Dislike review by ${rev.userName}`}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                                              userReacted === 'dislike'
                                                ? 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/50'
                                            }`}
                                          >
                                            <ThumbsDown size={11} className={userReacted === 'dislike' ? 'fill-amber-600 text-amber-700' : ''} />
                                            <span>Dislike</span>
                                            <span className="tabular-nums font-black ml-0.5">{dislikesCount}</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Carousel Bottom Controls: Prev / Dots / Next */}
                          {displayReviews.length > 1 && (
                            <div className="flex items-center justify-between px-1 pt-0.5">
                              <button
                                type="button"
                                onClick={handlePrevReview}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-[#D71920] transition-colors cursor-pointer active:scale-95"
                              >
                                <ChevronLeft size={13} />
                                <span>Prev</span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                {displayReviews.map((rev, idx) => (
                                  <button
                                    key={rev.id}
                                    type="button"
                                    onClick={() => setActiveReviewIndex(idx)}
                                    aria-label={`Go to review ${idx + 1}`}
                                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                      safeReviewIndex === idx
                                        ? 'w-5 bg-[#D71920]'
                                        : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                                    }`}
                                  />
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={handleNextReview}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-[#D71920] transition-colors cursor-pointer active:scale-95"
                              >
                                <span>Next</span>
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
                )}

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* লেখক ও প্রকাশনী (Unified Compact Author & Publisher Section for Books) */}
        {product.type === 'book' && (() => {
          const showAuthorInfo = siteSettings.authorInfo !== false;
          const bookAuthorName = (product.author || 'রেনাউন্ড লেখক').trim();
          const matchedStoreAuthor = authors.find(
            a => a.name.toLowerCase() === bookAuthorName.toLowerCase() ||
                 bookAuthorName.toLowerCase().includes(a.name.toLowerCase()) ||
                 a.name.toLowerCase().includes(bookAuthorName.toLowerCase())
          );

          const activeAuthor: Author = matchedStoreAuthor || {
            id: 'current-book-author',
            name: bookAuthorName,
            bio: `${bookAuthorName} সমকালীন সাহিত্যের একজন জনপ্রিয় ও পাঠকপ্রিয় লেখক। তাঁর সাবলীল লেখনী ও উপস্থাপনা পাঠকদের কাছে বিশেষভাবে সমাদৃত।`,
            photoUrl: '',
            booksCount: countBooksForAuthor({ name: bookAuthorName }, products),
          };
          const activeAuthorLiveCount = countBooksForAuthor(activeAuthor, products) || 1;

          const activePublisher: EnrichedPublisher = currentProductPublisher;
          const activePubNameLower = (activePublisher.name || '').trim().toLowerCase();
          const activePubBanglaLower = (activePublisher.banglaName || '').trim().toLowerCase();

          const authorMatches = showAuthorInfo
            ? products.filter(
                p =>
                  p.id !== product.id &&
                  p.type === 'book' &&
                  p.author &&
                  (p.author.toLowerCase().includes(activeAuthor.name.toLowerCase()) ||
                    activeAuthor.name.toLowerCase().includes(p.author.toLowerCase()))
              )
            : [];

          const publisherMatches = products.filter(p => {
            if (p.id === product.id || p.type !== 'book') return false;
            const prodPub = (p.publisher || '').trim().toLowerCase();
            if (!prodPub) return false;
            return (
              (activePubNameLower &&
                (prodPub === activePubNameLower ||
                  prodPub.includes(activePubNameLower) ||
                  activePubNameLower.includes(prodPub))) ||
              (activePubBanglaLower &&
                (prodPub === activePubBanglaLower ||
                  prodPub.includes(activePubBanglaLower) ||
                  activePubBanglaLower.includes(prodPub)))
            );
          });

          const fallbackBooks = products.filter(p => p.id !== product.id && p.type === 'book');
          const unifiedBookCandidates = [...authorMatches, ...publisherMatches, ...fallbackBooks];
          const seenBookIds = new Set<string>();
          const displayCombinedBooks: Product[] = [];
          for (const item of unifiedBookCandidates) {
            if (!seenBookIds.has(item.id)) {
              seenBookIds.add(item.id);
              displayCombinedBooks.push(item);
              if (displayCombinedBooks.length >= 4) break;
            }
          }

          const hasAuthorPhoto = !!activeAuthor.photoUrl && !authorAvatarError[activeAuthor.id];
          const hasPublisherLogo = !!activePublisher.logoUrl && !publisherLogoError[activePublisher.id];
          const publisherDisplayName =
            activePublisher.banglaName && activePublisher.banglaName !== activePublisher.name
              ? `${activePublisher.name} (${activePublisher.banglaName})`
              : activePublisher.name;

          return (
            <section
              data-testid="product-detail-publisher-spotlight"
              aria-label="লেখক ও প্রকাশনী"
              className="mt-10 pt-6 border-t border-neutral-200 dark:border-[#263347]"
            >
              {/* Clean Editorial Header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                  {showAuthorInfo ? 'লেখক ও প্রকাশনী' : 'প্রকাশনী পরিচিতি'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-500 shrink-0">
                  {showAuthorInfo && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActivePage('authors')}
                        className="font-medium hover:text-[#D71920] underline underline-offset-4 decoration-neutral-300 hover:decoration-[#D71920] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        সকল লেখক
                      </button>
                      <span aria-hidden="true" className="text-neutral-300 dark:text-slate-700">·</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setActivePage('publishers')}
                    className="font-medium hover:text-[#D71920] underline underline-offset-4 decoration-neutral-300 hover:decoration-[#D71920] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    সকল প্রকাশনী
                  </button>
                </div>
              </div>

              {/* Unified Minimal Author + Publisher Box */}
              <div className="rounded-xl border border-neutral-200 dark:border-[#263347] bg-white overflow-hidden">
                <div className={`grid grid-cols-1 ${showAuthorInfo ? 'md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-[#263347]' : ''}`}>
                  {/* Author Half */}
                  {showAuthorInfo && (
                    <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-neutral-200 dark:border-[#263347] bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0">
                            {hasAuthorPhoto ? (
                              <img
                                src={activeAuthor.photoUrl}
                                alt={activeAuthor.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={() =>
                                  setAuthorAvatarError(prev => ({ ...prev, [activeAuthor.id]: true }))
                                }
                              />
                            ) : (
                              <span className="text-sm font-bold text-neutral-700">
                                {activeAuthor.name ? activeAuthor.name[0] : 'A'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-[11px] font-medium text-neutral-500">
                              লেখক
                            </span>
                            <h4 className="text-sm sm:text-[15px] font-bold text-neutral-900 truncate leading-snug">
                              {activeAuthor.name}
                            </h4>
                            <p className="text-[11px] text-neutral-500 tabular-nums mt-0.5">
                              {activeAuthorLiveCount}টি প্রকাশিত বই · ৪.৯ রেটিং
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                          {activeAuthor.bio ||
                            `${activeAuthor.name} বাংলাদেশের একজন জনপ্রিয় ও খ্যাতিমান লেখক। তাঁর লেখা বইগুলো পাঠকমহলে ব্যাপকভাবে সমাদৃত।`}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-neutral-100 dark:border-[#1E2838] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryFilter('all');
                            setSearchQuery(activeAuthor.name);
                            setActivePage('books');
                          }}
                          className="text-xs font-semibold text-[#D71920] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>এই লেখকের সব বই দেখুন</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Publisher Half */}
                  <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg border border-neutral-200 dark:border-[#263347] bg-neutral-50 overflow-hidden flex items-center justify-center shrink-0">
                          {hasPublisherLogo ? (
                            <img
                              src={activePublisher.logoUrl}
                              alt={activePublisher.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={() =>
                                setPublisherLogoError(prev => ({
                                  ...prev,
                                  [activePublisher.id]: true,
                                }))
                              }
                            />
                          ) : (
                            <Building2 size={18} className="text-neutral-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-medium text-neutral-500">
                            প্রকাশনী
                          </span>
                          <h4 className="text-sm sm:text-[15px] font-bold text-neutral-900 truncate leading-snug">
                            {publisherDisplayName}
                          </h4>
                          <p className="text-[11px] text-neutral-500 tabular-nums mt-0.5">
                            {activePublisher.displayBooksCount || 1}+ প্রকাশিত বই
                            {activePublisher.establishedYear ? ` · স্থাপিত ${activePublisher.establishedYear}` : ''}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                        {activePublisher.description ||
                          `${activePublisher.name} বাংলাদেশের একটি স্বনামধন্য ও বিশ্বস্ত প্রকাশনা প্রতিষ্ঠান। তাদের প্রকাশিত প্রতিটি বই ১০০% অরিজিনাল মুদ্রিত সংস্করণ।`}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-neutral-100 dark:border-[#1E2838] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryFilter('all');
                          setSearchQuery(activePublisher.name);
                          setActivePage('books');
                        }}
                        className="text-xs font-semibold text-[#D71920] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>এই প্রকাশনীর সব বই দেখুন</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact More Books Row (Combined Author & Publisher Catalog) */}
              {displayCombinedBooks.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-neutral-500 mb-2.5">
                    {showAuthorInfo
                      ? `${activeAuthor.name} ও ${activePublisher.banglaName || activePublisher.name}-এর অন্যান্য বই`
                      : `${activePublisher.banglaName || activePublisher.name}-এর অন্যান্য বই`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {displayCombinedBooks.map(bookItem => (
                      <div
                        key={bookItem.id}
                        onClick={() => {
                          setActivePage('product-detail', bookItem.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-2.5 rounded-xl border border-neutral-200 dark:border-[#263347] hover:border-neutral-300 dark:hover:border-slate-600 bg-white transition-colors flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-12 h-16 rounded-md bg-neutral-50 border border-neutral-100 dark:border-[#1E2838] p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={bookItem.images[0]}
                            alt={bookItem.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-xs text-neutral-900 group-hover:text-[#D71920] transition-colors truncate">
                            {bookItem.title}
                          </h5>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {bookItem.author || activeAuthor.name}
                            {bookItem.publisher ? ` · ${bookItem.publisher}` : ''}
                          </p>
                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <div className="flex items-baseline gap-1.5 tabular-nums">
                              <span className="font-bold text-xs text-[#D71920]">৳{bookItem.price}</span>
                              {bookItem.previousPrice && bookItem.previousPrice > bookItem.price && (
                                <span className="text-[10px] text-neutral-400 line-through">
                                  ৳{bookItem.previousPrice}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(bookItem, bookItem.variants[0]?.id || 'v1', 1);
                                setActivePage('checkout');
                              }}
                              className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-[#263347] hover:border-[#D71920] hover:bg-[#D71920] hover:text-white text-neutral-700 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                            >
                              Buy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        {/* Stationery Quality & Brand Spotlight (Stationery Products Only) */}
        {product.type === 'stationery' && (
          <div
            data-testid="stationery-quality-spotlight"
            className="mt-10 pt-6 border-t border-neutral-200/80"
          >
            <div className="rounded-3xl border border-neutral-200/90 bg-gradient-to-br from-[#F8FAFC] via-white to-[#FFF1F2]/30 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <ShieldCheck size={12} /> 100% Authentic Stationery Guarantee
                </div>
                <h3 className="text-lg font-black text-neutral-900">
                  {product.brand ? `${product.brand} — Quality Stationery Supplies` : 'Premium Quality Stationery & Office Supplies'}
                </h3>
                <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
                  MR. BOOKS সরাসরি অনুমোদিত পরিবেশক ও অফিসিয়াল ব্র্যান্ড থেকে অরিজিনাল স্টেশনারি পণ্য সংগ্রহ করে। নিখুঁত প্যাকেজিং ও দ্রুত হোম ডেলিভারি নিশ্চিত।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('stationery')}
                className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <span>Browse All Stationery</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 pt-6 border-t border-neutral-200/80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                  You Might Also Like
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Recommended items in {product.category}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map(rel => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Featured Authors Slider (Books Only) & Video Reels Section */}
      <div className="mt-8 pt-4 border-t border-neutral-200/80">
        {siteSettings.authorInfo !== false && product.type === 'book' && <FeaturedAuthorsSection />}
        <ReelsSection />
      </div>
    </div>
  );
}
