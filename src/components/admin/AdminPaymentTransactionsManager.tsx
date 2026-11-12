import React, { useMemo, useState } from 'react';
import { Order, PaymentSubmission } from '../../types';
import {
  CreditCard,
  Download,
  RefreshCw,
  Plus,
  Wallet,
  TrendingUp,
  Clock,
  Search,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  X,
  Receipt,
} from 'lucide-react';
import {
  PaymentGatewayTab,
  PaymentStatusTab,
  UnifiedPaymentRecord,
  computePaymentDashboardMetrics,
  filterPaymentRecords,
  toNumericTimestamp,
} from '../../utils/adminOrderAndPaymentHelpers';

interface AdminPaymentTransactionsManagerProps {
  paymentSubmissions: PaymentSubmission[];
  orders: Order[];
  onReviewSubmission: (subId: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  onCreateManualPayment: (payload: {
    orderId: string;
    customerName: string;
    customerPhone: string;
    providerName: string;
    transactionReference: string;
    senderIdentifier: string;
    claimedAmount: number;
    status: 'pending_verification' | 'approved';
  }) => Promise<void>;
  onRefresh: () => Promise<void> | void;
  setToast: (t: { show: boolean; type: 'success' | 'error'; message: string }) => void;
}

const GATEWAY_TABS: { id: PaymentGatewayTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bkash', label: 'bKash' },
  { id: 'nagad', label: 'Nagad' },
  { id: 'rocket', label: 'Rocket' },
  { id: 'upay', label: 'Upay' },
  { id: 'card', label: 'Card / Other' },
  { id: 'cod', label: 'Cash on Delivery' },
];

export function AdminPaymentTransactionsManager({
  paymentSubmissions,
  orders,
  onReviewSubmission,
  onCreateManualPayment,
  onRefresh,
  setToast,
}: AdminPaymentTransactionsManagerProps) {
  const [gatewayTab, setGatewayTab] = useState<PaymentGatewayTab>('all');
  const [statusTab, setStatusTab] = useState<PaymentStatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [receiptRecord, setReceiptRecord] = useState<UnifiedPaymentRecord | null>(null);

  // + New Payment Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newProviderName, setNewProviderName] = useState('bKash');
  const [newTrxId, setNewTrxId] = useState('');
  const [newSenderAcc, setNewSenderAcc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPayStatus, setNewPayStatus] = useState<'pending_verification' | 'approved'>('approved');

  const metrics = useMemo(
    () => computePaymentDashboardMetrics(paymentSubmissions, orders),
    [paymentSubmissions, orders]
  );

  const filteredRecords = useMemo(
    () =>
      filterPaymentRecords(paymentSubmissions, orders, {
        gatewayTab,
        statusTab,
        searchQuery,
      }),
    [paymentSubmissions, orders, gatewayTab, statusTab, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice((safePage - 1) * perPage, safePage * perPage);

  const handleExportCsv = () => {
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Phone',
      'Gateway',
      'TrxID',
      'Sender Account',
      'Amount (BDT)',
      'Status',
      'Date',
    ];
    const escapeCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredRecords.map(r => [
      r.orderId,
      r.customerName,
      r.customerPhone,
      r.providerName,
      r.transactionReference,
      r.senderIdentifier,
      r.amount,
      r.status,
      new Date(toNumericTimestamp(r.timestamp)).toISOString(),
    ]);
    const csv = [headers.map(escapeCell).join(','), ...rows.map(r => r.map(escapeCell).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mr-books-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ show: true, type: 'success', message: `Exported ${filteredRecords.length} payment record(s) to CSV.` });
  };

  const handleCreatePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPayment(true);
    try {
      await onCreateManualPayment({
        orderId: newOrderId.trim() || `MRB-${Date.now().toString().slice(-6)}`,
        customerName: newCustomerName.trim(),
        customerPhone: newCustomerPhone.trim(),
        providerName: newProviderName,
        transactionReference: newTrxId.trim(),
        senderIdentifier: newSenderAcc.trim() || newCustomerPhone.trim(),
        claimedAmount: Math.max(0, Number(newAmount) || 0),
        status: newPayStatus,
      });
      setShowNewModal(false);
      setNewOrderId('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewTrxId('');
      setNewSenderAcc('');
      setNewAmount('');
      setToast({ show: true, type: 'success', message: 'Payment transaction saved to Firebase!' });
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: err?.message || 'Failed to record payment.' });
    } finally {
      setCreatingPayment(false);
    }
  };

  return (
    <div data-testid="admin-payments-dashboard" className="space-y-4">
      {/* Header Bar Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CreditCard size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                Payment Transactions
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real-time
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              MFS & Digital Payment Tracking &amp; Verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            data-testid="payments-export-csv-btn"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            data-testid="payments-refresh-btn"
            onClick={async () => {
              setRefreshing(true);
              try {
                await onRefresh();
                setToast({ show: true, type: 'success', message: 'Payment records refreshed.' });
              } finally {
                setRefreshing(false);
              }
            }}
            className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#D71920]' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            data-testid="payments-new-payment-btn"
            onClick={() => setShowNewModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus size={14} />
            <span>+ New Payment</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-neutral-500 block">Total Collected</span>
            <div className="text-2xl font-black text-neutral-900 mt-1 tabular-nums">
              ৳{metrics.totalCollected.toLocaleString()}
            </div>
            <span className="text-[11px] font-bold text-emerald-600 mt-0.5 block">
              {metrics.completedCount} Completed
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <Wallet size={18} />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-neutral-500 block">Today Collected</span>
            <div className="text-2xl font-black text-neutral-900 mt-1 tabular-nums">
              ৳{metrics.todayCollected.toLocaleString()}
            </div>
            <span className="text-[11px] font-bold text-[#D71920] mt-0.5 block">
              Today Collection
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/20 flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-neutral-500 block">Pending Payments</span>
            <div className="text-2xl font-black text-neutral-900 mt-1 tabular-nums">
              ৳{metrics.pendingAmount.toLocaleString()}
            </div>
            <span className="text-[11px] font-bold text-amber-600 mt-0.5 block">
              {metrics.pendingCount} pending verification
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-bold text-neutral-500 block">Digital MFS &amp; Bank</span>
            <div className="text-2xl font-black text-neutral-900 mt-1 tabular-nums">
              ৳{metrics.digitalTotal.toLocaleString()}
            </div>
            <span className="text-[11px] font-medium text-neutral-500 mt-0.5 block truncate">
              bKash: ৳{metrics.bkashTotal} | Nagad: ৳{metrics.nagadTotal}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <CreditCard size={18} />
          </div>
        </div>
      </div>

      {/* Search + Gateway & Status Filter Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              data-testid="payments-search-input"
              placeholder="Search by TrxID, mobile, customer or order..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 focus:bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#D71920]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setStatusTab(prev => (prev === 'failed' ? 'all' : 'failed'));
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                statusTab === 'failed'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
            >
              <XCircle size={13} />
              <span>Failed ({metrics.failedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusTab(prev => (prev === 'flagged' ? 'all' : 'flagged'));
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                statusTab === 'flagged'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle size={13} />
              <span>Flagged ({metrics.flaggedCount})</span>
            </button>
          </div>
        </div>

        {/* Gateway Chips + Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {GATEWAY_TABS.map(gw => {
              const active = gatewayTab === gw.id;
              return (
                <button
                  key={gw.id}
                  type="button"
                  data-testid={`payments-gateway-${gw.id}`}
                  onClick={() => {
                    setGatewayTab(gw.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
                    active
                      ? 'bg-[#D71920] text-white border-[#D71920] shadow-2xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {gw.label} ({metrics.gatewayCounts[gw.id]})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: `All (${paymentSubmissions.length})` },
                { id: 'pending', label: `Pending (${metrics.pendingCount})` },
                { id: 'done', label: `Payment Done (${metrics.completedCount})` },
                { id: 'failed', label: `Failed (${metrics.failedCount})` },
              ] as const
            ).map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setStatusTab(st.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  statusTab === st.id
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Record List Container */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div className="text-sm font-black text-neutral-900">
            Payments Record List <span className="text-neutral-400 font-bold">({filteredRecords.length})</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 font-semibold">Per page</span>
            <select
              value={perPage}
              onChange={e => {
                setPerPage(Number(e.target.value) || 10);
                setCurrentPage(1);
              }}
              aria-label="Records per page"
              className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-neutral-50 font-bold text-neutral-800 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {paginatedRecords.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto border border-neutral-200">
              <CreditCard size={20} />
            </div>
            <h3 className="text-sm font-black text-neutral-800">No payment records found</h3>
            <p className="text-xs text-neutral-500">New online payments will appear here.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 text-[10.5px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Gateway</th>
                    <th className="py-2.5 px-3">TrxID &amp; Sender</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {paginatedRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#D71920]">#{rec.orderId}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-neutral-900">{rec.customerName}</div>
                        <div className="text-[11px] text-neutral-500">{rec.customerPhone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-800 font-bold text-[11px]">
                          {rec.providerName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-neutral-900">{rec.transactionReference}</div>
                        <div className="text-[11px] text-neutral-500">
                          Sender: {rec.senderIdentifier || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-black text-neutral-900 text-sm">
                        ৳{rec.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            rec.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : rec.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {rec.status === 'approved'
                            ? 'Payment Done'
                            : rec.status === 'rejected'
                            ? 'Failed'
                            : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReceiptRecord(rec)}
                            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                            title="View Receipt"
                          >
                            <Receipt size={13} />
                          </button>
                          {rec.source === 'submission' && rec.status === 'pending_verification' && (
                            <>
                              <button
                                type="button"
                                onClick={() => void onReviewSubmission(rec.id, 'approved')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingId(rec.id)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-[#D71920] font-bold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2.5">
              {paginatedRecords.map(rec => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-[#D71920]">#{rec.orderId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        rec.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rec.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {rec.status === 'approved'
                        ? 'Payment Done'
                        : rec.status === 'rejected'
                        ? 'Failed'
                        : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="font-bold text-neutral-900">{rec.customerName}</div>
                      <div className="text-[11px] text-neutral-500">{rec.customerPhone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm">৳{rec.amount.toLocaleString()}</div>
                      <div className="text-[11px] text-neutral-600">{rec.providerName}</div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-neutral-200 flex justify-between text-[11px]">
                    <span>TrxID: <strong className="font-mono">{rec.transactionReference}</strong></span>
                    <span>From: <strong className="font-mono">{rec.senderIdentifier || 'N/A'}</strong></span>
                  </div>
                  {rec.source === 'submission' && rec.status === 'pending_verification' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void onReviewSubmission(rec.id, 'approved')}
                        className="py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(rec.id)}
                        className="py-2 bg-red-50 text-[#D71920] font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                <span className="text-neutral-500">
                  Page {safePage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-neutral-200 disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded-lg border border-neutral-200 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Inline Rejection Reason Box */}
        {rejectingId && (
          <div className="p-4 bg-red-50/70 rounded-xl border border-red-200 space-y-3">
            <h4 className="font-bold text-xs text-[#D71920]">Reason for Payment Rejection</h4>
            <input
              type="text"
              placeholder="e.g. Transaction ID was not found in statement"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:border-[#D71920]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-3.5 py-1.5 bg-white text-xs font-bold rounded-lg border border-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = rejectingId;
                  setRejectingId(null);
                  await onReviewSubmission(id, 'rejected', rejectReason);
                  setRejectReason('');
                }}
                className="px-4 py-1.5 bg-[#D71920] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Payment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-black text-neutral-900">Record New Payment</h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePaymentSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Order ID *</label>
                  <input
                    type="text"
                    required
                    value={newOrderId}
                    onChange={e => setNewOrderId(e.target.value)}
                    placeholder="MRB-123456"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Gateway *</label>
                  <select
                    value={newProviderName}
                    onChange={e => setNewProviderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Upay">Upay</option>
                    <option value="Bank Transfer">Bank / Card</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    placeholder="Name"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">TrxID *</label>
                  <input
                    type="text"
                    required
                    value={newTrxId}
                    onChange={e => setNewTrxId(e.target.value)}
                    placeholder="8J2K9901"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Sender Number</label>
                  <input
                    type="text"
                    value={newSenderAcc}
                    onChange={e => setNewSenderAcc(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Initial Status</label>
                  <select
                    value={newPayStatus}
                    onChange={e => setNewPayStatus(e.target.value as 'pending_verification' | 'approved')}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white"
                  >
                    <option value="approved">Payment Done</option>
                    <option value="pending_verification">Pending Verification</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPayment}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer disabled:opacity-50"
                >
                  {creatingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-black text-neutral-900">
                Transaction Receipt · #{receiptRecord.orderId}
              </h3>
              <button
                type="button"
                onClick={() => setReceiptRecord(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 text-xs bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
              <div className="flex justify-between">
                <span className="text-neutral-500">Customer:</span>
                <span className="font-bold">{receiptRecord.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Gateway:</span>
                <span className="font-bold">{receiptRecord.providerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">TrxID:</span>
                <span className="font-mono font-bold text-[#D71920]">{receiptRecord.transactionReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Amount:</span>
                <span className="font-black text-emerald-700">৳{receiptRecord.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
