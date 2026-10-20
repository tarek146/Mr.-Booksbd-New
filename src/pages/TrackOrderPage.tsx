import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Truck, Search, CheckCircle2, Package, Clock, ShieldCheck, ArrowLeft, ArrowRight, ExternalLink, Phone, MapPin, Calendar } from 'lucide-react';
import { Order } from '../types';

export function TrackOrderPage() {
  const { orders, setActivePage } = useStore();
  const [orderIdInput, setOrderIdInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    setLoading(true);

    const cleanId = orderIdInput.trim().replace(/^#/, '');
    const cleanPhone = phoneInput.trim().replace(/[\s-]/g, '');

    setTimeout(() => {
      const found = orders.find(o => {
        const idMatch = o.id.toLowerCase().includes(cleanId.toLowerCase());
        const phoneMatch = o.phone.replace(/[\s-]/g, '').includes(cleanPhone);
        return idMatch && phoneMatch;
      });

      setMatchedOrder(found || null);
      setLoading(false);
    }, 400);
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
      case 'awaiting_payment':
      case 'awaiting_payment_verification':
        return 1;
      case 'confirmed':
        return 2;
      case 'processing':
        return 3;
      case 'shipped':
      case 'out_for_delivery':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 1;
    }
  };

  const steps = [
    { id: 1, label: 'Order Placed', desc: 'Received & verified' },
    { id: 2, label: 'Confirmed', desc: 'Publisher check passed' },
    { id: 3, label: 'Processing', desc: 'Secure packaging' },
    { id: 4, label: 'Shipped', desc: 'Handed to courier' },
    { id: 5, label: 'Delivered', desc: 'At your doorstep' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back Link */}
        <button 
          onClick={() => setActivePage('home')}
          className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-[#D71920] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Storefront
        </button>

        {/* Tracking Header Card */}
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6 text-center">
          <div className="w-14 h-14 bg-[#FFF1F2] text-[#D71920] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Truck size={28} />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Real-Time Order Tracking
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Enter your Order ID (or parcel ID) and Mobile Phone Number below to track your book package status in real-time.
            </p>
          </div>

          <form onSubmit={handleTrackOrder} className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2">
            <div className="sm:col-span-5">
              <input 
                type="text"
                required
                value={orderIdInput}
                onChange={e => setOrderIdInput(e.target.value)}
                placeholder="Order ID (e.g. 1712345678)"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white transition-all"
              />
            </div>
            <div className="sm:col-span-5">
              <input 
                type="tel"
                required
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="Phone Number (e.g. 01712345678)"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-full py-3 bg-[#D71920] hover:bg-[#B9151B] text-white font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search size={16} />}
              </button>
            </div>
          </form>
        </div>

        {/* Search Results Display */}
        {searched && !loading && (
          <div>
            {matchedOrder ? (
              <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
                
                {/* Order Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-base text-[#D71920]">#{matchedOrder.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        matchedOrder.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        matchedOrder.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        Status: {matchedOrder.orderStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-2">
                      <Calendar size={13} />
                      <span>Ordered on {new Date(matchedOrder.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="text-right sm:text-left">
                    <span className="text-[11px] text-neutral-400 block">Total Payable</span>
                    <span className="text-xl font-black text-neutral-900 tabular-nums">৳{matchedOrder.total}</span>
                  </div>
                </div>

                {/* Visual Journey Stepper */}
                <div className="py-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-6">Delivery Progress Journey</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative">
                    {steps.map((st, idx) => {
                      const currentIndex = getStatusStepIndex(matchedOrder.orderStatus);
                      const isCompleted = st.id <= currentIndex;
                      const isCurrent = st.id === currentIndex;
                      return (
                        <div key={st.id} className="flex flex-col items-center text-center space-y-2 relative">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 ${
                            isCompleted ? 'bg-[#D71920] text-white shadow-md shadow-[#D71920]/30' : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                          }`}>
                            {isCompleted ? <CheckCircle2 size={16} /> : st.id}
                          </div>
                          <div>
                            <div className={`text-xs font-bold ${isCurrent ? 'text-[#D71920]' : 'text-neutral-800'}`}>{st.label}</div>
                            <div className="text-[10px] text-neutral-400">{st.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Courier Dispatch Details (if assigned) */}
                {(matchedOrder.courierName || matchedOrder.trackingCode) && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span>🚚 Courier Partner: {matchedOrder.courierName || 'Steadfast / RedX'}</span>
                      <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                        Tracking: {matchedOrder.trackingCode || 'DISPATCHED'}
                      </span>
                    </div>
                    {matchedOrder.trackingUrl && (
                      <div>
                        <a 
                          href={matchedOrder.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D71920] hover:underline"
                        >
                          <span>Open Live Courier Tracking Link</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                    {matchedOrder.trackingNotes && (
                      <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                        <strong>Dispatch Note:</strong> {matchedOrder.trackingNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* Customer & Items Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-neutral-100 text-xs">
                  <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                    <h4 className="font-black uppercase tracking-wider text-neutral-700">Customer & Delivery Info</h4>
                    <div className="space-y-1.5 text-neutral-600">
                      <p><strong>Name:</strong> {matchedOrder.customerName}</p>
                      <p className="flex items-center gap-1"><strong>Phone:</strong> <Phone size={12} /> {matchedOrder.phone}</p>
                      <p className="flex items-start gap-1"><strong>Address:</strong> <MapPin size={12} className="shrink-0 mt-0.5" /> {matchedOrder.address}, {matchedOrder.city}, {matchedOrder.district}</p>
                      {matchedOrder.notes && (
                        <p className="pt-1 text-neutral-800"><strong>Notes:</strong> {matchedOrder.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                    <h4 className="font-black uppercase tracking-wider text-neutral-700">Ordered Items ({matchedOrder.items.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {matchedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-neutral-200">
                          <img src={item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'} alt="" className="w-9 h-9 object-cover rounded-lg border border-neutral-200 shrink-0" />
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="font-black text-neutral-900 truncate">{item.title}</div>
                            <div className="text-[11px] text-neutral-500">Qty: {item.quantity} · ৳{item.price * item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-neutral-200/90 rounded-3xl p-12 text-center space-y-3">
                <Package size={40} className="mx-auto text-neutral-300" />
                <h3 className="text-base font-bold text-neutral-800">No Order Found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  We couldn't find any order matching ID <strong className="text-neutral-800 font-mono">{orderIdInput}</strong> and phone number <strong className="text-neutral-800 font-mono">{phoneInput}</strong>. Please check your details and try again.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
