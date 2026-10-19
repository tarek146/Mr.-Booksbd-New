import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Truck, CreditCard, Copy, Check, ArrowLeft, ArrowRight } from 'lucide-react';

const BANGLADESH_DISTRICTS = [
  'Dhaka', 'Gazipur', 'Narayanganj', 'Chittagong', 'Sylhet', 'Rajshahi', 
  'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Cox\'s Bazar', 'Bogura'
];

export function CheckoutPage() {
  const { cart, paymentMethods, settings, createOrder, setActivePage } = useStore();
  const { currentUser } = useAuth();

  const [name, setName] = useState(currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [district, setDistrict] = useState('Dhaka');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes] = useState('');

  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(paymentMethods[0]?.id || 'cod');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = district === 'Dhaka' ? settings.insideDhakaCharge : settings.outsideDhakaCharge;
  const total = subtotal + deliveryCharge;

  const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentId) || paymentMethods[0];

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const cleanAddress = address.trim();

    if (cleanName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    // Bangladeshi phone verification (11 digits e.g. 017xxxxxxxx or +88017xxxxxxxx)
    if (!/^(\+?8801|01)[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).');
      return;
    }

    if (cleanAddress.length < 5) {
      setErrorMsg('Please enter a detailed delivery address (minimum 5 characters).');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Your shopping cart is currently empty.');
      return;
    }

    setLoading(true);
    try {
      const orderId = await createOrder({
        userId: currentUser?.uid || ('guest-' + Date.now()),
        customerName: cleanName,
        phone: cleanPhone,
        email: email.trim(),
        district,
        city: city.trim(),
        address: cleanAddress,
        notes: notes.trim(),
        items: cart,
        subtotal,
        deliveryCharge,
        discount: 0,
        total,
        paymentMethodId: selectedMethod.id,
        paymentMethodName: selectedMethod.name
      });

      // Transition to order success / payment submission screen
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
        <button 
          onClick={() => setActivePage('cart')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#5F6368] hover:text-[#D71920] mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Cart
        </button>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Address & Payment Methods */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-[#EEEEEE]">
                <div className="w-10 h-10 bg-[#FFF1F2] text-[#D71920] rounded-xl flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#171717]">Delivery Address</h2>
                  <p className="text-xs text-[#5F6368]">Where should we deliver your book parcel?</p>
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
                    placeholder="e.g. Asif Mahmud"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Mobile Phone Number *
                  </label>
                  <input 
                    type="tel" 
                    required 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] focus:outline-none focus:border-[#D71920]"
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

            {/* Manual Payment Method Selection */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-[#EEEEEE]">
                <div className="w-10 h-10 bg-[#FFF1F2] text-[#D71920] rounded-xl flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#171717]">Payment Method</h2>
                  <p className="text-xs text-[#5F6368]">Select manual payment method (TrxID submitted on next screen)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.filter(m => m.isActive).map(method => {
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
                      <div>
                        <h4 className="font-bold text-sm text-[#171717]">{method.name}</h4>
                        <p className="text-[11px] text-[#5F6368]">{method.accountType || method.type}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#D71920] bg-[#D71920] text-white' : 'border-[#CCCCCC]'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Instructions for selected method */}
              {selectedMethod && selectedMethod.type !== 'cod' && (
                <div className="bg-[#F7F7F8] rounded-2xl p-5 border border-[#E5E5E5] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#D71920] uppercase tracking-wider block">Send Money Receiver Number</span>
                      <h3 className="text-lg font-black text-[#171717] font-mono">{selectedMethod.accountNumber}</h3>
                      <p className="text-xs text-[#5F6368]">Account Name: <strong>{selectedMethod.accountName}</strong></p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleCopyNumber(selectedMethod.accountNumber)}
                      className="px-3.5 py-1.5 bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/30 hover:bg-[#D71920] hover:text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy Number'}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[#E5E5E5] text-xs">
                    <span className="font-bold text-[#171717]">Payment Steps:</span>
                    <p className="text-[#5F6368] whitespace-pre-line mt-1 leading-relaxed">
                      {selectedMethod.instructions}
                    </p>
                  </div>
                </div>
              )}

              {selectedMethod && selectedMethod.type === 'cod' && (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
                  ✓ <strong>Cash on Delivery (COD) selected.</strong> Pay the courier when the package is delivered to your doorstep.
                </div>
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
                  <span>Delivery ({district})</span>
                  <span className="font-bold text-[#171717]">৳{deliveryCharge}</span>
                </div>
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
                By clicking Confirm, you accept MR. BOOKS manual payment verification policy.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
