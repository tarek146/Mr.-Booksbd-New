import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Search, Upload, X } from 'lucide-react';
import { Product, ProductType } from '../../types';
import {
  clampCategoryHomeLimit,
  getProductsEligibleForCategoryModal,
} from '../../utils/categoryHomeHelpers';
import { productHasCategory } from '../../utils/productCategoryHelpers';

export interface CategoryEditorModalProps {
  isOpen: boolean;
  editingCatId: string | null;
  catName: string;
  setCatName: (v: string) => void;
  catType: ProductType;
  setCatType: (v: ProductType) => void;
  catImage: string;
  setCatImage: (v: string) => void;
  catShowProductsOnHome: boolean;
  setCatShowProductsOnHome: (v: boolean) => void;
  catHomeProductLimit: number;
  setCatHomeProductLimit: (v: number) => void;
  catHomeFeaturedProductIds: string[];
  setCatHomeFeaturedProductIds: React.Dispatch<React.SetStateAction<string[]>>;
  catDisplayOrder: number;
  setCatDisplayOrder: (v: number) => void;
  products: Product[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PRESET_LIMITS = [4, 5, 8, 10, 12, 15];

export const CategoryEditorModal: React.FC<CategoryEditorModalProps> = ({
  isOpen,
  editingCatId,
  catName,
  setCatName,
  catType,
  setCatType,
  catImage,
  setCatImage,
  catShowProductsOnHome,
  setCatShowProductsOnHome,
  catHomeProductLimit,
  setCatHomeProductLimit,
  catHomeFeaturedProductIds,
  setCatHomeFeaturedProductIds,
  catDisplayOrder,
  setCatDisplayOrder,
  products,
  onClose,
  onSave,
  onUploadFile,
}) => {
  const [productSearch, setProductSearch] = useState('');
  const [limitDraft, setLimitDraft] = useState<string>(String(catHomeProductLimit));

  useEffect(() => {
    setLimitDraft(String(catHomeProductLimit));
  }, [catHomeProductLimit, isOpen]);

  useEffect(() => {
    if (!isOpen) setProductSearch('');
  }, [isOpen]);

  const eligibleProducts = useMemo(() => {
    return getProductsEligibleForCategoryModal(products, catType, catName);
  }, [products, catType, catName]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return eligibleProducts;
    return eligibleProducts.filter(p => {
      const titleMatch = (p.title || '').toLowerCase().includes(q);
      const authorMatch = (p.author || '').toLowerCase().includes(q);
      const skuMatch = (p.sku || '').toLowerCase().includes(q);
      const catMatch = (p.category || '').toLowerCase().includes(q);
      return titleMatch || authorMatch || skuMatch || catMatch;
    });
  }, [eligibleProducts, productSearch]);

  if (!isOpen) return null;

  const handleTypeChange = (nextType: ProductType) => {
    setCatType(nextType);
    // Keep only selected IDs that belong to the chosen product type so books/stationery never mix
    setCatHomeFeaturedProductIds(prev =>
      prev.filter(id => {
        const prod = products.find(p => p.id === id);
        return prod && prod.type === nextType;
      })
    );
  };

  const toggleProductSelection = (productId: string) => {
    setCatHomeFeaturedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const moveSelectedProduct = (productId: string, direction: 'up' | 'down') => {
    setCatHomeFeaturedProductIds(prev => {
      const idx = prev.indexOf(productId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
  };

  const commitLimitDraft = (raw: string) => {
    const parsed = parseInt(raw, 10);
    const clamped = clampCategoryHomeLimit(parsed);
    setCatHomeProductLimit(clamped);
    setLimitDraft(String(clamped));
  };

  return (
    <div
      data-testid="admin-category-editor-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#E5E5E5] max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 sm:px-7 py-4 border-b border-[#EEEEEE] shrink-0 bg-white">
          <h3 className="text-lg font-black text-[#171717]">
            {editingCatId ? 'Edit Category' : 'Add New Category'}
          </h3>
          <button
            type="button"
            aria-label="Close Category Modal"
            onClick={onClose}
            className="text-[#777777] hover:text-[#171717] p-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={e => {
            commitLimitDraft(limitDraft);
            onSave(e);
          }}
          className="flex flex-col flex-1 min-h-0 text-xs"
        >
          <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-4 space-y-4">
          {/* Category Name */}
          <div>
            <label className="block font-bold text-[#171717] mb-1.5 uppercase tracking-wider text-[11px]">
              Category Name
            </label>
            <input
              type="text"
              required
              data-testid="category-modal-name-input"
              placeholder="e.g. Islamic Books"
              value={catName}
              onChange={e => setCatName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] focus:outline-none focus:border-[#D71920] focus:bg-white transition-colors"
            />
          </div>

          {/* Category Type + Display Serial Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#171717] mb-1.5 uppercase tracking-wider text-[11px]">
                Category Type
              </label>
              <select
                data-testid="category-modal-type-select"
                value={catType}
                onChange={e => handleTypeChange(e.target.value as ProductType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] focus:outline-none focus:border-[#D71920] focus:bg-white transition-colors"
              >
                <option value="book">Book Category</option>
                <option value="stationery">Stationery Category</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#171717] mb-1.5 uppercase tracking-wider text-[11px]">
                Display Order
              </label>
              <input
                type="number"
                min={0}
                max={999}
                data-testid="category-modal-serial-input"
                value={catDisplayOrder}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setCatDisplayOrder(Number.isFinite(val) && val >= 0 ? val : 0);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] tabular-nums focus:outline-none focus:border-[#D71920] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Toggle: Show Related Products Section on Homepage */}
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFB] overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <span className="font-bold text-xs text-[#171717] block">
                  Show on Homepage (প্রোডাক্ট শো বাটন)
                </span>
                <span className="text-[11px] text-[#5F6368] leading-snug block mt-0.5">
                  Turn ON to show this category&apos;s products section on Home with a &quot;See More&quot; button.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={catShowProductsOnHome}
                aria-label="Toggle category products section on homepage"
                data-testid="category-modal-products-toggle"
                onClick={() => setCatShowProductsOnHome(!catShowProductsOnHome)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  catShowProductsOnHome ? 'bg-[#D71920]' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    catShowProductsOnHome ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {catShowProductsOnHome && (
              <div
                data-testid="category-modal-products-config"
                className="px-3.5 pb-3.5 pt-3 border-t border-[#E5E5E5] bg-white space-y-3"
              >
                {/* Quantity Selector */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="font-bold text-[#171717] uppercase tracking-wider text-[11px]">
                      Display Quantity (Before &quot;See More&quot;)
                    </label>
                    <span className="text-[11px] text-[#5F6368] tabular-nums">
                      Max 25
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRESET_LIMITS.map(num => {
                      const active = catHomeProductLimit === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setCatHomeProductLimit(num);
                            setLimitDraft(String(num));
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer tabular-nums ${
                            active
                              ? 'bg-[#D71920] text-white border-[#D71920]'
                              : 'bg-[#F7F7F8] text-[#171717] border-[#E5E5E5] hover:border-[#D71920]'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                    <input
                      type="number"
                      min={1}
                      max={25}
                      data-testid="category-modal-limit-input"
                      aria-label="Custom number of homepage products"
                      value={limitDraft}
                      onChange={e => {
                        const raw = e.target.value;
                        setLimitDraft(raw);
                        const parsed = parseInt(raw, 10);
                        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 25) {
                          setCatHomeProductLimit(parsed);
                        }
                      }}
                      onBlur={() => commitLimitDraft(limitDraft)}
                      className="w-16 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] text-[11px] font-semibold tabular-nums focus:outline-none focus:border-[#D71920]"
                    />
                  </div>
                </div>

                {/* Specific Product Selector */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="font-bold text-[#171717] uppercase tracking-wider text-[11px]">
                      Select {catType === 'stationery' ? 'Stationery Items' : 'Books'} for Homepage (Optional)
                    </label>
                    {catHomeFeaturedProductIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCatHomeFeaturedProductIds([])}
                        className="text-[11px] font-semibold text-[#D71920] hover:underline cursor-pointer"
                      >
                        Clear ({catHomeFeaturedProductIds.length})
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[#5F6368] mb-2">
                    {catHomeFeaturedProductIds.length > 0
                      ? `${catHomeFeaturedProductIds.length} selected in custom order (up to ${catHomeProductLimit} shown, rest under See More).`
                      : `Leave empty to auto-display up to ${catHomeProductLimit} latest ${catType === 'stationery' ? 'stationery items' : 'books'} from this category.`}
                  </p>

                  {/* Search Input */}
                  <div className="relative mb-2">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder={`Search ${catType === 'stationery' ? 'stationery' : 'books'} by title...`}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[11px] text-[#171717] focus:outline-none focus:border-[#D71920] focus:bg-white"
                    />
                  </div>

                  {/* Checklist */}
                  <div className="max-h-48 overflow-y-auto border border-[#E5E5E5] rounded-xl divide-y divide-neutral-100 bg-white">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-[11px] text-neutral-500">
                        No matching {catType === 'stationery' ? 'stationery items' : 'books'} found.
                      </div>
                    ) : (
                      filteredProducts.map(prod => {
                        const selectedIdx = catHomeFeaturedProductIds.indexOf(prod.id);
                        const isSelected = selectedIdx >= 0;
                        const alreadyInCategory =
                          catName.trim() !== '' && productHasCategory(prod, catName.trim());

                        return (
                          <div
                            key={prod.id}
                            className={`flex items-center justify-between gap-2.5 px-2.5 py-2 transition-colors ${
                              isSelected ? 'bg-[#FFF5F5]' : 'hover:bg-neutral-50'
                            }`}
                          >
                            <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductSelection(prod.id)}
                                className="accent-[#D71920] w-3.5 h-3.5 rounded shrink-0"
                              />
                              <div className="w-8 h-9 rounded-md overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0">
                                {prod.images?.[0] && (
                                  <img
                                    src={prod.images[0]}
                                    alt={prod.title}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-[11px] text-[#171717] truncate">
                                  {prod.title}
                                </div>
                                <div className="text-[10px] text-[#5F6368] truncate">
                                  ৳{prod.price}
                                  {prod.author ? ` · ${prod.author}` : ''}
                                  {alreadyInCategory ? ' · In category' : ''}
                                </div>
                              </div>
                            </label>

                            {isSelected && (
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] font-bold text-[#D71920] tabular-nums mr-0.5">
                                  #{selectedIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Move ${prod.title} up`}
                                  onClick={() => moveSelectedProduct(prod.id, 'up')}
                                  disabled={selectedIdx === 0}
                                  className="p-1 rounded border border-neutral-200 bg-white text-neutral-600 hover:text-[#D71920] disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp size={11} />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Move ${prod.title} down`}
                                  onClick={() => moveSelectedProduct(prod.id, 'down')}
                                  disabled={selectedIdx === catHomeFeaturedProductIds.length - 1}
                                  className="p-1 rounded border border-neutral-200 bg-white text-neutral-600 hover:text-[#D71920] disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Picture */}
          <div>
            <label className="block font-bold text-[#171717] mb-1.5 uppercase tracking-wider text-[11px]">
              Category Picture (URL or Upload Image File)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/category-photo.jpg"
                value={catImage}
                onChange={e => setCatImage(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] focus:outline-none focus:border-[#D71920] focus:bg-white transition-colors"
              />
              <label className="px-4 py-2.5 bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#D71920] hover:text-white transition-colors shrink-0">
                <Upload size={14} /> Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUploadFile}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E5E5E5] bg-neutral-100 shrink-0 flex items-center justify-center">
                {catImage ? (
                  <img src={catImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#D71920] font-bold text-xs">Preview</span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-[#5F6368] font-bold mb-1">Preset Pictures:</div>
                <div className="flex flex-wrap gap-1">
                  {[
                    {
                      name: 'Novels',
                      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
                    },
                    {
                      name: 'Islamic',
                      url: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600&auto=format&fit=crop&q=80',
                    },
                    {
                      name: 'Academic',
                      url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
                    },
                    {
                      name: 'Stationery',
                      url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
                    },
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCatImage(preset.url)}
                      className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 hover:bg-[#FFF1F2] hover:text-[#D71920] border border-[#E5E5E5] font-semibold cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="flex justify-end gap-2.5 px-6 sm:px-7 py-3.5 border-t border-[#EEEEEE] bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-neutral-100 text-[#171717] font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="category-modal-save-btn"
              className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} /> Save Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
