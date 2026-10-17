import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
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
  QrCode
} from 'lucide-react';

export function ProductDetail() {
  const { products, selectedProductId, setActivePage, addToCart, wishlist, toggleWishlist, setSelectedCategoryFilter, settings } = useStore();
  
  const product = products.find(p => p.id === selectedProductId) || products[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product?.variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedAlert, setAddedAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

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
    addToCart(product, activeVariant.id, quantity);
    setAddedAlert(true);
    setTimeout(() => setAddedAlert(false), 2500);
  };

  const handleBuyNow = () => {
    addToCart(product, activeVariant.id, quantity);
    setActivePage('cart');
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
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                {productImages.map((img, idx) => {
                    const isSelected = activeImageIndex === idx;
                    return (
                      <button 
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 overflow-hidden bg-white p-1 transition-all shrink-0 cursor-pointer shadow-2xs ${
                          isSelected 
                            ? 'border-[#D71920] ring-2 ring-[#D71920]/25 scale-105 shadow-md' 
                            : 'border-neutral-200/90 opacity-75 hover:opacity-100 hover:border-neutral-400'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-contain" />
                        <span className={`absolute bottom-1 right-1 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs ${
                          isSelected ? 'bg-[#D71920] text-white' : 'bg-[#171717]/80 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Right Column (7 cols): Buy Actions & Prominent Categories */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Prominent Category Header Chips & Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Category & Subcategory Chips */}
                <div className="flex flex-wrap items-center gap-2">
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

                {/* Wishlist & Copy Link Buttons */}
                <div className="flex items-center gap-2">
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

              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-snug">
                {product.title}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {product.type === 'book' ? (
                  <>
                    By <strong className="text-neutral-900 font-bold">{product.author || 'Renowned Author'}</strong> • Published by {product.publisher || 'MR. BOOKS Publications'}
                  </>
                ) : (
                  <>Brand: <strong className="text-neutral-900 font-bold">{product.brand || 'Stationery'}</strong></>
                )}
              </p>

              {/* 5-Star Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <span className="text-sm font-bold text-neutral-900 tabular-nums">{product.rating}</span>
                <span className="text-xs text-neutral-400 tabular-nums">({product.reviewCount} verified reviews)</span>
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

              {/* Direct Order Support Callout Buttons: WhatsApp, Call, Messenger */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <a 
                  href={`https://wa.me/8801712345678?text=Hello%20MR.%20BOOKS,%20I%20want%20to%20order%20${encodeURIComponent(product.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-center"
                >
                  <MessageCircle size={15} className="text-emerald-600 shrink-0" />
                  <span>WhatsApp</span>
                </a>

                <a 
                  href={`tel:${settings?.phone || '01712345678'}`}
                  className="py-2.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-center"
                >
                  <Phone size={15} className="text-blue-600 shrink-0" />
                  <span>Call Now</span>
                </a>

                <a 
                  href="https://m.me/mrbooksbd"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-center"
                >
                  <MessageSquare size={15} className="text-indigo-600 shrink-0" />
                  <span>Messenger</span>
                </a>
              </div>
            </div>

            {/* OPTIMIZED IMAGE 3: Modern Card-Based Specifications Grid for Phone & PC */}
            <div className="pt-4 border-t border-neutral-200/80 space-y-2.5">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#D71920]" />
                Book & Edition Specifications
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.isbn && (
                  <div className="bg-[#F8F9FA] border border-neutral-200/90 rounded-2xl p-3 shadow-2xs hover:border-[#D71920]/30 transition-colors flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <Barcode size={12} className="text-[#D71920]" /> ISBN
                    </span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-neutral-900 mt-1 truncate">
                      {product.isbn}
                    </span>
                  </div>
                )}

                {product.pages && (
                  <div className="bg-[#F8F9FA] border border-neutral-200/90 rounded-2xl p-3 shadow-2xs hover:border-[#D71920]/30 transition-colors flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText size={12} className="text-[#D71920]" /> Total Pages
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-neutral-900 mt-1 tabular-nums">
                      {product.pages} Pages
                    </span>
                  </div>
                )}

                {product.language && (
                  <div className="bg-[#F8F9FA] border border-neutral-200/90 rounded-2xl p-3 shadow-2xs hover:border-[#D71920]/30 transition-colors flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <Globe size={12} className="text-[#D71920]" /> Language
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-neutral-900 mt-1 truncate">
                      {product.language}
                    </span>
                  </div>
                )}

                {product.edition && (
                  <div className="bg-[#F8F9FA] border border-neutral-200/90 rounded-2xl p-3 shadow-2xs hover:border-[#D71920]/30 transition-colors flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <Award size={12} className="text-[#D71920]" /> Edition
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-neutral-900 mt-1 truncate">
                      {product.edition}
                    </span>
                  </div>
                )}

                <div className="bg-[#F8F9FA] border border-neutral-200/90 rounded-2xl p-3 shadow-2xs hover:border-[#D71920]/30 transition-colors flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <QrCode size={12} className="text-[#D71920]" /> SKU Code
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-neutral-900 mt-1 truncate">
                    {activeVariant.sku}
                  </span>
                </div>

                <div className="bg-[#F8F9FA] border border-neutral-200/90 rounded-2xl p-3 shadow-2xs hover:border-[#D71920]/30 transition-colors flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={12} className="text-[#D71920]" /> Format
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-[#D71920] mt-1 truncate">
                    {activeVariant.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Overview, Specs, Reviews */}
        <div className="mt-10 pt-6 border-t border-neutral-200/80">
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-5 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('description')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'description' 
                  ? 'bg-[#D71920] text-white shadow-xs' 
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <FileText size={15} /> Book Synopsis & Description
            </button>
            <button 
              onClick={() => setActiveTab('specifications')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'specifications' 
                  ? 'bg-[#D71920] text-white shadow-xs' 
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <BookOpen size={15} /> Full Specifications
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reviews' 
                  ? 'bg-[#D71920] text-white shadow-xs' 
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <MessageSquare size={15} /> Customer Reviews ({product.reviewCount})
            </button>
          </div>

          {/* TAB 1: Description */}
          {activeTab === 'description' && (
            <div className="bg-neutral-50 p-5 sm:p-7 rounded-2xl border border-neutral-200 space-y-3">
              <h3 className="font-black text-base sm:text-lg text-neutral-900 flex items-center gap-2">
                <Sparkles size={18} className="text-[#D71920]" />
                About "{product.title}"
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
              <div className="pt-2 border-t border-neutral-200/80 text-xs text-neutral-500">
                100% genuine publisher edition supplied directly with fast home delivery in Bangladesh.
              </div>
            </div>
          )}

          {/* TAB 2: Specifications */}
          {activeTab === 'specifications' && (
            <div className="bg-neutral-50 p-5 sm:p-7 rounded-2xl border border-neutral-200 space-y-3">
              <h3 className="font-black text-base sm:text-lg text-neutral-900">Technical Details & Binding</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[11px]">Title</span>
                  <span className="font-bold text-neutral-900">{product.title}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[11px]">Author / Brand</span>
                  <span className="font-bold text-neutral-900">{product.author || product.brand || 'N/A'}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[11px]">Publisher</span>
                  <span className="font-bold text-neutral-900">{product.publisher || 'MR. BOOKS'}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[11px]">Category</span>
                  <span className="font-bold text-neutral-900">{product.category}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[11px]">Delivery Time</span>
                  <span className="font-bold text-neutral-900">{product.deliveryEstimate || '2-3 Days'}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[11px]">Guarantee</span>
                  <span className="font-bold text-emerald-700">100% Original Publisher Edition</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Reviews */}
          {activeTab === 'reviews' && (
            <div className="bg-neutral-50 p-5 sm:p-7 rounded-2xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-neutral-900">Verified Reader Ratings</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <span className="font-bold text-sm text-neutral-900">{product.rating} out of 5</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-neutral-900">Tanvir Ahmed</span>
                    <span className="text-[11px] text-neutral-400">Sylhet</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed italic">
                    "Authentic print quality! Book binding and paper feel 100% original. Delivered in Sylhet within 48 hours."
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-neutral-900">Nusrat Jahan</span>
                    <span className="text-[11px] text-neutral-400">Dhaka (Dhanmondi)</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed italic">
                    "Fast bKash manual payment verification. Received the package safely wrapped in bubble wrap."
                  </p>
                </div>
              </div>
            </div>
          )}
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
