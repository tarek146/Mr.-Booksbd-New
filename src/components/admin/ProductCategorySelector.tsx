import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Category, ProductType } from '../../types';
import {
  getSelectableProductCategories,
  toggleProductCategorySelection,
} from '../../utils/productCategoryHelpers';

export interface ProductCategorySelectorProps {
  categories: Category[];
  productType: ProductType;
  selectedCategories: string[];
  onChange: (nextSelected: string[]) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductCategorySelector: React.FC<ProductCategorySelectorProps> = ({
  categories,
  productType,
  selectedCategories,
  onChange,
  isOpen,
  onOpenChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const allChoices = useMemo(
    () => getSelectableProductCategories(categories, productType, selectedCategories),
    [categories, productType, selectedCategories]
  );

  const visibleChoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allChoices;
    return allChoices.filter(c => c.name.toLowerCase().includes(q));
  }, [allChoices, searchQuery]);

  // Reset filter query whenever dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    } else {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  // Close cleanly on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  const handleToggle = (categoryName: string) => {
    onChange(toggleProductCategorySelection(selectedCategories, categoryName));
  };

  return (
    <div
      ref={containerRef}
      data-testid="product-multi-category-picker"
      className="relative space-y-2"
    >
      {/* Header Label Row */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="product-category-dropdown-trigger"
          className="block text-xs font-semibold text-slate-700"
        >
          Categories <span className="text-[#D71920]">*</span>
        </label>
        <div className="flex items-center gap-2.5">
          {selectedCategories.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] font-medium text-slate-500 hover:text-[#D71920] transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
          <span
            data-testid="product-category-selected-count"
            className="text-[11px] font-medium text-slate-500 tabular-nums"
          >
            {selectedCategories.length} selected
          </span>
        </div>
      </div>

      {/* Collapsible Trigger Button + Anchored Floating Dropdown */}
      <div className="relative">
        <button
          id="product-category-dropdown-trigger"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          data-testid="product-category-dropdown-trigger"
          onClick={() => onOpenChange(!isOpen)}
          className={`w-full min-h-[42px] px-3.5 py-2.5 rounded-lg border bg-white text-left flex items-center justify-between gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D71920]/20 ${
            isOpen
              ? 'border-[#D71920] ring-2 ring-[#D71920]/10'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span
            className={`text-xs truncate ${
              selectedCategories.length === 0
                ? 'text-slate-400 font-normal'
                : 'text-slate-900 font-medium'
            }`}
          >
            {selectedCategories.length === 0
              ? 'Select categories...'
              : selectedCategories.join(', ')}
          </span>
          <ChevronDown
            size={15}
            className={`text-slate-400 shrink-0 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#D71920]' : ''
            }`}
          />
        </button>

        {/* Floating Multi-Select Dropdown Panel (Hidden until clicked) */}
        {isOpen && (
          <div
            role="listbox"
            aria-multiselectable="true"
            data-testid="product-category-dropdown-menu"
            className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border border-slate-200 bg-white shadow-[0_14px_34px_-10px_rgba(15,23,42,0.18)] overflow-hidden"
          >
            {allChoices.length > 4 && (
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
                <Search size={13} className="text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  data-testid="product-category-search-input"
                  className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear category search"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
              {visibleChoices.length === 0 ? (
                <p className="px-3.5 py-4 text-xs text-slate-400 text-center">
                  No matching categories found.
                </p>
              ) : (
                visibleChoices.map(c => {
                  const checked = selectedCategories.some(
                    sel => sel.toLowerCase() === c.name.toLowerCase()
                  );
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                        checked
                          ? 'bg-rose-50/60 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggle(c.name)}
                          className="w-4 h-4 rounded border-slate-300 text-[#D71920] accent-[#D71920] cursor-pointer shrink-0"
                        />
                        <span className="truncate">{c.name}</span>
                      </span>
                      {checked && (
                        <Check size={13} className="text-[#D71920] shrink-0" />
                      )}
                    </label>
                  );
                })
              )}
            </div>

            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 tabular-nums">
                {selectedCategories.length === 0
                  ? 'Choose 1 or more categories'
                  : `${selectedCategories.length} selected`}
              </span>
              <button
                type="button"
                data-testid="product-category-dropdown-done"
                onClick={() => onOpenChange(false)}
                className="px-3 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Items Summary (only visible when at least one category is selected) */}
      {selectedCategories.length > 0 && (
        <div
          data-testid="product-category-selected-tags"
          className="flex flex-wrap gap-1.5 pt-0.5"
        >
          {selectedCategories.map((catName, idx) => (
            <span
              key={`sel-cat-${catName}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-800 border border-slate-200 text-[11px] font-medium"
            >
              <span className="truncate max-w-[160px]">{catName}</span>
              {idx === 0 && selectedCategories.length > 1 && (
                <span className="text-[10px] text-slate-500 font-normal">Primary</span>
              )}
              <button
                type="button"
                aria-label={`Remove ${catName}`}
                onClick={() => handleToggle(catName)}
                className="text-slate-400 hover:text-[#D71920] transition-colors cursor-pointer p-0.5 -mr-0.5"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
