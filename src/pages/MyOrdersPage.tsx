import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Heart, 
  ArrowRight,
  Truck,
  ShieldCheck
} from 'lucide-react';

export interface OrderTrackingProps {
  orderStatus: string;
  paymentStatus: string;
}

export function OrderTracking({ orderStatus, paymentStatus }: OrderTrackingProps) {
  const isCancelled = orderStatus === 'cancelled' || paymentStatus === 'rejected';

  const steps = [
    { label: 'Pending', desc: 'Order Received', icon: Clock },
    { label: 'Verified', desc: 'Payment Approved', icon: ShieldCheck },
    { label: 'Processing', desc: 'Packing Items', icon: Package },
    { label: 'Shipped', desc: 'In Transit', icon: Truck },
    { label: 'Delivered', desc: 'Handed Over', icon: CheckCircle2 },
  ];

  const getStepIndex = (): number => {
    if (orderStatus === 'delivered') return 4;
    if (orderStatus === 'shipped' || orderStatus === 'out_for_delivery') return 3;
    if (orderStatus === 'processing') return 2;
    if (orderStatus === 'confirmed' || paymentStatus === 'approved') return 1;
    return 0; // pending / awaiting_payment / pending_verification
  };

  if (isCancelled) {
    return (
      <div className="bg-[#FFF1F2] border border-[#D71920]/30 rounded-2xl p-4 flex items-center gap-3 text-[#D71920]">
        <AlertCircle size={20} className="shrink-0" />
        <div>
          <h4 className="font-extrabold text-xs uppercase tracking-wide">Order Issue / Cancelled</h4>
          <p className="text-xs font-medium mt-0.5 text-neutral-700">
            {paymentStatus === 'rejected' 
              ? 'Payment reference rejected. Please re-submit your correct Transaction ID below.' 
              : 'This order was cancelled. Please contact support if you need further help.'}
          </p>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex();
  const progressWidthPercent = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="bg-[#F8F9FA] rounded-2xl p-4 sm:p-5 border border-[#E5E5E5] space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
        <span className="flex items-center gap-1.5 text-[#D71920]">
          <Truck size={15} /> Real-Time Order Tracking
        </span>
        <span className="text-neutral-500 font-medium">
          Status: <strong className="text-[#D71920] font-black">{steps[currentStep].label}</strong>
        </span>
      </div>

      {/* Visual Stepper Bar */}
      <div className="relative pt-2 pb-2">
        {/* Background Line */}
        <div className="absolute top-[22px] left-6 right-6 h-1 bg-neutral-200 rounded-full z-0" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-[22px] left-6 h-1 bg-[#D71920] rounded-full transition-all duration-500 z-0" 
          style={{ width: `calc(${progressWidthPercent}% * 0.88)` }}
        />

        {/* Steps Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={idx} className="flex flex-col items-center text-center">
                <div 
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-2xs ${
                    isCompleted 
                      ? 'bg-[#D71920] text-white border-2 border-[#D71920]' 
                      : isCurrent 
                      ? 'bg-[#D71920] text-white ring-4 ring-[#D71920]/20 scale-110 border-2 border-[#D71920]' 
                      : 'bg-white text-neutral-400 border-2 border-neutral-200'
                  }`}
                >
                  <Icon size={16} />
                </div>

                <div className="mt-2">
                  <p className={`text-[10px] sm:text-xs font-extrabold ${
                    isCurrent ? 'text-[#D71920]' : isCompleted ? 'text-[#171717]' : 'text-neutral-400'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400 font-medium hidden sm:block">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MyOrdersPage() {
  const { orders, products, wishlist, submitPaymentProof, setActivePage } = useStore();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>(wishlist.length > 0 && orders.length === 0 ? 'wishlist' : 'orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trxId, setTrxId] = useState('');
  const [senderNum, setSenderNum] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Order ID direct lookup state
  const [trackingInput, setTrackingInput] = useState('');
  const [searchedOrderResult, setSearchedOrderResult] = useState<any | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleLookupOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    const query = trackingInput.trim().replace(/^#/, '');
    const found = orders.find(o => o.id.toLowerCase() === query.toLowerCase() || o.phone.includes(query));
    setSearchedOrderResult(found || null);
    setSearchAttempted(true);
  };

  const userOrders = currentUser 
    ? orders.filter(o => o.userId === currentUser.uid || o.email === currentUser.email)
    : orders;

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !trxId || !senderNum) return;
    setSubmitting(true);
    try {
      await submitPaymentProof({
        orderId: selectedOrder.id,
        userId: selectedOrder.userId,
        customerName: selectedOrder.customerName,
        customerPhone: selectedOrder.phone,
        providerId: selectedOrder.paymentMethodId,
        providerName: selectedOrder.paymentMethodName,
        transactionReference: trxId,
        senderIdentifier: senderNum,
        claimedAmount: selectedOrder.total
      });
      alert('Payment reference re-submitted successfully!');
      setSelectedOrderId(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold capitalize">
            <CheckCircle2 size={12} /> {status}
          </span>
        );
      case 'pending_verification':
      case 'awaiting_payment_verification':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
            <Clock size={12} /> Pending Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/30 px-2.5 py-1 rounded-full text-xs font-bold">
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-full text-xs font-bold capitalize">
            <AlertCircle size={12} /> {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white transition-colors py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Header & Tab Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#EEEEEE]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D71920] text-white rounded-xl flex items-center justify-center shadow-sm">
              {activeTab === 'wishlist' ? <Heart size={20} fill="currentColor" /> : <Package size={20} />}
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-[#171717] tracking-tight">
                {activeTab === 'wishlist' ? 'Saved Wishlist Items' : 'Order History & Tracking'}
              </h1>
              <p className="text-xs text-[#5F6368] mt-0.5">
                {activeTab === 'wishlist' 
                  ? 'Your saved books & stationery collections for quick checkout' 
                  : ''}
              </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-2 bg-[#F7F7F8] p-1.5 rounded-2xl border border-[#E5E5E5] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-white text-[#D71920] shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Package size={14} />
              <span>Orders ({userOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'wishlist'
                  ? 'bg-white text-[#D71920] shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Heart size={14} className={wishlist.length > 0 ? "fill-[#D71920] text-[#D71920]" : ""} />
              <span>Wishlist ({wishlist.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SAVED WISHLIST ITEMS */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {wishlistProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-[#F7F7F8] rounded-3xl p-10 text-center border border-[#E5E5E5] max-w-md mx-auto my-8">
                <Heart size={38} className="mx-auto text-neutral-400 mb-3" />
                <h3 className="font-bold text-base text-[#171717]">Your Wishlist is Empty</h3>
                <p className="text-xs text-[#5F6368] mt-1 mb-5">
                  Tap the heart icon on any book or stationery item to save it here for later.
                </p>
                <button 
                  onClick={() => setActivePage('books')}
                  className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Explore Books Catalog</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDER HISTORY WITH DEDICATED TRACKING PROGRESS BAR */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            {/* Direct Order ID / Phone Tracking Lookup Card */}
            <div className="bg-[#F8F9FA] border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="max-w-xl mx-auto text-center space-y-3">
                <div className="w-12 h-12 bg-[#D71920]/10 text-[#D71920] rounded-2xl mx-auto flex items-center justify-center font-black">
                  <Truck size={24} />
                </div>
                <h2 className="text-xl font-black text-[#171717] tracking-tight">
                  Track Your Order Status
                </h2>
                <p className="text-xs text-[#5F6368]">
                  Enter your Order ID (e.g., PV-728014) or phone number to view real-time fulfillment status directly from Firebase.
                </p>

                <form onSubmit={handleLookupOrder} className="flex gap-2 pt-2">
                  <input 
                    type="text"
                    required
                    placeholder="Enter Order ID (e.g. PV-728014)"
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-white text-xs font-mono font-bold text-[#171717] shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-2xl text-xs shadow-md transition-all cursor-pointer shrink-0"
                  >
                    Track Status
                  </button>
                </form>

                {searchAttempted && (
                  <div className="mt-4">
                    {searchedOrderResult ? (
                      <div className="bg-white border border-emerald-200 rounded-2xl p-5 text-left shadow-md space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                          <div>
                            <span className="text-xs font-bold text-[#D71920] uppercase font-mono">
                              Order #{searchedOrderResult.id}
                            </span>
                            <h4 className="font-black text-sm text-[#171717] mt-0.5">
                              {searchedOrderResult.customerName} ({searchedOrderResult.phone})
                            </h4>
                          </div>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold capitalize">
                            {searchedOrderResult.orderStatus}
                          </span>
                        </div>
                        <OrderTracking 
                          orderStatus={searchedOrderResult.orderStatus}
                          paymentStatus={searchedOrderResult.paymentStatus}
                        />
                      </div>
                    ) : (
                      <div className="bg-[#FFF1F2] border border-[#D71920]/30 rounded-2xl p-4 text-[#D71920] text-xs font-bold">
                        No order found matching "{trackingInput}". Please check your Order ID and try again.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {userOrders.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase text-neutral-500 tracking-wider">Your Recent Orders</h3>
                {userOrders.map(order => (
                  <div 
                    key={order.id}
                    className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
                      <div>
                        <span className="text-xs font-bold text-[#D71920] uppercase tracking-wider font-mono">
                          Order #{order.id}
                        </span>
                        <h3 className="text-lg font-black text-[#171717] mt-0.5">
                          {order.customerName} ({order.phone})
                        </h3>
                        <p className="text-xs text-[#5F6368] mt-0.5">
                          Placed on {new Date(order.createdAt).toLocaleDateString()} • Destination: {order.district}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-[#777777] mb-1">Payment Status</div>
                          {getStatusBadge(order.paymentStatus)}
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-[#777777] mb-1">Fulfillment</div>
                          {getStatusBadge(order.orderStatus)}
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Visual Order Progress Bar (Pending -> Verified -> Processing -> Shipped -> Delivered) */}
                    <OrderTracking 
                      orderStatus={order.orderStatus} 
                      paymentStatus={order.paymentStatus} 
                    />

                    {/* Order Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-[#F7F7F8] rounded-xl border border-[#E5E5E5]">
                          <img src={item.image} alt="" className="w-10 h-12 object-contain bg-white rounded-md p-1 border border-[#E5E5E5] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-[#171717] truncate">{item.title}</p>
                            <p className="text-[11px] text-[#5F6368]">{item.variantName} × {item.quantity}</p>
                            <p className="text-xs font-black text-[#D71920] mt-0.5">৳{item.price * item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-[#EEEEEE] gap-4">
                      <div className="text-xs text-[#5F6368]">
                        Method: <strong className="text-[#171717]">{order.paymentMethodName}</strong>
                        <span className="mx-2">•</span>
                        Total Paid/Payable: <strong className="text-[#D71920] font-black text-sm">৳{order.total}</strong>
                      </div>

                      {order.paymentStatus === 'rejected' && (
                        <button 
                          onClick={() => setSelectedOrderId(order.id)}
                          className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          Resubmit Correct Transaction Reference
                        </button>
                      )}
                    </div>

                    {/* Resubmit Form Drawer */}
                    {selectedOrderId === order.id && (
                      <form onSubmit={handleResubmit} className="mt-4 p-5 bg-[#FFF1F2] rounded-2xl border border-[#D71920]/30 space-y-3">
                        <h4 className="font-bold text-xs text-[#D71920] uppercase tracking-wider">
                          Resubmit Payment Reference for Order {order.id}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input 
                            type="text" 
                            required 
                            placeholder="Correct Transaction ID (TrxID)"
                            value={trxId} 
                            onChange={e => setTrxId(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-mono text-[#171717]"
                          />
                          <input 
                            type="text" 
                            required 
                            placeholder="Sender Phone Number"
                            value={senderNum} 
                            onChange={e => setSenderNum(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-mono text-[#171717]"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button 
                            type="button" 
                            onClick={() => setSelectedOrderId(null)}
                            className="px-4 py-2 bg-white text-xs font-bold rounded-xl border border-[#E5E5E5] text-[#171717] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            disabled={submitting}
                            className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                          >
                            {submitting ? 'Submitting...' : 'Submit New Reference'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#F7F7F8] rounded-3xl p-12 text-center border border-[#E5E5E5] max-w-md mx-auto my-8">
                <Package size={40} className="mx-auto text-[#777777] mb-3" />
                <h3 className="font-bold text-base text-[#171717]">No Orders Placed Yet</h3>
                <p className="text-xs text-[#5F6368] mt-1 mb-4">
                  You haven't placed any book or stationery orders with us yet.
                </p>
                <button 
                  onClick={() => setActivePage('books')}
                  className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Browse Books Catalog
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
