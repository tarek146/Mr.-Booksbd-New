import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, ShieldCheck, Tag, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  calculateCheckoutPricing,
  evaluateCoupon,
  resolveActiveCoupons,
} from '../utils/storeEnhancementsHelpers';

export function CartPage() {
  const {
    cart,
    products,
    updateCartQuantity,
    removeFromCart,
    setActivePage,
    settings,
    coupons,
    appliedCouponCode,
    setAppliedCouponCode,
  } = useStore();
  const [promoCode, setPromoCode] = useState(appliedCouponCode || '');
  const [promoStatus, setPromoStatus] = useState<{ valid: boolean; text: string } | null>(null);

  useEffect(() => {
    if (appliedCouponCode) {
      setPromoCode(appliedCouponCode);
    }
  }, [appliedCouponCode]);

  const activeCoupons = resolveActiveCoupons(coupons).filter(c => c.isActive !== false);
  const pricing = calculateCheckoutPricing({
    cart,
    products,
    district: 'Dhaka',
    deliveryType: 'standard',
    settings,
    couponCode: appliedCouponCode,
    coupons: activeCoupons,
  });

  const totalCartCount = pricing.totalQuantity;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const res = evaluateCoupon(promoCode, activeCoupons, pricing.subtotal, settings.insideDhakaCharge ?? 60);
    if (res.valid) {
      setAppliedCouponCode(res.code);
      setPromoStatus({ valid: true, text: res.message });
    } else {
      setPromoStatus({ valid: false, text: res.message });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-white transition-colors">
        <div className="w-20 h-20 bg-[#FFF1F2] text-[#D71920] rounded-full flex items-center justify-center mb-4 border border-[#D71920]/25">
          <ShoppingBag size={36} />
        </div>
        <h2 className="text-2xl font-black text-[#171717] mb-2">Your Shopping Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-[#5F6368] mb-6 max-w-sm">
          Looks like you haven't added any books or stationery items to your cart yet.
        </p>
        <button 
          onClick={() => setActivePage('books')}
          className="px-8 py-3.5 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-[#D71920]/25 transition-all cursor-pointer"
        >
          Explore Books Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EEEEEE]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D71920] text-white rounded-xl flex items-center justify-center shadow-sm">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
                Shopping Cart
              </h1>
              <p className="text-xs text-[#5F6368]">{totalCartCount} items in your order</p>
            </div>
          </div>
          <button 
            onClick={() => setActivePage('books')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#5F6368] hover:text-[#D71920] transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Continue Shopping
          </button>
        </div>

        {/* Grid: Cart Items (8 cols) & Summary (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item, idx) => (
              <div 
                key={`${item.productId}-${item.variantId}-${idx}`}
                className="bg-white border border-[#E5E5E5] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 shadow-xs"
              >
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-20 h-24 object-contain bg-[#F7F7F8] rounded-xl p-2 shrink-0 border border-[#E5E5E5]"
                />

                <div className="flex-1 text-center sm:text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D71920]">{item.type}</span>
                  <h3 className="font-bold text-[#171717] text-base mt-0.5 line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-[#5F6368] mt-1">
                    Format: <strong className="text-[#171717]">{item.variantName}</strong>
                  </p>
                  <p className="text-sm font-black text-[#D71920] mt-2">৳{item.price} each</p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Stepper */}
                  <div className="flex items-center border border-[#E5E5E5] rounded-xl overflow-hidden bg-[#F7F7F8]">
                    <button 
                      onClick={() => updateCartQuantity(item.variantId, item.quantity - 1, item.productId)}
                      className="px-3 py-1.5 font-bold hover:bg-[#E5E5E5] text-[#171717] transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 font-bold text-xs min-w-[2rem] text-center text-[#171717]">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateCartQuantity(item.variantId, item.quantity + 1, item.productId)}
                      className="px-3 py-1.5 font-bold hover:bg-[#E5E5E5] text-[#171717] transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-black text-base text-[#171717] min-w-[5rem] text-right">
                    ৳{item.price * item.quantity}
                  </span>

                  <button 
                    onClick={() => removeFromCart(item.variantId, item.productId)}
                    className="p-2 text-[#777777] hover:text-[#D71920] hover:bg-[#FFF1F2] rounded-lg transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="bg-[#F7F7F8] border border-[#E5E5E5] rounded-3xl p-6 shadow-xs space-y-5">
              <h3 className="text-base font-black text-[#171717] pb-3 border-b border-[#E5E5E5]">
                Order Summary
              </h3>

              {/* Promo Code Form */}
              <div className="space-y-2.5">
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" size={14} />
                    <input 
                      type="text" 
                      placeholder="Coupon (e.g. MRBOOKS10)"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        setPromoStatus(null);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#171717] uppercase focus:outline-none focus:border-[#D71920]"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-3.5 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                  {appliedCouponCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCouponCode('');
                        setPromoCode('');
                        setPromoStatus(null);
                      }}
                      aria-label="Remove coupon"
                      className="px-2.5 py-2 bg-white border border-neutral-300 text-neutral-600 hover:text-red-600 rounded-xl cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </form>

                {/* Clickable Coupon Quick Chips */}
                {activeCoupons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {activeCoupons.slice(0, 3).map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setPromoCode(c.code);
                          const res = evaluateCoupon(c.code, activeCoupons, pricing.subtotal, settings.insideDhakaCharge ?? 60);
                          if (res.valid) {
                            setAppliedCouponCode(res.code);
                            setPromoStatus({ valid: true, text: res.message });
                          } else {
                            setPromoStatus({ valid: false, text: res.message });
                          }
                        }}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-extrabold cursor-pointer transition-colors ${
                          appliedCouponCode === c.code
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#D71920]'
                        }`}
                      >
                        {c.code} ({c.badgeText || (c.discountType === 'percentage' ? `${c.discountValue}%` : c.discountType === 'free_delivery' ? 'FREE DEL' : `৳${c.discountValue}`)})
                      </button>
                    ))}
                  </div>
                )}

                {promoStatus && (
                  <div className={`text-xs font-bold p-2.5 rounded-xl border flex items-center gap-1.5 ${
                    promoStatus.valid
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-red-700 bg-red-50 border-red-200'
                  }`}>
                    {promoStatus.valid ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
                    <span>{promoStatus.text}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-[#5F6368]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#171717]">৳{pricing.subtotal}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount ({appliedCouponCode})</span>
                    <span>-৳{pricing.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5F6368]">
                  <span>Estimated Delivery (Inside Dhaka)</span>
                  <span className="font-bold text-[#171717]">
                    {pricing.deliveryCharge === 0 ? 'FREE' : `৳${pricing.deliveryCharge}`}
                  </span>
                </div>
                {pricing.freeDeliveryReason === 'threshold' && (
                  <div className="text-[11px] text-emerald-700 font-bold">
                    ✓ Qualified for Free Shipping over ৳{settings.freeShippingThreshold}
                  </div>
                )}
                <div className="pt-3 border-t border-[#E5E5E5] flex justify-between text-sm font-black text-[#171717]">
                  <span>Total Amount</span>
                  <span className="text-[#D71920] text-xl">৳{pricing.total}</span>
                </div>
              </div>

              <button 
                onClick={() => setActivePage('checkout')}
                className="w-full py-4 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-lg shadow-[#D71920]/25 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#777777]">
                <ShieldCheck size={14} className="text-[#D71920]" />
                <span>100% Secure Checkout & Manual Verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
