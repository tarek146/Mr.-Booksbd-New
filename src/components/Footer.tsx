import React from 'react';
import { useStore } from '../context/StoreContext';
import { BookOpen, Phone, Mail, MapPin, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export function Footer() {
  const { settings, setActivePage, setSelectedCategoryFilter } = useStore();

  return (
    <footer className="bg-[#121212] text-zinc-300 pt-10 sm:pt-12 pb-10 sm:pb-12 border-t border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Top 4 Value Pillars - Boxed Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm hover:border-zinc-700 transition-colors">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#28282a] text-[#D71920] rounded-xl flex items-center justify-center shrink-0 border border-zinc-700/60 shadow-2xs">
              <Truck size={18} />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Nationwide Delivery</h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Inside Dhaka 48h, Outside 72h</p>
            </div>
          </div>

          <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm hover:border-zinc-700 transition-colors">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#28282a] text-[#D71920] rounded-xl flex items-center justify-center shrink-0 border border-zinc-700/60 shadow-2xs">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">100% Original Guarantee</h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Directly from publishers</p>
            </div>
          </div>

          <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm hover:border-zinc-700 transition-colors">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#28282a] text-[#D71920] rounded-xl flex items-center justify-center shrink-0 border border-zinc-700/60 shadow-2xs">
              <RefreshCw size={18} />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Instant Order Support</h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">bKash, Nagad & COD verified</p>
            </div>
          </div>

          <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm hover:border-zinc-700 transition-colors">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#28282a] text-[#D71920] rounded-xl flex items-center justify-center shrink-0 border border-zinc-700/60 shadow-2xs">
              <Phone size={18} />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Customer Helpline</h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">{settings.phone}</p>
            </div>
          </div>
        </div>

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

          {/* Side-by-Side Quick Links & Categories Box on Mobile (grid-cols-2) */}
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            {/* Quick Links Box */}
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

            {/* Categories Box */}
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

          {/* Payments & Admin-Managed Info Box */}
          <div className="md:col-span-3 bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-800 pb-2">
              Payment Options
            </h4>
            <p className="text-xs text-zinc-400">
              Verified manual transactions supported:
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-[#28282a] border border-zinc-700/70 p-2 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-pink-400 shadow-2xs">bKash</div>
              <div className="bg-[#28282a] border border-zinc-700/70 p-2 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-orange-400 shadow-2xs">Nagad</div>
              <div className="bg-[#28282a] border border-zinc-700/70 p-2 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-purple-400 shadow-2xs">Rocket</div>
              <div className="bg-[#28282a] border border-zinc-700/70 p-2 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-blue-400 shadow-2xs">Upay</div>
              <div className="bg-[#28282a] border border-zinc-700/70 p-2 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-emerald-400 shadow-2xs">Bank</div>
              <div className="bg-[#28282a] border border-zinc-700/70 p-2 rounded-xl text-center text-[10px] sm:text-[11px] font-bold text-white shadow-2xs">COD</div>
            </div>
          </div>
        </div>

        {/* Bottom Boxed Copyright Footer */}
        <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2 shadow-sm">
          <p>© {new Date().getFullYear()} MR. BOOKS Bangladesh. All rights reserved.</p>
          <p className="text-zinc-500 text-[11px]">
            Designed for book lovers in Bangladesh.
          </p>
        </div>

      </div>
    </footer>
  );
}
