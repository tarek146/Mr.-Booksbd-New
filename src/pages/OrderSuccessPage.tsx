import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ShieldCheck, ArrowRight, Package, Copy, Check } from 'lucide-react';

export function OrderSuccessPage() {
  const { orders, selectedProductId: orderId, submitPaymentProof, setActivePage, paymentMethods } = useStore();
  
  const order = orders.find(o => o.id === orderId) || orders[0];
  
  const [transactionRef, setTransactionRef] = useState('');
  const [senderIdentifier, setSenderIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen py-20 text-center bg-white">
        <h2 className="text-xl font-bold text-[#171717] mb-2">Order Not Found</h2>
        <button onClick={() => setActivePage('home')} className="px-6 py-2.5 bg-[#D71920] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">
          Back to Home
        </button>
      </div>
    );
  }

  const paymentMethod = paymentMethods.find(m => m.id === order.paymentMethodId);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef || !senderIdentifier) {
      alert('Please enter your Transaction ID and Sender Number.');
      return;
    }

    setLoading(true);
    try {
      await submitPaymentProof({
        orderId: order.id,
        userId: order.userId,
        customerName: order.customerName,
        customerPhone: order.phone,
        providerId: order.paymentMethodId,
        providerName: order.paymentMethodName,
        transactionReference: transactionRef,
        senderIdentifier: senderIdentifier,
        claimedAmount: order.total
      });
      setSubmitted(true);
    } catch (err: any) {
      alert('Failed to submit payment proof: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white transition-colors py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Success Card */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 sm:p-10 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 size={36} />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
            Order Placed Successfully!
          </h1>
          
          <p className="text-xs sm:text-sm text-[#5F6368] max-w-md mx-auto">
            Your Order ID is <strong className="text-[#D71920] font-mono">{order.id}</strong>. 
            {order.paymentMethodId === 'cod' 
              ? ' Your Cash on Delivery order has been registered and is being prepared for dispatch.' 
              : ' Please transfer the total amount using your selected payment method and submit the transaction ID below.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => setActivePage('my-orders')}
              className="px-6 py-3 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package size={14} /> View Order Status
            </button>
            <button 
              onClick={() => setActivePage('home')}
              className="px-6 py-3 bg-white border border-[#E5E5E5] hover:border-[#D71920] text-[#171717] text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Manual Payment Submission Form */}
        {order.paymentMethodId !== 'cod' && !submitted && order.paymentStatus !== 'pending_verification' && order.paymentStatus !== 'approved' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 shadow-xs space-y-6">
            <div className="pb-4 border-b border-[#EEEEEE]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D71920]">
                Step 2: Submit Payment Details
              </span>
              <h2 className="text-xl font-black text-[#171717] mt-1">
                Enter Your Transaction ID (TrxID)
              </h2>
              <p className="text-xs text-[#5F6368] mt-1">
                Please send <strong className="text-[#D71920]">৳{order.total}</strong> to{' '}
                <strong className="text-[#171717]">{paymentMethod?.accountNumber}</strong> ({order.paymentMethodName}), then enter your details below.
              </p>
            </div>

            {paymentMethod && (
              <div className="p-4 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#777777]">Receiver Number</div>
                  <div className="font-mono font-bold text-base text-[#171717]">{paymentMethod.accountNumber}</div>
                  <div className="text-xs text-[#5F6368]">A/C: {paymentMethod.accountName}</div>
                </div>
                <button 
                  onClick={() => handleCopy(paymentMethod.accountNumber)}
                  className="px-3.5 py-1.5 bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/25 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#D71920] hover:text-white transition-all cursor-pointer"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                  Transaction ID (TrxID) *
                </label>
                <input 
                  type="text" 
                  required 
                  value={transactionRef} 
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="e.g. 9J87K65432"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] font-mono uppercase focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                  Sender Mobile / Account Number *
                </label>
                <input 
                  type="text" 
                  required 
                  value={senderIdentifier} 
                  onChange={e => setSenderIdentifier(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#171717] font-mono focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-lg shadow-[#D71920]/25 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Submitting Verification...' : 'Submit Payment for Admin Approval'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Verification Status Banner */}
        {(submitted || order.paymentStatus === 'pending_verification') && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center space-y-2">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-base text-amber-900">
              Payment Verification in Progress
            </h3>
            <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
              We have received your payment reference. Our team will verify it against our statement and update your order to confirmed within 15-30 minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
