import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Search,
  Sparkles,
  X,
  SlidersHorizontal,
} from 'lucide-react';

interface AnimatedSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onFocus?: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholderPrefix?: string;
  className?: string;
  inputClassName?: string;
  showSubmitButton?: boolean;
  spotlightTrigger?: boolean;
}

const ROTATING_ICONIC_HINTS = [
  'Search Books, Authors, Publishers...',
  'বই, লেখক বা প্রকাশনী খুঁজুন মুহূর্তেই...',
  'Stationery, Diaries, Fountain Pens...',
  'Type to discover 100% original titles',
];

export function AnimatedSearchInput({
  value,
  onChange,
  onFocus,
  onSubmit,
  className = '',
  inputClassName = '',
  showSubmitButton = true,
  spotlightTrigger = false,
}: AnimatedSearchInputProps) {
  const { setIsSearchSpotlightOpen } = useStore();
  const [hintIdx, setHintIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value || isFocused) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setHintIdx((prev) => (prev + 1) % ROTATING_ICONIC_HINTS.length);
        setIsFading(false);
      }, 260);
    }, 3000);
    return () => clearInterval(interval);
  }, [value, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  // Spotlight Launcher Mode for Navbar (Totally Iconic Capsule Look)
  if (spotlightTrigger) {
    return (
      <div
        data-testid="iconic-search-bar"
        className={`relative w-full ${className}`}
      >
        <div
          onClick={() => setIsSearchSpotlightOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsSearchSpotlightOpen(true);
            }
          }}
          className="group w-full flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-2xl bg-neutral-100/80 dark:bg-[#151C2A] hover:bg-white dark:hover:bg-[#1A2334] border border-neutral-200/90 dark:border-[#2B374C] hover:border-[#D71920]/60 shadow-2xs hover:shadow-md transition-all cursor-pointer"
        >
          {/* Iconic Red Pulse Lens Badge */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D71920] to-[#B01218] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <Search size={15} strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0 overflow-hidden h-5 flex items-center">
            <span
              className={`text-xs font-semibold truncate block transition-all duration-200 ${
                value
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-slate-300'
              } ${isFading && !value ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
            >
              {value || ROTATING_ICONIC_HINTS[hintIdx]}
            </span>
          </div>

          {/* Interactive Iconic Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-[10px] font-black text-neutral-500 dark:text-slate-300 shadow-2xs">
              <Sparkles size={10} className="text-[#D71920]" />
              <span>⌘K</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-neutral-900 dark:bg-[#D71920] text-white text-[10px] font-extrabold tracking-wide flex items-center gap-1">
              <SlidersHorizontal size={10} />
              <span>Find</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Inline Filter Mode (used inside BooksPage & StationeryPage)
  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      <div className="relative flex items-center rounded-2xl bg-white dark:bg-[#161C28] border border-neutral-200 dark:border-[#2B374C] focus-within:border-[#D71920] focus-within:ring-2 focus-within:ring-[#D71920]/15 shadow-2xs transition-all overflow-hidden">
        <div className="pl-2 pr-1.5 py-1 flex items-center">
          <div className="w-7 h-7 rounded-xl bg-[#FFF1F2] dark:bg-[#D71920]/20 text-[#D71920] flex items-center justify-center shrink-0">
            <Search size={14} strokeWidth={2.5} />
          </div>
        </div>

        <div className="relative flex-1 min-w-0 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={ROTATING_ICONIC_HINTS[hintIdx]}
            className={`w-full py-2 pr-8 bg-transparent text-xs font-semibold text-[#171717] dark:text-white placeholder:text-neutral-400 focus:outline-none ${inputClassName}`}
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#D71920] p-1 cursor-pointer"
              aria-label="Clear filter"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {showSubmitButton ? (
          <button
            type="submit"
            className="mr-1.5 px-3 py-1.5 bg-[#D71920] hover:bg-[#B9151B] text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer shrink-0"
          >
            Search
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsSearchSpotlightOpen(true)}
            title="Open Full Iconic Search"
            className="mr-1.5 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-slate-800 hover:bg-[#FFF1F2] text-neutral-600 dark:text-slate-300 hover:text-[#D71920] text-[10px] font-black cursor-pointer shrink-0 flex items-center gap-1 transition-colors"
          >
            <Sparkles size={10} className="text-[#D71920]" />
            <span className="hidden sm:inline">Spotlight</span>
          </button>
        )}
      </div>
    </form>
  );
}
