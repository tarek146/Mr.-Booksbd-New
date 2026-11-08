import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { buildEnrichedPublishersList } from '../utils/publisherAndDeliveryHelpers';
import { PublishersPageSkeleton } from '../components/SkeletonScreens';
import { shouldShowSkeletonScreen } from '../utils/instantStoreCache';
import { Layers, ArrowRight, Search, BookOpen, Building2, Sparkles } from 'lucide-react';

export function PublishersPage() {
  const { publishers, products, isLoading, settings, setActivePage, setSearchQuery, setSelectedCategoryFilter } = useStore();
  const [filterText, setFilterText] = useState('');

  const enrichedPublishers = useMemo(
    () => buildEnrichedPublishersList(publishers, products),
    [publishers, products]
  );

  const filteredPublishers = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return enrichedPublishers;
    return enrichedPublishers.filter(
      pub =>
        pub.name.toLowerCase().includes(q) ||
        (pub.banglaName && pub.banglaName.toLowerCase().includes(q)) ||
        (pub.description && pub.description.toLowerCase().includes(q))
    );
  }, [enrichedPublishers, filterText]);

  const handlePublisherClick = (publisherName: string) => {
    setSelectedCategoryFilter('all');
    setSearchQuery(publisherName);
    setActivePage('books');
  };

  if (shouldShowSkeletonScreen(isLoading, settings.enableSkeletonLoading)) {
    return <PublishersPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white transition-colors py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Search Bar */}
        <div className="pb-4 border-b border-[#EEEEEE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D71920] text-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#171717] tracking-tight">
                  Publishers
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#D71920] text-xs font-extrabold border border-[#D71920]/25">
                  {enrichedPublishers.length}
                </span>
              </div>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Explore all official publishing houses and their published books
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Search publishers..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-xs font-semibold text-[#171717] focus:outline-none focus:border-[#D71920]"
            />
          </div>
        </div>

        {/* Publishers Grid */}
        {filteredPublishers.length === 0 ? (
          <div className="p-10 text-center rounded-3xl border border-[#E5E5E5] bg-[#F7F7F8] space-y-3">
            <Layers size={36} className="mx-auto text-neutral-400" />
            <h3 className="text-base font-bold text-[#171717]">No Publishers Found</h3>
            <p className="text-xs text-[#5F6368]">Try searching with a different publisher name.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPublishers.map(pub => (
              <div
                key={pub.id}
                onClick={() => handlePublisherClick(pub.name)}
                className="bg-white border border-[#E5E5E5] hover:border-[#D71920] rounded-3xl p-5 sm:p-6 cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#D71920]/20 shrink-0 group-hover:scale-105 transition-all shadow-xs bg-[#FFF1F2] flex items-center justify-center">
                      {pub.logoUrl ? (
                        <img
                          src={pub.logoUrl}
                          alt={pub.name}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-[#D71920] font-black text-xl">
                          {(pub.banglaName || pub.name)[0]}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {pub.isFeatured !== false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF1F2] text-[#D71920] text-[10px] font-bold border border-[#D71920]/20">
                            <Sparkles size={10} /> Verified Publisher
                          </span>
                        )}
                        {pub.establishedYear && (
                          <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                            Est. {pub.establishedYear}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-base text-[#171717] group-hover:text-[#D71920] transition-colors mt-1 truncate">
                        {pub.banglaName ? `${pub.banglaName}` : pub.name}
                      </h3>
                      {pub.banglaName && pub.banglaName !== pub.name && (
                        <p className="text-xs font-bold text-[#5F6368] truncate">{pub.name}</p>
                      )}
                    </div>
                  </div>

                  {pub.description && (
                    <p className="text-xs text-[#5F6368] mt-3.5 line-clamp-2 leading-relaxed">
                      {pub.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#EEEEEE] flex items-center justify-between text-xs font-bold text-[#D71920]">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} />
                    <span>
                      {pub.displayBooksCount} {pub.displayBooksCount === 1 ? 'Book' : 'Books'}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Books <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
