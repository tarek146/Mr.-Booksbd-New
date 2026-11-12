import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  filterSpotlightSearch,
  SpotlightSearchScope,
} from '../utils/storeEnhancementsHelpers';
import {
  Search,
  X,
  BookOpen,
  PenTool,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  Command,
} from 'lucide-react';

const SCOPE_TABS: { id: SpotlightSearchScope; label: string; icon: any }[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'books', label: 'Books', icon: BookOpen },
  { id: 'authors', label: 'Authors', icon: Users },
  { id: 'publishers', label: 'Publishers', icon: Building2 },
  { id: 'stationery', label: 'Stationery', icon: PenTool },
];

const TRENDING_TAGS = [
  'Paradoxical Sajid',
  'Humayun Ahmed',
  'Himu',
  'Islamic Books',
  'Diary 2026',
  'Fountain Pen',
];

export function SearchSpotlightModal() {
  const {
    isSearchSpotlightOpen,
    setIsSearchSpotlightOpen,
    searchQuery,
    setSearchQuery,
    products,
    authors,
    publishers,
    categories,
    setActivePage,
    setSelectedCategoryFilter,
  } = useStore();

  const [scope, setScope] = useState<SpotlightSearchScope>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut Cmd+K / Ctrl+K or '/'
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchSpotlightOpen(!isSearchSpotlightOpen);
      } else if (e.key === 'Escape' && isSearchSpotlightOpen) {
        setIsSearchSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchSpotlightOpen, setIsSearchSpotlightOpen]);

  useEffect(() => {
    if (isSearchSpotlightOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isSearchSpotlightOpen]);

  const results = useMemo(
    () =>
      filterSpotlightSearch(
        searchQuery,
        scope,
        products,
        authors,
        publishers,
        categories
      ),
    [searchQuery, scope, products, authors, publishers, categories]
  );

  if (!isSearchSpotlightOpen) return null;

  const handleViewAllCatalog = () => {
    setIsSearchSpotlightOpen(false);
    setActivePage(scope === 'stationery' ? 'stationery' : 'books');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Iconic Store Search"
      data-testid="search-spotlight-modal"
      className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 pt-6 sm:pt-14 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsSearchSpotlightOpen(false);
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#101623] rounded-3xl border border-neutral-200/90 dark:border-slate-700/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Iconic Top Search Bar Header */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-100 dark:border-slate-800 bg-gradient-to-r from-[#FFF5F5] via-white to-[#F8FAFC] dark:from-[#161E2E] dark:via-[#121826] dark:to-[#161E2E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D71920] to-[#9E0F14] text-white flex items-center justify-center shadow-md shadow-[#D71920]/25 shrink-0">
              <Search size={18} strokeWidth={2.5} />
            </div>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                data-testid="spotlight-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleViewAllCatalog();
                  }
                }}
                placeholder="বই, লেখক, প্রকাশনী বা স্টেশনারি খুঁজুন..."
                className="w-full bg-transparent text-sm sm:text-base font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-[#D71920] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSearchSpotlightOpen(false)}
              className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close Search"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scope Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 scrollbar-none">
            {SCOPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = scope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScope(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                    active
                      ? 'bg-[#D71920] text-white border-[#D71920] shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 text-neutral-700 dark:text-slate-300 border-neutral-200 dark:border-slate-700 hover:border-[#D71920]/40'
                  }`}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 max-h-[68vh] overflow-y-auto space-y-5">
          {/* Trending Searches */}
          {!searchQuery.trim() && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                <span className="flex items-center gap-1.5 text-[#D71920]">
                  <TrendingUp size={13} /> Trending Searches
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-400">
                  <Command size={10} /> + K to toggle
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-slate-800/70 hover:bg-[#FFF1F2] dark:hover:bg-[#D71920]/20 border border-neutral-200/90 dark:border-slate-700 text-xs font-bold text-neutral-700 dark:text-slate-200 hover:text-[#D71920] transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Authors & Publishers Quick Cards */}
          {(results.authors.length > 0 || results.publishers.length > 0) && searchQuery.trim() && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.authors.length > 0 && (
                <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-slate-800/50 border border-neutral-200/80 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D71920] flex items-center gap-1">
                    <Users size={12} /> Authors (লেখক)
                  </span>
                  <div className="space-y-1.5">
                    {results.authors.slice(0, 3).map((auth) => (
                      <button
                        key={auth.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery(auth.name);
                          setSelectedCategoryFilter('all');
                          setIsSearchSpotlightOpen(false);
                          setActivePage('books');
                        }}
                        className="w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900/70 hover:bg-[#FFF1F2] text-xs font-bold text-neutral-800 dark:text-slate-100 border border-neutral-100 dark:border-slate-700 cursor-pointer"
                      >
                        <span className="truncate">{auth.name}</span>
                        <ArrowRight size={12} className="text-[#D71920] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.publishers.length > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Building2 size={12} /> Publishers (প্রকাশনী)
                  </span>
                  <div className="space-y-1.5">
                    {results.publishers.slice(0, 3).map((pub) => (
                      <button
                        key={pub.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery(pub.name);
                          setSelectedCategoryFilter('all');
                          setIsSearchSpotlightOpen(false);
                          setActivePage('books');
                        }}
                        className="w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900/70 hover:bg-emerald-50 text-xs font-bold text-neutral-800 dark:text-slate-100 border border-emerald-100 dark:border-slate-700 cursor-pointer"
                      >
                        <span className="truncate">
                          {pub.name}
                          {pub.banglaName && pub.banglaName !== pub.name
                            ? ` (${pub.banglaName})`
                            : ''}
                        </span>
                        <ArrowRight size={12} className="text-emerald-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Product Results */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Layers size={13} className="text-[#D71920]" />
                {searchQuery.trim()
                  ? `Search Results (${results.products.length})`
                  : 'Popular & Featured Items'}
              </span>
              <button
                type="button"
                onClick={handleViewAllCatalog}
                className="text-xs font-extrabold text-[#D71920] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Catalog</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {results.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {results.products.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-testid="spotlight-result-card"
                    onClick={() => {
                      setIsSearchSpotlightOpen(false);
                      setActivePage('product-detail', item.id);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl border border-neutral-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 hover:border-[#D71920] hover:bg-[#FFF8F8] dark:hover:bg-slate-800 transition-all text-left cursor-pointer group shadow-2xs"
                  >
                    <div className="w-12 h-14 rounded-xl bg-neutral-50 dark:bg-slate-800 border border-neutral-100 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300">
                          {item.type === 'book' ? 'Book' : 'Stationery'}
                        </span>
                        <span className="text-[10px] text-neutral-400 truncate">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white truncate mt-0.5 group-hover:text-[#D71920]">
                        {item.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10.5px] text-neutral-500 dark:text-slate-400 truncate max-w-[130px]">
                          {item.type === 'book'
                            ? item.author || item.publisher || 'Original Edition'
                            : item.brand || 'Authentic Supply'}
                        </span>
                        <span className="text-xs font-black text-[#D71920] tabular-nums">
                          ৳{item.price}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-slate-700">
                <Search size={28} className="mx-auto text-neutral-300 mb-2" />
                <p className="text-xs font-bold text-neutral-600 dark:text-slate-300">
                  "{searchQuery}" নামে কোনো বই বা প্রোডাক্ট পাওয়া যায়নি
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-bold text-[#D71920] hover:underline cursor-pointer"
                >
                  Clear search query
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
