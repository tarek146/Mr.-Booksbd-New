import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface AnimatedSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onFocus?: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholderPrefix?: string;
  className?: string;
  inputClassName?: string;
  showSubmitButton?: boolean;
}

const ROTATING_SEARCH_SUGGESTIONS = [
  'Search by Book Title (e.g. Paradoxical Sajid, Himu...)',
  'Search by Author / Writer (e.g. Humayun Ahmed, Arif Azad...)',
  'Search by Topic or Category (e.g. Islamic Books, Novels...)',
  'বইয়ের নাম দিয়ে খুঁজুন (যেমন: প্যারাডক্সিক্যাল সাজিদ, দেবদাস)',
  'লেখকের নাম দিয়ে খুঁজুন (যেমন: হুমায়ূন আহমেদ, আরিফ আজাদ)',
  'বিষয় বা বিষয়বস্তু দিয়ে খুঁজুন (যেমন: ইসলামি বই, উপন্যাস)'
];

export function AnimatedSearchInput({
  value,
  onChange,
  onFocus,
  onSubmit,
  className = '',
  inputClassName = '',
  showSubmitButton = true
}: AnimatedSearchInputProps) {
  const [currentTextIdx, setCurrentTextIdx] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Cycle rotating placeholder text every 2.8 seconds with vertical slide animation
  useEffect(() => {
    if (value || isFocused) return;

    const interval = setInterval(() => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setCurrentTextIdx((prev) => (prev + 1) % ROTATING_SEARCH_SUGGESTIONS.length);
        setIsAnimatingOut(false);
      }, 350); // duration of slide transition
    }, 2800);

    return () => clearInterval(interval);
  }, [value, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  const showOverlay = !value && !isFocused;

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 z-10 shrink-0" size={16} />
      
      <div className="relative w-full flex items-center">
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (onFocus) onFocus();
          }}
          onBlur={() => setIsFocused(false)}
          className={`w-full pl-9 ${showSubmitButton ? 'pr-20' : 'pr-8'} py-2 bg-neutral-50 border border-neutral-200 rounded-full text-xs font-medium text-[#171717] focus:outline-none focus:bg-white focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 transition-all ${inputClassName}`}
        />

        {/* Vertical Sliding Placeholder Text Overlay */}
        {showOverlay && (
          <div className="absolute left-9 right-20 top-1/2 -translate-y-1/2 overflow-hidden h-5 pointer-events-none flex items-center select-none z-0">
            <span 
              className={`text-xs text-neutral-400 font-normal truncate block transition-all duration-300 ease-in-out transform ${
                isAnimatingOut 
                  ? '-translate-y-full opacity-0' 
                  : 'translate-y-0 opacity-100'
              }`}
            >
              {ROTATING_SEARCH_SUGGESTIONS[currentTextIdx]}
            </span>
          </div>
        )}

        {/* Clear Button if value present */}
        {value && (
          <button 
            type="button"
            onClick={() => onChange('')}
            className="absolute right-16 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#D71920] p-1 cursor-pointer z-10"
          >
            <X size={14} />
          </button>
        )}

        {/* Submit button */}
        {showSubmitButton && (
          <button 
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1 bg-[#D71920] hover:bg-[#C5161C] text-white text-[11px] font-bold rounded-full transition-all cursor-pointer active:scale-95 shadow-2xs z-10"
          >
            Search
          </button>
        )}
      </div>
    </form>
  );
}
