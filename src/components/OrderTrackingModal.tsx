import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Phone, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { Order } from '../types';
import { useStore } from '../context/StoreContext';

interface OrderTrackingModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderTrackingModal({ order, onClose }: OrderTrackingModalProps) {
  const { settings } = useStore();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyToClipboard = (text: string, type: 'id' | 'code') => {
    navigator.clipboard?.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const isCancelled = order.orderStatus === 'cancelled' || order.paymentStatus === 'rejected';

  const steps = [
    { label: 'Order Placed', bangla: 'অর্ডার গৃহীত', desc: 'Received successfully', icon: Clock },
    { label: 'Confirmed', bangla: 'যাচাইকৃত', desc: 'Verified & Approved', icon: ShieldCheck },
    { label: 'Processing', bangla: 'প্রসেসিং', desc: 'Packing books & items', icon: Package },
    { label: 'Shipped', bangla: 'কুরিয়ারে হস্তান্তর', desc: 'Handed to courier', icon: Truck },
    { label: 'Delivered', bangla: 'ডেলিভারি সম্পন্ন', desc: 'Reached destination', icon: CheckCircle2 }
  ];

  const getStepIndex = (): number => {
    if (order.orderStatus === 'delivered') return 4;
    if (order.orderStatus === 'shipped' || order.orderStatus === 'out_for_delivery') return 3;
    if (order.orderStatus === 'processing') return 2;
    if (order.orderStatus === 'confirmed' || order.paymentStatus === 'approved') return 1;
    return 0; // pending / awaiting_payment / awaiting_payment_verification
  };

  const currentStep = getStepIndex();
  const progressPercent = (currentStep / (steps.length - 1)) * 100;

  // Courier URL generator if missing
  const getCourierLink = () => {
    if (order.trackingUrl) return order.trackingUrl;
    if (!order.trackingCode) return null;
    const name = (order.courierName || '').toLowerCase();
    if (name.includes('steadfast')) {
      return `https://steadfast.com.bd/t/${encodeURIComponent(order.trackingCode)}`;
    }
    if (name.includes('pathao')) {
      return `https://pathao.com/courier/tracking/?consignment_id=${encodeURIComponent(order.trackingCode)}`;
    }
    if (name.includes('redx')) {
      return `https://redx.com.bd/track-order/?trackingId=${encodeURIComponent(order.trackingCode)}`;
    }
    return null;
  };

  const courierUrl = getCourierLink();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-zinc-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800 bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D71920]/15 text-[#D71920] flex items-center justify-center border border-[#D71920]/30 shadow-xs">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Live Order Tracking
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D71920]/20 text-[#FF4D4D] border border-[#D71920]/30">
                  {order.orderStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time delivery & dispatch status for your parcel
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Order ID & Placement Date Bar */}
          <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-zinc-400 text-[11px] block">Order Identifier</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-black text-sm text-white">{order.id}</span>
                <button
                  onClick={() => copyToClipboard(order.id, 'id')}
                  className="p-1 text-zinc-400 hover:text-white rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-zinc-400 text-[11px] block">Placed On</span>
              <span className="font-semibold text-zinc-200">
                {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Cancelled Alert or Progress Stepper */}
          {isCancelled ? (
            <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-4 flex items-start gap-3 text-red-200">
              <AlertCircle size={20} className="shrink-0 text-red-400 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-300">Order Issue / Cancelled</h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {order.paymentStatus === 'rejected'
                    ? 'Payment transaction verification failed. Please verify your transaction reference with customer support.'
                    : 'This order has been cancelled. For inquiries or questions, please contact our helpline.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Delivery Journey Progress
                </span>
                <span className="text-[11px] font-bold text-[#FF4D4D] bg-[#D71920]/15 px-2.5 py-0.5 rounded-full border border-[#D71920]/30">
                  {steps[currentStep].label} ({steps[currentStep].bangla})
                </span>
              </div>

              {/* Stepper Graphic */}
              <div className="relative pt-3 pb-2 px-1">
                {/* Background Connecting Line */}
                <div className="absolute top-[28px] left-6 right-6 h-1 bg-zinc-700/60 rounded-full z-0" />
                
                {/* Active Progress Line */}
                <div 
                  className="absolute top-[28px] left-6 h-1 bg-gradient-to-r from-[#D71920] to-[#FF4D4D] rounded-full transition-all duration-500 z-0"
                  style={{ width: `calc(${progressPercent}% * 0.88)` }}
                />

                {/* Steps Nodes */}
                <div className="relative z-10 flex items-center justify-between">
                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx < currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={idx} className="flex flex-col items-center text-center max-w-[80px]">
                        <div 
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                            isCompleted 
                              ? 'bg-[#D71920] text-white border-2 border-[#D71920]' 
                              : isCurrent 
                              ? 'bg-[#D71920] text-white ring-4 ring-[#D71920]/30 scale-110 border-2 border-[#FF4D4D]' 
                              : 'bg-zinc-800 text-zinc-500 border-2 border-zinc-700'
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="mt-2.5">
                          <p className={`text-[10px] sm:text-xs font-black tracking-tight ${
                            isCurrent ? 'text-white' : isCompleted ? 'text-zinc-200' : 'text-zinc-500'
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-[9px] text-[#FF6B6B] font-bold block sm:hidden">
                            {step.bangla}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
                            {step.bangla}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Courier Details (Steadfast / Pathao / RedX / etc) */}
          {(order.courierName || order.trackingCode) && (
            <div className="bg-gradient-to-r from-zinc-900 via-[#1e1e24] to-zinc-900 border border-zinc-700/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Truck size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Assigned Courier Partner
                    </h4>
                    <p className="text-xs font-bold text-amber-400">
                      {order.courierName || 'Third-Party Courier'}
                    </p>
                  </div>
                </div>

                {courierUrl && (
                  <a
                    href={courierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <span>Track on Courier</span>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>

              {order.trackingCode && (
                <div className="bg-black/40 rounded-xl p-2.5 border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Consignment / Tracking ID:</span>
                    <span className="font-mono font-bold text-white tracking-wide">{order.trackingCode}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(order.trackingCode!, 'code')}
                    className="p-1 text-zinc-400 hover:text-white rounded-md bg-zinc-800 transition-colors cursor-pointer"
                    title="Copy Tracking ID"
                  >
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              )}

              {order.trackingNotes && (
                <p className="text-xs text-zinc-300 italic bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-800/80">
                  ℹ️ {order.trackingNotes}
                </p>
              )}
            </div>
          )}

          {/* Delivery & Customer Info Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MapPin size={13} className="text-[#D71920]" /> Shipping Destination
              </span>
              <p className="font-bold text-white text-sm">{order.customerName}</p>
              <p className="text-zinc-300 leading-relaxed text-xs">{order.address}</p>
              <p className="text-zinc-400 text-xs">{order.city}, {order.district}</p>
            </div>

            <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-400" /> Contact & Payment
              </span>
              <p className="font-bold text-white text-sm">{order.phone}</p>
              <div className="flex items-center gap-2 text-xs pt-0.5">
                <span className="text-zinc-400">Payment:</span>
                <span className="font-bold text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md text-[10px]">
                  {order.paymentMethodName || 'COD'}
                </span>
                <span className="text-zinc-400 font-bold">({order.paymentStatus})</span>
              </div>
              <p className="text-xs text-zinc-300 pt-1 font-semibold">
                Grand Total: <strong className="text-white text-sm font-black">৳{order.total}</strong>
              </p>
            </div>
          </div>

          {/* Ordered Items Preview */}
          <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span>Items in this Package ({order.items.length})</span>
              <span className="text-zinc-400 font-normal">Subtotal: ৳{order.subtotal}</span>
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[#18181b] p-2 rounded-xl border border-zinc-800/80">
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'} 
                    alt={item.title} 
                    className="w-10 h-10 object-cover rounded-lg border border-zinc-700/60 shrink-0" 
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-bold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-zinc-400">
                      {item.variantName ? `${item.variantName} · ` : ''}Qty: {item.quantity} × ৳{item.price}
                    </p>
                  </div>
                  <span className="font-bold text-white text-xs">৳{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Helpline Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs border-t border-zinc-800 text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <HelpCircle size={14} className="text-[#D71920]" />
              Need help regarding this order?
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors cursor-pointer"
              >
                <Phone size={13} />
                <span>Call Helpline</span>
              </a>
              <a
                href={`https://wa.me/${(settings.phone || '8801712345678').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello MR. BOOKS, I need updates on Order #${order.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
