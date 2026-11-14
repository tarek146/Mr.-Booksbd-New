import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import {
  PaymentInstructions,
  CheckoutCodPaymentIcon,
  CheckoutOnlinePaymentIcon,
} from '../components/PaymentInstructions';
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
  getCouponScheduleState,
  normalizeCouponPhoneLast10,
  resolveActiveCoupons,
} from '../utils/storeEnhancementsHelpers';
import {
  Check,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  checkCustomerFraudByPhone,
  getDefaultCourierProvider,
  SteadfastFraudCheckReport,
} from '../utils/steadfastCourierService';
import { useCheckoutFraudCheck } from '../hooks/useCheckoutFraudCheck';
import { computeCheckoutCompletion } from '../utils/checkoutProgressHelpers';
import { getUnincludedCartItems } from '../utils/directCheckoutHelpers';
import {
  resolveProductImageFitMode,
  getProductImageLayoutClasses,
} from '../utils/productImageLayoutHelpers';

const BANGLADESH_DISTRICTS = [
  'Dhaka',
  'Sub Area',
  'Gazipur',
  'Narayanganj',
  'Chittagong',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Rangpur',
  'Mymensingh',
  'Comilla',
  "Cox's Bazar",
  'Bogura',
];

export function CheckoutPage() {
  const {
    cart,
    directCheckoutItems,
    removeFromCart,
    removeDirectCheckoutItem,
    includeCartInDirectCheckout,
    clearDirectCheckout,
    products,
    paymentMethods,
    settings,
    homeConfig,
    createOrder,
    submitPaymentProof,
    setActivePage,
    orders,
    trackOrder,
    visitorId,
    coupons,
    appliedCouponCode,
    setAppliedCouponCode,
    fetchCustomerCouponProfile,
    getLocalCustomerCouponHistory,
  } = useStore();
  const { currentUser } = useAuth();
  const imageLayout = getProductImageLayoutClasses(
    resolveProductImageFitMode(settings, homeConfig)
  );

  const isDirectCheckout =
    settings.directOrderIsolatesCart !== false && directCheckoutItems !== null;
  const checkoutItems = isDirectCheckout ? directCheckoutItems : cart;

  const unincludedCartItems = useMemo(
    () => (isDirectCheckout ? getUnincludedCartItems(cart, checkoutItems) : []),
    [isDirectCheckout, cart, checkoutItems]
  );

  const unincludedCartUnits = useMemo(
    () => unincludedCartItems.reduce((sum, item) => sum + item.quantity, 0),
    [unincludedCartItems]
  );

  const canRemoveCheckoutItems = settings.allowCheckoutItemRemoval !== false;

  const handleRemoveCheckoutItem = (productId: string, variantId: string) => {
    if (!canRemoveCheckoutItems) return;
    setErrorMsg('');
    if (isDirectCheckout) {
      removeDirectCheckoutItem(variantId, productId);
    } else {
      removeFromCart(variantId, productId);
    }
  };

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

  // Mobile collapsible Order Summary toggle
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Phone Number Validation & Repeat-Cancellation Fraud Checker Hook
  const fraudCheck = useCheckoutFraudCheck(phone, orders, settings);

  // Checkout form completion metric driven by required delivery fields
  const checkoutProgress = useMemo(
    () => computeCheckoutCompletion({ name, phone, district, city, address }),
    [name, phone, district, city, address]
  );

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
          customerNote: '',
        });
      }
    }
  }, [currentUser, orders]);

  // Fire Facebook InitiateCheckout when entering Checkout Page with active items
  useEffect(() => {
    if (!checkoutItems || checkoutItems.length === 0) return;
    void trackFacebookConversionEvent({
      eventName: 'InitiateCheckout',
      settings,
      customData: buildCartCustomData(checkoutItems),
      customerProfile: {
        fullName: name || savedAddressData?.name || currentUser?.displayName || undefined,
        phone: phone || savedAddressData?.phone || undefined,
        email: email || savedAddressData?.email || currentUser?.email || undefined,
        city: city || savedAddressData?.city || district || 'Dhaka',
        state: district || savedAddressData?.district || 'Dhaka',
        externalId: currentUser?.uid || visitorId,
      },
      uniqueKey: checkoutItems.map(i => `${i.productId}_${i.quantity}`).join('-'),
    });
  }, [checkoutItems.length]);

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
          customerNote: '',
        };
        setSavedAddressData(obj);
        applyAddressObj(obj);
        try {
          localStorage.setItem('mrb_last_delivery_address', JSON.stringify(obj));
        } catch {
          // ignore
        }
        return;
      }
    }

    setShowPhoneLookup(true);
  };

  const handleLookupByPhone = async () => {
    const rawDigits = lookupPhone.replace(/[^0-9]/g, '');
    if (rawDigits.length < 10) {
      setLookupError('Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).');
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
          customerNote: '',
        };
        setSavedAddressData(obj);
        applyAddressObj(obj);
        try {
          localStorage.setItem('mrb_last_delivery_address', JSON.stringify(obj));
        } catch {
          // ignore
        }
        setShowPhoneLookup(false);
      } else {
        setLookupError('No previous order found for this number. Please fill in your details below.');
      }
    } catch {
      setLookupError('Could not load saved address right now. Please enter manually.');
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
      customData: buildCartCustomData(checkoutItems, { paymentType: method.name }),
      customerProfile: {
        fullName: name || savedAddressData?.name || currentUser?.displayName || undefined,
        phone: phone || savedAddressData?.phone || undefined,
        email: email || savedAddressData?.email || currentUser?.email || undefined,
        city: city || savedAddressData?.city || district || 'Dhaka',
        state: district || savedAddressData?.district || 'Dhaka',
        externalId: currentUser?.uid || visitorId,
      },
      uniqueKey: `${method.id}_${checkoutItems.length}`,
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

  // Coupon Input State synced with StoreContext
  const [couponInput, setCouponInput] = useState(appliedCouponCode || '');
  const [couponFeedback, setCouponFeedback] = useState<{ valid: boolean; text: string } | null>(null);
  const [remoteCouponProfile, setRemoteCouponProfile] = useState<{
    orderCount: number;
    usedCoupons: string[];
  } | null>(null);

  useEffect(() => {
    if (appliedCouponCode) {
      setCouponInput(appliedCouponCode);
    }
  }, [appliedCouponCode]);

  useEffect(() => {
    let active = true;
    const normPhone = normalizeCouponPhoneLast10(phone);
    if (!normPhone && !currentUser?.uid) {
      setRemoteCouponProfile(null);
      return;
    }
    const timer = window.setTimeout(() => {
      fetchCustomerCouponProfile(phone, currentUser?.uid)
        .then(profile => {
          if (active) setRemoteCouponProfile(profile);
        })
        .catch(() => {});
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [phone, currentUser?.uid]);

  const localCouponHistory = useMemo(
    () => getLocalCustomerCouponHistory(),
    [orders.length, phone]
  );

  const couponCustomerContext = useMemo(
    () => ({
      orders,
      phone,
      email,
      userId: currentUser?.uid,
      remoteProfile: remoteCouponProfile,
      localOrderHistoryPhones: localCouponHistory.phones,
      localUsedCoupons: localCouponHistory.usedCoupons,
    }),
    [orders, phone, email, currentUser?.uid, remoteCouponProfile, localCouponHistory]
  );

  const activeCouponsList = useMemo(() => {
    const nowTs = Date.now();
    return resolveActiveCoupons(coupons, { allowFallbackDefaults: false }).filter(
      c => getCouponScheduleState(c, nowTs).isLive
    );
  }, [coupons]);

  // Dynamic Pricing, Delivery, Free Threshold & Coupon Calculation
  const pricingSummary = useMemo(
    () =>
      calculateCheckoutPricing({
        cart: checkoutItems,
        products,
        district,
        deliveryType,
        settings,
        couponCode: appliedCouponCode,
        coupons: activeCouponsList,
        customerContext: couponCustomerContext,
      }),
    [
      checkoutItems,
      products,
      district,
      deliveryType,
      settings,
      appliedCouponCode,
      activeCouponsList,
      couponCustomerContext,
    ]
  );

  const subtotal = pricingSummary.subtotal;
  const baseDelivery = pricingSummary.baseDelivery;
  const extraWeightCharge = pricingSummary.extraWeightCharge;
  const deliveryCharge = pricingSummary.deliveryCharge;
  const hasFreeDelivery = pricingSummary.hasFreeDelivery;
  const discount = pricingSummary.discount;
  const total = pricingSummary.total;

  // Auto re-validate applied coupon when phone/profile/subtotal changes (e.g. firstOrderOnly check)
  useEffect(() => {
    if (!appliedCouponCode) return;
    const check = evaluateCoupon(
      appliedCouponCode,
      activeCouponsList,
      subtotal,
      baseDelivery + extraWeightCharge,
      couponCustomerContext
    );
    if (!check.valid) {
      setAppliedCouponCode('');
      setCouponFeedback({ valid: false, text: check.message });
    }
  }, [
    appliedCouponCode,
    activeCouponsList,
    subtotal,
    baseDelivery,
    extraWeightCharge,
    couponCustomerContext,
    setAppliedCouponCode,
  ]);

  const handleApplyCheckoutCoupon = (codeToApply?: string) => {
    const raw = typeof codeToApply === 'string' ? codeToApply : couponInput;
    const res = evaluateCoupon(
      raw,
      activeCouponsList,
      subtotal,
      baseDelivery + extraWeightCharge,
      couponCustomerContext
    );
    if (res.valid) {
      setCouponInput(res.code);
      setAppliedCouponCode(res.code);
      setCouponFeedback({ valid: true, text: res.message });
    } else {
      if (appliedCouponCode && raw.trim().toUpperCase() === appliedCouponCode.toUpperCase()) {
        setAppliedCouponCode('');
      }
      setCouponFeedback({ valid: false, text: res.message });
    }
  };

  const selectedMethod =
    sortedPaymentMethods.find(m => m.id === selectedPaymentId) ||
    sortedPaymentMethods[0] ||
    paymentMethods[0];

  const codMethod = useMemo(
    () => sortedPaymentMethods.find(m => m.type === 'cod'),
    [sortedPaymentMethods]
  );

  const onlineMethods = useMemo(
    () => sortedPaymentMethods.filter(m => m.type !== 'cod'),
    [sortedPaymentMethods]
  );

  const isOnlineSelected = Boolean(selectedMethod && selectedMethod.type !== 'cod');
  const activeOnlineMethod = useMemo(() => {
    if (selectedMethod && selectedMethod.type !== 'cod') return selectedMethod;
    return onlineMethods[0] || selectedMethod;
  }, [selectedMethod, onlineMethods]);

  const handleSelectOnlinePaymentOption = () => {
    const targetMethod = activeOnlineMethod || onlineMethods[0];
    if (!targetMethod) return;
    handleSelectPaymentMethod(targetMethod);
  };

  const executeOrderSubmission = async (overridePayment?: {
    method: PaymentMethodConfig;
    subOptionLabel: string;
    cleanSender: string;
    cleanTrxId: string;
  }) => {
    setErrorMsg('');

    const cleanName = name.trim();
    const primaryPhoneCheck = validateBangladeshPhone(phone, false);
    const optionalPhoneCheck = validateBangladeshPhone(optionalPhone, true);
    const cleanAddress = address.trim();

    if (cleanName.length < 2) {
      if (overridePayment) {
        setIsPaymentModalOpen(false);
      }
      setErrorMsg('Please enter your full name (minimum 2 characters) in Delivery Details.');
      return;
    }

    if (!primaryPhoneCheck.valid) {
      if (overridePayment) {
        setIsPaymentModalOpen(false);
      }
      setErrorMsg(
        primaryPhoneCheck.error ||
          'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).'
      );
      return;
    }

    if (!optionalPhoneCheck.valid) {
      if (overridePayment) {
        setIsPaymentModalOpen(false);
      }
      setErrorMsg(
        optionalPhoneCheck.error ||
          'Please enter a valid 11-digit alternate mobile number or leave it blank.'
      );
      return;
    }

    const cleanPhone = primaryPhoneCheck.cleaned;
    const cleanOptionalPhone = optionalPhoneCheck.cleaned;

    if (cleanAddress.length < 5) {
      if (overridePayment) {
        setIsPaymentModalOpen(false);
      }
      setErrorMsg('Please enter your street address (minimum 5 characters) in Delivery Details.');
      return;
    }

    const effectiveMethod = overridePayment ? overridePayment.method : selectedMethod;
    const effectiveSubLabel = overridePayment
      ? overridePayment.subOptionLabel
      : selectedSubOptionLabel;
    const effectiveSender = overridePayment ? overridePayment.cleanSender : senderNumber;
    const effectiveTrxId = overridePayment ? overridePayment.cleanTrxId : transactionId;

    if (
      deliveryType === 'sundarban' &&
      settings.sundarbanForcesPrepayment !== false &&
      effectiveMethod?.type === 'cod'
    ) {
      setErrorMsg(
        'Standard Hub Delivery / Point Delivery requires advance online payment (bKash/Nagad/Rocket/Bank). Cash on Delivery is disabled for Hub / Point Delivery.'
      );
      return;
    }

    // For online/manual payment methods, ensure transaction details are valid
    if (effectiveMethod && effectiveMethod.type !== 'cod') {
      const popupCheck = validatePaymentTransactionPopup(
        effectiveMethod.type,
        effectiveSender,
        effectiveTrxId
      );
      if (!popupCheck.valid || (!isPaymentSubmitted && !overridePayment)) {
        setIsPaymentModalOpen(true);
        setErrorMsg(
          popupCheck.error ||
            'Please complete the online payment details in the popup to confirm your order.'
        );
        return;
      }
    }

    if (checkoutItems.length === 0) {
      if (overridePayment) {
        setIsPaymentModalOpen(false);
      }
      setErrorMsg('No items selected for this order. Add a product or load your Cart items.');
      return;
    }

    if (appliedCouponCode) {
      const freshCouponCheck = evaluateCoupon(
        appliedCouponCode,
        activeCouponsList,
        subtotal,
        baseDelivery + extraWeightCharge,
        {
          ...couponCustomerContext,
          phone: cleanPhone,
          email: email.trim(),
        }
      );
      if (!freshCouponCheck.valid) {
        if (overridePayment) {
          setIsPaymentModalOpen(false);
        }
        setAppliedCouponCode('');
        setCouponFeedback({ valid: false, text: freshCouponCheck.message });
        setErrorMsg(freshCouponCheck.message);
        return;
      }
    }

    setLoading(true);
    try {
      const hubTitle = (settings.hubDeliveryLabel || '').trim() || 'Standard Hub Delivery / Point Delivery';
      const deliveryLabel =
        deliveryType === 'sundarban' ? `${hubTitle} (Prepaid)` : 'Standard Home Delivery';
      const fullNotes = [
        customerNote.trim() ? `Customer Note: ${customerNote.trim()}` : '',
        cleanOptionalPhone ? `Alt Phone: ${cleanOptionalPhone}` : '',
        `Delivery Method: ${deliveryLabel}`,
      ]
        .filter(Boolean)
        .join(' | ');

      const methodMeta = getPaymentMethodDisplayMeta(effectiveMethod);
      const baseMethodLabel = methodMeta.englishName || effectiveMethod.name;
      const resolvedPaymentMethodName =
        effectiveMethod.type !== 'cod' && effectiveSubLabel
          ? `${baseMethodLabel} (${effectiveSubLabel})`
          : baseMethodLabel;

      const orderId = await createOrder({
        userId: currentUser?.uid || 'guest-' + Date.now(),
        customerName: cleanName,
        phone: cleanPhone,
        ...(cleanOptionalPhone ? { optionalPhone: cleanOptionalPhone } : {}),
        email: email.trim(),
        district,
        city: city.trim(),
        address: cleanAddress,
        notes: fullNotes,
        items: checkoutItems,
        subtotal,
        deliveryCharge,
        discount,
        ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
        total,
        paymentMethodId: effectiveMethod.id,
        paymentMethodName: resolvedPaymentMethodName,
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
          customerNote: customerNote.trim(),
        };
        localStorage.setItem('mrb_last_delivery_address', JSON.stringify(addrToSave));
        setSavedAddressData(addrToSave);
      } catch (storageErr) {
        console.warn('Could not cache address:', storageErr);
      }

      if (effectiveMethod?.type !== 'cod' && effectiveTrxId.trim() && effectiveSender.trim()) {
        try {
          await submitPaymentProof({
            orderId,
            userId: currentUser?.uid || 'guest-' + Date.now(),
            customerName: cleanName,
            customerPhone: cleanPhone,
            providerId: effectiveMethod.id,
            providerName: resolvedPaymentMethodName,
            transactionReference: effectiveTrxId.trim(),
            senderIdentifier: effectiveSender.trim(),
            claimedAmount: total,
          });
        } catch (proofErr) {
          console.warn('Payment proof submission deferred:', proofErr);
        }
      }

      setIsPaymentModalOpen(false);
      setActivePage('order-success', orderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check your cart and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeOrderSubmission();
  };

  const totalItemUnits = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
    [checkoutItems]
  );

  const inputClass =
    'w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#0E1420] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#D71920] transition-colors';
  const labelClass = 'block text-xs font-medium text-neutral-700 dark:text-slate-300 mb-1.5';

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F17] py-6 sm:py-9 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Clean Minimal Checkout Header */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActivePage('cart')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-slate-400 hover:text-[#D71920] transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to Cart</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-slate-400">
            <span className="font-semibold text-neutral-900 dark:text-white">Checkout</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {totalItemUnits} {totalItemUnits === 1 ? 'item' : 'items'}
            </span>
            {settings.showCheckoutProgress !== false && (
              <>
                <span aria-hidden="true">·</span>
                <div
                  data-testid="checkout-header-progress"
                  className="inline-flex items-center gap-1.5"
                  title={checkoutProgress.statusLabel}
                >
                  <div className="w-12 sm:w-16 h-1 rounded-full bg-neutral-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ease-out ${
                        checkoutProgress.isComplete ? 'bg-emerald-600' : 'bg-[#D71920]'
                      }`}
                      style={{ width: `${checkoutProgress.percentage}%` }}
                    />
                  </div>
                  <span className="tabular-nums font-semibold text-neutral-800 dark:text-slate-200">
                    {checkoutProgress.percentage}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Compact Summary Toggle (< lg) */}
        <div className="lg:hidden rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-[#121722] overflow-hidden">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(prev => !prev)}
            data-testid="mobile-summary-toggle"
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-neutral-800 dark:text-slate-200 cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag size={14} className="text-[#D71920]" />
              <span>{mobileSummaryOpen ? 'Hide order summary' : 'Show order summary'}</span>
              {mobileSummaryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
            <span className="font-bold text-sm text-[#D71920] tabular-nums">৳{total}</span>
          </button>

          {mobileSummaryOpen && (
            <div className="px-4 pb-3 pt-2 border-t border-neutral-100 dark:border-slate-800 space-y-2 text-xs">
              {checkoutItems.length === 0 ? (
                <div className="py-2 text-center space-y-2 text-neutral-500 dark:text-slate-400">
                  <p>No items selected for this order.</p>
                  <div className="flex items-center justify-center gap-2">
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={clearDirectCheckout}
                        className="px-2.5 py-1 rounded-md border border-neutral-300 dark:border-slate-600 text-neutral-800 dark:text-slate-200 font-medium cursor-pointer"
                      >
                        Load Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActivePage('books')}
                      className="px-2.5 py-1 rounded-md bg-[#D71920] text-white font-medium cursor-pointer"
                    >
                      Browse Books
                    </button>
                  </div>
                </div>
              ) : (
                checkoutItems.map((item, idx) => (
                  <div
                    key={`${item.productId}-${item.variantId}-${idx}`}
                    data-testid={`mobile-checkout-item-${item.productId}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-neutral-700 dark:text-slate-300 truncate min-w-0 flex-1">
                      {item.title} ({item.variantName}) × {item.quantity}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-medium text-neutral-900 dark:text-white tabular-nums">
                        ৳{item.price * item.quantity}
                      </span>
                      {canRemoveCheckoutItems && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCheckoutItem(item.productId, item.variantId)}
                          aria-label={`Remove ${item.title}`}
                          title="Cancel / remove item"
                          className="p-1 rounded text-neutral-400 hover:text-[#D71920] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isDirectCheckout && unincludedCartItems.length > 0 && (
                <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-neutral-600 dark:text-slate-300 truncate">
                    {unincludedCartUnits} {unincludedCartUnits === 1 ? 'item' : 'items'} in Cart
                  </span>
                  <button
                    type="button"
                    onClick={includeCartInDirectCheckout}
                    className="px-2.5 py-1 rounded-md border border-neutral-300 dark:border-slate-600 bg-neutral-50 dark:bg-slate-800 hover:border-[#D71920] hover:text-[#D71920] text-[11px] font-semibold text-neutral-800 dark:text-slate-200 cursor-pointer shrink-0"
                  >
                    Include Cart
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 flex justify-between text-neutral-500 dark:text-slate-400">
                <span>Delivery ({deliveryType === 'sundarban' ? 'Hub / Point' : district})</span>
                <span className="tabular-nums">{hasFreeDelivery ? 'Free' : `৳${deliveryCharge}`}</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT COLUMN (7 cols): Single Structured Container with Hairline Dividers */}
          <div className="lg:col-span-7 bg-white dark:bg-[#121722] border border-neutral-200 dark:border-slate-800 rounded-xl divide-y divide-neutral-200 dark:divide-slate-800">
            {/* 1. Delivery Information */}
            <section className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h1 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Delivery Details
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                    Enter your contact number and address for courier delivery.
                  </p>
                </div>

                {settings.enableUseOldAddress !== false && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleApplyOldAddress}
                      title={savedAddressPreview || 'Auto-fill your saved delivery address'}
                      className="h-8 px-2.5 rounded-lg border border-neutral-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-[#D71920] hover:text-[#D71920] text-neutral-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw size={12} className={isSearchingOldAddress ? 'animate-spin' : ''} />
                      <span>
                        {settings.oldAddressButtonLabel &&
                        settings.oldAddressButtonLabel !== 'ইউজ ওল্ড এড্রেস (সেম অ্যাড্রেস)'
                          ? settings.oldAddressButtonLabel
                          : 'Use Saved Address'}
                      </span>
                    </button>

                    {!hasSavedAddress && !showPhoneLookup && (
                      <button
                        type="button"
                        onClick={() => setShowPhoneLookup(true)}
                        title="Look up previous address by phone number"
                        className="h-8 px-2.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 hover:border-neutral-300 text-neutral-600 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        <Search size={12} />
                        <span>Find by Phone</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Returning Customer Phone Lookup / Status Feedback */}
              {settings.enableUseOldAddress !== false && (showPhoneLookup || addressAutoFilled || savedAddressPreview) && (
                <div className="rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/40 px-3.5 py-2.5 space-y-2">
                  {savedAddressPreview && !showPhoneLookup && !addressAutoFilled && (
                    <div className="text-[11px] text-neutral-600 dark:text-slate-300 flex items-center justify-between gap-2">
                      <span className="truncate">Saved: {savedAddressPreview}</span>
                      <button
                        type="button"
                        onClick={() => setShowPhoneLookup(true)}
                        className="text-neutral-500 hover:text-[#D71920] font-medium shrink-0 cursor-pointer"
                      >
                        Change phone
                      </button>
                    </div>
                  )}

                  {showPhoneLookup && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-slate-300">
                        <span>Enter your previous order phone number</span>
                        <button
                          type="button"
                          onClick={() => setShowPhoneLookup(false)}
                          className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={lookupPhone}
                          onChange={e => setLookupPhone(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleLookupByPhone())}
                          placeholder="017XXXXXXXX"
                          className="flex-1 h-9 px-3 rounded-lg border border-neutral-300 dark:border-slate-600 text-xs bg-white dark:bg-[#0E1420] text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920]"
                        />
                        <button
                          type="button"
                          onClick={handleLookupByPhone}
                          disabled={isSearchingOldAddress}
                          className="px-3.5 h-9 bg-neutral-900 dark:bg-[#D71920] hover:bg-neutral-800 text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {isSearchingOldAddress ? 'Searching...' : 'Load Address'}
                        </button>
                      </div>
                      {lookupError && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                          {lookupError}
                        </p>
                      )}
                    </div>
                  )}

                  {addressAutoFilled && (
                    <div className="text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                      <Check size={13} className="shrink-0" />
                      <span>Saved delivery address filled in.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="checkout-name" className={labelClass}>
                    Full Name <span className="text-[#D71920]">*</span>
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Abdullah Al Mamun"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="checkout-email" className={labelClass}>
                    Email <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Primary Phone & Alternate Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="checkout-phone" className={labelClass}>
                    Mobile Number <span className="text-[#D71920]">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    aria-label="Mobile Phone Number"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="checkout-alt-phone" className={labelClass}>
                    Alternate Phone <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="checkout-alt-phone"
                    type="tel"
                    value={optionalPhone}
                    onChange={e => setOptionalPhone(e.target.value)}
                    placeholder="018XXXXXXXX"
                    aria-label="Optional Phone Number"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Phone Validation & Repeat-Cancellation Fraud Checker Hook Banner */}
              {(fraudCheck.isLoading || fraudCheck.riskLevel !== 'unknown') && (
                <div className="mt-2">
                  {fraudCheck.isLoading && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-slate-400 py-1">
                      <div className="w-3.5 h-3.5 border-2 border-[#D71920] border-t-transparent rounded-full animate-spin" />
                      <span>Fetching order history from Firestore &amp; calculating cancellation rate...</span>
                    </div>
                  )}

                  {!fraudCheck.isLoading && fraudCheck.riskLevel !== 'unknown' && (
                    <div
                      className={`rounded-lg p-3 text-xs border flex items-start gap-2.5 ${
                        fraudCheck.riskLevel === 'high_risk' || fraudCheck.isFlagged
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                          : fraudCheck.riskLevel === 'moderate'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      {fraudCheck.riskLevel === 'high_risk' || fraudCheck.isFlagged ? (
                        <ShieldAlert size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      ) : fraudCheck.riskLevel === 'moderate' ? (
                        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="font-semibold flex items-center justify-between gap-2">
                          <span>
                            {fraudCheck.isFlagged
                              ? '⚠️ High Cancellation Rate Flag (Exceeds Threshold)'
                              : fraudCheck.riskLevel === 'high_risk'
                              ? 'High Risk Cancellation History'
                              : fraudCheck.riskLevel === 'moderate'
                              ? 'Moderate Order History'
                              : 'Trusted Customer History'}
                          </span>
                          <span className="tabular-nums font-mono text-[10px] opacity-80">
                            Cancellation Rate: {fraudCheck.cancellationRate}% ({fraudCheck.cancelledOrders}/{fraudCheck.totalOrders} orders)
                          </span>
                        </div>
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          {fraudCheck.riskMessage}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* District & Area/Thana */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="checkout-district" className={labelClass}>
                    District <span className="text-[#D71920]">*</span>
                  </label>
                  <select
                    id="checkout-district"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className={inputClass}
                  >
                    {BANGLADESH_DISTRICTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="checkout-city" className={labelClass}>
                    Thana / Area <span className="text-[#D71920]">*</span>
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Mirpur, Dhaka"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Full Street Address */}
              <div>
                <label htmlFor="checkout-address" className={labelClass}>
                  Street Address &amp; Landmark <span className="text-[#D71920]">*</span>
                </label>
                <textarea
                  id="checkout-address"
                  rows={2}
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="House, road, flat number or nearby landmark"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#0E1420] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#D71920] resize-none transition-colors"
                />
              </div>

              {/* Optional Delivery Note */}
              <div>
                <label htmlFor="checkout-note" className={labelClass}>
                  Delivery Note <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="checkout-note"
                  type="text"
                  value={customerNote}
                  onChange={e => setCustomerNote(e.target.value)}
                  placeholder="Any special instruction for delivery..."
                  className={inputClass}
                />
              </div>
            </section>

            {/* 2. Delivery Method */}
            <section className="p-5 sm:p-6 space-y-3">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Delivery Method
                </h2>
                <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                  {settings.showSundarbanOnCheckout !== false
                    ? 'Choose doorstep home delivery or hub / point pickup.'
                    : 'Standard doorstep courier delivery across Bangladesh.'}
                </p>
              </div>

              <div
                className={
                  settings.showSundarbanOnCheckout !== false
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                    : 'grid grid-cols-1 gap-3'
                }
              >
                <button
                  type="button"
                  data-testid="delivery-card-standard"
                  onClick={() => handleDeliveryTypeChange('standard')}
                  className={`px-3.5 py-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    deliveryType === 'standard'
                      ? 'border-[#D71920] bg-[#FFF1F2]/50 dark:bg-[#D71920]/10'
                      : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#121722] hover:border-neutral-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white leading-snug">
                      Standard Home Delivery
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Inside &amp; Outside Dhaka · Doorstep delivery
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      deliveryType === 'standard'
                        ? 'border-[#D71920] bg-[#D71920]'
                        : 'border-neutral-300 dark:border-slate-600'
                    }`}
                  >
                    {deliveryType === 'standard' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </button>

                {settings.showSundarbanOnCheckout !== false && (
                  <button
                    type="button"
                    data-testid="delivery-card-hub"
                    onClick={() => handleDeliveryTypeChange('sundarban')}
                    className={`px-3.5 py-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      deliveryType === 'sundarban'
                        ? 'border-[#D71920] bg-[#FFF1F2]/50 dark:bg-[#D71920]/10'
                        : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#121722] hover:border-neutral-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white leading-snug">
                        {(settings.hubDeliveryLabel || '').trim() ||
                          'Standard Hub Delivery / Point Delivery'}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {(settings.hubDeliverySubtitle || '').trim() ||
                          'Courier hub or point pickup · Advance payment'}
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        deliveryType === 'sundarban'
                          ? 'border-[#D71920] bg-[#D71920]'
                          : 'border-neutral-300 dark:border-slate-600'
                      }`}
                    >
                      {deliveryType === 'sundarban' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                )}
              </div>

              {deliveryType === 'sundarban' && settings.showSundarbanOnCheckout !== false && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <span className="font-semibold">Hub / Point Delivery Note:</span>{' '}
                  {settings.deliveryNote &&
                  !settings.deliveryNote.includes('সুন্দরবন')
                    ? settings.deliveryNote
                    : 'Standard Hub Delivery / Point Delivery orders require advance online payment. Cash on Delivery is unavailable.'}
                </div>
              )}
            </section>

            {/* 3. Payment Method: Clean 2-Option Selector (Cash on Delivery vs Online Payment Popup) */}
            <section className="p-5 sm:p-6 space-y-3">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Payment Method
                </h2>
                <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                  Select Cash on Delivery or Online Payment to complete your order.
                </p>
              </div>

              <div
                data-testid="payment-methods-grid"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {/* Option 1: Cash on Delivery */}
                {codMethod && (
                  <button
                    type="button"
                    data-testid="payment-card-cod"
                    onClick={() => handleSelectPaymentMethod(codMethod)}
                    className={`px-3.5 py-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                      !isOnlineSelected
                        ? 'border-[#D71920] bg-[#FFF1F2]/50 dark:bg-[#D71920]/10'
                        : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#121722] hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckoutCodPaymentIcon
                        customIconUrl={settings.codPaymentIconUrl}
                        isSelected={!isOnlineSelected}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white leading-tight">
                          Cash on Delivery
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Pay cash upon delivery
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        !isOnlineSelected
                          ? 'border-[#D71920] bg-[#D71920]'
                          : 'border-neutral-300 dark:border-slate-600'
                      }`}
                    >
                      {!isOnlineSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                )}

                {/* Option 2: Online Payment (Opens minimal popup on click) */}
                {onlineMethods.length > 0 && activeOnlineMethod && (
                  <button
                    type="button"
                    data-testid="payment-card-online"
                    onClick={handleSelectOnlinePaymentOption}
                    className={`px-3.5 py-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                      isOnlineSelected
                        ? 'border-[#D71920] bg-[#FFF1F2]/50 dark:bg-[#D71920]/10'
                        : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#121722] hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckoutOnlinePaymentIcon
                        customIconUrl={settings.onlinePaymentIconUrl}
                        isSelected={isOnlineSelected}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white leading-tight">
                          Online Payment
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5 leading-snug truncate">
                          {onlineMethods
                            .map(m => getPaymentMethodDisplayMeta(m).englishName || m.name)
                            .join(', ')}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isOnlineSelected
                          ? 'border-[#D71920] bg-[#D71920]'
                          : 'border-neutral-300 dark:border-slate-600'
                      }`}
                    >
                      {isOnlineSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* Clean Inline Payment Status Summary & Minimal Single-Screen Popup Modal */}
              {selectedMethod && (
                <PaymentInstructions
                  selectedMethod={selectedMethod}
                  allMethods={paymentMethods}
                  onSelectMethod={m => setSelectedPaymentId(m.id)}
                  onSelectSubOption={sub => setSelectedSubOptionLabel(sub.label)}
                  onSubmitPaymentAndOrder={async (method, subLabel, cleanSender, cleanTrxId) => {
                    await executeOrderSubmission({
                      method,
                      subOptionLabel: subLabel,
                      cleanSender,
                      cleanTrxId,
                    });
                  }}
                  isSubmittingOrder={loading}
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
            </section>
          </div>

          {/* RIGHT COLUMN (5 cols): Calm Sticky Order Summary & Primary Submit CTA */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-[#121722] border border-neutral-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Order Summary
                </h3>
                <span
                  data-testid="checkout-summary-item-count"
                  className="text-xs text-neutral-500 dark:text-slate-400 tabular-nums"
                >
                  {checkoutItems.length} {checkoutItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Active Checkout Items */}
              {checkoutItems.length === 0 ? (
                <div
                  data-testid="checkout-empty-summary"
                  className="py-5 text-center space-y-2.5 text-xs text-neutral-500 dark:text-slate-400"
                >
                  <p>No items selected for this order.</p>
                  <div className="flex items-center justify-center gap-2">
                    {cart.length > 0 && (
                      <button
                        type="button"
                        data-testid="checkout-load-cart-btn"
                        onClick={clearDirectCheckout}
                        className="h-8 px-3 rounded-lg border border-neutral-300 dark:border-slate-600 bg-white dark:bg-[#0E1420] hover:border-[#D71920] hover:text-[#D71920] text-neutral-800 dark:text-slate-200 font-medium transition-colors cursor-pointer"
                      >
                        Load Cart Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActivePage('books')}
                      className="h-8 px-3 rounded-lg bg-[#D71920] hover:bg-[#B9151B] text-white font-medium transition-colors cursor-pointer"
                    >
                      Browse Books
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-slate-800 max-h-60 overflow-y-auto pr-1">
                  {checkoutItems.map((item, idx) => (
                    <div
                      key={`${item.productId}-${item.variantId}-${idx}`}
                      data-testid={`checkout-summary-item-${item.productId}`}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className={imageLayout.miniThumbClass}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-slate-400 tabular-nums mt-0.5">
                            {item.variantName} · Qty {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                          ৳{item.price * item.quantity}
                        </span>
                        {canRemoveCheckoutItems && (
                          <button
                            type="button"
                            data-testid={`checkout-remove-item-${item.productId}`}
                            onClick={() => handleRemoveCheckoutItem(item.productId, item.variantId)}
                            aria-label={`Remove ${item.title}`}
                            title="Cancel / remove item from order"
                            className="p-1 rounded-md text-neutral-400 hover:text-[#D71920] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional prompt to include existing Cart items during isolated direct checkout */}
              {isDirectCheckout && unincludedCartItems.length > 0 && (
                <div
                  data-testid="checkout-include-cart-prompt"
                  className="rounded-lg border border-neutral-200 dark:border-slate-700/80 bg-neutral-50/80 dark:bg-slate-800/40 px-3 py-2 flex items-center justify-between gap-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800 dark:text-slate-200 truncate">
                      {unincludedCartUnits} {unincludedCartUnits === 1 ? 'item' : 'items'} saved in Cart
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                      Include {unincludedCartItems.length === 1 ? 'it' : 'them'} with this order?
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="checkout-include-cart-btn"
                    onClick={includeCartInDirectCheckout}
                    className="px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-slate-600 bg-white dark:bg-[#0E1420] hover:border-[#D71920] hover:text-[#D71920] text-neutral-800 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    Include Cart
                  </button>
                </div>
              )}

              {/* Minimal Coupon Input */}
              <div className="pt-3.5 border-t border-neutral-100 dark:border-slate-800 space-y-2">
                <label htmlFor="checkout-coupon" className="block text-xs font-medium text-neutral-700 dark:text-slate-300">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="checkout-coupon"
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
                    placeholder="Enter promo code"
                    className="flex-1 h-9 px-3 rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-[#0E1420] text-xs font-medium text-neutral-900 dark:text-white uppercase focus:outline-none focus:border-[#D71920] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    data-testid="checkout-coupon-apply-btn"
                    onClick={() => handleApplyCheckoutCoupon()}
                    className="h-9 px-3.5 rounded-lg bg-neutral-900 dark:bg-slate-700 hover:bg-neutral-800 text-white text-xs font-medium cursor-pointer transition-colors shrink-0"
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
                      className="h-9 px-2.5 rounded-lg border border-neutral-200 dark:border-slate-700 text-neutral-500 hover:text-red-600 cursor-pointer shrink-0"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Clean Inline Coupon Suggestions (Managed from Admin) */}
                {settings.showCheckoutCoupons !== false && activeCouponsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-neutral-500 dark:text-slate-400">
                    <span>Available:</span>
                    {activeCouponsList.slice(0, 3).map(c => {
                      const isApplied = appliedCouponCode === c.code;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleApplyCheckoutCoupon(c.code)}
                          className={`font-medium cursor-pointer transition-colors ${
                            isApplied
                              ? 'text-emerald-600 dark:text-emerald-400 underline underline-offset-2'
                              : 'text-neutral-700 dark:text-slate-300 hover:text-[#D71920] underline decoration-neutral-300 underline-offset-2'
                          }`}
                        >
                          {c.code}
                          {c.firstOrderOnly ? ' (1st Order)' : ''}
                        </button>
                      );
                    })}
                  </div>
                )}

                {couponFeedback && (
                  <div
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1.5 border ${
                      couponFeedback.valid
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {couponFeedback.valid ? (
                      <CheckCircle2 size={13} className="shrink-0" />
                    ) : (
                      <AlertCircle size={13} className="shrink-0" />
                    )}
                    <span>{couponFeedback.text}</span>
                  </div>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-2 pt-3.5 border-t border-neutral-100 dark:border-slate-800 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900 dark:text-white tabular-nums">
                    ৳{subtotal}
                  </span>
                </div>

                {discount > 0 && (
                  <div
                    data-testid="checkout-discount-row"
                    className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium"
                  >
                    <span>Discount ({appliedCouponCode})</span>
                    <span className="tabular-nums">-৳{discount}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600 dark:text-slate-400">
                  <span>Delivery ({deliveryType === 'sundarban' ? 'Hub / Point' : district})</span>
                  <span className="font-medium text-neutral-900 dark:text-white tabular-nums">
                    {hasFreeDelivery ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Free (৳0)
                      </span>
                    ) : (
                      `৳${baseDelivery}`
                    )}
                  </span>
                </div>

                {extraWeightCharge > 0 && (
                  <div className="flex justify-between text-neutral-600 dark:text-slate-400">
                    <span>Extra Weight Charge</span>
                    <span className="font-medium text-neutral-900 dark:text-white tabular-nums">
                      ৳{extraWeightCharge}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Total Payable
                  </span>
                  <span
                    data-testid="checkout-total-payable"
                    className="text-xl font-bold text-[#D71920] tabular-nums"
                  >
                    ৳{total}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-800/50 px-3 py-2.5 text-xs text-red-700 dark:text-red-300 flex items-start gap-2 leading-relaxed">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {settings.showCheckoutProgress !== false && (
                <div
                  data-testid="checkout-completion-meter"
                  className="pt-3 border-t border-neutral-100 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 dark:text-slate-400 font-medium truncate pr-2">
                      {checkoutProgress.statusLabel}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white tabular-nums shrink-0">
                      {checkoutProgress.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ease-out ${
                        checkoutProgress.isComplete ? 'bg-emerald-600' : 'bg-[#D71920]'
                      }`}
                      style={{ width: `${checkoutProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                data-testid="checkout-confirm-btn"
                className="w-full h-11 rounded-lg bg-[#D71920] hover:bg-[#B9151B] active:scale-[0.99] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Placing Order...' : 'Confirm Order'}</span>
                <ArrowRight size={16} />
              </button>

              <p className="text-[11px] text-center text-neutral-500 dark:text-slate-400 leading-normal">
                By confirming, you agree to MR. BOOKS delivery and payment verification terms.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
