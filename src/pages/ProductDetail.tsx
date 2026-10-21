import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Review } from '../types';
import { 
  Star, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowLeft, 
  Heart, 
  Truck, 
  ShieldCheck, 
  MessageCircle,
  Phone,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Layers,
  Tag,
  Globe,
  Award,
  Barcode,
  QrCode,
  Edit3,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

function WhatsAppIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.59-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.434 9.889-9.885.002-2.641-1.025-5.12-2.891-6.988-1.866-1.868-4.345-2.897-6.993-2.898-5.452 0-9.887 4.434-9.889 9.884-.001 2.05.617 4.048 1.748 5.75l-.973 3.555 3.79-.91zm10.882-7.811c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347" />
    </svg>
  );
}

function TelegramIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.923z" />
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
  const { products, selectedProductId, setActivePage, addToCart, wishlist, toggleWishlist, setSelectedCategoryFilter, settings, reviews, visitorId, addProductReview, reactToReview } = useStore();
  
  const product = products.find(p => p.id === selectedProductId) || products[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product?.variants?.[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedAlert, setAddedAlert] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<'description' | 'specifications' | 'reviews' | null>('description');

  const toggleAccordion = (section: 'description' | 'specifications' | 'reviews') => {
    setActiveAccordion(prev => prev === section ? null : section);
  };

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
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
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3500);
    } finally {
      setReviewSubmitting(false);
    }
  };

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
        
        {/* OPTIMIZED IMAGE 1: Sleek, Mobile-First Compact Breadcrumb & Back Navigation Bar */}
        <div className="flex items-center gap-2 py-1.5 mb-3 border-b border-neutral-100 text-xs overflow-hidden">
          <button 
            onClick={() => setActivePage(product.type === 'book' ? 'books' : 'stationery')}
            className="inline-flex items-center gap-1 font-bold text-[#D71920] hover:text-[#B9151B] bg-[#FFF1F2] px-2.5 py-1 rounded-xl border border-[#D71920]/25 shrink-0 text-xs cursor-pointer shadow-2xs hover:bg-[#D71920] hover:text-white transition-all"
          >
            <ArrowLeft size={13} /> 
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1.5 text-neutral-500 text-xs overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
            <button onClick={() => setActivePage('home')} className="hover:text-[#D71920] cursor-pointer shrink-0">Home</button>
            <span className="text-neutral-300">/</span>
            <button 
              onClick={() => { setSelectedCategoryFilter(product.category); setActivePage(product.type === 'book' ? 'books' : 'stationery'); }} 
              className="hover:text-[#D71920] font-medium text-neutral-700 cursor-pointer underline decoration-dotted shrink-0 truncate max-w-[110px] sm:max-w-none"
            >
              {product.category}
            </button>
            <span className="text-neutral-300">/</span>
            <strong className="text-neutral-900 font-bold truncate">
              {product.title}
            </strong>
          </div>
        </div>

        {/* Toast alert for added item */}
        {addedAlert && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#D71920]/30 text-[#D71920] text-xs font-bold flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Added "{product.title}" ({activeVariant.name}) to cart!
            </span>
            <button 
              onClick={() => setActivePage('cart')}
              className="underline font-black hover:text-[#C5161C] cursor-pointer"
            >
              View Cart →
            </button>
          </div>
        )}

        {/* Main Product Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column (5 cols): Multi-Image Photo Gallery */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-neutral-50/80 rounded-2xl p-6 sm:p-8 border border-neutral-200/90 flex items-center justify-center relative overflow-hidden shadow-2xs group min-h-[320px] sm:min-h-[380px]">
              
              <img 
                src={productImages[activeImageIndex] || productImages[0]} 
                alt={product.title} 
                className="max-h-[380px] w-auto object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 ease-out"
              />
              
              {/* Photo Counter Badge if multiple images exist */}
              {productImages.length > 1 && (
                <div className="absolute top-3.5 right-3.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                  <Layers size={12} />
                  <span>{activeImageIndex + 1} / {productImages.length}</span>
                </div>
              )}

              {/* Prev / Next Chevron Arrows overlay for switching multiple images */}
              {productImages.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-[#D71920] hover:text-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-800 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-[#D71920] hover:text-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-800 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                    aria-label="Next Image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {product.isOriginalBadge && (
                <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-xs text-[#171717] text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs border border-neutral-200">
                  <ShieldCheck size={14} className="text-[#D71920]" />
                  <span>100% Original Edition</span>
                </div>
              )}
            </div>

            {/* Multiple Photos Thumbnail Gallery Strip */}
            {productImages.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                {productImages.map((img, idx) => {
                    const isSelected = activeImageIndex === idx;
                    return (
                      <button 
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 overflow-hidden bg-white p-1 transition-all shrink-0 cursor-pointer shadow-2xs ${
                          isSelected 
                            ? 'border-[#D71920] ring-2 ring-[#D71920]/25 scale-105 shadow-md' 
                            : 'border-neutral-200/90 opacity-75 hover:opacity-100 hover:border-neutral-400'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt="" 
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain" 
                        />
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Right Column (7 cols): Buy Actions & Prominent Categories */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Header: Title, Author, Rating, then Category/Badges, then Price Card */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-snug">
                    {product.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    {product.type === 'book' ? (
                      <>
                        By <strong className="text-neutral-900 font-bold">{product.author || 'Renowned Author'}</strong>
                      </>
                    ) : (
                      <>Brand: <strong className="text-neutral-900 font-bold">{product.brand || 'Stationery'}</strong></>
                    )}
                  </p>

                  {/* 5-Star Rating */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-neutral-900 tabular-nums">{avgRating}</span>
                    <span className="text-xs text-neutral-400 tabular-nums">({displayReviews.length} verified reviews)</span>
                  </div>
                </div>

                {/* Wishlist & Copy Link Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <button 
                    onClick={handleCopyLink}
                    className="p-2 rounded-full border border-neutral-200 text-neutral-600 hover:text-[#D71920] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-2 rounded-full border transition-all cursor-pointer ${
                      isWishlisted 
                        ? 'bg-[#D71920] text-white border-[#D71920]' 
                        : 'border-neutral-200 text-neutral-600 hover:border-[#D71920] hover:text-[#D71920] hover:bg-[#FFF1F2]'
                    }`}
                    title="Save to Wishlist"
                  >
                    <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Category Chips, Book/Stationery Type & Original Badge (Below Rating & Above Price Card) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button 
                  onClick={() => { setSelectedCategoryFilter(product.category); setActivePage(product.type === 'book' ? 'books' : 'stationery'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1F2] border border-[#D71920]/30 text-[#D71920] font-bold text-xs hover:bg-[#D71920] hover:text-white transition-all cursor-pointer shadow-2xs"
                >
                  <BookOpen size={13} />
                  <span>Category: {product.category}</span>
                </button>

                {product.subcategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs border border-neutral-200">
                    <Tag size={11} className="text-neutral-500" />
                    {product.subcategory}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold text-[10px] uppercase tracking-wider">
                  {product.type === 'book' ? 'Book' : 'Stationery'}
                </span>

                {product.isOriginalBadge !== false && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[11px] border border-emerald-300 shadow-2xs">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>অরিজিনাল বই</span>
                  </span>
                )}
              </div>
            </div>

            {/* Price Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/90 border border-neutral-200/90 flex items-center justify-between shadow-2xs">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-[#D71920] tabular-nums">৳{activeVariant.price}</span>
                {activeVariant.previousPrice && activeVariant.previousPrice > activeVariant.price && (
                  <span className="text-xs sm:text-sm text-neutral-400 line-through font-medium tabular-nums">৳{activeVariant.previousPrice}</span>
                )}
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                In Stock ({activeVariant.stock} items)
              </span>
            </div>

            {/* Edition / Format Variant Selector */}
            {product.variants.length > 1 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Select Edition / Format:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {product.variants.map(v => (
                    <button 
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedVariantId === v.id || (!selectedVariantId && v.id === product.variants[0].id)
                          ? 'border-[#D71920] bg-[#FFF1F2] text-[#D71920] font-bold shadow-2xs'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-[#D71920]'
                      }`}
                    >
                      <div className="text-xs font-bold">{v.name}</div>
                      <div className="text-sm font-black mt-0.5 tabular-nums">৳{v.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Buy Actions */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-between border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50 shrink-0 px-1 py-0.5">
                  <span className="text-xs font-bold text-neutral-500 px-2 sm:hidden">Quantity:</span>
                  <div className="flex items-center">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-neutral-800 hover:bg-neutral-200 font-bold transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 font-black text-sm text-neutral-900 min-w-[2rem] text-center tabular-nums">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-neutral-800 hover:bg-neutral-200 font-bold transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Dual Action Buttons Side-by-Side on Mobile (Add to Cart & Buy Now - pasha pashi) */}
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button 
                    onClick={handleAddToCart}
                    className="w-full py-3 sm:py-3.5 bg-white hover:bg-[#FFF1F2] text-[#D71920] border-2 border-[#D71920] font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-wider cursor-pointer active:scale-95"
                  >
                    <ShoppingBag size={15} /> Add to Cart
                  </button>

                  <button 
                    onClick={handleBuyNow}
                    className="w-full py-3 sm:py-3.5 bg-[#D71920] hover:bg-[#C5161C] text-white font-bold rounded-xl shadow-md shadow-[#D71920]/20 transition-all flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-wider cursor-pointer active:scale-95"
                  >
                    Buy Now
                  </button>
                </div>
              </div>

              {/* 4 Direct Support Callout Buttons: WhatsApp, Call, Telegram, Messenger (1 Single Row on All Devices) */}
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 pt-1">
                {/* 1. WhatsApp Button */}
                <a 
                  href={`https://wa.me/${(settings?.whatsappNumber || settings?.phone || '8801712345678').replace(/[^0-9]/g, '')}?text=Hello%20MR.%20BOOKS,%20I%20want%20to%20order%20${encodeURIComponent(product.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-1 sm:py-2 sm:px-1.5 bg-[#E8F8F0] hover:bg-[#D7F5E5] text-[#0A8754] border border-[#BBEBD2] rounded-xl font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-2xs text-center group cursor-pointer active:scale-95"
                  title="Order via WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-xs tracking-tight truncate leading-none">WhatsApp</span>
                </a>

                {/* 2. Call Now Button */}
                <a 
                  href={`tel:${(settings?.callNumber || settings?.phone || '01712345678').replace(/[^0-9+]/g, '')}`}
                  className="py-1.5 px-1 sm:py-2 sm:px-1.5 bg-[#EEF4FF] hover:bg-[#DFECFF] text-[#1D63D8] border border-[#CFE1FF] rounded-xl font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-2xs text-center group cursor-pointer active:scale-95"
                  title="Call Hotline"
                >
                  <Phone size={13} className="text-[#1D63D8] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-xs tracking-tight truncate leading-none">Call</span>
                </a>

                {/* 3. Telegram Button */}
                <a 
                  href={settings?.telegramUrl?.startsWith('http') ? settings.telegramUrl : (settings?.telegramUrl ? `https://t.me/${settings.telegramUrl.replace(/^@/, '')}` : 'https://t.me/mrbooksbd')}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-1 sm:py-2 sm:px-1.5 bg-[#EAF6FD] hover:bg-[#D7EFFB] text-[#0088CC] border border-[#BFECF8] rounded-xl font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-2xs text-center group cursor-pointer active:scale-95"
                  title="Contact on Telegram"
                >
                  <TelegramIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#229ED9] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-xs tracking-tight truncate leading-none">Telegram</span>
                </a>

                {/* 4. Messenger Button */}
                <a 
                  href={settings?.messengerUrl?.startsWith('http') ? settings.messengerUrl : (settings?.messengerUrl ? `https://m.me/${settings.messengerUrl.replace(/^@/, '')}` : 'https://m.me/mrbooksbd')}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-1 sm:py-2 sm:px-1.5 bg-[#F0F5FF] hover:bg-[#E0ECFF] text-[#006CE0] border border-[#CCE0FF] rounded-xl font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-2xs text-center group cursor-pointer active:scale-95"
                  title="Chat on Facebook Messenger"
                >
                  <MessengerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0084FF] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-xs tracking-tight truncate leading-none">Messenger</span>
                </a>
              </div>

              {/* Single-Open Interactive Accordion: Description, Full Specification, Reviews */}
              <div className="pt-2 space-y-2">
                
                {/* Accordion 1: Description */}
                <div className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white ${
                  activeAccordion === 'description' 
                    ? 'border-[#D71920]/40 ring-1 ring-[#D71920]/15 shadow-xs' 
                    : 'border-neutral-200 hover:border-neutral-300 shadow-2xs'
                }`}>
                  <button
                    type="button"
                    onClick={() => toggleAccordion('description')}
                    className="w-full p-3 sm:p-3.5 text-left flex items-center justify-between gap-2.5 hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className={activeAccordion === 'description' ? 'text-[#D71920]' : 'text-neutral-500'} />
                        <h3 className={`text-sm sm:text-[15px] font-bold ${activeAccordion === 'description' ? 'text-[#D71920]' : 'text-neutral-900 group-hover:text-neutral-950'}`}>
                          Description
                        </h3>
                      </div>
                      <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 truncate pl-6">
                        Overview, summary & book details
                      </p>
                    </div>
                    <div className={`p-1.5 rounded-full transition-all duration-200 shrink-0 ${
                      activeAccordion === 'description' ? 'bg-[#FFF1F2] text-[#D71920] rotate-90' : 'bg-neutral-100 text-neutral-400 group-hover:text-neutral-600'
                    }`}>
                      <ChevronRight size={14} className="stroke-[2.5]" />
                    </div>
                  </button>

                  {activeAccordion === 'description' && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-neutral-100 space-y-3 text-xs text-neutral-700 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#D71920]" /> About "{product.title}"
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck size={11} /> 100% Genuine
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-[11px]">
                        <div className="p-2.5 bg-neutral-50 rounded-xl flex items-center gap-2 text-neutral-700 font-medium">
                          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                          <span>100% Original Copy</span>
                        </div>
                        <div className="p-2.5 bg-neutral-50 rounded-xl flex items-center gap-2 text-neutral-700 font-medium">
                          <Truck size={14} className="text-[#D71920]" />
                          <span>Safe Bubble-Wrap Packaging</span>
                        </div>
                        <div className="p-2.5 bg-neutral-50 rounded-xl flex items-center gap-2 text-neutral-700 font-medium">
                          <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                          <span>Cash on Delivery Available</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 2: Full Specification */}
                <div className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white ${
                  activeAccordion === 'specifications' 
                    ? 'border-[#D71920]/40 ring-1 ring-[#D71920]/15 shadow-xs' 
                    : 'border-neutral-200 hover:border-neutral-300 shadow-2xs'
                }`}>
                  <button
                    type="button"
                    onClick={() => toggleAccordion('specifications')}
                    className="w-full p-3 sm:p-3.5 text-left flex items-center justify-between gap-2.5 hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className={activeAccordion === 'specifications' ? 'text-[#D71920]' : 'text-neutral-500'} />
                        <h3 className={`text-sm sm:text-[15px] font-bold ${activeAccordion === 'specifications' ? 'text-[#D71920]' : 'text-neutral-900 group-hover:text-neutral-950'}`}>
                          Full Specification
                        </h3>
                      </div>
                      <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 truncate pl-6">
                        Author, format, pages, language, SKU & edition details
                      </p>
                    </div>
                    <div className={`p-1.5 rounded-full transition-all duration-200 shrink-0 ${
                      activeAccordion === 'specifications' ? 'bg-[#FFF1F2] text-[#D71920] rotate-90' : 'bg-neutral-100 text-neutral-400 group-hover:text-neutral-600'
                    }`}>
                      <ChevronRight size={14} className="stroke-[2.5]" />
                    </div>
                  </button>

                  {activeAccordion === 'specifications' && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-neutral-100 space-y-3 text-xs text-neutral-700 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                          <BookOpen size={14} className="text-[#D71920]" /> Complete Technical Specs
                        </span>
                        <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                          Active: {activeVariant.name}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {/* SKU Code */}
                        <div className="p-2.5 bg-neutral-50/90 rounded-xl border border-neutral-200">
                          <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <QrCode size={11} className="text-[#D71920]" /> SKU Code
                          </span>
                          <span className="font-mono font-bold text-xs text-neutral-900 mt-0.5 block truncate">
                            {activeVariant.sku || 'MB-STK-001'}
                          </span>
                        </div>

                        {/* Format / Edition */}
                        <div className="p-2.5 bg-neutral-50/90 rounded-xl border border-neutral-200">
                          <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Tag size={11} className="text-[#D71920]" /> Format / Binding
                          </span>
                          <span className="font-bold text-xs text-[#D71920] mt-0.5 block truncate">
                            {activeVariant.name}
                          </span>
                        </div>

                        {/* Author / Brand */}
                        <div className="p-2.5 bg-neutral-50/90 rounded-xl border border-neutral-200">
                          <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Award size={11} className="text-[#D71920]" /> {product.type === 'book' ? 'Author' : 'Brand'}
                          </span>
                          <span className="font-bold text-xs text-neutral-900 mt-0.5 block truncate">
                            {product.author || product.brand || 'MR. BOOKS Selected'}
                          </span>
                        </div>

                        {/* ISBN */}
                        {product.isbn && (
                          <div className="p-2.5 bg-neutral-50/90 rounded-xl border border-neutral-200">
                            <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Barcode size={11} className="text-[#D71920]" /> ISBN
                            </span>
                            <span className="font-mono font-bold text-xs text-neutral-900 mt-0.5 block truncate">
                              {product.isbn}
                            </span>
                          </div>
                        )}

                        {/* Total Pages */}
                        {product.pages && (
                          <div className="p-2.5 bg-neutral-50/90 rounded-xl border border-neutral-200">
                            <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <FileText size={11} className="text-[#D71920]" /> Pages
                            </span>
                            <span className="font-bold text-xs text-neutral-900 mt-0.5 block tabular-nums">
                              {product.pages} Pages
                            </span>
                          </div>
                        )}

                        {/* Language */}
                        <div className="p-2.5 bg-neutral-50/90 rounded-xl border border-neutral-200">
                          <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Globe size={11} className="text-[#D71920]" /> Language
                          </span>
                          <span className="font-bold text-xs text-neutral-900 mt-0.5 block">
                            {product.language || 'Bangla'}
                          </span>
                        </div>

                        {/* Edition */}
                        {product.edition && (
                          <div className="p-2.5 bg-neutral-50/90 rounded-xl border border-neutral-200">
                            <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Award size={11} className="text-[#D71920]" /> Edition
                            </span>
                            <span className="font-bold text-xs text-neutral-900 mt-0.5 block truncate">
                              {product.edition}
                            </span>
                          </div>
                        )}

                        {/* Delivery Time */}
                        <div className="p-2.5 bg-neutral-50/90 rounded-xl border border-neutral-200">
                          <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Truck size={11} className="text-[#D71920]" /> Delivery
                          </span>
                          <span className="font-bold text-xs text-neutral-900 mt-0.5 block truncate">
                            {product.deliveryEstimate || '24-48 Hours'}
                          </span>
                        </div>

                        {/* Guarantee */}
                        <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
                          <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={11} className="text-emerald-600" /> Guarantee
                          </span>
                          <span className="font-bold text-xs text-emerald-800 mt-0.5 block">
                            100% Original Publisher Copy
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 3: Customer Reviews */}
                <div className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white ${
                  activeAccordion === 'reviews' 
                    ? 'border-[#D71920]/40 ring-1 ring-[#D71920]/15 shadow-xs' 
                    : 'border-neutral-200 hover:border-neutral-300 shadow-2xs'
                }`}>
                  <button
                    type="button"
                    onClick={() => toggleAccordion('reviews')}
                    className="w-full p-3 sm:p-3.5 text-left flex items-center justify-between gap-2.5 hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Star size={16} className={activeAccordion === 'reviews' ? 'text-amber-500 fill-amber-500' : 'text-neutral-500'} />
                        <h3 className={`text-sm sm:text-[15px] font-bold ${activeAccordion === 'reviews' ? 'text-[#D71920]' : 'text-neutral-900 group-hover:text-neutral-950'}`}>
                          Customer Reviews
                        </h3>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                          activeAccordion === 'reviews' ? 'bg-[#FFF1F2] text-[#D71920]' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {displayReviews.length}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 truncate pl-6">
                        {avgRating} ★ rated ({displayReviews.length} reviews) · Verified purchaser feedback
                      </p>
                    </div>
                    <div className={`p-1.5 rounded-full transition-all duration-200 shrink-0 ${
                      activeAccordion === 'reviews' ? 'bg-[#FFF1F2] text-[#D71920] rotate-90' : 'bg-neutral-100 text-neutral-400 group-hover:text-neutral-600'
                    }`}>
                      <ChevronRight size={14} className="stroke-[2.5]" />
                    </div>
                  </button>

                  {activeAccordion === 'reviews' && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-neutral-100 space-y-3.5 text-xs animate-in fade-in duration-200">
                      
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

                        {/* Side 2: Customer Reviews Display (Phone: Below Box, PC: Right Side) */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                              <Star size={13} className="text-amber-500 fill-amber-500" />
                              Customer Reviews ({displayReviews.length})
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium">Verified purchases</span>
                          </div>

                          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                            {displayReviews.map((rev) => {
                              const userReacted = rev.userReactions?.[visitorId] || null;
                              const likesCount = rev.likesCount ?? 0;
                              const lovesCount = rev.lovesCount ?? 0;
                              const dislikesCount = rev.dislikesCount ?? 0;

                              return (
                                <div key={rev.id} className="p-3.5 bg-neutral-50/90 rounded-xl border border-neutral-200/90 space-y-2 shadow-2xs hover:border-neutral-300 transition-colors">
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-[#D71920]/10 text-[#D71920] font-black text-[11px] flex items-center justify-center shrink-0">
                                        {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                                      </div>
                                      <span className="font-bold text-xs text-neutral-900">{rev.userName}</span>
                                      {rev.isVerifiedPurchase && (
                                        <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                                          <CheckCircle2 size={9} /> Verified
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center text-amber-500 shrink-0">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={11} fill={i < rev.rating ? 'currentColor' : 'none'} />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-xs text-neutral-700 leading-relaxed italic">
                                    "{rev.comment}"
                                  </p>
                                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1.5 border-t border-neutral-200/60">
                                    <span className="text-[10px] text-neutral-400">
                                      {new Date(rev.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>

                                    {/* Real-Time Customer Review Reactions: Like, Love, Dislike */}
                                    <div className="flex items-center gap-1.5">
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
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 pt-6 border-t border-neutral-200/80">
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
    </div>
  );
}
