import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, BookOpen, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Author } from '../types';

export function FeaturedAuthorsSection() {
  const { authors, setActivePage, setSelectedCategoryFilter } = useStore();
  const [authorImgErrors, setAuthorImgErrors] = useState<Record<string, boolean>>({});
  const authorsScrollRef = useRef<HTMLDivElement>(null);

  const handleAuthorClick = (_author: Author) => {
    setSelectedCategoryFilter('');
    setActivePage('authors');
  };

  const scrollContainer = (direction: 'left' | 'right') => {
    if (authorsScrollRef.current) {
      const scrollAmount = authorsScrollRef.current.clientWidth * 0.75;
      authorsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const displayAuthors = authors.length > 0 ? authors : [];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Clean Header matching site design */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 pb-1 border-b border-[#F0F0F0]">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-[#171717] tracking-tight">
            Featured Authors
          </h2>
        </div>
        <button 
          onClick={() => setActivePage('authors')}
          className="text-xs font-bold text-[#D71920] hover:text-[#B9151B] flex items-center gap-1 group cursor-pointer shrink-0"
        >
          <span>All Writers ({authors.length})</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Single Row Horizontal Slider with Arrow Navigation */}
      <div className="relative group/authors-slider">
        <button 
          onClick={() => scrollContainer('left')}
          className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/authors-slider:opacity-100 cursor-pointer active:scale-90"
          aria-label="Scroll Authors Left"
        >
          <ChevronLeft size={18} />
        </button>

        <button 
          onClick={() => scrollContainer('right')}
          className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#E5E5E5] shadow-lg flex items-center justify-center text-[#171717] hover:bg-[#D71920] hover:text-white hover:border-[#D71920] transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover/authors-slider:opacity-100 cursor-pointer active:scale-90"
          aria-label="Scroll Authors Right"
        >
          <ChevronRight size={18} />
        </button>

        <div 
          ref={authorsScrollRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-1 px-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayAuthors.map((author) => {
            const hasPhoto = !!author.photoUrl && !authorImgErrors[author.id];
            return (
              <div 
                key={author.id}
                onClick={() => handleAuthorClick(author)}
                className="w-[calc(80%-8px)] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] shrink-0 snap-start bg-white border border-[#E5E5E5] hover:border-[#D71920]/40 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Accent Line on Hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#D71920] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-3">
                  {/* Author Profile Picture Avatar */}
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#D71920] via-rose-400 to-amber-300 shadow-xs shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                        {hasPhoto ? (
                          <img 
                            src={author.photoUrl} 
                            alt={author.name} 
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                            onError={() => setAuthorImgErrors(prev => ({ ...prev, [author.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full bg-[#D71920] text-white font-black flex items-center justify-center text-base">
                            {author.name ? author.name[0] : 'A'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-[#171717] group-hover:text-[#D71920] transition-colors truncate">
                        {author.name}
                      </h3>
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5F6368] bg-[#F7F7F8] px-2 py-0.5 rounded-md border border-[#E5E5E5] mt-1">
                        <BookOpen size={10} className="text-[#D71920]" />
                        <span>{author.booksCount || 15}+ Publications</span>
                      </div>
                    </div>
                  </div>

                  {/* Biography snippet */}
                  <p className="text-xs text-[#5F6368] line-clamp-2 leading-relaxed">
                    {author.bio || 'Beloved Bangladeshi author known for iconic storytelling.'}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2.5 mt-3 border-t border-[#F0F0F0] flex items-center justify-between text-xs font-bold text-[#D71920] group-hover:text-[#B9151B]">
                  <span className="flex items-center gap-1 text-[11px]">
                    <UserCheck size={12} /> Explore Books
                  </span>
                  <div className="w-5 h-5 rounded-full bg-[#FFF1F2] group-hover:bg-[#D71920] text-[#D71920] group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
