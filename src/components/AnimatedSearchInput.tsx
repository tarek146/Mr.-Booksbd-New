import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

interface AnimatedSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onFocus?: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  onEscape?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showSubmitButton?: boolean;
  autoFocus?: boolean;
  inputTestId?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function AnimatedSearchInput({
  value,
  onChange,
  onFocus,
  onSubmit,
  onEscape,
  placeholder = 'বই, লেখক বা প্রকাশনী খুঁজুন...',
  className = '',
  inputClassName = '',
  showSubmitButton = true,
  autoFocus = false,
  inputTestId,
  inputRef: externalRef,
}: AnimatedSearchInputProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const resolvedRef = externalRef || internalRef;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      <div className="relative flex items-center rounded-xl bg-neutral-100/80 dark:bg-[#151C2A] hover:bg-white dark:hover:bg-[#1A2334] focus-within:bg-white dark:focus-within:bg-[#1A2334] border border-neutral-200 dark:border-[#2B374C] focus-within:border-[#D71920] transition-colors">
        <div className="pl-3.5 pr-2 flex items-center text-neutral-400 pointer-events-none">
          <Search size={16} strokeWidth={2} />
        </div>

        <input
          ref={resolvedRef}
          type="text"
          autoFocus={autoFocus}
          data-testid={inputTestId}
          aria-label="Search books, authors, or publishers"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => onFocus?.()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onEscape?.();
            }
          }}
          placeholder={placeholder}
          className={`flex-1 min-w-0 py-2.5 pr-2 bg-transparent text-sm sm:text-[13px] font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-slate-400 focus:outline-none ${inputClassName}`}
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              resolvedRef.current?.focus();
            }}
            className="p-1.5 mr-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Clear search query"
          >
            <X size={15} />
          </button>
        )}

        {showSubmitButton && (
          <button
            type="submit"
            className="mr-1.5 px-3.5 py-1.5 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            Search
          </button>
        )}
      </div>
    </form>
  );
}
