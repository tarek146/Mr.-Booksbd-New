import React, { useMemo, useState } from 'react';
import {
  Order,
  PaymentMethodConfig,
  PaymentSubmission,
  Product,
} from '../../types';
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  Calendar,
  Phone,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CheckCircle2,
  X,
  FileText,
  Receipt,
  Sparkles,
  User,
} from 'lucide-react';
import {
  OrderChannelFilter,
  OrderDateFilter,
  OrderStatusTab,
  OrderVerificationFilter,
  OrderZoneFilter,
  computeCustomerPhoneOrderStats,
  filterAdminOrders,
  getOrderChannelKey,
  getOrderRepeatRankLabel,
  isOrderCompletedStatus,
  isOrderPendingGroup,
  isOrderProcessingGroup,
  isOrderShippedGroup,
  toNumericTimestamp,
} from '../../utils/adminOrderAndPaymentHelpers';
import {
  buildOrderSummaryCsv,
  buildSalesReportCsv,
  buildProductSalesReportCsv,
  triggerCsvDownload,
} from '../../utils/bookkeepingCsvHelpers';

interface AdminOrdersManagerProps {
  orders: Order[];
  products: Product[];
  paymentMethods: PaymentMethodConfig[];
  paymentSubmissions: PaymentSubmission[];
  onUpdateOrderStatus: (orderId: string, status: Order['orderStatus']) => Promise<void>;
  onUpdateOrderPaymentStatus: (orderId: string, status: Order['paymentStatus']) => Promise<void>;
  onOpenTrackingModal: (order: Order, preselectCourier?: string) => void;
  onCreateManualOrder: (payload: {
    customerName: string;
    phone: string;
    optionalPhone?: string;
    email?: string;
    district: string;
    city: string;
    address: string;
    notes?: string;
    productId: string;
    quantity: number;
    deliveryCharge: number;
    paymentMethodId: string;
    paymentMethodName: string;
  }) => Promise<string>;
  onSoftDeleteOrder: (orderId: string) => Promise<void>;
  onRestoreOrder: (orderId: string) => Promise<void>;
  onPermanentDeleteOrder: (orderId: string) => Promise<void>;
  onSyncOrders: () => Promise<void> | void;
  setToast: (t: { show: boolean; type: 'success' | 'error'; message: string }) => void;
}

const CHANNEL_CHIPS: { id: OrderChannelFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cod', label: 'COD' },
  { id: 'bkash', label: 'bKash' },
  { id: 'nagad', label: 'Nagad' },
  { id: 'rocket', label: 'Rocket' },
  { id: 'upay', label: 'Upay' },
  { id: 'banking', label: 'Banking' },
];

function formatOrderDateBadge(ts: unknown): { dateStr: string; timeStr: string } {
  const ms = toNumericTimestamp(ts, Date.now());
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { dateStr: `${yyyy}-${mm}-${dd}`, timeStr };
}

function cleanWhatsappPhone(phone: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  return digits;
}

export function AdminOrdersManager({
  orders,
  products,
  paymentMethods,
  paymentSubmissions,
  onUpdateOrderStatus,
  onUpdateOrderPaymentStatus,
  onOpenTrackingModal,
  onCreateManualOrder,
  onSoftDeleteOrder,
  onRestoreOrder,
  onPermanentDeleteOrder,
  onSyncOrders,
  setToast,
}: AdminOrdersManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDropdown, setStatusDropdown] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<OrderDateFilter>('all');
  const [channelFilter, setChannelFilter] = useState<OrderChannelFilter>('all');
  const [zoneFilter, setZoneFilter] = useState<OrderZoneFilter>('all');
  const [verificationFilter, setVerificationFilter] = useState<OrderVerificationFilter>('all');
  const [statusTab, setStatusTab] = useState<OrderStatusTab>('all');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedItemsOrderIds, setExpandedItemsOrderIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Modals (No window.alert / window.confirm)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDistrict, setNewCustDistrict] = useState('Dhaka');
  const [newCustCity, setNewCustCity] = useState('Dhaka');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');
  const [newProductId, setNewProductId] = useState(products[0]?.id || '');
  const [newQty, setNewQty] = useState(1);
  const [newDeliveryCharge, setNewDeliveryCharge] = useState(60);
  const [newPaymentMethodId, setNewPaymentMethodId] = useState(paymentMethods[0]?.id || 'cod');

  const [detailModalOrder, setDetailModalOrder] = useState<Order | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);
  const [printModalData, setPrintModalData] = useState<{ mode: 'label' | 'invoice'; order: Order } | null>(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<{ order: Order; permanent: boolean } | null>(null);

  const subByOrderId = useMemo(() => {
    const map = new Map<string, PaymentSubmission>();
    for (const s of paymentSubmissions) {
      map.set(s.orderId, s);
    }
    return map;
  }, [paymentSubmissions]);

  const phoneStatsMap = useMemo(() => computeCustomerPhoneOrderStats(orders), [orders]);

  const activeOrdersList = useMemo(() => orders.filter(o => !o.isTrashed), [orders]);
  const trashedOrdersList = useMemo(() => orders.filter(o => Boolean(o.isTrashed)), [orders]);

  const channelCounts = useMemo(() => {
    const counts: Record<OrderChannelFilter, number> = {
      all: activeOrdersList.length,
      cod: 0,
      bkash: 0,
      nagad: 0,
      rocket: 0,
      upay: 0,
      banking: 0,
    };
    for (const o of activeOrdersList) {
      const k = getOrderChannelKey(o);
      counts[k] = (counts[k] || 0) + 1;
    }
    return counts;
  }, [activeOrdersList]);

  const statusTabCounts = useMemo(() => ({
    all: activeOrdersList.length,
    pending: activeOrdersList.filter(o => isOrderPendingGroup(o.orderStatus)).length,
    processing: activeOrdersList.filter(o => isOrderProcessingGroup(o.orderStatus)).length,
    shipped: activeOrdersList.filter(o => isOrderShippedGroup(o.orderStatus)).length,
    completed: activeOrdersList.filter(o => isOrderCompletedStatus(o.orderStatus)).length,
    cancelled: activeOrdersList.filter(o => o.orderStatus === 'cancelled').length,
    trash: trashedOrdersList.length,
  }), [activeOrdersList, trashedOrdersList]);

  const filteredOrders = useMemo(() => {
    const list = filterAdminOrders(orders, paymentSubmissions, {
      searchQuery,
      statusTab,
      dateFilter,
      channelFilter,
      zoneFilter,
      verificationFilter,
    });
    if (statusDropdown !== 'all') {
      return list.filter(o => o.orderStatus === statusDropdown);
    }
    return list;
  }, [orders, paymentSubmissions, searchQuery, statusTab, dateFilter, channelFilter, zoneFilter, verificationFilter, statusDropdown]);

  const totalCount = filteredOrders.length;
  const allFilteredSelected =
    filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleCopyText = (text: string, label: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(key);
    setTimeout(() => setCopiedId(prev => (prev === key ? null : prev)), 1500);
    setToast({ show: true, type: 'success', message: `${label} copied to clipboard.` });
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportCsv = () => {
    const res = buildOrderSummaryCsv(filteredOrders, paymentSubmissions);
    triggerCsvDownload(res.csv, res.filename);
    setShowExportMenu(false);
    setToast({
      show: true,
      type: 'success',
      message: `Order Summary CSV downloaded (${res.rowCount} orders · ৳${res.totalRevenue.toLocaleString()}).`,
    });
  };

  const handleExportSalesReportCsv = () => {
    const res = buildSalesReportCsv(filteredOrders);
    triggerCsvDownload(res.csv, res.filename);
    setShowExportMenu(false);
    setToast({
      show: true,
      type: 'success',
      message: `Sales Report CSV downloaded (${res.dayCount} days · ৳${res.netRevenue.toLocaleString()}).`,
    });
  };

  const handleExportProductSalesCsv = () => {
    const res = buildProductSalesReportCsv(filteredOrders, products);
    triggerCsvDownload(res.csv, res.filename);
    setShowExportMenu(false);
    setToast({
      show: true,
      type: 'success',
      message: `Product Sales CSV downloaded (${res.productCount} products · ${res.totalUnitsSold} units sold).`,
    });
  };

  const handleBulkAction = async (action: 'processing' | 'shipped' | 'delivered' | 'trash' | 'restore') => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        if (action === 'trash') await onSoftDeleteOrder(id);
        else if (action === 'restore') await onRestoreOrder(id);
        else await onUpdateOrderStatus(id, action);
      }
      setToast({
        show: true,
        type: 'success',
        message: `Updated ${selectedIds.length} selected order(s).`,
      });
      setSelectedIds([]);
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: err?.message || 'Bulk update failed.' });
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenProd = products.find(p => p.id === newProductId) || products[0];
    if (!chosenProd) {
      setToast({ show: true, type: 'error', message: 'Please add a product first before creating an order.' });
      return;
    }
    const chosenMethod =
      paymentMethods.find(m => m.id === newPaymentMethodId) ||
      paymentMethods[0] || { id: 'cod', name: 'Cash on Delivery', englishName: 'Cash on Delivery' };

    setCreatingOrder(true);
    try {
      const createdId = await onCreateManualOrder({
        customerName: newCustName.trim(),
        phone: newCustPhone.trim(),
        district: newCustDistrict.trim() || 'Dhaka',
        city: newCustCity.trim() || 'Dhaka',
        address: newCustAddress.trim(),
        notes: newCustNotes.trim(),
        productId: chosenProd.id,
        quantity: Math.max(1, newQty),
        deliveryCharge: Math.max(0, Number(newDeliveryCharge) || 0),
        paymentMethodId: chosenMethod.id,
        paymentMethodName: chosenMethod.englishName || chosenMethod.name,
      });
      setShowCreateModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setNewCustNotes('');
      setNewQty(1);
      setToast({ show: true, type: 'success', message: `Order #${createdId} created & synced to Firebase!` });
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: err?.message || 'Could not create order.' });
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div data-testid="admin-orders-dashboard" className="space-y-4">
      {/* Top Command Toolbar Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Row 1: Search, Status Select, Date Select, + Create Order, Export CSV, Sync */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              data-testid="orders-search-input"
              placeholder="Search by order #, customer name, phone, address, or TrxID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 focus:bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#D71920] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                aria-label="Clear order search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={statusDropdown}
              onChange={e => setStatusDropdown(e.target.value)}
              aria-label="Filter by exact status"
              className="px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920] cursor-pointer"
            >
              <option value="all">⚡ All Status ({activeOrdersList.length})</option>
              <option value="pending">Pending</option>
              <option value="awaiting_payment">Awaiting Payment</option>
              <option value="awaiting_payment_verification">Awaiting Verification</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as OrderDateFilter)}
              aria-label="Filter by date range"
              className="px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920] cursor-pointer"
            >
              <option value="all">📅 All Dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <button
              type="button"
              data-testid="orders-create-order-btn"
              onClick={() => {
                if (!newProductId && products[0]) setNewProductId(products[0].id);
                setShowCreateModal(true);
              }}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>+ Create Order</span>
            </button>

            <div className="relative">
              <button
                type="button"
                data-testid="orders-export-csv-btn"
                onClick={() => setShowExportMenu(prev => !prev)}
                className="px-3.5 py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={13} className="text-neutral-600" />
                <span>Export CSV</span>
                <ChevronDown size={13} className="text-neutral-400" />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div
                    data-testid="orders-export-csv-dropdown"
                    className="absolute right-0 mt-1.5 w-60 bg-white border border-neutral-200 rounded-xl shadow-lg p-1.5 z-40 space-y-0.5"
                  >
                    <button
                      type="button"
                      data-testid="orders-export-order-summary-item"
                      onClick={handleExportCsv}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <FileText size={14} className="text-neutral-700 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-neutral-900">Order Summary CSV</div>
                        <div className="text-[11px] text-neutral-500">Orders, items, payment & courier</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      data-testid="orders-sales-report-csv-btn"
                      onClick={handleExportSalesReportCsv}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <Receipt size={14} className="text-[#D71920] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-neutral-900">Sales Report CSV</div>
                        <div className="text-[11px] text-neutral-500">Daily revenue & COD/MFS ledger</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      data-testid="orders-product-sales-csv-btn"
                      onClick={handleExportProductSalesCsv}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <Package size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-neutral-900">Product Sales CSV</div>
                        <div className="text-[11px] text-neutral-500">Item-wise units sold & revenue</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              data-testid="orders-sync-btn"
              onClick={async () => {
                setSyncing(true);
                try {
                  await onSyncOrders();
                  setToast({ show: true, type: 'success', message: 'Orders synchronized with Firebase.' });
                } finally {
                  setSyncing(false);
                }
              }}
              className="px-3.5 py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin text-[#D71920]' : 'text-neutral-600'} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Row 2: Payment Channel Pills + Zone / Verification Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {CHANNEL_CHIPS.map(chip => {
              const active = channelFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  data-testid={`orders-channel-${chip.id}`}
                  onClick={() => setChannelFilter(chip.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                    active
                      ? 'bg-[#D71920] text-white border-[#D71920] shadow-2xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      active ? 'bg-white/25 text-white' : 'bg-neutral-200/80 text-neutral-700'
                    }`}
                  >
                    {channelCounts[chip.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value as OrderZoneFilter)}
              aria-label="Filter by delivery zone"
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-[11px] font-bold text-neutral-700 cursor-pointer focus:outline-none focus:border-[#D71920]"
            >
              <option value="all">🌐 All Zones</option>
              <option value="inside_dhaka">Inside Dhaka</option>
              <option value="outside_dhaka">Outside Dhaka</option>
            </select>

            <select
              value={verificationFilter}
              onChange={e => setVerificationFilter(e.target.value as OrderVerificationFilter)}
              aria-label="Filter by payment verification"
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-[11px] font-bold text-neutral-700 cursor-pointer focus:outline-none focus:border-[#D71920]"
            >
              <option value="all">🛡️ Verification: All</option>
              <option value="paid">Payment Done (Paid)</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="unpaid">Unpaid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Rounded Tabs Bar + Select All */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'all', label: 'All Orders', count: statusTabCounts.all },
              { id: 'pending', label: 'Pending', count: statusTabCounts.pending },
              { id: 'processing', label: 'Processing', count: statusTabCounts.processing },
              { id: 'shipped', label: 'Shipped', count: statusTabCounts.shipped },
              { id: 'completed', label: 'Completed', count: statusTabCounts.completed },
              { id: 'cancelled', label: 'Cancelled', count: statusTabCounts.cancelled },
              { id: 'trash', label: 'Trash Bin', count: statusTabCounts.trash },
            ] as const
          ).map(tab => {
            const active = statusTab === tab.id;
            const isTrash = tab.id === 'trash';
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`orders-tab-${tab.id}`}
                onClick={() => {
                  setStatusTab(tab.id);
                  setSelectedIds([]);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                  active
                    ? isTrash
                      ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                      : 'bg-[#D71920] text-white border-[#D71920] shadow-2xs'
                    : isTrash
                    ? 'bg-red-50/70 text-red-700 border-red-200 hover:bg-red-100/80'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {isTrash && <Trash2 size={12} />}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    active ? 'bg-white/25 text-white' : 'bg-neutral-200/80 text-neutral-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer shrink-0 select-none">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 accent-[#D71920] rounded cursor-pointer"
          />
          <span>Select All ({totalCount})</span>
        </label>
      </div>

      {/* Bulk Action Strip (Visible when >= 1 order selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-[#FFF1F2] border border-[#D71920]/30 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-black text-[#D71920]">
            {selectedIds.length} order(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {statusTab !== 'trash' ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleBulkAction('processing')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 font-bold text-neutral-800 hover:border-[#D71920] cursor-pointer"
                >
                  Mark Processing
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkAction('shipped')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 font-bold text-neutral-800 hover:border-[#D71920] cursor-pointer"
                >
                  Mark Shipped
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkAction('delivered')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Mark Completed
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkAction('trash')}
                  className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void handleBulkAction('restore')}
                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Restore Selected
              </button>
            )}
          </div>
        </div>
      )}

      {/* Orders Card List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-12 text-center space-y-2">
            <Package size={30} className="mx-auto text-neutral-300" />
            <h3 className="text-sm font-black text-neutral-800">
              {statusTab === 'trash' ? 'Trash Bin is empty' : 'No matching orders found'}
            </h3>
            <p className="text-xs text-neutral-500">
              {statusTab === 'trash'
                ? 'Moved or deleted orders will stay safely in Trash Bin until permanently removed.'
                : 'Try clearing filters or create a manual order with + Create Order.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order, idx) => {
            const serialNumber = String(filteredOrders.length - idx).padStart(2, '0');
            const repeatMeta = getOrderRepeatRankLabel(order, phoneStatsMap);
            const { dateStr, timeStr } = formatOrderDateBadge(order.createdAt);
            const isInsideDhaka = (order.district || '').toLowerCase().includes('dhaka');
            const itemsList = Array.isArray(order.items) ? order.items : [];
            const isItemsExpanded = Boolean(expandedItemsOrderIds[order.id]);
            const visibleItems = isItemsExpanded ? itemsList : itemsList.slice(0, 1);
            const extraCount = Math.max(0, itemsList.length - 1);
            const linkedSub = subByOrderId.get(order.id);
            const isSelected = selectedIds.includes(order.id);
            const waPhone = cleanWhatsappPhone(order.phone);

            return (
              <div
                key={order.id}
                data-testid={`order-card-${order.id}`}
                className={`bg-white border rounded-2xl overflow-hidden shadow-2xs transition-all ${
                  isSelected
                    ? 'border-[#D71920] ring-2 ring-[#D71920]/15'
                    : 'border-neutral-200/90 hover:border-neutral-300'
                }`}
              >
                {/* Card Header Strip */}
                <div className="px-4 py-3 bg-neutral-50/80 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(order.id)}
                      aria-label={`Select order ${order.id}`}
                      className="w-4 h-4 accent-[#D71920] rounded cursor-pointer"
                    />

                    {/* SL Badge */}
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/90 text-[11px] font-black font-mono">
                      SL #{serialNumber}
                    </span>

                    {/* Order # + Copy */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-neutral-900 text-white text-[11px] font-mono font-bold">
                      #{order.id}
                      <button
                        type="button"
                        onClick={() => handleCopyText(order.id, 'Order ID', `id-${order.id}`)}
                        className="ml-0.5 text-neutral-300 hover:text-white cursor-pointer"
                        title="Copy Order ID"
                        aria-label={`Copy Order ${order.id}`}
                      >
                        {copiedId === `id-${order.id}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    </span>

                    {/* 1st Order / Repeat Order Badge */}
                    <span
                      data-testid={`order-repeat-badge-${order.id}`}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold border inline-flex items-center gap-1 ${
                        repeatMeta.isRepeat
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <Sparkles size={10} />
                      {repeatMeta.label}
                    </span>

                    {/* Fraud Check Badge (when cancelled > 0 highlight in header too) */}
                    {repeatMeta.cancelledCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                        <AlertTriangle size={10} className="text-amber-600" />
                        Fraud: {repeatMeta.cancelledCount} Cancelled
                      </span>
                    )}

                    {/* Date & Time Pill */}
                    <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-[11px] font-semibold text-neutral-600 inline-flex items-center gap-1">
                      <Calendar size={11} className="text-neutral-400" />
                      {dateStr} · {timeStr}
                    </span>

                    {/* Inside / Outside Dhaka Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold border ${
                        isInsideDhaka
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      {isInsideDhaka ? 'Inside Dhaka' : 'Outside Dhaka'}
                    </span>
                  </div>

                  {/* Header Right Controls: Label, Invoice, Status Select */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPrintModalData({ mode: 'label', order })}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      title="Print Shipping Label"
                    >
                      <Printer size={12} />
                      <span>Label</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintModalData({ mode: 'invoice', order })}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      title="Print Customer Invoice"
                    >
                      <FileText size={12} />
                      <span>Invoice</span>
                    </button>

                    <select
                      value={order.orderStatus}
                      onChange={e =>
                        void onUpdateOrderStatus(order.id, e.target.value as Order['orderStatus'])
                      }
                      aria-label={`Order status for ${order.id}`}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border cursor-pointer focus:outline-none ${
                        order.orderStatus === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.orderStatus === 'cancelled'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : isOrderPendingGroup(order.orderStatus)
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="awaiting_payment">Awaiting Payment</option>
                      <option value="awaiting_payment_verification">Pending Verify</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Completed (Delivered)</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* 4-Column Body */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
                  {/* Col 1: Customer Details + Fraud Signal (3 cols) */}
                  <div className="lg:col-span-3 space-y-2">
                    <div className="font-black text-sm text-neutral-900 flex items-center gap-1.5">
                      <User size={13} className="text-neutral-400 shrink-0" />
                      <span className="truncate">{order.customerName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <a
                        href={`tel:${(order.phone || '').replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold"
                      >
                        <Phone size={11} className="text-emerald-600" />
                        <span>{order.phone}</span>
                      </a>

                      {waPhone && (
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-black"
                          title="Message on WhatsApp"
                        >
                          WA
                        </a>
                      )}
                    </div>

                    <div className="text-xs text-neutral-500 flex items-start gap-1.5 leading-snug">
                      <MapPin size={12} className="text-neutral-400 shrink-0 mt-0.5" />
                      <span>
                        {[order.address, order.city, order.district].filter(Boolean).join(', ')}
                      </span>
                    </div>

                    {/* Fraud Check Risk Indicator Pill */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10.5px] font-bold ${
                        repeatMeta.cancelledCount > 0
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50/70 text-emerald-700 border-emerald-200/80'
                      }`}
                    >
                      {repeatMeta.cancelledCount > 0 ? (
                        <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                      ) : (
                        <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                      )}
                      <span>
                        Fraud: {repeatMeta.cancelledCount} Cancelled ({repeatMeta.totalOrders} total)
                      </span>
                    </div>
                  </div>

                  {/* Col 2: Ordered Items + Expandable Toggle (3 cols) */}
                  <div className="lg:col-span-3 space-y-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10.5px] font-extrabold">
                      <Package size={11} />
                      {itemsList.length} item(s)
                    </span>

                    <div className="space-y-1.5">
                      {visibleItems.map((item, i) => (
                        <div
                          key={`${item.productId}-${i}`}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50 border border-neutral-200/80"
                        >
                          <img
                            src={
                              item.image ||
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'
                            }
                            alt={item.title}
                            className="w-9 h-10 object-cover rounded-lg border border-neutral-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-neutral-900 truncate">
                              {item.quantity}x {item.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[11px] font-black text-[#D71920]">
                                ৳{item.price}
                              </span>
                              {item.variantName && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9.5px] font-bold">
                                  {item.variantName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {extraCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedItemsOrderIds(prev => ({ ...prev, [order.id]: !prev[order.id] }))
                        }
                        className="w-full py-1 px-2.5 rounded-lg bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/90 text-amber-800 text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        {isItemsExpanded ? (
                          <>
                            <ChevronUp size={12} /> Show fewer items
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> + {extraCount} more item(s)
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Col 3: Amount, Payment Method, Payment Status & Receipt (3 cols) */}
                  <div className="lg:col-span-3 space-y-2">
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-neutral-500">
                      <span className="text-amber-700">Total Amount</span>
                      <span>Delivery ৳{order.deliveryCharge || 0}</span>
                    </div>

                    <div className="text-xl font-black text-neutral-900 tabular-nums leading-none">
                      ৳{(order.total || 0).toLocaleString()}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold">
                        {order.paymentMethodName || 'Cash on Delivery'}
                      </span>

                      <select
                        value={order.paymentStatus}
                        onChange={e =>
                          void onUpdateOrderPaymentStatus(
                            order.id,
                            e.target.value as Order['paymentStatus']
                          )
                        }
                        aria-label={`Payment status for ${order.id}`}
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-extrabold border cursor-pointer focus:outline-none ${
                          order.paymentStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.paymentStatus === 'pending_verification'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : order.paymentStatus === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="pending_verification">Pending Verify</option>
                        <option value="approved">Payment Done</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {order.paymentStatus !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => void onUpdateOrderPaymentStatus(order.id, 'approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 size={11} />
                          <span>Mark Paid</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setReceiptModalOrder(order)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt size={11} />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>

                  {/* Col 4: Quick Courier Assignment + Row Action Icons (3 cols) */}
                  <div className="lg:col-span-3 flex flex-col justify-between gap-2.5">
                    {order.courierName || order.trackingCode ? (
                      <button
                        type="button"
                        onClick={() => onOpenTrackingModal(order)}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {order.courierName || 'Courier'}: {order.trackingCode || 'Assigned'}
                          </span>
                        </span>
                        <Edit2 size={12} className="shrink-0" />
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenTrackingModal(order, 'Steadfast')}
                          className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Truck size={12} />
                          <span>Steadfast</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenTrackingModal(order, 'Pathao')}
                          className="py-2 px-2.5 rounded-xl bg-[#FFF1F2] hover:bg-[#D71920] text-[#D71920] hover:text-white border border-[#D71920]/25 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Truck size={12} />
                          <span>Pathao</span>
                        </button>
                      </div>
                    )}

                    {/* Action Icons Row */}
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            `Order #${order.id}\nName: ${order.customerName}\nPhone: ${order.phone}\nAddress: ${order.address}, ${order.city}, ${order.district}\nTotal: ৳${order.total}${linkedSub?.transactionReference ? `\nTrxID: ${linkedSub.transactionReference}` : ''}`,
                            'Order summary',
                            `summary-${order.id}`
                          )
                        }
                        className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 cursor-pointer"
                        title="Copy Full Order Summary"
                      >
                        {copiedId === `summary-${order.id}` ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetailModalOrder(order)}
                        className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 cursor-pointer"
                        title="View Order Details"
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenTrackingModal(order)}
                        className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 cursor-pointer"
                        title="Edit Courier / Tracking"
                      >
                        <Edit2 size={13} />
                      </button>

                      {order.isTrashed ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void onRestoreOrder(order.id)}
                            className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                            title="Restore Order from Trash"
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteOrder({ order, permanent: true })}
                            className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteOrder({ order, permanent: false })}
                          className="p-2 rounded-xl border border-red-100 bg-red-50/70 hover:bg-red-100 text-red-600 cursor-pointer"
                          title="Move to Trash Bin"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900">Create Manual Order</h3>
                  <p className="text-[11px] text-neutral-500">Save a phone/social order directly to Firebase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    placeholder="e.g. Abdullah Al Mamun"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={newCustDistrict}
                    onChange={e => setNewCustDistrict(e.target.value)}
                    placeholder="Dhaka"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">City / Area</label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={e => setNewCustCity(e.target.value)}
                    placeholder="Dhanmondi"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Full Address *</label>
                <input
                  type="text"
                  required
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  placeholder="House, Road, Area"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-neutral-700 mb-1">Select Product *</label>
                  <select
                    value={newProductId}
                    onChange={e => setNewProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-[#D71920]"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} (৳{p.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Qty *</label>
                  <input
                    type="number"
                    min={1}
                    value={newQty}
                    onChange={e => setNewQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Payment Method</label>
                  <select
                    value={newPaymentMethodId}
                    onChange={e => setNewPaymentMethodId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-[#D71920]"
                  >
                    {paymentMethods.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.englishName || m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Delivery Fee (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={newDeliveryCharge}
                    onChange={e => setNewDeliveryCharge(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={newCustNotes}
                  onChange={e => setNewCustNotes(e.target.value)}
                  placeholder="Optional courier or gift note"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer disabled:opacity-50"
                >
                  {creatingOrder ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {detailModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-black text-neutral-900">
                Order Details · #{detailModalOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setDetailModalOrder(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                <div><strong>Customer:</strong> {detailModalOrder.customerName}</div>
                <div><strong>Phone:</strong> {detailModalOrder.phone}{detailModalOrder.optionalPhone ? ` (Alt: ${detailModalOrder.optionalPhone})` : ''}</div>
                {detailModalOrder.email && <div><strong>Email:</strong> {detailModalOrder.email}</div>}
                <div><strong>Address:</strong> {[detailModalOrder.address, detailModalOrder.city, detailModalOrder.district].filter(Boolean).join(', ')}</div>
                {detailModalOrder.notes && <div><strong>Notes:</strong> {detailModalOrder.notes}</div>}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(detailModalOrder.items || []).map((it, i) => (
                  <div key={i} className="flex justify-between p-2 rounded-lg border border-neutral-100">
                    <span className="font-bold">{it.quantity}x {it.title} ({it.variantName})</span>
                    <span className="font-black">৳{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-100 font-black text-sm">
                <span>Grand Total (inc. ৳{detailModalOrder.deliveryCharge} delivery)</span>
                <span className="text-[#D71920]">৳{detailModalOrder.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {receiptModalOrder && (() => {
        const sub = subByOrderId.get(receiptModalOrder.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h3 className="text-sm font-black text-neutral-900">
                  Payment Receipt · #{receiptModalOrder.id}
                </h3>
                <button
                  type="button"
                  onClick={() => setReceiptModalOrder(null)}
                  className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-500 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 text-xs bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer:</span>
                  <span className="font-bold text-neutral-900">{receiptModalOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Method:</span>
                  <span className="font-bold text-neutral-900">{sub?.providerName || receiptModalOrder.paymentMethodName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">TrxID:</span>
                  <span className="font-mono font-bold text-[#D71920]">{sub?.transactionReference || receiptModalOrder.trackingCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Sender Account:</span>
                  <span className="font-mono font-bold text-neutral-800">{sub?.senderIdentifier || receiptModalOrder.phone}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200">
                  <span className="font-bold text-neutral-700">Paid / Total:</span>
                  <span className="font-black text-sm text-emerald-700">৳{sub?.claimedAmount || receiptModalOrder.total}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Label / Invoice Preview & Print Modal */}
      {printModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-black text-neutral-900 uppercase">
                {printModalData.mode === 'label' ? 'Shipping Label Preview' : 'Customer Invoice Preview'} · #{printModalData.order.id}
              </h3>
              <button
                type="button"
                onClick={() => setPrintModalData(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 rounded-2xl border-2 border-dashed border-neutral-300 bg-white space-y-3 text-xs">
              <div className="flex justify-between items-start border-b border-neutral-200 pb-2">
                <div>
                  <div className="font-black text-base text-[#D71920]">MR. BOOKS</div>
                  <div className="text-[10px] text-neutral-500">Order #{printModalData.order.id}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{printModalData.order.district}</div>
                  <div className="text-[10px] text-neutral-500">{formatOrderDateBadge(printModalData.order.createdAt).dateStr}</div>
                </div>
              </div>
              <div>
                <div className="font-black text-sm">{printModalData.order.customerName}</div>
                <div className="font-bold text-neutral-700">{printModalData.order.phone}</div>
                <div className="text-neutral-600">{[printModalData.order.address, printModalData.order.city, printModalData.order.district].filter(Boolean).join(', ')}</div>
              </div>
              {printModalData.mode === 'invoice' && (
                <div className="border-t border-neutral-200 pt-2 space-y-1">
                  {(printModalData.order.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{it.quantity}x {it.title}</span>
                      <span className="font-bold">৳{it.price * it.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black pt-1 border-t border-neutral-200 text-sm">
                    <span>Total COD / Paid</span>
                    <span>৳{printModalData.order.total}</span>
                  </div>
                </div>
              )}
              {printModalData.mode === 'label' && (
                <div className="p-2.5 rounded-xl bg-neutral-100 flex justify-between font-black">
                  <span>COD / Amount:</span>
                  <span>৳{printModalData.order.paymentStatus === 'approved' ? '0 (PAID)' : printModalData.order.total}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintModalData(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={13} /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trash / Permanent Delete Confirmation Modal */}
      {confirmDeleteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-neutral-900">
                {confirmDeleteOrder.permanent
                  ? `Permanently delete #${confirmDeleteOrder.order.id}?`
                  : `Move #${confirmDeleteOrder.order.id} to Trash Bin?`}
              </h3>
              <p className="text-xs text-neutral-500">
                {confirmDeleteOrder.permanent
                  ? 'This action cannot be undone and removes the order from Firebase.'
                  : 'You can restore this order anytime from the Trash Bin tab.'}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOrder(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = confirmDeleteOrder;
                  setConfirmDeleteOrder(null);
                  try {
                    if (target.permanent) {
                      await onPermanentDeleteOrder(target.order.id);
                      setToast({ show: true, type: 'success', message: `Order #${target.order.id} permanently deleted.` });
                    } else {
                      await onSoftDeleteOrder(target.order.id);
                      setToast({ show: true, type: 'success', message: `Order #${target.order.id} moved to Trash Bin.` });
                    }
                  } catch (err: any) {
                    setToast({ show: true, type: 'error', message: err?.message || 'Action failed.' });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                {confirmDeleteOrder.permanent ? 'Delete Forever' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
