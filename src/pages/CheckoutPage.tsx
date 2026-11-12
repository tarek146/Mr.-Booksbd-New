import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { PaymentInstructions, PaymentBrandIcon } from '../components/PaymentInstructions';
import {
  validateBangladeshPhone,
  sortPaymentMethods,
  getPaymentMethodDisplayMeta,
  validatePaymentTransactionPopup,
} from '../utils/reviewHelpers';
import { PaymentMethodConfig } from '../types';
import { formatAddressPreview, sanitizeSavedAddress, SavedDeliveryAddress } from '../utils/addressHelpers';
import {
  trackFacebookConversionEvent,
  buildCartCustomData,
  saveCustomerMatchProfile,
} from '../utils/facebookCapiHelpers';
import {
  calculateCheckoutPricing,
  evaluateCoupon,
  resolveActiveCoupons,
} from '../utils/storeEnhancementsHelpers';
import { Truck, CreditCard, Check, ArrowLeft, ArrowRight, Phone, RotateCcw, Search, Sparkles, Tag, TicketPercent, X, CheckCircle2, AlertCircle } from 'lucide-react';

const BANGLADESH_DISTRICTS = [
  'Dhaka', 'Sub Area', 'Gazipur', 'Narayanganj', 'Chittagong', 'Sylhet', 'Rajshahi', 
  'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Cox\'s Bazar', 'Bogura'
];

export function CheckoutPage() {
  const {
    cart,
    products,
    paymentMethods,
    settings,
    createOrder,
    submitPaymentProof,
    setActivePage,
    orders,
    trackOrder,
    visitorId,
    coupons,
    appliedCouponCode,
    setAppliedCouponCode,
  } = useStore();
  const { currentUser } = useAuth();

  const [name, setName] = useState(currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [optionalPhone, setOptionalPhone] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [district, setDistrict] = useState('Dhaka');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // Returning Customer Address Autofill State
  const [savedAddressData, setSavedAddressData] = useState<SavedDeliveryAddress | null>(null);
  const [addressAutoFilled, setAddressAutoFilled] = useState(false);
  const [showPhoneLookup, setShowPhoneLookup] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [isSearchingOldAddress, setIsSearchingOldAddress] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Check for saved delivery address from local storage on mount or recent user order
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mrb_last_delivery_address');
      if (stored) {
        const parsed = JSON.parse(stored);
        const sanitized = sanitizeSavedAddress(parsed);
        if (sanitized) {
          setSavedAddressData(sanitized);
          return;
        }
      }
    } catch {
      // Storage access check
    }

    // Fallback: check if logged-in user has previous orders
    if (currentUser?.uid && orders.length > 0) {
      const pastOrder = orders.find(
        o => o.userId === currentUser.uid || (currentUser.email && o.email === currentUser.email)
      );
      if (pastOrder && pastOrder.address) {
        setSavedAddressData({
          name: pastOrder.customerName,
          phone: pastOrder.phone,
          optionalPhone: pastOrder.optionalPhone || '',
          email: pastOrder.email || '',
          district: pastOrder.district || 'Dhaka',
          city: pastOrder.city || '',
          address: pastOrder.address || '',
          customerNote: ''
        });
      }
    }
  }, [currentUser, orders]);

  // Fire Facebook InitiateCheckout when entering Checkout Page with items in cart
  useEffect(() => {
    if (!cart || cart.length === 0) return;
    void trackFacebookConversionEvent({
      eventName: 'InitiateCheckout',
      settings,
      customData: buildCartCustomData(cart),
      customerProfile: {
        fullName: name || savedAddressData?.name || currentUser?.displayName || undefined,
        phone: phone || savedAddressData?.phone || undefined,
        email: email || savedAddressData?.email || currentUser?.email || undefined,
        city: city || savedAddressData?.city || district || 'Dhaka',
        state: district || savedAddressData?.district || 'Dhaka',
        externalId: currentUser?.uid || visitorId,
      },
      uniqueKey: cart.map(i => `${i.productId}_${i.quantity}`).join('-'),
    });
  }, [cart.length]);

  // Keep customer match profile continuously enriched as customer fills checkout fields
  useEffect(() => {
    if (!name && !phone && !email) return;
    saveCustomerMatchProfile({
      fullName: name || undefined,
      phone: phone || undefined,
      email: email || undefined,
      city: city || district || 'Dhaka',
      state: district || 'Dhaka',
      zipCode: district.toLowerCase() === 'dhaka' ? '1200' : '1000',
      country: 'bd',
      externalId: currentUser?.uid || visitorId,
    });
  }, [name, phone, email, district, city, currentUser?.uid, visitorId]);

  const hasSavedAddress = Boolean(savedAddressData?.address || savedAddressData?.phone);

  const savedAddressPreview = useMemo(() => {
    return formatAddressPreview(savedAddressData);
  }, [savedAddressData]);

  const applyAddressObj = (addr: {
    name?: string;
    phone?: string;
    optionalPhone?: string;
    email?: string;
    district?: string;
    city?: string;
    address?: string;
    customerNote?: string;
  }) => {
    if (addr.name) setName(addr.name);
    if (addr.phone) setPhone(addr.phone);
    if (addr.optionalPhone) setOptionalPhone(addr.optionalPhone);
    if (addr.email) setEmail(addr.email);
    if (addr.district && BANGLADESH_DISTRICTS.includes(addr.district)) {
      setDistrict(addr.district);
    }
    if (addr.city) setCity(addr.city);
    if (addr.address) setAddress(addr.address);
    if (addr.customerNote) setCustomerNote(addr.customerNote);

    setAddressAutoFilled(true);
    setTimeout(() => setAddressAutoFilled(false), 4500);
  };

  const handleApplyOldAddress = () => {
    if (savedAddressData) {
      applyAddressObj(savedAddressData);
      return;
    }

    // If logged in, check past orders
    if (currentUser?.uid && orders.length > 0) {
      const pastOrder = orders.find(
        o => o.userId === currentUser.uid || (currentUser.email && o.email === currentUser.email)
      );
      if (pastOrder && pastOrder.address) {
        const obj = {
          name: pastOrder.customerName,
          phone: pastOrder.phone,
          optionalPhone: pastOrder.optionalPhone || '',
          email: pastOrder.email || '',
          district: pastOrder.district || 'Dhaka',
          city: pastOrder.city || '',
          address: pastOrder.address || '',
          customerNote: ''
        };
        setSavedAddressData(obj);
        applyAddressObj(obj);
        try {
          localStorage.setItem('mrb_last_delivery_address', JSON.stringify(obj));
        } catch {}
        return;
      }
    }

    // If no saved address found on this browser, show phone number lookup
    setShowPhoneLookup(true);
  };

  const handleLookupByPhone = async () => {
    const rawDigits = lookupPhone.replace(/[^0-9]/g, '');
    if (rawDigits.length < 10) {
      setLookupError('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (e.g. 017XXXXXXXX)।');
      return;
    }
    setIsSearchingOldAddress(true);
    setLookupError('');
    try {
      const found = await trackOrder(rawDigits);
      if (found && (found.address || found.customerName)) {
        const obj = {
          name: found.customerName || '',
          phone: found.phone || rawDigits,
          optionalPhone: found.optionalPhone || '',
          email: found.email || '',
          district: found.district || 'Dhaka',
          city: found.city || '',
          address: found.address || '',
          customerNote: ''
        };
        setSavedAddressData(obj);
        applyAddressObj(obj);
        try {
          localStorage.setItem('mrb_last_delivery_address', JSON.stringify(obj));
        } catch {}
        setShowPhoneLookup(false);
      } else {
        setLookupError('এই নম্বরে কোনো পূর্ববর্তী অর্ডারের ঠিকানা পাওয়া যায়নি। নিচের বক্সে নতুন ঠিকানা পূরণ করুন।');
      }
    } catch {
      setLookupError('তথ্য লোড করতে সাময়িক সমস্যা হয়েছে। দয়া করে ম্যানুয়ালি লিখুন।');
    } finally {
      setIsSearchingOldAddress(false);
    }
  };


  // Payment Verification & Popup Modal State
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentSubmitted, setIsPaymentSubmitted] = useState(false);
  const [selectedSubOptionLabel, setSelectedSubOptionLabel] = useState('সেন্ড মানি');

  // Delivery type: 'standard' (Home Delivery) or 'sundarban' (Sundarban Courier)
  const [deliveryType, setDeliveryType] = useState<'standard' | 'sundarban'>('standard');

  // Deterministically sorted payment methods: Cash on Delivery (COD) 1st -> bKash 2nd -> Nagad -> Rocket -> Upay -> Bank
  const sortedPaymentMethods = useMemo(() => {
    return sortPaymentMethods(
      paymentMethods.filter(
        m =>
          m.isActive &&
          (deliveryType !== 'sundarban' ||
            m.type !== 'cod' ||
            settings.sundarbanForcesPrepayment === false)
      )
    );
  }, [paymentMethods, deliveryType, settings.sundarbanForcesPrepayment]);

  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    () =>
      paymentMethods.find(m => m.isActive && m.type === 'cod')?.id ||
      paymentMethods[0]?.id ||
      'cod'
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Ensure COD is selected by default when payment methods finish loading on Standard Delivery
  useEffect(() => {
    if (sortedPaymentMethods.length === 0) return;
    const exists = sortedPaymentMethods.some(m => m.id === selectedPaymentId);
    if (!exists) {
      const codMethod = sortedPaymentMethods.find(m => m.type === 'cod');
      setSelectedPaymentId(codMethod?.id || sortedPaymentMethods[0].id);
    }
  }, [sortedPaymentMethods, selectedPaymentId]);

  const handleSelectPaymentMethod = (method: PaymentMethodConfig) => {
    const isSwitchingMethod = selectedPaymentId !== method.id;
    setSelectedPaymentId(method.id);
    setErrorMsg('');

    void trackFacebookConversionEvent({
      eventName: 'AddPaymentInfo',
      settings,
      customData: buildCartCustomData(cart, { paymentType: method.name }),
      customerProfile: {
        fullName: name || savedAddressData?.name || currentUser?.displayName || undefined,
        phone: phone || savedAddressData?.phone || undefined,
        email: email || savedAddressData?.email || currentUser?.email || undefined,
        city: city || savedAddressData?.city || district || 'Dhaka',
        state: district || savedAddressData?.district || 'Dhaka',
        externalId: currentUser?.uid || visitorId,
      },
      uniqueKey: `${method.id}_${cart.length}`,
    });

    if (method.type === 'cod') {
      setIsPaymentModalOpen(false);
      setIsPaymentSubmitted(false);
    } else {
      if (isSwitchingMethod) {
        setIsPaymentSubmitted(false);
      }
      setIsPaymentModalOpen(true);
    }
  };

  // If Sundarban is selected and prepayment is enforced, ensure COD is deselected and pick first online payment method (bKash)
  const handleDeliveryTypeChange = (type: 'standard' | 'sundarban') => {
    setDeliveryType(type);
    if (type === 'sundarban' && settings.sundarbanForcesPrepayment !== false) {
      const onlineMethod = sortPaymentMethods(paymentMethods).find(
        m => m.isActive && m.type !== 'cod'
      );
      if (onlineMethod) {
        setSelectedPaymentId(onlineMethod.id);
        setIsPaymentModalOpen(true);
      }
    }
  };

  // Calculate form completion percentage parameter (25% each for Name, Phone, Address, District/City)
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (name.trim().length >= 2) score += 25;
    if (/^(\+?8801|01)[3-9]\d{8}$/.test(phone.trim().replace(/[\s-]/g, ''))) score += 25;
    if (district) score += 25;
    if (address.trim().length >= 5) score += 25;
    return score;
  }, [name, phone, district, address]);

  // Coupon Input State synced with StoreContext
  const [couponInput, setCouponInput] = useState(appliedCouponCode || '');
  const [couponFeedback, setCouponFeedback] = useState<{ valid: boolean; text: string } | null>(null);

  useEffect(() => {
    if (appliedCouponCode) {
      setCouponInput(appliedCouponCode);
    }
  }, [appliedCouponCode]);

  const activeCouponsList = useMemo(
    () => resolveActiveCoupons(coupons).filter(c => c.isActive !== false),
    [coupons]
  );

  // Dynamic Pricing, Delivery, Free Threshold & Coupon Calculation
  const pricingSummary = useMemo(
    () =>
      calculateCheckoutPricing({
        cart,
        products,
        district,
        deliveryType,
        settings,
        couponCode: appliedCouponCode,
        coupons: activeCouponsList,
      }),
    [cart, products, district, deliveryType, settings, appliedCouponCode, activeCouponsList]
  );

  const subtotal = pricingSummary.subtotal;
  const baseDelivery = pricingSummary.baseDelivery;
  const extraWeightCharge = pricingSummary.extraWeightCharge;
  const deliveryCharge = pricingSummary.deliveryCharge;
  const hasFreeDelivery = pricingSummary.hasFreeDelivery;
  const discount = pricingSummary.discount;
  const total = pricingSummary.total;

  const handleApplyCheckoutCoupon = (codeToApply?: string) => {
    const raw = typeof codeToApply === 'string' ? codeToApply : couponInput;
    const res = evaluateCoupon(raw, activeCouponsList, subtotal, baseDelivery + extraWeightCharge);
    if (res.valid) {
      setCouponInput(res.code);
      setAppliedCouponCode(res.code);
      setCouponFeedback({ valid: true, text: res.message });
    } else {
      setCouponFeedback({ valid: false, text: res.message });
    }
  };

  const selectedMethod =
    sortedPaymentMethods.find(m => m.id === selectedPaymentId) ||
    sortedPaymentMethods[0] ||
    paymentMethods[0];

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    const primaryPhoneCheck = validateBangladeshPhone(phone, false);
    const optionalPhoneCheck = validateBangladeshPhone(optionalPhone, true);
    const cleanAddress = address.trim();

    if (cleanName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!primaryPhoneCheck.valid) {
      setErrorMsg(primaryPhoneCheck.error || 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).');
      return;
    }

    if (!optionalPhoneCheck.valid) {
      setErrorMsg(optionalPhoneCheck.error || 'Please enter a valid 11-digit optional mobile number or leave it blank.');
      return;
    }

    const cleanPhone = primaryPhoneCheck.cleaned;
    const cleanOptionalPhone = optionalPhoneCheck.cleaned;

    if (cleanAddress.length < 5) {
      setErrorMsg('Please enter a detailed delivery address (minimum 5 characters).');
      return;
    }

    if (deliveryType === 'sundarban' && settings.sundarbanForcesPrepayment !== false && selectedMethod?.type === 'cod') {
      setErrorMsg('Sundarban Courier Delivery requires advance online payment (bKash/Nagad/Card). Cash on Delivery is disabled for Sundarban.');
      return;
    }

    // For online/manual payment methods, ensure the user submitted their transaction details via the popup Done button
    if (selectedMethod && selectedMethod.type !== 'cod') {
      const popupCheck = validatePaymentTransactionPopup(
        selectedMethod.type,
        senderNumber,
        transactionId
      );
      if (!popupCheck.valid || !isPaymentSubmitted) {
        setIsPaymentModalOpen(true);
        setErrorMsg(
          popupCheck.error ||
            'অনুগ্রহ করে পপআপে ট্রানজেকশন তথ্য পূরণ করে "Done" বাটনে ক্লিক করুন, তারপর অর্ডার কনফার্ম করুন।'
        );
        return;
      }
    }

    if (cart.length === 0) {
      setErrorMsg('Your shopping cart is currently empty.');
      return;
    }

    setLoading(true);
    try {
      const deliveryLabel = deliveryType === 'sundarban' ? 'Sundarban Courier (Prepaid)' : 'Standard Home Delivery';
      const fullNotes = [
        customerNote.trim() ? `Customer Note: ${customerNote.trim()}` : '',
        cleanOptionalPhone ? `Alt Phone: ${cleanOptionalPhone}` : '',
        `Delivery Method: ${deliveryLabel}`
      ].filter(Boolean).join(' | ');

      const resolvedPaymentMethodName =
        selectedMethod.type !== 'cod' && selectedSubOptionLabel
          ? `${selectedMethod.name} (${selectedSubOptionLabel})`
          : selectedMethod.name;

      const orderId = await createOrder({
        userId: currentUser?.uid || ('guest-' + Date.now()),
        customerName: cleanName,
        phone: cleanPhone,
        ...(cleanOptionalPhone ? { optionalPhone: cleanOptionalPhone } : {}),
        email: email.trim(),
        district,
        city: city.trim(),
        address: cleanAddress,
        notes: fullNotes,
        items: cart,
        subtotal,
        deliveryCharge,
        discount,
        ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
        total,
        paymentMethodId: selectedMethod.id,
        paymentMethodName: resolvedPaymentMethodName
      });

      // Save delivery address to localStorage for returning customer autofill
      try {
        const addrToSave = {
          name: cleanName,
          phone: cleanPhone,
          optionalPhone: cleanOptionalPhone,
          email: email.trim(),
          district,
          city: city.trim(),
          address: cleanAddress,
          customerNote: customerNote.trim()
        };
        localStorage.setItem('mrb_last_delivery_address', JSON.stringify(addrToSave));
        setSavedAddressData(addrToSave);
      } catch (storageErr) {
        console.warn('Could not cache address:', storageErr);
      }

      // If online payment is selected and transaction details are provided, submit proof immediately
      if (selectedMethod?.type !== 'cod' && transactionId.trim() && senderNumber.trim()) {
        try {
          await submitPaymentProof({
            orderId,
            userId: currentUser?.uid || ('guest-' + Date.now()),
            customerName: cleanName,
            customerPhone: cleanPhone,
            providerId: selectedMethod.id,
            providerName: resolvedPaymentMethodName,
            transactionReference: transactionId.trim(),
            senderIdentifier: senderNumber.trim(),
            claimedAmount: total
          });
        } catch (proofErr) {
          console.warn('Payment proof submission deferred:', proofErr);
        }
      }

      setActivePage('order-success', orderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check your cart and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setActivePage('cart')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#5F6368] hover:text-[#D71920] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Cart
          </button>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Address, Delivery Options & Payment Methods */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Delivery Address Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#EEEEEE] flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFF1F2] text-[#D71920] rounded-xl flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#171717]">Delivery Address</h2>
                    <p className="text-xs text-[#5F6368]">Where should we deliver your book parcel?</p>
                  </div>
                </div>

                {/* Checkout Form Completion Parameter Bar */}
                <div className="bg-neutral-100 border border-neutral-200 px-3.5 py-1.5 rounded-2xl flex items-center gap-2.5">
                  <div className="text-[11px] font-bold text-neutral-700">
                    Form Completion: <span className="text-[#D71920] font-black">{completionPercentage}%</span>
                  </div>
                  <div className="w-24 sm:w-28 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#D71920] transition-all duration-300 rounded-full"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Returning Customer Address Autofill Banner / Action Button */}
              {settings.enableUseOldAddress !== false && (
                <div className="bg-linear-to-r from-red-50/70 via-amber-50/50 to-neutral-50/80 border border-red-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-red-200 text-[#D71920] flex items-center justify-center shrink-0 shadow-2xs">
                        <RotateCcw size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-neutral-900">
                            পুরান কাস্টমার? (Returning Customer)
                          </span>
                          {hasSavedAddress && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Check size={10} /> সেভড অ্যাড্রেস প্রস্তুত
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-600 mt-0.5">
                          {savedAddressPreview 
                            ? `সংরক্ষিত ঠিকানা: ${savedAddressPreview}` 
                            : 'এক ক্লিকে আপনার পূর্বের নাম, মোবাইল ও ডেলিভারি ঠিকানা পূরণ করুন।'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
                      <button
                        type="button"
                        onClick={handleApplyOldAddress}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                      >
                        <RotateCcw size={14} className={isSearchingOldAddress ? 'animate-spin' : ''} />
                        <span>{settings.oldAddressButtonLabel || 'ইউজ ওল্ড এড্রেস (সেম অ্যাড্রেস)'}</span>
                      </button>

                      {!hasSavedAddress && !showPhoneLookup && (
                        <button
                          type="button"
                          onClick={() => setShowPhoneLookup(true)}
                          title="আগের মোবাইল নম্বর দিয়ে খুঁজুন"
                          className="px-3 py-2.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Search size={13} />
                          <span className="hidden sm:inline">নম্বর দিয়ে খুঁজুন</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Phone Lookup Modal/Box when no address in local storage */}
                  {showPhoneLookup && (
                    <div className="mt-3 pt-3 border-t border-neutral-200/90 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                        <span>পূর্বে অর্ডার করা ফোন নম্বর দিয়ে ঠিকানা লোড করুন:</span>
                        <button
                          type="button"
                          onClick={() => setShowPhoneLookup(false)}
                          className="text-neutral-500 hover:text-neutral-800 text-[11px] cursor-pointer"
                        >
                          ✕ বন্ধ করুন
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={lookupPhone}
                          onChange={e => setLookupPhone(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleLookupByPhone())}
                          placeholder="017XXXXXXXX"
                          className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white text-[#171717] focus:outline-none focus:border-[#D71920]"
                        />
                        <button
                          type="button"
                          onClick={handleLookupByPhone}
                          disabled={isSearchingOldAddress}
                          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSearchingOldAddress ? 'খোঁজা হচ্ছে...' : 'খুঁজুন ও পূরণ করুন'}
                        </button>
                      </div>
                      {lookupError && (
                        <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                          {lookupError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Address auto-filled confirmation feedback */}
                  {addressAutoFilled && (
                    <div className="mt-3 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <Check size={14} className="text-emerald-600 shrink-0" />
                      <span>পূর্বের ডেলিভারি ঠিকানা সফলভাবে পূরণ করা হয়েছে! (Old address auto-filled)</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Full Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Abdullah Al Mamun"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Email Address (Optional)
                  </label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              {/* Primary Phone & Optional Secondary Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#EEEEEE]">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5 flex items-center gap-1.5">
                    <Phone size={12} className="text-[#D71920] shrink-0" />
                    <span>Mobile Phone Number *</span>
                  </label>
                  <input 
                    type="tel" 
                    required 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX (Primary)"
                    aria-label="Mobile Phone Number"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] font-medium focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1.5 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 truncate">
                      <Phone size={12} className="text-neutral-400 shrink-0" />
                      <span className="truncate">Optional Phone (অপশনাল নাম্বার)</span>
                    </span>
                    <span className="text-[10px] font-semibold bg-neutral-200/80 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">Optional</span>
                  </label>
                  <input 
                    type="tel" 
                    value={optionalPhone} 
                    onChange={e => setOptionalPhone(e.target.value)}
                    placeholder="018XXXXXXXX (বিকল্প নাম্বার - অপশনাল)"
                    aria-label="Optional Phone Number"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] font-medium focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    District *
                  </label>
                  <select 
                    value={district} 
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] focus:outline-none focus:border-[#D71920]"
                  >
                    {BANGLADESH_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Thana / City / Area *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Mirpur, Dhaka"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                  Full Street Address & Landmark *
                </label>
                <textarea 
                  rows={2} 
                  required 
                  value={address} 
                  onChange={e => setAddress(e.target.value)}
                  placeholder="House number, Road number, Flat, Landmark"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] focus:outline-none focus:border-[#D71920]"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                  Customer Note (কাস্টমার নোট - Optional)
                </label>
                <input 
                  type="text" 
                  value={customerNote} 
                  onChange={e => setCustomerNote(e.target.value)}
                  placeholder="Any special instruction for delivery..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </div>

            {/* Delivery Method Selection: Standard vs Sundarban Courier */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#EEEEEE]">
                <div className="w-10 h-10 bg-[#FFF1F2] text-[#D71920] rounded-xl flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#171717]">Select Delivery Method</h2>
                  <p className="text-xs text-[#5F6368]">Choose between Standard Home Delivery or Sundarban Courier</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  onClick={() => handleDeliveryTypeChange('standard')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    deliveryType === 'standard' ? 'border-[#D71920] bg-[#FFF1F2] shadow-xs' : 'border-[#E5E5E5] bg-white hover:border-zinc-400'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-[#171717]">Standard Home Delivery</h4>
                    <p className="text-[11px] text-[#5F6368]">Inside/Outside Dhaka (COD available)</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    deliveryType === 'standard' ? 'border-[#D71920] bg-[#D71920] text-white' : 'border-[#CCCCCC]'
                  }`}>
                    {deliveryType === 'standard' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </div>

                <div 
                  onClick={() => handleDeliveryTypeChange('sundarban')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    deliveryType === 'sundarban' ? 'border-[#D71920] bg-[#FFF1F2] shadow-xs' : 'border-[#E5E5E5] bg-white hover:border-zinc-400'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-[#171717]">Sundarban Courier Delivery</h4>
                    <p className="text-[11px] text-[#5F6368]">Prepayment required (COD disabled)</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    deliveryType === 'sundarban' ? 'border-[#D71920] bg-[#D71920] text-white' : 'border-[#CCCCCC]'
                  }`}>
                    {deliveryType === 'sundarban' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </div>
              </div>

              {deliveryType === 'sundarban' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold leading-relaxed space-y-1">
                  <p className="font-bold">⚠️ Sundarban Courier Notice:</p>
                  <p>{settings.deliveryNote || 'সুন্দরবন কুরিয়ার সার্ভিসের ক্ষেত্রে সম্পূর্ণ পেমেন্ট অগ্রিম প্রযোজ্য। ক্যাশ অন ডেলিভারি প্রযোজ্য নয়।'}</p>
                </div>
              )}
            </div>

            {/* Payment Method Selection (Ordered: COD -> bKash -> Nagad -> Rocket -> Others) */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="space-y-1 pb-3 border-b border-[#EEEEEE]">
                <div className="flex items-center gap-2.5">
                  <CreditCard size={20} className="text-[#F15A24] shrink-0" />
                  <h2 className="text-lg font-black text-[#171717]">Select Payment Method</h2>
                </div>
                <p className="text-xs text-[#5F6368]">
                  {deliveryType === 'sundarban'
                    ? 'Select Online Payment Method (Sundarban Courier requires advance payment)'
                    : 'Cash on Delivery or Mobile Banking (bKash / Nagad / Rocket)'}
                </p>
              </div>

              <div
                data-testid="payment-methods-grid"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1"
              >
                {sortedPaymentMethods.map(method => {
                  const isSelected = selectedPaymentId === method.id;
                  const meta = getPaymentMethodDisplayMeta(method);
                  return (
                    <div
                      key={method.id}
                      data-testid={`payment-card-${method.type}`}
                      onClick={() => handleSelectPaymentMethod(method)}
                      className={`relative p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-[#D71920] bg-[#FFF1F2]/70 shadow-2xs ring-2 ring-[#D71920]/10'
                          : 'border-slate-200/90 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Optional Top-right Promo Badge (only if set from Admin Panel) */}
                      {meta.badgeText && (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF8A00] via-[#F15A24] to-[#E2136E] text-white text-[9px] font-black tracking-wide shadow-2xs flex items-center gap-0.5 z-10">
                          <span>🔥</span>
                          <span>{meta.badgeText}</span>
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-1.5">
                        <PaymentBrandIcon method={method} size="sm" />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'border-[#D71920] bg-[#D71920] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-black text-xs text-slate-900 leading-tight truncate">
                          {meta.displayTitle}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
                          {meta.displaySubtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Payment Instructions Popup Modal & Status Summary */}
              {selectedMethod && (
                <PaymentInstructions
                  selectedMethod={selectedMethod}
                  allMethods={paymentMethods}
                  onSelectMethod={m => setSelectedPaymentId(m.id)}
                  onSelectSubOption={sub => setSelectedSubOptionLabel(sub.label)}
                  totalAmount={total}
                  transactionId={transactionId}
                  setTransactionId={setTransactionId}
                  senderNumber={senderNumber}
                  setSenderNumber={setSenderNumber}
                  isModalOpen={isPaymentModalOpen}
                  setIsModalOpen={setIsPaymentModalOpen}
                  isPaymentSubmitted={isPaymentSubmitted}
                  setIsPaymentSubmitted={setIsPaymentSubmitted}
                />
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Order Summary & Confirm Order */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="bg-[#F7F7F8] border border-[#E5E5E5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <h3 className="text-base font-black text-[#171717] pb-3 border-b border-[#E5E5E5]">
                Order Review ({cart.length} items)
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.variantId} className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.image} alt="" className="w-9 h-11 object-contain bg-white rounded-lg p-0.5 border border-[#E5E5E5] shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-[#171717] truncate">{item.title}</p>
                        <p className="text-[#777777]">{item.variantName} × {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#171717] shrink-0">
                      ৳{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Application Section */}
              <div className="pt-3 border-t border-[#E5E5E5] space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                  <TicketPercent size={13} className="text-[#D71920]" /> Have a Coupon Code?
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={13} />
                    <input
                      type="text"
                      data-testid="checkout-coupon-input"
                      value={couponInput}
                      onChange={e => {
                        setCouponInput(e.target.value);
                        setCouponFeedback(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCheckoutCoupon();
                        }
                      }}
                      placeholder="Enter code (e.g. MRBOOKS10)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-900 uppercase focus:outline-none focus:border-[#D71920]"
                    />
                  </div>
                  <button
                    type="button"
                    data-testid="checkout-coupon-apply-btn"
                    onClick={() => handleApplyCheckoutCoupon()}
                    className="px-3.5 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Apply
                  </button>
                  {appliedCouponCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCouponCode('');
                        setCouponInput('');
                        setCouponFeedback(null);
                      }}
                      aria-label="Clear applied coupon"
                      className="px-2.5 py-2 bg-white border border-neutral-300 text-neutral-600 hover:text-red-600 rounded-xl cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {activeCouponsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {activeCouponsList.slice(0, 3).map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleApplyCheckoutCoupon(c.code)}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-extrabold cursor-pointer transition-colors ${
                          appliedCouponCode === c.code
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#D71920]'
                        }`}
                      >
                        {c.code} • {c.badgeText || (c.discountType === 'percentage' ? `${c.discountValue}% OFF` : c.discountType === 'free_delivery' ? 'FREE DEL' : `৳${c.discountValue}`)}
                      </button>
                    ))}
                  </div>
                )}

                {couponFeedback && (
                  <div className={`p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border ${
                    couponFeedback.valid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {couponFeedback.valid ? <CheckCircle2 size={13} className="shrink-0" /> : <AlertCircle size={13} className="shrink-0" />}
                    <span>{couponFeedback.text}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#E5E5E5] text-xs">
                <div className="flex justify-between text-[#5F6368]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#171717]">৳{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div data-testid="checkout-discount-row" className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount ({appliedCouponCode})</span>
                    <span>-৳{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5F6368]">
                  <span>Delivery ({deliveryType === 'sundarban' ? 'Sundarban' : district})</span>
                  <span className="font-bold text-[#171717]">
                    {hasFreeDelivery ? (
                      <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        FREE (৳0)
                      </span>
                    ) : (
                      `৳${baseDelivery}`
                    )}
                  </span>
                </div>
                {extraWeightCharge > 0 && (
                  <div className="flex justify-between text-[#5F6368]">
                    <span>Extra Weight/Items Charge</span>
                    <span className="font-bold text-[#171717]">৳{extraWeightCharge}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#E5E5E5] flex justify-between text-sm font-black text-[#171717]">
                  <span>Total Payable</span>
                  <span data-testid="checkout-total-payable" className="text-[#D71920] text-xl">৳{total}</span>
                </div>
              </div>
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-lg shadow-[#D71920]/25 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Placing Order...' : 'Confirm Order Now'} <ArrowRight size={16} />
              </button>

              <p className="text-[11px] text-center text-[#777777]">
                By clicking Confirm, you accept MR. BOOKS delivery and payment verification policy.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
