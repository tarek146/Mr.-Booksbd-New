import React, { useState } from 'react';
import { Coupon, CouponDiscountType } from '../../types';
import { DEFAULT_COUPONS, resolveActiveCoupons } from '../../utils/storeEnhancementsHelpers';
import {
  TicketPercent,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  CheckCircle2,
  Power,
  Sparkles,
} from 'lucide-react';

interface AdminCouponsManagerProps {
  coupons: Coupon[];
  onAddCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateCoupon: (id: string, data: Partial<Coupon>) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
  setToast: (t: { show: boolean; type: 'success' | 'error'; message: string }) => void;
}

export function AdminCouponsManager({
  coupons,
  onAddCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
  setToast,
}: AdminCouponsManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(250);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(300);
  const [badgeText, setBadgeText] = useState('10% OFF');
  const [isActive, setIsActive] = useState(true);

  const displayCoupons = resolveActiveCoupons(coupons);
  const isUsingDefaultsOnly = coupons.length === 0;

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setTitle('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinOrderAmount(250);
    setMaxDiscountAmount(300);
    setBadgeText('10% OFF');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setTitle(c.title);
    setDescription(c.description);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderAmount(c.minOrderAmount ?? 0);
    setMaxDiscountAmount(c.maxDiscountAmount ?? 0);
    setBadgeText(c.badgeText || '');
    setIsActive(c.isActive !== false);
    setShowModal(true);
  };

  const handleSeedDefaultsToFirestore = async () => {
    setSaving(true);
    try {
      for (const c of DEFAULT_COUPONS) {
        await onAddCoupon({
          code: c.code,
          title: c.title,
          description: c.description,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minOrderAmount: c.minOrderAmount,
          maxDiscountAmount: c.maxDiscountAmount,
          badgeText: c.badgeText,
          isActive: c.isActive,
        });
      }
      setToast({ show: true, type: 'success', message: 'ডিফল্ট ৩টি কুপন ফায়ারবেসে সেভ হয়েছে!' });
    } catch {
      setToast({ show: true, type: 'error', message: 'কুপন সেভ করতে সমস্যা হয়েছে।' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      setToast({ show: true, type: 'error', message: 'কুপন কোড লিখুন (যেমন: MRBOOKS15)' });
      return;
    }
    setSaving(true);
    try {
      const autoBadge =
        badgeText.trim() ||
        (discountType === 'percentage'
          ? `${discountValue}% OFF`
          : discountType === 'free_delivery'
          ? 'FREE DELIVERY'
          : `৳${discountValue} OFF`);

      const payload: Omit<Coupon, 'id' | 'createdAt'> = {
        code: cleanCode,
        title: title.trim() || `${cleanCode} Offer`,
        description: description.trim() || 'Special store coupon offer.',
        discountType,
        discountValue: discountType === 'free_delivery' ? 0 : Number(discountValue) || 0,
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: Number(maxDiscountAmount) || 0,
        badgeText: autoBadge,
        isActive,
      };

      const existsInDb = editingCoupon && coupons.some(c => c.id === editingCoupon.id);
      if (existsInDb && editingCoupon) {
        await onUpdateCoupon(editingCoupon.id, payload);
        setToast({ show: true, type: 'success', message: `"${cleanCode}" কুপন আপডেট হয়েছে!` });
      } else {
        await onAddCoupon(payload);
        setToast({ show: true, type: 'success', message: `"${cleanCode}" কুপন তৈরি ও ফায়ারবেসে সেভ হয়েছে!` });
      }
      setShowModal(false);
    } catch {
      setToast({ show: true, type: 'error', message: 'কুপন সেভ করতে ত্রুটি হয়েছে।' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <TicketPercent size={22} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-neutral-900">
              Coupons & Promo Offers Manager
            </h2>
            <p className="text-xs text-neutral-500">
              Percentage (%), Fixed Cash (৳), ও Free Delivery — একাধিক টাইপের কুপন পরিচালনা করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isUsingDefaultsOnly && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSeedDefaultsToFirestore}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} /> Sync 3 Default Coupons to DB
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-[#D71920] hover:bg-[#b8141a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={15} /> Create New Coupon
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayCoupons.map(c => {
          const inDb = coupons.some(dbItem => dbItem.id === c.id);
          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 sm:p-5 bg-white shadow-2xs flex flex-col justify-between gap-3 ${
                c.isActive !== false ? 'border-neutral-200' : 'border-neutral-200 opacity-65 bg-neutral-50'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-neutral-900 text-white tracking-wider">
                    {c.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black">
                    {c.badgeText || c.discountType.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-neutral-900">{c.title}</h3>
                  <p className="text-xs text-neutral-600 mt-0.5">{c.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                    <span className="text-neutral-500 block text-[10px]">Type</span>
                    <strong className="text-neutral-900 capitalize">{c.discountType.replace('_', ' ')}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                    <span className="text-neutral-500 block text-[10px]">Min Order</span>
                    <strong className="text-neutral-900">৳{c.minOrderAmount || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  disabled={!inDb}
                  onClick={() => onUpdateCoupon(c.id, { isActive: c.isActive === false })}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer disabled:opacity-50 ${
                    c.isActive !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                  }`}
                >
                  <Power size={12} /> {c.isActive !== false ? 'Active' : 'Paused'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-[#D71920] hover:border-[#D71920] cursor-pointer"
                    title="Edit coupon"
                  >
                    <Edit2 size={13} />
                  </button>
                  {inDb && (
                    <button
                      type="button"
                      onClick={() => onDeleteCoupon(c.id)}
                      className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-red-600 hover:border-red-300 cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <TicketPercent size={18} className="text-[#D71920]" />
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MRBOOKS15"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono font-black uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as CouponDiscountType)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-bold bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                    <option value="free_delivery">Free Delivery (৳0)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    {discountType === 'percentage' ? 'Discount %' : discountType === 'fixed' ? 'Amount (৳)' : 'Delivery Free'}
                  </label>
                  <input
                    type="number"
                    disabled={discountType === 'free_delivery'}
                    value={discountType === 'free_delivery' ? 0 : discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-bold disabled:bg-neutral-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Min Order (৳)</label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={e => setMinOrderAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Max Cap (৳)</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={e => setMaxDiscountAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Offer Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Eid Reading Offer"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Badge Label</label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={e => setBadgeText(e.target.value)}
                    placeholder="e.g. 15% OFF"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Terms & details shown in Coupons popup..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                />
              </div>

              <label className="flex items-center gap-2 font-bold text-neutral-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#D71920]"
                />
                <span>Coupon is Active & Available for Customers</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#D71920] hover:bg-[#b8141a] text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} /> {saving ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
