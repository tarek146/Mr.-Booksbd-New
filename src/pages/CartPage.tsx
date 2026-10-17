import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, ShieldCheck, Tag } from 'lucide-react';

export function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, setActivePage, settings } = useStore();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const deliveryCharge = subtotal > settings.freeShippingThreshold ? 0 : settings.insideDhakaCharge;
  const total = subtotal - discount + deliveryCharge;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'BOOKFAIR' || promoCode.trim().toUpperCase() === 'MRBOOKS10') {
      setPromoApplied(true);
    } else {
      alert('Invalid promo code. Try "BOOKFAIR" or "MRBOOKS10"');
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
            {cart.map(item => (
              <div 
                key={item.variantId}
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
                      onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                      className="px-3 py-1.5 font-bold hover:bg-[#E5E5E5] text-[#171717] transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 font-bold text-xs min-w-[2rem] text-center text-[#171717]">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                      className="px-3 py-1.5 font-bold hover:bg-[#E5E5E5] text-[#171717] transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-black text-base text-[#171717] min-w-[5rem] text-right">
                    ৳{item.price * item.quantity}
                  </span>

                  <button 
                    onClick={() => removeFromCart(item.variantId)}
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
            <div className="bg-[#F7F7F8] border border-[#E5E5E5] rounded-3xl p-6 shadow-xs space-y-6">
              <h3 className="text-base font-black text-[#171717] pb-3 border-b border-[#E5E5E5]">
                Order Summary
              </h3>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" size={14} />
                  <input 
                    type="text" 
                    placeholder="Coupon (e.g. BOOKFAIR)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#171717] uppercase focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <button 
                  type="submit"
                  className="px-3.5 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {promoApplied && (
                <div className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl text-center border border-emerald-200">
                  🎉 10% Discount Coupon Applied!
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-[#5F6368]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#171717]">৳{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount (10%)</span>
                    <span>-৳{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5F6368]">
                  <span>Estimated Delivery (Inside Dhaka)</span>
                  <span className="font-bold text-[#171717]">
                    {deliveryCharge === 0 ? 'FREE' : `৳${deliveryCharge}`}
                  </span>
                </div>
                {subtotal > settings.freeShippingThreshold && (
                  <div className="text-[11px] text-emerald-700 font-bold">
                    ✓ Qualified for Free Shipping over ৳{settings.freeShippingThreshold}
                  </div>
                )}
                <div className="pt-3 border-t border-[#E5E5E5] flex justify-between text-sm font-black text-[#171717]">
                  <span>Total Amount</span>
                  <span className="text-[#D71920] text-xl">৳{total}</span>
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
