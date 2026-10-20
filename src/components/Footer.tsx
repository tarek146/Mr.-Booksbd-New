import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  BookOpen, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Globe, 
  Package, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Gift
} from 'lucide-react';
import { OrderTrackingModal } from './OrderTrackingModal';
import { Order } from '../types';

const FacebookIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.124-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

export function Footer() {
  const { settings, setActivePage, setSelectedCategoryFilter, addSubscriber, trackOrder } = useStore();

  // Subscription state
  const [subInput, setSubInput] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subMessage, setSubMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Tracking state
  const [trackInput, setTrackInput] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subInput.trim()) return;
    setSubLoading(true);
    setSubMessage(null);
    try {
      const res = await addSubscriber(subInput);
      setSubMessage({ text: res.message, success: res.success });
      if (res.success) {
        setSubInput('');
      }
    } catch {
      setSubMessage({ text: 'Something went wrong. Please try again.', success: false });
    } finally {
      setSubLoading(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    setTrackLoading(true);
    setTrackError(null);
    try {
      const order = await trackOrder(trackInput);
      if (order) {
        setActiveTrackingOrder(order);
        setTrackError(null);
      } else {
        setTrackError(`কোনো অর্ডার পাওয়া যায়নি। সঠিক Order ID (যেমন #ORD-...) অথবা অর্ডার দেওয়ার সময় ব্যবহৃত মোবাইল নম্বর দিয়ে চেষ্টা করুন।`);
      }
    } catch {
      setTrackError('অর্ডার লোড হতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা আমাদের হেল্পলাইনে কল করুন।');
    } finally {
      setTrackLoading(false);
    }
  };

  const showSubscription = settings.showFooterSubscription !== false;
  const showTracking = settings.showFooterTracking !== false;

  return (
    <footer className="bg-[#121212] text-zinc-300 pt-8 sm:pt-10 pb-10 sm:pb-12 border-t border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Phone-Optimized Subscription & Real-Time Order Tracking Options (Side-by-side in 1 line on md+) */}
        {(showSubscription || showTracking) && (
          <div className={`grid ${showSubscription && showTracking ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-3.5 sm:gap-4.5 items-stretch`}>
            
            {/* 1. VIP Book Club & Offers Subscription Card */}
            {showSubscription && (
              <div className="relative overflow-hidden bg-gradient-to-br from-[#1c1c20] via-[#18181b] to-[#131315] border border-zinc-800/90 hover:border-zinc-700/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/25 transition-all duration-300 group">
                {/* Decorative Subtle Ambient Red Glow */}
                <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 bg-[#D71920]/10 group-hover:bg-[#D71920]/20 rounded-full blur-2xl transition-all duration-500" />

                <div className="space-y-2.5 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D71920]/25 to-[#D71920]/10 text-[#FF4D4D] flex items-center justify-center border border-[#D71920]/35 shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Gift size={18} />
                      </div>
                      <h3 className="font-bold text-white text-[15px] sm:text-base tracking-tight leading-snug">
                        {settings.subscriptionTitle || 'Join MR. BOOKS Readers Club'}
                      </h3>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold text-[#FF5555] bg-[#D71920]/15 border border-[#D71920]/30 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                      <Sparkles size={11} className="text-[#FF5555]" /> {settings.subscriptionDiscountBadge || '10% OFF Coupon'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {settings.subscriptionSubtitle || 'Subscribe to get 10% OFF discount coupon & new releases alert directly to your phone/email.'}
                  </p>
                </div>

                {/* Sleek Integrated Subscription Form */}
                <form onSubmit={handleSubscribe} className="mt-3.5 space-y-2 relative z-10">
                  <div className="relative flex items-center bg-[#232327] hover:bg-[#26262a] focus-within:bg-[#232327] border border-zinc-700/80 focus-within:border-[#D71920] focus-within:ring-2 focus-within:ring-[#D71920]/20 rounded-xl p-1 transition-all duration-200 shadow-inner">
                    <div className="pl-2.5 pr-1.5 text-zinc-400 pointer-events-none flex items-center shrink-0">
                      <Mail size={15} />
                    </div>
                    <input
                      type="text"
                      value={subInput}
                      onChange={e => { setSubInput(e.target.value); setSubMessage(null); }}
                      placeholder="Email or Mobile (017... / name@...)"
                      disabled={subLoading}
                      className="w-full bg-transparent px-2 py-1.5 sm:py-2 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={subLoading || !subInput.trim()}
                      className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B9151B] hover:from-[#E51E25] hover:to-[#C7171D] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-[#D71920]/25 cursor-pointer shrink-0 active:scale-95"
                    >
                      {subLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">Subscribing...</span>
                        </>
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>

                  {subMessage && (
                    <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
                      subMessage.success 
                        ? 'bg-emerald-950/70 border border-emerald-700/80 text-emerald-300' 
                        : 'bg-red-950/70 border border-red-700/80 text-red-300'
                    }`}>
                      {subMessage.success ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
                      <span className="leading-snug">{subMessage.text}</span>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* 2. Real-Time Order Tracking Card */}
            {showTracking && (
              <div className="relative overflow-hidden bg-gradient-to-br from-[#1c1c20] via-[#18181b] to-[#131315] border border-zinc-800/90 hover:border-zinc-700/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/25 transition-all duration-300 group">
                {/* Decorative Subtle Ambient Emerald Glow */}
                <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 group-hover:bg-emerald-500/20 rounded-full blur-2xl transition-all duration-500" />

                <div className="space-y-2.5 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/35 shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Truck size={18} />
                      </div>
                      <h3 className="font-bold text-white text-[15px] sm:text-base tracking-tight leading-snug">
                        {settings.trackingTitle || 'Real-Time Order Tracking'}
                      </h3>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Live Status
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {settings.trackingSubtitle || 'Enter your Order ID (ORD-...) or phone number to track your book package.'}
                  </p>
                </div>

                {/* Sleek Integrated Tracking Form */}
                <form onSubmit={handleTrackSubmit} className="mt-3.5 space-y-2 relative z-10">
                  <div className="relative flex items-center bg-[#232327] hover:bg-[#26262a] focus-within:bg-[#232327] border border-zinc-700/80 focus-within:border-[#D71920] focus-within:ring-2 focus-within:ring-[#D71920]/20 rounded-xl p-1 transition-all duration-200 shadow-inner">
                    <div className="pl-2.5 pr-1.5 text-zinc-400 pointer-events-none flex items-center shrink-0">
                      <Package size={15} />
                    </div>
                    <input
                      type="text"
                      value={trackInput}
                      onChange={e => { setTrackInput(e.target.value); setTrackError(null); }}
                      placeholder="Order ID (ORD-...) or Mobile No."
                      disabled={trackLoading}
                      className="w-full bg-transparent px-2 py-1.5 sm:py-2 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={trackLoading || !trackInput.trim()}
                      className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B9151B] hover:from-[#E51E25] hover:to-[#C7171D] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-[#D71920]/25 cursor-pointer shrink-0 active:scale-95"
                    >
                      {trackLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search size={13} />
                          <span>Track Order</span>
                        </>
                      )}
                    </button>
                  </div>

                  {trackError && (
                    <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                        <span className="leading-snug">{trackError}</span>
                      </div>
                      <a
                        href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-white bg-red-800/90 hover:bg-red-700 px-2.5 py-1 rounded-lg shrink-0 transition-colors shadow-xs"
                      >
                        <Phone size={11} /> Call Helpline
                      </a>
                    </div>
                  )}
                </form>
              </div>
            )}

          </div>
        )}

        {/* Main Footer Links - Modern Boxed Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          
          {/* Brand Box */}
          <div className="md:col-span-4 bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl p-4 sm:p-6 space-y-3.5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#D71920] rounded-xl flex items-center justify-center text-white shadow-xs">
                  <BookOpen size={18} />
                </div>
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  MR. <span className="text-[#D71920]">BOOKS</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Bangladesh's premier online bookstore and stationery shop. Bringing knowledge, timeless literature, and premium supplies directly to your doorstep.
              </p>
            </div>

            <div className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#D71920] shrink-0" />
                <span className="truncate">{settings.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#D71920] shrink-0" />
                <span>{settings.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#D71920] shrink-0" />
                <span className="truncate">{settings.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Links & Categories Box */}
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-800 pb-2">
                  QUICK LINKS
                </h4>
                <ul className="space-y-2 text-xs text-zinc-400 mt-2.5">
                  <li><button onClick={() => setActivePage('home')} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Home</button></li>
                  <li><button onClick={() => setActivePage('books')} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Books Catalog</button></li>
                  <li><button onClick={() => setActivePage('stationery')} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Stationery</button></li>
                  <li><button onClick={() => setActivePage('authors')} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Authors</button></li>
                  <li><button onClick={() => setActivePage('my-orders')} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Track Orders</button></li>
                </ul>
              </div>
            </div>

            <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-800 pb-2">
                  CATEGORIES
                </h4>
                <ul className="space-y-2 text-xs text-zinc-400 mt-2.5">
                  <li><button onClick={() => { setSelectedCategoryFilter('Fiction & Literature'); setActivePage('books'); }} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Fiction & Literature</button></li>
                  <li><button onClick={() => { setSelectedCategoryFilter('Islamic Books'); setActivePage('books'); }} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Islamic Books</button></li>
                  <li><button onClick={() => { setSelectedCategoryFilter('Academic & University'); setActivePage('books'); }} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Academic & University</button></li>
                  <li><button onClick={() => { setSelectedCategoryFilter('Bangla Novels & Poetry'); setActivePage('books'); }} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Bangla Novels & Poetry</button></li>
                  <li><button onClick={() => setActivePage('stationery')} className="hover:text-white transition-colors cursor-pointer text-left w-full truncate">Diaries & Pens</button></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Combined Payment Options & Social Media Box */}
          <div className="md:col-span-3 bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-800 pb-2 mb-3">
                Payment Options
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {settings.footerPaymentMethods && settings.footerPaymentMethods.length > 0 ? (
                  settings.footerPaymentMethods.filter(p => p.isActive).map(method => (
                    <div key={method.id} className="bg-[#28282a] border border-zinc-700/70 py-2 px-2.5 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-zinc-200 shadow-2xs truncate">
                      {method.name}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-[#28282a] border border-zinc-700/70 p-2 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-pink-400">bKash</div>
                    <div className="bg-[#28282a] border border-zinc-700/70 p-2 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-orange-400">Nagad</div>
                    <div className="bg-[#28282a] border border-zinc-700/70 p-2 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-emerald-400">COD</div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5">
                Social Media
              </h4>
              <div className="flex items-center justify-between gap-1.5">
                {settings.socialLinks && settings.socialLinks.length > 0 ? (
                  settings.socialLinks.filter(s => s.isActive).map(social => {
                    const lower = social.name.toLowerCase();
                    const iconNode = lower.includes('face') ? <FacebookIcon /> :
                                     lower.includes('insta') ? <InstagramIcon /> :
                                     lower.includes('tube') ? <YouTubeIcon /> :
                                     lower.includes('tik') ? <TikTokIcon /> :
                                     lower.includes('whats') || lower.includes('app') ? <WhatsAppIcon /> :
                                     <Globe size={16} />;
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.name}
                        className="w-9 h-9 bg-[#28282a] hover:bg-[#D71920] text-zinc-300 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-zinc-700/60"
                      >
                        {iconNode}
                      </a>
                    );
                  })
                ) : (
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook" className="w-9 h-9 bg-[#28282a] hover:bg-[#D71920] text-zinc-300 hover:text-white rounded-xl flex items-center justify-center transition-all">
                    <FacebookIcon />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Boxed Copyright Footer */}
        <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2 shadow-sm">
          <p>© {new Date().getFullYear()} MR. BOOKS Bangladesh. All rights reserved.</p>
          <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
            <span>Designed for book lovers in Bangladesh.</span>
          </div>
        </div>

      </div>

      {/* Real-Time Order Tracking Modal */}
      {activeTrackingOrder && (
        <OrderTrackingModal 
          order={activeTrackingOrder} 
          onClose={() => setActiveTrackingOrder(null)} 
        />
      )}
    </footer>
  );
}
