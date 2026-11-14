import React, { useEffect, useMemo, useState } from 'react';
import { X, Copy, Check, Clock, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  formatDurationCompact,
  getCouponScheduleState,
  shouldDisplayCouponPopup,
} from '../utils/storeEnhancementsHelpers';

const SESSION_DISMISS_KEY = 'mrb_coupon_popup_session_dismissed';
const DAY_DISMISS_KEY = 'mrb_coupon_popup_day_dismissed';

export function CouponPromoPopup() {
  const {
    coupons,
    settings,
    activePage,
    appliedCouponCode,
    setAppliedCouponCode,
    setActivePage,
    cart,
  } = useStore();

  const [now, setNow] = useState(() => Date.now());
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState(false);

  const [sessionDismissedKey, setSessionDismissedKey] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(SESSION_DISMISS_KEY);
    } catch {
      return null;
    }
  });

  const [dayDismissInfo, setDayDismissInfo] = useState<{ key: string | null; at: number | null }>(() => {
    if (typeof window === 'undefined') return { key: null, at: null };
    try {
      const raw = window.localStorage.getItem(DAY_DISMISS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { key: parsed?.key || null, at: Number(parsed?.at) || null };
      }
    } catch {
      // ignore
    }
    return { key: null, at: null };
  });

  const evaluation = useMemo(
    () =>
      shouldDisplayCouponPopup({
        coupons,
        settings,
        activePage,
        now,
        sessionDismissedKey,
        lastDismissedKey: dayDismissInfo.key,
        lastDismissedAt: dayDismissInfo.at,
      }),
    [coupons, settings, activePage, now, sessionDismissedKey, dayDismissInfo]
  );

  // Schedule popup reveal using admin-configured delay
  useEffect(() => {
    if (!evaluation.show) {
      setIsVisible(false);
      return;
    }

    const delaySec =
      typeof settings.couponPopupDelaySeconds === 'number' &&
      !Number.isNaN(settings.couponPopupDelaySeconds)
        ? Math.max(0, Math.min(30, settings.couponPopupDelaySeconds))
        : 1.5;

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, Math.round(delaySec * 1000));

    return () => window.clearTimeout(timer);
  }, [evaluation.show, evaluation.popupKey, settings.couponPopupDelaySeconds]);

  // Live 1s countdown ticker while visible
  useEffect(() => {
    if (!isVisible) return;
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isVisible]);

  // If a popup coupon is scheduled to start soon, wake up when its startsAt timestamp arrives
  useEffect(() => {
    if (isVisible) return;
    const upcomingStarts = coupons
      .filter(c => c && c.showAsPopup && c.isActive !== false && c.startsAt && c.startsAt > now)
      .map(c => c.startsAt as number);
    if (upcomingStarts.length === 0) return;
    const nextStart = Math.min(...upcomingStarts);
    const waitMs = nextStart - now + 150;
    if (waitMs > 0 && waitMs <= 3600000) {
      const timer = window.setTimeout(() => setNow(Date.now()), waitMs);
      return () => window.clearTimeout(timer);
    }
  }, [coupons, now, isVisible]);

  // Reset slide index if coupon list shrinks
  useEffect(() => {
    if (activeIndex >= evaluation.allPopupCoupons.length) {
      setActiveIndex(0);
    }
  }, [evaluation.allPopupCoupons.length, activeIndex]);

  if (!isVisible || !evaluation.show || evaluation.allPopupCoupons.length === 0) {
    return null;
  }

  const activeCoupon = evaluation.allPopupCoupons[activeIndex] || evaluation.primaryCoupon;
  if (!activeCoupon) return null;

  const scheduleState = getCouponScheduleState(activeCoupon, now);
  const discountDisplay =
    activeCoupon.badgeText?.trim() ||
    (activeCoupon.discountType === 'percentage'
      ? `${activeCoupon.discountValue}% OFF`
      : activeCoupon.discountType === 'free_delivery'
      ? 'FREE DELIVERY'
      : `৳${activeCoupon.discountValue} OFF`);

  const handleDismiss = () => {
    setIsVisible(false);
    const key = evaluation.popupKey;
    const dismissedAt = Date.now();
    setSessionDismissedKey(key);
    setDayDismissInfo({ key, at: dismissedAt });
    try {
      window.sessionStorage.setItem(SESSION_DISMISS_KEY, key);
      window.localStorage.setItem(DAY_DISMISS_KEY, JSON.stringify({ key, at: dismissedAt }));
    } catch {
      // ignore storage failure
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(activeCoupon.code).catch(() => {});
    setCopiedCode(activeCoupon.code);
    window.setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleApplyAndContinue = () => {
    setAppliedCouponCode(activeCoupon.code);
    setAppliedFeedback(true);
    window.setTimeout(() => {
      handleDismiss();
      setAppliedFeedback(false);
      if (cart.length > 0) {
        setActivePage('checkout');
      } else if (activePage === 'home') {
        setActivePage('books');
      }
    }, 450);
  };

  const isAlreadyApplied =
    appliedCouponCode.trim().toUpperCase() === activeCoupon.code.trim().toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coupon-promo-popup-title"
      data-testid="storefront-coupon-popup"
      className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={handleDismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-[#121722] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="h-1.5 w-full bg-[#D71920]" />

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close coupon popup"
          data-testid="coupon-popup-close-btn"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Kicker & Title */}
          <div className="space-y-1.5 pr-7">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#D71920]">
              <Sparkles size={13} />
              <span>
                {activeCoupon.firstOrderOnly
                  ? 'First Purchase Offer'
                  : `${settings.storeName || 'MR. BOOKS'} Special Offer`}
              </span>
            </div>
            <h2
              id="coupon-promo-popup-title"
              className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug"
            >
              {activeCoupon.popupHeadline?.trim() || activeCoupon.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeCoupon.popupSubtitle?.trim() || activeCoupon.description}
            </p>
          </div>

          {/* Coupon Code & Discount Strip */}
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Discount Benefit
                </span>
                <span className="text-lg sm:text-xl font-black text-[#D71920] tabular-nums">
                  {discountDisplay}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  data-testid="coupon-popup-code"
                  className="font-mono font-bold text-sm tracking-wider px-3 py-1.5 rounded-lg bg-slate-900 text-white select-all"
                >
                  {activeCoupon.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  data-testid="coupon-popup-copy-btn"
                  aria-label={`Copy coupon ${activeCoupon.code}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer whitespace-nowrap"
                >
                  {copiedCode === activeCoupon.code ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Typographic Eligibility & Countdown Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>
                  {activeCoupon.minOrderAmount > 0
                    ? `Min. order ৳${activeCoupon.minOrderAmount}`
                    : 'No minimum order'}
                </span>
                {activeCoupon.maxDiscountAmount &&
                  activeCoupon.maxDiscountAmount > 0 &&
                  activeCoupon.discountType === 'percentage' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Up to ৳{activeCoupon.maxDiscountAmount}</span>
                    </>
                  )}
                {activeCoupon.firstOrderOnly && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#D71920]">1st Order Only</span>
                  </>
                )}
              </div>

              {scheduleState.remainingMs !== null && (
                <div className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-amber-700 dark:text-amber-400">
                  <Clock size={12} />
                  <span>{formatDurationCompact(scheduleState.remainingMs)} left</span>
                </div>
              )}
            </div>
          </div>

          {/* Switcher if multiple popup coupons exist */}
          {evaluation.allPopupCoupons.length > 1 && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Offer {activeIndex + 1} of {evaluation.allPopupCoupons.length}
              </span>
              <div className="flex items-center gap-1.5">
                {evaluation.allPopupCoupons.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      idx === activeIndex
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primary Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleApplyAndContinue}
              data-testid="coupon-popup-apply-btn"
              className="flex-1 py-2.5 px-4 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Tag size={14} />
              <span>
                {appliedFeedback || isAlreadyApplied
                  ? `Applied (${activeCoupon.code})`
                  : activeCoupon.popupCtaText?.trim() ||
                    (cart.length > 0 ? 'Apply & Checkout' : 'Claim & Browse Books')}
              </span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
