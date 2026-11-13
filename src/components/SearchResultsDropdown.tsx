import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { filterSpotlightSearch } from '../utils/storeEnhancementsHelpers';
import { ArrowRight, BookOpen, Building2, Search, Users } from 'lucide-react';

interface SearchResultsDropdownProps {
  query: string;
  onClose: () => void;
  testId?: string;
}

export function SearchResultsDropdown({
  query,
  onClose,
  testId = 'search-results-dropdown',
}: SearchResultsDropdownProps) {
  const {
    products,
    authors,
    publishers,
    categories,
    setSearchQuery,
    setSelectedCategoryFilter,
    setActivePage,
  } = useStore();

  const trimmed = query.trim();

  const results = useMemo(() => {
    if (!trimmed) {
      return { products: [], authors: [], publishers: [], categories: [] };
    }
    return filterSpotlightSearch(trimmed, 'all', products, authors, publishers, categories);
  }, [trimmed, products, authors, publishers, categories]);

  if (!trimmed) return null;

  const hasMatches =
    results.products.length > 0 ||
    results.authors.length > 0 ||
    results.publishers.length > 0;

  const handleOpenCatalog = () => {
    const allStationery =
      results.products.length > 0 && results.products.every(p => p.type === 'stationery');
    onClose();
    setActivePage(allStationery ? 'stationery' : 'books');
  };

  return (
    <div
      data-testid={testId}
      role="region"
      aria-label="Search suggestions"
      className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#111827] border border-neutral-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="max-h-[65vh] overflow-y-auto divide-y divide-neutral-100 dark:divide-slate-800">
        {/* Matching Writers & Publishers (Quiet inline rows, no pill cards) */}
        {(results.authors.length > 0 || results.publishers.length > 0) && (
          <div className="py-1.5">
            {results.authors.slice(0, 2).map(auth => (
              <button
                key={`auth-${auth.id}`}
                type="button"
                onClick={() => {
                  setSearchQuery(auth.name);
                  setSelectedCategoryFilter('all');
                  onClose();
                  setActivePage('books');
                }}
                className="w-full px-3.5 py-2 flex items-center justify-between gap-3 text-left hover:bg-neutral-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Users size={14} className="text-neutral-400 shrink-0" />
                  <span className="text-xs font-semibold text-neutral-800 dark:text-slate-100 truncate">
                    {auth.name}
                  </span>
                  <span className="text-[11px] text-neutral-400 shrink-0">Author</span>
                </span>
                <ArrowRight size={13} className="text-neutral-400 shrink-0" />
              </button>
            ))}

            {results.publishers.slice(0, 2).map(pub => (
              <button
                key={`pub-${pub.id}`}
                type="button"
                onClick={() => {
                  setSearchQuery(pub.name);
                  setSelectedCategoryFilter('all');
                  onClose();
                  setActivePage('books');
                }}
                className="w-full px-3.5 py-2 flex items-center justify-between gap-3 text-left hover:bg-neutral-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Building2 size={14} className="text-neutral-400 shrink-0" />
                  <span className="text-xs font-semibold text-neutral-800 dark:text-slate-100 truncate">
                    {pub.name}
                    {pub.banglaName && pub.banglaName !== pub.name ? ` (${pub.banglaName})` : ''}
                  </span>
                  <span className="text-[11px] text-neutral-400 shrink-0">Publisher</span>
                </span>
                <ArrowRight size={13} className="text-neutral-400 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Matching Books & Stationery */}
        {results.products.length > 0 ? (
          <div className="divide-y divide-neutral-100 dark:divide-slate-800/80">
            {results.products.slice(0, 6).map(item => (
              <button
                key={item.id}
                type="button"
                data-testid="search-result-item"
                onClick={() => {
                  onClose();
                  setActivePage('product-detail', item.id);
                }}
                className="w-full px-3.5 py-2.5 flex items-center gap-3 text-left hover:bg-neutral-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
              >
                <div className="w-9 h-12 rounded-md bg-neutral-100 dark:bg-slate-800 border border-neutral-200/70 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen size={14} className="text-neutral-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white truncate group-hover:text-[#D71920] transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                    <span className="truncate">
                      {item.type === 'book'
                        ? item.author || item.publisher || 'Original Edition'
                        : item.brand || 'Stationery'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{item.category}</span>
                  </div>
                </div>

                <div className="text-xs font-bold text-[#D71920] tabular-nums shrink-0">
                  ৳{item.price}
                </div>
              </button>
            ))}
          </div>
        ) : !hasMatches ? (
          <div className="px-4 py-6 text-center">
            <Search size={20} className="mx-auto text-neutral-300 dark:text-slate-600 mb-1.5" />
            <p className="text-xs font-medium text-neutral-600 dark:text-slate-300">
              "{trimmed}" নামে কোনো বই বা প্রোডাক্ট পাওয়া যায়নি
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-1.5 text-xs font-semibold text-[#D71920] hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : null}

        {/* Footer link to full catalog */}
        {hasMatches && (
          <button
            type="button"
            onClick={handleOpenCatalog}
            className="w-full px-3.5 py-2.5 bg-neutral-50/80 dark:bg-slate-900/60 hover:bg-neutral-100 dark:hover:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-slate-200 hover:text-[#D71920] flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="truncate">View all results for "{trimmed}"</span>
            <ArrowRight size={13} className="shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
