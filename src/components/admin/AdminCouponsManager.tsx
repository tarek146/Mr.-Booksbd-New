import React, { useEffect, useMemo, useState } from 'react';
import { Coupon, CouponDiscountType, Order, StoreSettings } from '../../types';
import {
  DEFAULT_COUPONS,
  fromDateTimeLocalValue,
  getCouponScheduleState,
  toDateTimeLocalValue,
} from '../../utils/storeEnhancementsHelpers';
import {
  TicketPercent,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Clock,
  Sparkles,
  Search,
  Megaphone,
  UserCheck,
  Power,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

interface AdminCouponsManagerProps {
  coupons: Coupon[];
  orders?: Order[];
  settings?: StoreSettings;
  onUpdateSettings?: (newSettings: Partial<StoreSettings>) => Promise<void>;
  onAddCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateCoupon: (id: string, data: Partial<Coupon>) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
  setToast: (t: { show: boolean; type: 'success' | 'error'; message: string }) => void;
}

type CouponFilterTab = 'all' | 'live' | 'scheduled' | 'popup' | 'first_order' | 'inactive';

export function AdminCouponsManager({
  coupons,
  orders = [],
  settings,
  onUpdateSettings,
  onAddCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
  setToast,
}: AdminCouponsManagerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<CouponFilterTab>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyCouponId, setBusyCouponId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Storefront Entry Popup Global Settings Drawer
  const [showPopupSettings, setShowPopupSettings] = useState(false);
  const [enablePopupMaster, setEnablePopupMaster] = useState(settings?.enableCouponPopup !== false);
  const [popupDelaySeconds, setPopupDelaySeconds] = useState<number>(
    settings?.couponPopupDelaySeconds ?? 1.5
  );
  const [popupFrequency, setPopupFrequency] = useState<'once_per_session' | 'once_per_day' | 'always'>(
    settings?.couponPopupFrequency || 'once_per_session'
  );
  const [savingPopupSettings, setSavingPopupSettings] = useState(false);

  // Coupon Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(250);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(300);
  const [badgeText, setBadgeText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startsAtInput, setStartsAtInput] = useState('');
  const [expiresAtInput, setExpiresAtInput] = useState('');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [perCustomerLimit, setPerCustomerLimit] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(0);
  const [showAsPopup, setShowAsPopup] = useState(false);
  const [popupHeadline, setPopupHeadline] = useState('');
  const [popupSubtitle, setPopupSubtitle] = useState('');
  const [popupCtaText, setPopupCtaText] = useState('');

  useEffect(() => {
    setEnablePopupMaster(settings?.enableCouponPopup !== false);
    setPopupDelaySeconds(settings?.couponPopupDelaySeconds ?? 1.5);
    setPopupFrequency(settings?.couponPopupFrequency || 'once_per_session');
  }, [
    settings?.enableCouponPopup,
    settings?.couponPopupDelaySeconds,
    settings?.couponPopupFrequency,
  ]);

  // Live 1-second tick so scheduled/expiring countdowns stay exact
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Compute order-derived redemption counts merged with coupon.usageCount
  const orderRedemptionsByCode = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      if (!o || o.isTrashed || o.orderStatus === 'cancelled' || !o.couponCode) continue;
      const key = o.couponCode.trim().toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [orders]);

  const enrichedCoupons = useMemo(() => {
    return coupons.map(c => {
      const schedule = getCouponScheduleState(c, now);
      const codeKey = c.code.trim().toUpperCase();
      const recordedUses = Math.max(c.usageCount || 0, orderRedemptionsByCode[codeKey] || 0);
      return { coupon: c, schedule, recordedUses };
    });
  }, [coupons, now, orderRedemptionsByCode]);

  const stats = useMemo(() => {
    let live = 0;
    let scheduled = 0;
    let popup = 0;
    let firstOrder = 0;
    let inactive = 0;
    let totalRedemptions = 0;

    for (const item of enrichedCoupons) {
      if (item.schedule.isLive) live += 1;
      if (item.schedule.status === 'scheduled') scheduled += 1;
      if (item.coupon.showAsPopup) popup += 1;
      if (item.coupon.firstOrderOnly) firstOrder += 1;
      if (!item.schedule.isLive && item.schedule.status !== 'scheduled') inactive += 1;
      totalRedemptions += item.recordedUses;
    }

    return {
      total: enrichedCoupons.length,
      live,
      scheduled,
      popup,
      firstOrder,
      inactive,
      totalRedemptions,
    };
  }, [enrichedCoupons]);

  const filteredCoupons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedCoupons.filter(({ coupon, schedule }) => {
      if (filterTab === 'live' && !schedule.isLive) return false;
      if (filterTab === 'scheduled' && schedule.status !== 'scheduled') return false;
      if (filterTab === 'popup' && !coupon.showAsPopup) return false;
      if (filterTab === 'first_order' && !coupon.firstOrderOnly) return false;
      if (
        filterTab === 'inactive' &&
        (schedule.isLive || schedule.status === 'scheduled')
      ) {
        return false;
      }

      if (!q) return true;
      return (
        coupon.code.toLowerCase().includes(q) ||
        coupon.title.toLowerCase().includes(q) ||
        (coupon.description || '').toLowerCase().includes(q)
      );
    });
  }, [enrichedCoupons, filterTab, searchQuery]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setTitle('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinOrderAmount(250);
    setMaxDiscountAmount(300);
    setBadgeText('');
    setIsActive(true);
    setStartsAtInput('');
    setExpiresAtInput('');
    setFirstOrderOnly(false);
    setPerCustomerLimit(0);
    setUsageLimit(0);
    setShowAsPopup(false);
    setPopupHeadline('');
    setPopupSubtitle('');
    setPopupCtaText('');
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
    setStartsAtInput(toDateTimeLocalValue(c.startsAt));
    setExpiresAtInput(toDateTimeLocalValue(c.expiresAt));
    setFirstOrderOnly(Boolean(c.firstOrderOnly));
    setPerCustomerLimit(c.perCustomerLimit ?? 0);
    setUsageLimit(c.usageLimit ?? 0);
    setShowAsPopup(Boolean(c.showAsPopup));
    setPopupHeadline(c.popupHeadline || '');
    setPopupSubtitle(c.popupSubtitle || '');
    setPopupCtaText(c.popupCtaText || '');
    setShowModal(true);
  };

  const applyQuickDuration = (hours: number) => {
    const baseMs = fromDateTimeLocalValue(startsAtInput) || Date.now();
    if (!startsAtInput) {
      setStartsAtInput(toDateTimeLocalValue(baseMs));
    }
    setExpiresAtInput(toDateTimeLocalValue(baseMs + hours * 3600 * 1000));
  };

  const handleGenerateCode = () => {
    const prefix = firstOrderOnly ? 'FIRST' : showAsPopup ? 'VIP' : 'MRB';
    const num = discountType === 'free_delivery' ? 'FREE' : String(Math.max(5, discountValue || 10));
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    setCode(`${prefix}${num}${rand}`);
  };

  const handleCopyCode = (val: string) => {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopiedCode(val);
    window.setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleRestoreDefaultCoupons = async () => {
    setSaving(true);
    try {
      for (const def of DEFAULT_COUPONS) {
        if (!coupons.some(existing => existing.code.toUpperCase() === def.code.toUpperCase())) {
          await onAddCoupon({
            code: def.code,
            title: def.title,
            description: def.description,
            discountType: def.discountType,
            discountValue: def.discountValue,
            minOrderAmount: def.minOrderAmount,
            maxDiscountAmount: def.maxDiscountAmount,
            badgeText: def.badgeText,
            isActive: def.isActive,
          });
        }
      }
      setToast({ show: true, type: 'success', message: 'ডিফল্ট কুপনগুলো আবার যুক্ত করা হয়েছে।' });
    } catch {
      setToast({ show: true, type: 'error', message: 'ডিফল্ট কুপন যুক্ত করতে সমস্যা হয়েছে।' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePopupGlobalSettings = async () => {
    if (!onUpdateSettings) return;
    setSavingPopupSettings(true);
    try {
      await onUpdateSettings({
        enableCouponPopup: enablePopupMaster,
        couponPopupDelaySeconds: Number(popupDelaySeconds) >= 0 ? Number(popupDelaySeconds) : 1.5,
        couponPopupFrequency: popupFrequency,
      });
      setToast({
        show: true,
        type: 'success',
        message: 'ওয়েবসাইট কুপন পপআপ সেটিংস Firebase-এ সেভ হয়েছে!',
      });
      setShowPopupSettings(false);
    } catch {
      setToast({ show: true, type: 'error', message: 'পপআপ সেটিংস সেভ করতে সমস্যা হয়েছে।' });
    } finally {
      setSavingPopupSettings(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      setToast({ show: true, type: 'error', message: 'কুপন কোড লিখুন (যেমন: MRBOOKS15)' });
      return;
    }

    const parsedStart = fromDateTimeLocalValue(startsAtInput);
    const parsedEnd = fromDateTimeLocalValue(expiresAtInput);
    if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
      setToast({
        show: true,
        type: 'error',
        message: 'মেয়াদ শেষ হওয়ার সময় অবশ্যই শুরুর সময়ের পরের হতে হবে।',
      });
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
        minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
        maxDiscountAmount: Math.max(0, Number(maxDiscountAmount) || 0),
        badgeText: autoBadge,
        isActive,
        ...(parsedStart ? { startsAt: parsedStart } : { startsAt: 0 }),
        ...(parsedEnd ? { expiresAt: parsedEnd } : { expiresAt: 0 }),
        firstOrderOnly,
        perCustomerLimit: firstOrderOnly
          ? Math.max(1, Number(perCustomerLimit) || 1)
          : Math.max(0, Number(perCustomerLimit) || 0),
        usageLimit: Math.max(0, Number(usageLimit) || 0),
        showAsPopup,
        popupHeadline: popupHeadline.trim(),
        popupSubtitle: popupSubtitle.trim(),
        popupCtaText: popupCtaText.trim(),
        updatedAt: Date.now(),
      };

      if (editingCoupon) {
        await onUpdateCoupon(editingCoupon.id, payload);
        setToast({
          show: true,
          type: 'success',
          message: `"${cleanCode}" কুপন সফলভাবে আপডেট হয়েছে!`,
        });
      } else {
        await onAddCoupon(payload);
        setToast({
          show: true,
          type: 'success',
          message: showAsPopup
            ? `"${cleanCode}" কুপন তৈরি হয়েছে এবং ওয়েবসাইট পপআপে চালু করা হয়েছে!`
            : `"${cleanCode}" কুপন তৈরি ও Firebase-এ সেভ হয়েছে!`,
        });
      }
      setShowModal(false);
    } catch {
      setToast({
        show: true,
        type: 'error',
        message: 'কুপন সেভ করতে ত্রুটি হয়েছে। অনুগ্রহ করে অ্যাডমিন লগইন ও ইন্টারনেট সংযোগ যাচাই করুন।',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    setBusyCouponId(c.id);
    try {
      const nextActive = c.isActive === false;
      await onUpdateCoupon(c.id, { isActive: nextActive });
      setToast({
        show: true,
        type: 'success',
        message: nextActive ? `"${c.code}" লাইভ করা হয়েছে।` : `"${c.code}" সাময়িকভাবে পজ করা হয়েছে।`,
      });
    } catch {
      setToast({ show: true, type: 'error', message: 'স্ট্যাটাস পরিবর্তন করা যায়নি।' });
    } finally {
      setBusyCouponId(null);
    }
  };

  const handleTogglePopup = async (c: Coupon) => {
    setBusyCouponId(c.id);
    try {
      const nextPopup = !c.showAsPopup;
      await onUpdateCoupon(c.id, {
        showAsPopup: nextPopup,
        ...(nextPopup && c.isActive === false ? { isActive: true } : {}),
      });
      setToast({
        show: true,
        type: 'success',
        message: nextPopup
          ? `"${c.code}" এখন ওয়েবসাইট এন্ট্রি পপআপে দেখাবে!`
          : `"${c.code}" ওয়েবসাইট পপআপ থেকে বন্ধ করা হয়েছে।`,
      });
    } catch {
      setToast({ show: true, type: 'error', message: 'পপআপ স্ট্যাটাস পরিবর্তন করা যায়নি।' });
    } finally {
      setBusyCouponId(null);
    }
  };

  const handleToggleFirstOrder = async (c: Coupon) => {
    setBusyCouponId(c.id);
    try {
      const nextFirst = !c.firstOrderOnly;
      await onUpdateCoupon(c.id, {
        firstOrderOnly: nextFirst,
        ...(nextFirst && (!c.perCustomerLimit || c.perCustomerLimit < 1) ? { perCustomerLimit: 1 } : {}),
      });
      setToast({
        show: true,
        type: 'success',
        message: nextFirst
          ? `"${c.code}" শুধুমাত্র প্রথম অর্ডারের জন্য সেট করা হয়েছে।`
          : `"${c.code}" সব কাস্টমারের জন্য উন্মুক্ত করা হয়েছে।`,
      });
    } catch {
      setToast({ show: true, type: 'error', message: 'কাস্টমার সীমাবদ্ধতা আপডেট করা যায়নি।' });
    } finally {
      setBusyCouponId(null);
    }
  };

  const handleExecuteDelete = async (c: Coupon) => {
    setBusyCouponId(c.id);
    try {
      await onDeleteCoupon(c.id);
      setConfirmDeleteId(null);
      setToast({
        show: true,
        type: 'success',
        message: `"${c.code}" কুপন স্থায়ীভাবে ডিলিট হয়েছে!`,
      });
    } catch {
      setToast({
        show: true,
        type: 'error',
        message: `"${c.code}" ডিলিট করা যায়নি। Firebase অ্যাডমিন অনুমতি যাচাই করুন।`,
      });
    } finally {
      setBusyCouponId(null);
    }
  };

  const filterTabs: { id: CouponFilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Coupons', count: stats.total },
    { id: 'live', label: 'Live', count: stats.live },
    { id: 'scheduled', label: 'Scheduled', count: stats.scheduled },
    { id: 'popup', label: 'Popup On', count: stats.popup },
    { id: 'first_order', label: 'First Order', count: stats.firstOrder },
    { id: 'inactive', label: 'Paused / Expired', count: stats.inactive },
  ];

  return (
    <div className="space-y-5">
      {/* Cohesive Workspace Control Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden">
        {/* Top Bar: Title + Actions */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <TicketPercent size={19} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Coupons & Promotions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Schedule promo validity, enforce first-purchase discounts, and control storefront entry popups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onUpdateSettings && (
              <button
                type="button"
                data-testid="toggle-coupon-popup-settings-btn"
                onClick={() => setShowPopupSettings(v => !v)}
                className={`px-3.5 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showPopupSettings
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Popup Settings</span>
                <span
                  className={`text-[10px] font-bold ${
                    enablePopupMaster ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                >
                  · {enablePopupMaster ? 'On' : 'Off'}
                </span>
              </button>
            )}

            <button
              type="button"
              data-testid="create-coupon-btn"
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#D71920] hover:bg-[#b8141a] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus size={15} />
              <span>Create Coupon</span>
            </button>
          </div>
        </div>

        {/* Metrics Summary Strip (Borderless divided columns, tabular numerals) */}
        <div className="border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50">
          <div className="px-4 py-3">
            <span className="text-[11px] font-medium text-slate-500 block">Total Coupons</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">{stats.total}</span>
          </div>
          <div className="px-4 py-3">
            <span className="text-[11px] font-medium text-slate-500 block">Live & Active</span>
            <span className="text-lg font-bold text-emerald-700 tabular-nums">{stats.live}</span>
          </div>
          <div className="px-4 py-3">
            <span className="text-[11px] font-medium text-slate-500 block">Popup Active</span>
            <span className="text-lg font-bold text-[#D71920] tabular-nums">{stats.popup}</span>
          </div>
          <div className="px-4 py-3">
            <span className="text-[11px] font-medium text-slate-500 block">1st Purchase Only</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">{stats.firstOrder}</span>
          </div>
          <div className="px-4 py-3 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Redemptions</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">{stats.totalRedemptions}</span>
          </div>
        </div>

        {/* Expandable Global Storefront Popup Settings */}
        {showPopupSettings && onUpdateSettings && (
          <div
            data-testid="coupon-popup-settings-panel"
            className="border-t border-slate-200 bg-slate-50/80 p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Storefront Entry Popup Settings (Firebase Synced)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Control when visitors see coupons marked with "Popup On" upon entering the storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSavePopupGlobalSettings}
                disabled={savingPopupSettings}
                data-testid="save-coupon-popup-settings-btn"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                <Check size={13} />
                <span>{savingPopupSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-800 block">Enable Website Popup</span>
                  <span className="text-[11px] text-slate-500">Master toggle for entry modal</span>
                </div>
                <input
                  type="checkbox"
                  checked={enablePopupMaster}
                  onChange={e => setEnablePopupMaster(e.target.checked)}
                  data-testid="admin-coupon-popup-master-checkbox"
                  className="w-4 h-4 accent-[#D71920]"
                />
              </label>

              <div className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg">
                <label className="font-semibold text-slate-700 block mb-1" htmlFor="popup-delay-select">
                  Entry Delay (Seconds)
                </label>
                <select
                  id="popup-delay-select"
                  value={popupDelaySeconds}
                  onChange={e => setPopupDelaySeconds(Number(e.target.value))}
                  className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                >
                  <option value={0}>0s (Immediate)</option>
                  <option value={1}>1s</option>
                  <option value={1.5}>1.5s (Recommended)</option>
                  <option value={3}>3s</option>
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                </select>
              </div>

              <div className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg">
                <label className="font-semibold text-slate-700 block mb-1" htmlFor="popup-freq-select">
                  Display Frequency
                </label>
                <select
                  id="popup-freq-select"
                  value={popupFrequency}
                  onChange={e =>
                    setPopupFrequency(e.target.value as 'once_per_session' | 'once_per_day' | 'always')
                  }
                  className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                >
                  <option value="once_per_session">Once per browser session</option>
                  <option value="once_per_day">Once per 24 hours</option>
                  <option value="always">Every storefront page load</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs + Search Row */}
        <div className="border-t border-slate-100 px-4 sm:px-5 pt-2.5 pb-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar border-b lg:border-b-0 border-slate-100 -mb-px">
            {filterTabs.map(tab => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`pb-2.5 pt-1 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'border-[#D71920] text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="tabular-nums text-[11px] text-slate-400 font-medium">
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search code or offer title..."
              data-testid="coupon-search-input"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-slate-400 text-xs text-slate-800 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredCoupons.length === 0 ? (
        <div
          data-testid="coupons-empty-state"
          className="bg-white border border-slate-200/90 rounded-xl p-10 text-center space-y-3"
        >
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <TicketPercent size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              {coupons.length === 0 ? 'No coupons configured' : 'No matching coupons'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {coupons.length === 0
                ? 'Create a new promo code with validity dates, first-purchase rules, or storefront popup visibility.'
                : 'Try adjusting your search query or status filter.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#D71920] hover:bg-[#b8141a] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Create Coupon
            </button>
            {coupons.length === 0 && (
              <button
                type="button"
                onClick={handleRestoreDefaultCoupons}
                disabled={saving}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} /> Load 3 Starter Coupons
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Structured 2-Column Coupon Cards (Zero Nested Card-Within-Card) */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredCoupons.map(({ coupon: c, schedule, recordedUses }) => {
            const isBusy = busyCouponId === c.id;
            const isConfirmingDelete = confirmDeleteId === c.id;
            const discountHeadline =
              c.discountType === 'percentage'
                ? `${c.discountValue}% OFF`
                : c.discountType === 'free_delivery'
                ? 'FREE DELIVERY'
                : `৳${c.discountValue} OFF`;

            const statusColorClass =
              schedule.status === 'active'
                ? 'text-emerald-700'
                : schedule.status === 'scheduled'
                ? 'text-blue-700'
                : schedule.status === 'expired' || schedule.status === 'exhausted'
                ? 'text-rose-700'
                : 'text-slate-500';

            return (
              <article
                key={c.id}
                data-testid={`coupon-card-${c.code}`}
                className={`bg-white border rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors ${
                  schedule.isLive ? 'border-slate-200/90' : 'border-slate-200/80 bg-slate-50/40'
                }`}
              >
                {/* Row 1: Code, Discount Value, Status & Edit/Delete */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.code)}
                        title="Click to copy coupon code"
                        className="inline-flex items-center gap-1.5 font-mono font-bold text-sm px-2.5 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800 tracking-wide cursor-pointer whitespace-nowrap"
                      >
                        <span>{c.code}</span>
                        {copiedCode === c.code ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} className="text-slate-300" />
                        )}
                      </button>

                      <span className="text-sm font-extrabold text-[#D71920] tabular-nums whitespace-nowrap">
                        {discountHeadline}
                      </span>

                      <span className={`text-xs font-semibold ${statusColorClass} whitespace-nowrap`}>
                        · {schedule.label}
                      </span>
                    </div>

                    {/* Edit & Inline-Confirm Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isConfirmingDelete ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            aria-label={`Edit coupon ${c.code}`}
                            data-testid={`edit-coupon-${c.code}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer"
                            title="Edit coupon"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(c.id)}
                            aria-label={`Delete coupon ${c.code}`}
                            data-testid={`delete-coupon-btn-${c.code}`}
                            disabled={isBusy}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete coupon"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleExecuteDelete(c)}
                            disabled={isBusy}
                            data-testid={`confirm-delete-coupon-${c.code}`}
                            className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap disabled:opacity-50"
                          >
                            {isBusy ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isBusy}
                            className="px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Offer Title, Description & Quiet Typographic Rules */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{c.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                    <span className="capitalize">
                      {c.discountType.replace('_', ' ')}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="tabular-nums">
                      Min order {c.minOrderAmount > 0 ? `৳${c.minOrderAmount}` : '৳0'}
                    </span>
                    {c.discountType === 'percentage' &&
                      c.maxDiscountAmount &&
                      c.maxDiscountAmount > 0 && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="tabular-nums">Max cap ৳{c.maxDiscountAmount}</span>
                        </>
                      )}
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="tabular-nums">
                      Used {recordedUses}
                      {c.usageLimit && c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}
                    </span>
                    {c.firstOrderOnly && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="font-semibold text-[#D71920]">First Purchase Only</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Row 3: Schedule Window & Live Remaining Time */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate" title={schedule.timeSummary}>
                      {schedule.timeSummary}
                    </span>
                  </div>
                  <div
                    data-testid={`coupon-countdown-${c.code}`}
                    className={`font-mono tabular-nums font-semibold shrink-0 ${
                      schedule.status === 'active' && schedule.remainingMs !== null
                        ? 'text-amber-700'
                        : schedule.status === 'scheduled'
                        ? 'text-blue-700'
                        : schedule.status === 'expired'
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {schedule.countdownLabel}
                  </div>
                </div>

                {/* Row 4: Quick Interactive Toggles (Active, Storefront Popup, First Order) */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleToggleActive(c)}
                    data-testid={`toggle-active-${c.code}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${
                      c.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                    }`}
                  >
                    <Power size={12} />
                    <span>{c.isActive !== false ? 'Active' : 'Paused'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleTogglePopup(c)}
                    data-testid={`toggle-popup-${c.code}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${
                      c.showAsPopup
                        ? 'bg-rose-50 text-[#D71920] border-rose-200 hover:bg-rose-100/70'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <Megaphone size={12} />
                    <span>{c.showAsPopup ? 'Popup On' : 'Popup Off'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleToggleFirstOrder(c)}
                    data-testid={`toggle-first-order-${c.code}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${
                      c.firstOrderOnly
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck size={12} />
                    <span>{c.firstOrderOnly ? '1st Order Only' : 'All Customers'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-modal-title"
          data-testid="coupon-editor-modal"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
          >
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <TicketPercent size={18} className="text-[#D71920]" />
                <h3 id="coupon-modal-title" className="font-bold text-base text-slate-900">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
              {/* Section 1: Code & Discount Value */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-900">1. Code & Discount Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700" htmlFor="coupon-code-input">
                        Coupon Code *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="text-[11px] font-semibold text-[#D71920] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={11} /> Generate
                      </button>
                    </div>
                    <input
                      id="coupon-code-input"
                      data-testid="coupon-form-code"
                      type="text"
                      required
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME15"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold uppercase text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                      {(
                        [
                          { id: 'percentage', label: '% Off' },
                          { id: 'fixed', label: '৳ Flat' },
                          { id: 'free_delivery', label: 'Free Del.' },
                        ] as { id: CouponDiscountType; label: string }[]
                      ).map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDiscountType(opt.id)}
                          className={`py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                            discountType === opt.id
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-value-input">
                      {discountType === 'percentage'
                        ? 'Discount (%)'
                        : discountType === 'fixed'
                        ? 'Amount (৳)'
                        : 'Delivery Fee'}
                    </label>
                    <input
                      id="coupon-value-input"
                      data-testid="coupon-form-value"
                      type="number"
                      min={0}
                      disabled={discountType === 'free_delivery'}
                      value={discountType === 'free_delivery' ? 0 : discountValue}
                      onChange={e => setDiscountValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold tabular-nums disabled:bg-slate-100 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-min-input">
                      Min Order (৳)
                    </label>
                    <input
                      id="coupon-min-input"
                      data-testid="coupon-form-min-order"
                      type="number"
                      min={0}
                      value={minOrderAmount}
                      onChange={e => setMinOrderAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold tabular-nums text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-cap-input">
                      Max Discount Cap (৳)
                    </label>
                    <input
                      id="coupon-cap-input"
                      type="number"
                      min={0}
                      disabled={discountType !== 'percentage'}
                      value={discountType === 'percentage' ? maxDiscountAmount : 0}
                      onChange={e => setMaxDiscountAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold tabular-nums disabled:bg-slate-100 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-title-input">
                      Offer Title
                    </label>
                    <input
                      id="coupon-title-input"
                      data-testid="coupon-form-title"
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. First Order Welcome Bonus"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-badge-input">
                      Display Label (Optional)
                    </label>
                    <input
                      id="coupon-badge-input"
                      type="text"
                      value={badgeText}
                      onChange={e => setBadgeText(e.target.value)}
                      placeholder="Auto (e.g. 15% OFF)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-desc-input">
                    Description / Terms
                  </label>
                  <textarea
                    id="coupon-desc-input"
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Details shown to customers in Coupons modal and popup..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800"
                  />
                </div>
              </div>

              {/* Section 2: Timing & Schedule */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-500" />
                    <span>2. Validity Schedule & Timing</span>
                  </h4>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { label: '+24h', hours: 24 },
                      { label: '+3 Days', hours: 72 },
                      { label: '+7 Days', hours: 168 },
                      { label: '+30 Days', hours: 720 },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyQuickDuration(preset.hours)}
                        className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                    {(startsAtInput || expiresAtInput) && (
                      <button
                        type="button"
                        onClick={() => {
                          setStartsAtInput('');
                          setExpiresAtInput('');
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-starts-input">
                      Start Date & Time (Optional)
                    </label>
                    <input
                      id="coupon-starts-input"
                      data-testid="coupon-form-starts-at"
                      type="datetime-local"
                      value={startsAtInput}
                      onChange={e => setStartsAtInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-expires-input">
                      Expiry Date & Time (Optional)
                    </label>
                    <input
                      id="coupon-expires-input"
                      data-testid="coupon-form-expires-at"
                      type="datetime-local"
                      value={expiresAtInput}
                      onChange={e => setExpiresAtInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: First Order & Redemption Limits */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-bold text-xs text-slate-900">
                  3. Customer Eligibility & Usage Limits
                </h4>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="coupon-form-first-order"
                    checked={firstOrderOnly}
                    onChange={e => {
                      setFirstOrderOnly(e.target.checked);
                      if (e.target.checked && perCustomerLimit === 0) {
                        setPerCustomerLimit(1);
                      }
                    }}
                    className="w-4 h-4 mt-0.5 accent-[#D71920]"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      First Purchase Only (শুধুমাত্র প্রথম অর্ডারের জন্য কার্যকর)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Only valid for customers with zero previous non-cancelled orders (verified by phone number & account).
                    </span>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-usage-limit">
                      Max Storewide Uses (0 = Unlimited)
                    </label>
                    <input
                      id="coupon-usage-limit"
                      type="number"
                      min={0}
                      value={usageLimit}
                      onChange={e => setUsageLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold tabular-nums text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1" htmlFor="coupon-per-customer-limit">
                      Uses Per Customer (0 = Unlimited)
                    </label>
                    <input
                      id="coupon-per-customer-limit"
                      type="number"
                      min={0}
                      value={perCustomerLimit}
                      onChange={e => setPerCustomerLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold tabular-nums text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Activation & Website Entry Popup */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-bold text-xs text-slate-900">
                  4. Status & Website Entry Popup
                </h4>

                <label className="flex items-center gap-2.5 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="coupon-form-active"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#D71920]"
                  />
                  <span>Coupon is Active & Available for Checkout</span>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-rose-50/40 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="coupon-form-show-popup"
                    checked={showAsPopup}
                    onChange={e => setShowAsPopup(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-[#D71920]"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Show as Website Entry Popup (ওয়েবসাইটে ঢুকলেই পপআপ দেখাবে)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Automatically displays this live coupon as an offer popup to visitors opening the store.
                    </span>
                  </div>
                </label>

                {showAsPopup && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Popup Headline (Optional)
                      </label>
                      <input
                        type="text"
                        value={popupHeadline}
                        onChange={e => setPopupHeadline(e.target.value)}
                        placeholder={title || 'e.g. Welcome Gift: 15% Off!'}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Popup CTA Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={popupCtaText}
                        onChange={e => setPopupCtaText(e.target.value)}
                        placeholder="Apply & Browse Books"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Popup Message (Optional)
                      </label>
                      <input
                        type="text"
                        value={popupSubtitle}
                        onChange={e => setPopupSubtitle(e.target.value)}
                        placeholder={description || 'Short message displayed inside the popup...'}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Submit */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  data-testid="coupon-form-submit-btn"
                  className="px-5 py-2 rounded-lg bg-[#D71920] hover:bg-[#b8141a] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Save Coupon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
