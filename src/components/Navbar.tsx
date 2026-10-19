import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  ShoppingBag, 
  Heart, 
  Search, 
  ShieldCheck, 
  Menu, 
  X, 
  LogOut, 
  Package, 
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  PenTool,
  Users,
  ChevronRight,
  User
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { AnimatedSearchInput } from './AnimatedSearchInput';

export function Navbar() {
  const { 
    activePage, 
    setActivePage, 
    categories,
    setSelectedCategoryFilter,
    cart, 
    wishlist, 
    searchQuery, 
    setSearchQuery,
    products
  } = useStore();
  
  const { currentUser, logout } = useAuth();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);

  // Mobile accordions
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const shopRef = useRef<HTMLDivElement>(null);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const suggestions = searchQuery.trim() ? products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setShopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActivePage('books');
      setShowSuggestions(false);
    }
  };

  const handleSelectCategory = (catName: string, type: 'book' | 'stationery') => {
    setSelectedCategoryFilter(catName);
    setActivePage(type === 'stationery' ? 'stationery' : 'books');
    setCategoriesDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleSelectShopOption = (type: 'books' | 'stationery') => {
    setActivePage(type);
    setShopDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  // Group categories into books and stationery
  const bookCategories = categories.filter(c => c.type === 'book');
  const stationeryCategories = categories.filter(c => c.type === 'stationery');

  const marqueeItems = [
    { icon: '⚡', title: 'SPECIAL OFFER:', desc: 'Free Delivery on orders above Tk 1,500 across Bangladesh!' },
    { icon: '🎁', title: 'DISCOUNT COUPON:', desc: 'Use coupon code MRBOOKS10 for 10% instant discount!' },
    { icon: '🚚', title: 'FAST SHIPPING:', desc: '24-48 Hours Express Delivery in Dhaka & 2-3 days nationwide.' },
    { icon: '💳', title: 'EASY PAYMENT:', desc: 'Cash on Delivery, bKash, Nagad, Rocket & Bank Transfer accepted.' },
    { icon: '📚', title: '100% ORIGINAL:', desc: 'Authentic books direct from reputed publishing houses.' },
    { icon: '✍️', title: 'PREMIUM STATIONERY:', desc: 'Imported notebooks, fountain pens, art supplies in stock.' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/80 transition-colors shadow-2xs">

        {/* Main Nav Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Logo */}
              <div 
                className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0" 
                onClick={() => setActivePage('home')}
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#D71920] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#D71920]/20 group-hover:bg-[#C5161C] transition-colors">
                  <BookOpen size={20} className="sm:hidden stroke-[2.2]" />
                  <BookOpen size={22} className="hidden sm:block stroke-[2.2]" />
                </div>
                <div className="leading-tight">
                  <div className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
                    MR. <span className="text-[#D71920]">BOOKS</span>
                  </div>
                  <div className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                    Bookstore & Stationery
                  </div>
                </div>
              </div>
            </div>

            {/* Optimized Search Bar with Vertical Sliding Suggestions */}
            <div className="hidden md:block flex-1 max-w-xl mx-4 relative" ref={searchRef}>
              <AnimatedSearchInput 
                value={searchQuery}
                onChange={(val) => { setSearchQuery(val); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onSubmit={handleSearchSubmit}
              />

              {/* Autocomplete Dropdown Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden z-50">
                  <div className="p-2 border-b border-neutral-100 text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-3">
                    Matching Products
                  </div>
                  {suggestions.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => { setActivePage('product-detail', item.id); setSearchQuery(''); setShowSuggestions(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0"
                    >
                      <img src={item.images[0]} alt="" className="w-9 h-11 object-contain bg-neutral-50 rounded-md p-0.5 border border-neutral-200" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-neutral-900 truncate">{item.title}</p>
                        <p className="text-xs text-neutral-500 truncate">{item.author || item.brand} • <span className="text-[#D71920] font-bold">৳{item.price}</span></p>
                      </div>
                      <span className="text-[11px] text-[#D71920] font-semibold flex items-center gap-1">
                        View <ArrowRight size={12} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Wishlist, Cart, Single Sign Up / Profile button, and Mobile Menu Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Wishlist Saved Items Button with Counter Badge */}
              <button 
                onClick={() => setActivePage('my-orders')}
                className="relative p-2 sm:p-2.5 rounded-full border border-neutral-200 bg-white hover:bg-[#FFF1F2] hover:text-[#D71920] text-neutral-700 transition-colors flex cursor-pointer"
                title={`Saved Wishlist Items (${wishlist.length})`}
                aria-label={`Wishlist (${wishlist.length} items saved)`}
              >
                <Heart size={18} className={wishlist.length > 0 ? "text-[#D71920] fill-[#D71920]" : ""} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#D71920] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border border-white animate-in zoom-in-50 duration-200">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <button 
                onClick={() => setActivePage('cart')}
                className="relative flex items-center gap-2 px-3.5 py-2 bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/25 rounded-full font-bold hover:bg-[#D71920] hover:text-white transition-all group cursor-pointer"
              >
                <ShoppingBag size={18} />
                <span className="text-xs hidden sm:inline">
                  {totalCartCount > 0 ? `৳${cartSubtotal}` : 'Cart'}
                </span>
                {totalCartCount > 0 && (
                  <span className="w-5 h-5 bg-[#D71920] group-hover:bg-white group-hover:text-[#D71920] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs transition-colors">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Desktop Only Auth / Profile Button (Moved into Menu Bar Drawer for Phone & Tablet) */}
              <div className="hidden md:block relative">
                {currentUser ? (
                  <div>
                    <button 
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-full hover:bg-neutral-50 border border-neutral-200 cursor-pointer transition-colors"
                      title="User Account"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#D71920] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                        {currentUser.email?.[0].toUpperCase() || 'U'}
                      </div>
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-white border border-neutral-200 rounded-2xl shadow-xl py-2 z-50">
                        <div className="px-4 py-2.5 border-b border-neutral-100">
                          <p className="text-[11px] text-neutral-500 font-medium">Logged in as</p>
                          <p className="text-sm font-bold text-neutral-900 truncate">{currentUser.email}</p>
                        </div>
                        
                        <button 
                          onClick={() => { setActivePage('my-orders'); setUserDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer text-left"
                        >
                          <Package size={16} className="text-[#D71920]" /> My Orders & Payments
                        </button>

                        <div className="border-t border-neutral-100 my-1"></div>
                        
                        <button 
                          onClick={() => { logout(); setUserDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#D71920] font-semibold hover:bg-[#FFF1F2] transition-colors cursor-pointer text-left"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
                    className="px-4 py-2 bg-[#D71920] hover:bg-[#C5161C] text-white text-xs font-bold rounded-full shadow-md shadow-[#D71920]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <User size={14} />
                    <span>Sign Up</span>
                  </button>
                )}
              </div>

              {/* Mobile Menu Toggle Button (Triggers Mobile Drawer) */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 -mr-1 rounded-xl md:hidden hover:bg-neutral-100 text-neutral-800 cursor-pointer transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
              </button>
            </div>
          </div>

          {/* Desktop Sub Navigation Bar */}
          <nav className="hidden md:flex items-center justify-between border-t border-neutral-200/80 text-sm font-bold py-1">
            <div className="flex items-center space-x-2 lg:space-x-4">
              
              {/* 1. All Categories */}
              <div 
                className="relative py-2" 
                ref={categoriesRef}
                onMouseEnter={() => setCategoriesDropdownOpen(true)}
                onMouseLeave={() => setCategoriesDropdownOpen(false)}
              >
                <button 
                  onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#D71920] text-white hover:bg-[#C5161C] shadow-xs"
                >
                  <LayoutGrid size={15} />
                  <span>All Categories</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* All Categories Dropdown Mega Menu */}
                {categoriesDropdownOpen && (
                  <div className="absolute left-0 top-full pt-1 w-[460px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-5">
                      <div className="grid grid-cols-2 gap-5">
                      {/* Books Categories */}
                      <div>
                        <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-100 mb-2.5">
                          <BookOpen size={15} className="text-[#D71920]" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">Books</h4>
                        </div>
                        <ul className="space-y-1">
                          {bookCategories.map(cat => (
                            <li key={cat.id}>
                              <button 
                                onClick={() => handleSelectCategory(cat.name, 'book')}
                                className="w-full text-left px-2.5 py-1.5 text-xs text-neutral-600 hover:text-[#D71920] hover:bg-[#FFF1F2] rounded-lg transition-colors font-medium flex items-center justify-between group cursor-pointer"
                              >
                                <span className="truncate">{cat.name}</span>
                                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-[#D71920] transition-opacity" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Stationery Categories */}
                      <div>
                        <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-100 mb-2.5">
                          <PenTool size={15} className="text-[#D71920]" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">Stationery</h4>
                        </div>
                        <ul className="space-y-1">
                          {stationeryCategories.map(cat => (
                            <li key={cat.id}>
                              <button 
                                onClick={() => handleSelectCategory(cat.name, 'stationery')}
                                className="w-full text-left px-2.5 py-1.5 text-xs text-neutral-600 hover:text-[#D71920] hover:bg-[#FFF1F2] rounded-lg transition-colors font-medium flex items-center justify-between group cursor-pointer"
                              >
                                <span className="truncate">{cat.name}</span>
                                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-[#D71920] transition-opacity" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-normal">Explore 1000+ curated titles</span>
                      <button 
                        onClick={() => { setActivePage('books'); setCategoriesDropdownOpen(false); }}
                        className="text-[#D71920] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        View Full Catalog <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                  </div>
                )}
              </div>

              {/* 2. Home */}
              <button 
                onClick={() => setActivePage('home')}
                className={`relative px-3 py-2 transition-colors cursor-pointer ${
                  activePage === 'home' 
                    ? 'text-[#D71920]' 
                    : 'text-neutral-800 hover:text-[#D71920]'
                }`}
              >
                <span>Home</span>
                {activePage === 'home' && (
                  <span className="absolute -bottom-1.5 left-3 right-3 h-0.5 bg-[#D71920] rounded-full"></span>
                )}
              </button>

              {/* 3. Shop (Books & Stationery) */}
              <div 
                className="relative py-2" 
                ref={shopRef}
                onMouseEnter={() => setShopDropdownOpen(true)}
                onMouseLeave={() => setShopDropdownOpen(false)}
              >
                <button 
                  onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors cursor-pointer ${
                    activePage === 'books' || activePage === 'stationery' || shopDropdownOpen
                      ? 'text-[#D71920]' 
                      : 'text-neutral-800 hover:text-[#D71920]'
                  }`}
                >
                  <span>Shop</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${shopDropdownOpen ? 'rotate-180' : ''}`} />
                  {(activePage === 'books' || activePage === 'stationery') && (
                    <span className="absolute -bottom-1.5 left-3 right-3 h-0.5 bg-[#D71920] rounded-full"></span>
                  )}
                </button>

                {/* Shop Options: Books & Stationery */}
                {shopDropdownOpen && (
                  <div className="absolute left-0 top-full pt-1 w-72 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-2.5">
                    <button 
                      onClick={() => handleSelectShopOption('books')}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left cursor-pointer ${
                        activePage === 'books' ? 'bg-[#FFF1F2] border border-[#D71920]/20' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#FFF1F2] text-[#D71920] flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-neutral-900">Books</span>
                          <span className="text-[10px] font-bold bg-[#D71920] text-white px-2 py-0.5 rounded-full">Popular</span>
                        </div>
                        <p className="text-xs text-neutral-500 font-normal mt-0.5 leading-snug">
                          Novels, Academic, Islamic & Classic Bangla Books
                        </p>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleSelectShopOption('stationery')}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left mt-1 cursor-pointer ${
                        activePage === 'stationery' ? 'bg-[#FFF1F2] border border-[#D71920]/20' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#FFF1F2] text-[#D71920] flex items-center justify-center shrink-0 mt-0.5">
                        <PenTool size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-neutral-900">Stationery</span>
                          <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">Supplies</span>
                        </div>
                        <p className="text-xs text-neutral-500 font-normal mt-0.5 leading-snug">
                          Notebooks, Pens, Art Kits & Office Essentials
                        </p>
                      </div>
                    </button>
                  </div>
                  </div>
                )}
              </div>

            </div>

            {/* Subtle Divider between Navigation Links and Announcement Ticker */}
            <div className="h-4 w-px bg-neutral-200 mx-2 lg:mx-3 shrink-0" aria-hidden="true" />

            {/* Continuous Sliding Announcement Bar */}
            <div 
              className="flex-1 min-w-0 flex items-center overflow-hidden select-none py-1"
              style={{
                maskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)'
              }}
            >
              <div className="relative overflow-hidden w-full flex-1">
                <div className="animate-marquee-continuous flex items-center text-xs space-x-6">
                  {marqueeItems.map((item, index) => (
                    <div key={`m1-${index}`} className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span className="font-black text-[#D71920] tracking-wide uppercase text-[11px]">{item.title}</span>
                      <span className="text-black font-bold tracking-tight text-xs">{item.desc}</span>
                      <span className="text-neutral-300 font-bold ml-3">•</span>
                    </div>
                  ))}
                  {marqueeItems.map((item, index) => (
                    <div key={`m2-${index}`} className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span className="font-black text-[#D71920] tracking-wide uppercase text-[11px]">{item.title}</span>
                      <span className="text-black font-bold tracking-tight text-xs">{item.desc}</span>
                      <span className="text-neutral-300 font-bold ml-3">•</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </nav>
        </div>

        {/* Mobile View Sub-Nav Bar (EXPLICITLY: All Categories + Sliding Announcement Bar next to it!) */}
        <div className="md:hidden border-t border-neutral-200/80 bg-neutral-50 px-3 py-2 flex items-center gap-2 select-none">
          {/* All Categories Button */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D71920] text-white text-xs font-bold rounded-lg shrink-0 shadow-xs cursor-pointer active:scale-95"
          >
            <LayoutGrid size={14} />
            <span>All Categories</span>
          </button>

          {/* Sliding Announcement Ticker Next to All Categories on Mobile */}
          <div 
            className="flex-1 min-w-0 overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)'
            }}
          >
            <div className="relative overflow-hidden w-full">
              <div className="animate-marquee-continuous flex items-center text-[11px] space-x-5">
                {marqueeItems.map((item, index) => (
                  <div key={`mob1-${index}`} className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs shrink-0">{item.icon}</span>
                    <span className="font-extrabold text-[#D71920]">{item.title}</span>
                    <span className="text-black font-extrabold tracking-tight">{item.desc}</span>
                    <span className="text-neutral-300 font-bold ml-2">•</span>
                  </div>
                ))}
                {marqueeItems.map((item, index) => (
                  <div key={`mob2-${index}`} className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs shrink-0">{item.icon}</span>
                    <span className="font-extrabold text-[#D71920]">{item.title}</span>
                    <span className="text-black font-extrabold tracking-tight">{item.desc}</span>
                    <span className="text-neutral-300 font-bold ml-2">•</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer (Slides out smoothly when opened) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden flex justify-end">
            <div className="w-80 max-w-[85vw] bg-white h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-4">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#D71920] text-white rounded-lg flex items-center justify-center font-bold">
                      <BookOpen size={18} />
                    </div>
                    <span className="font-black text-lg text-neutral-900">MR. BOOKS</span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile Search Input */}
                <AnimatedSearchInput 
                  value={searchQuery}
                  onChange={(val) => setSearchQuery(val)}
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                    setMobileMenuOpen(false);
                  }}
                  showSubmitButton={false}
                />

                {/* Mobile Drawer Menu Links: Home, Shop (Books & Stationery), Writer/Authors */}
                <div className="space-y-1 divide-y divide-neutral-100 pt-1">
                  {/* Home Link */}
                  <button 
                    onClick={() => { setActivePage('home'); setMobileMenuOpen(false); }} 
                    className={`block w-full text-left py-2.5 text-sm font-bold cursor-pointer ${
                      activePage === 'home' ? 'text-[#D71920]' : 'text-neutral-800'
                    }`}
                  >
                    Home
                  </button>

                  {/* Shop Accordion (Books & Stationery) */}
                  <div className="pt-1">
                    <button 
                      onClick={() => setMobileShopOpen(!mobileShopOpen)} 
                      className={`w-full flex items-center justify-between py-2.5 text-sm font-bold cursor-pointer ${
                        activePage === 'books' || activePage === 'stationery' ? 'text-[#D71920]' : 'text-neutral-800'
                      }`}
                    >
                      <span>Shop Collection</span>
                      <ChevronDown size={16} className={`transition-transform ${mobileShopOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {mobileShopOpen && (
                      <div className="pl-3 pb-2 space-y-1 pt-1 text-xs">
                        <button 
                          onClick={() => handleSelectShopOption('books')}
                          className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg text-left cursor-pointer ${
                            activePage === 'books' ? 'bg-[#FFF1F2] text-[#D71920] font-bold' : 'text-neutral-600'
                          }`}
                        >
                          <BookOpen size={15} /> Books Catalog
                        </button>
                        <button 
                          onClick={() => handleSelectShopOption('stationery')}
                          className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg text-left cursor-pointer ${
                            activePage === 'stationery' ? 'bg-[#FFF1F2] text-[#D71920] font-bold' : 'text-neutral-600'
                          }`}
                        >
                          <PenTool size={15} /> Stationery & Office
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Featured Authors / Writers Section Link */}
                  <div className="pt-1">
                    <button 
                      onClick={() => { setActivePage('authors'); setMobileMenuOpen(false); }} 
                      className={`w-full flex items-center justify-between py-2.5 text-sm font-bold cursor-pointer ${
                        activePage === 'authors' ? 'text-[#D71920]' : 'text-neutral-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Users size={16} className="text-[#D71920]" /> Featured Writers
                      </span>
                    </button>
                  </div>

                  {/* All Categories Accordion */}
                  <div className="pt-1">
                    <button 
                      onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)} 
                      className="w-full flex items-center justify-between py-2.5 text-sm font-bold text-[#D71920] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutGrid size={16} /> All Categories
                      </span>
                      <ChevronDown size={16} className={`transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {mobileCategoriesOpen && (
                      <div className="pl-3 pb-2 space-y-3 pt-1 text-xs">
                        <div>
                          <p className="font-bold text-neutral-900 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                            <BookOpen size={12} className="text-[#D71920]" /> Books
                          </p>
                          <div className="grid grid-cols-1 gap-1">
                            {bookCategories.map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => handleSelectCategory(cat.name, 'book')}
                                className="text-left py-1 text-neutral-600 hover:text-[#D71920] truncate cursor-pointer"
                              >
                                • {cat.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-neutral-900 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                            <PenTool size={12} className="text-[#D71920]" /> Stationery
                          </p>
                          <div className="grid grid-cols-1 gap-1">
                            {stationeryCategories.map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => handleSelectCategory(cat.name, 'stationery')}
                                className="text-left py-1 text-neutral-600 hover:text-[#D71920] truncate cursor-pointer"
                              >
                                • {cat.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track Orders & Payments */}
                  <div className="pt-1">
                    <button 
                      onClick={() => { setActivePage('my-orders'); setMobileMenuOpen(false); }} 
                      className={`block w-full text-left py-2.5 text-sm font-bold cursor-pointer ${
                        activePage === 'my-orders' ? 'text-[#D71920]' : 'text-neutral-800'
                      }`}
                    >
                      Track Orders & Payments
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Drawer Footer Auth Action */}
              <div className="pt-4 border-t border-neutral-100">
                {currentUser ? (
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-500 font-medium">Logged in as {currentUser.email}</div>
                    <button 
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="w-full py-2 bg-[#FFF1F2] text-[#D71920] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); setMobileMenuOpen(false); }}
                    className="w-full py-2.5 bg-[#D71920] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <User size={14} /> Create Account / Sign Up
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />
    </>
  );
}
