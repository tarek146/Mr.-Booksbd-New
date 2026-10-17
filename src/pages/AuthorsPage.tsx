import React from 'react';
import { useStore } from '../context/StoreContext';
import { Award, ArrowRight } from 'lucide-react';

export function AuthorsPage() {
  const { authors, setActivePage, setSearchQuery } = useStore();

  const handleAuthorClick = (authorName: string) => {
    setSearchQuery(authorName);
    setActivePage('books');
  };

  return (
    <div className="min-h-screen bg-white transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 pb-3 border-b border-[#EEEEEE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#D71920] text-white rounded-xl flex items-center justify-center shadow-sm">
              <Award size={16} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#171717] tracking-tight">
              Featured Authors & Writers
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {authors.map(author => (
            <div 
              key={author.id}
              onClick={() => handleAuthorClick(author.name)}
              className="bg-white border border-[#E5E5E5] hover:border-[#D71920] rounded-3xl p-6 text-center cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#D71920]/25 mx-auto mb-4 group-hover:scale-105 transition-all shadow-md bg-[#FFF1F2] flex items-center justify-center">
                  {author.photoUrl ? (
                    <img 
                      src={author.photoUrl} 
                      alt={author.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[#D71920] font-black text-2xl group-hover:text-white">
                      {author.name[0]}
                    </span>
                  )}
                </div>
                <h3 className="font-black text-base text-[#171717] group-hover:text-[#D71920] transition-colors">
                  {author.name}
                </h3>
                <p className="text-xs text-[#5F6368] mt-2 line-clamp-3 leading-relaxed">
                  {author.bio}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#EEEEEE] flex items-center justify-between text-xs font-bold text-[#D71920]">
                <span>{author.booksCount || 15}+ Published Books</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
