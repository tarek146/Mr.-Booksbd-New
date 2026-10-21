import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { PaymentInstructions } from '../components/PaymentInstructions';
import { validateBangladeshPhone } from '../utils/reviewHelpers';
import { Truck, CreditCard, Copy, Check, ArrowLeft, ArrowRight, Phone } from 'lucide-react';

const BANGLADESH_DISTRICTS = [
  'Dhaka', 'Gazipur', 'Narayanganj', 'Chittagong', 'Sylhet', 'Rajshahi', 
  'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Cox\'s Bazar', 'Bogura'
];

export function CheckoutPage() {
  const { cart, paymentMethods, settings, createOrder, submitPaymentProof, setActivePage } = useStore();
  const { currentUser } = useAuth();

  const [name, setName] = useState(currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [optionalPhone, setOptionalPhone] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [district, setDistrict] = useState('Dhaka');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // Payment Verification State
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');

  // Delivery type: 'standard' (Home Delivery) or 'sundarban' (Sundarban Courier)
  const [deliveryType, setDeliveryType] = useState<'standard' | 'sundarban'>('standard');

  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    paymentMethods.find(m => m.isActive && m.type === 'cod')?.id || paymentMethods[0]?.id || 'cod'
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If Sundarban is selected and prepayment is enforced, ensure COD is deselected and pick first online payment method
  const handleDeliveryTypeChange = (type: 'standard' | 'sundarban') => {
    setDeliveryType(type);
    if (type === 'sundarban' && settings.sundarbanForcesPrepayment !== false) {
      const onlineMethod = paymentMethods.find(m => m.isActive && m.type !== 'cod');
      if (onlineMethod) {
        setSelectedPaymentId(onlineMethod.id);
      }
    }
  };

  // Calculate form completion percentage parameter (25% each for Name, Phone, Address, District/City)
  const completionPercentage = React.useMemo(() => {
    let score = 0;
    if (name.trim().length >= 2) score += 25;
    if (/^(\+?8801|01)[3-9]\d{8}$/.test(phone.trim().replace(/[\s-]/g, ''))) score += 25;
    if (district) score += 25;
    if (address.trim().length >= 5) score += 25;
    return score;
  }, [name, phone, district, address]);

  // Subtotal & Delivery Calculation
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Base delivery charge
  let baseDelivery = deliveryType === 'sundarban' 
    ? (settings.sundarbanDeliveryCharge ?? 120)
    : (district === 'Dhaka' ? settings.insideDhakaCharge : settings.outsideDhakaCharge);

  // Extra weight charge if total items > 1 kg/item
  const extraWeightCharge = totalQuantity > 1 ? (totalQuantity - 1) * (settings.extraWeightChargePerKg ?? 20) : 0;
  const deliveryCharge = baseDelivery + extraWeightCharge;
  const total = subtotal + deliveryCharge;

  const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentId) || paymentMethods[0];

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
        discount: 0,
        total,
        paymentMethodId: selectedMethod.id,
        paymentMethodName: selectedMethod.name
      });

      // If online payment is selected and transaction details are provided, submit proof immediately
      if (selectedMethod?.type !== 'cod' && transactionId.trim() && senderNumber.trim()) {
        try {
          await submitPaymentProof({
            orderId,
            userId: currentUser?.uid || ('guest-' + Date.now()),
            customerName: cleanName,
            customerPhone: cleanPhone,
            providerId: selectedMethod.id,
            providerName: selectedMethod.name,
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

            {/* Manual Payment Method Selection */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-[#EEEEEE]">
                <div className="w-10 h-10 bg-[#FFF1F2] text-[#D71920] rounded-xl flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#171717]">Payment Method</h2>
                  <p className="text-xs text-[#5F6368]">
                    {deliveryType === 'sundarban' 
                      ? 'Select Online Payment Method (Sundarban Courier requires advance payment)'
                      : 'Select manual payment method or Cash on Delivery'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.filter(m => m.isActive && (deliveryType !== 'sundarban' || m.type !== 'cod' || settings.sundarbanForcesPrepayment === false)).map(method => {
                  const isSelected = selectedPaymentId === method.id;
                  return (
                    <div 
                      key={method.id}
                      onClick={() => setSelectedPaymentId(method.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'border-[#D71920] bg-[#FFF1F2] shadow-xs' 
                          : 'border-[#E5E5E5] bg-white hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {method.logoUrl ? (
                          <img src={method.logoUrl} alt={method.name} className="w-8 h-8 object-contain rounded-lg shrink-0 border border-[#E5E5E5] p-0.5 bg-white" />
                        ) : method.type === 'bkash' ? (
                          <div className="w-8 h-8 rounded-lg bg-[#E2136E] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs tracking-tighter">
                            bKash
                          </div>
                        ) : method.type === 'nagad' ? (
                          <div className="w-8 h-8 rounded-lg bg-[#F15A24] text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                            নগদ
                          </div>
                        ) : method.type === 'rocket' ? (
                          <div className="w-8 h-8 rounded-lg bg-[#8C3494] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            Rocket
                          </div>
                        ) : method.type === 'upay' ? (
                          <div className="w-8 h-8 rounded-lg bg-[#00A859] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            Upay
                          </div>
                        ) : method.type === 'bank' ? (
                          <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            Bank
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                            COD
                          </div>
                        )}
                        <div className="truncate">
                          <h4 className="font-bold text-sm text-[#171717] truncate">{method.name}</h4>
                          <p className="text-[11px] text-[#5F6368] uppercase font-semibold text-[10px] tracking-wide">{method.accountType || method.type}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#D71920] bg-[#D71920] text-white' : 'border-[#CCCCCC]'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Step-by-Step Payment Instructions & Verification Inputs */}
              {selectedMethod && (
                <PaymentInstructions 
                  selectedMethod={selectedMethod}
                  totalAmount={total}
                  transactionId={transactionId}
                  setTransactionId={setTransactionId}
                  senderNumber={senderNumber}
                  setSenderNumber={setSenderNumber}
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

              <div className="space-y-2.5 pt-4 border-t border-[#E5E5E5] text-xs">
                <div className="flex justify-between text-[#5F6368]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#171717]">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-[#5F6368]">
                  <span>Delivery ({deliveryType === 'sundarban' ? 'Sundarban' : district})</span>
                  <span className="font-bold text-[#171717]">৳{baseDelivery}</span>
                </div>
                {extraWeightCharge > 0 && (
                  <div className="flex justify-between text-[#5F6368]">
                    <span>Extra Weight/Items Charge</span>
                    <span className="font-bold text-[#171717]">৳{extraWeightCharge}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#E5E5E5] flex justify-between text-sm font-black text-[#171717]">
                  <span>Total Payable</span>
                  <span className="text-[#D71920] text-xl">৳{total}</span>
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
