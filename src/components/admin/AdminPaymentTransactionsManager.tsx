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
    <div data-testid="admin-payments-dashboard" className="space-y-5">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Payment Transactions
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Real-time sync
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-500">
            MFS &amp; digital payment tracking, TrxID verification, and settlement records
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            data-testid="payments-export-csv-btn"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export CSV</span>
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
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#D71920]' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            data-testid="payments-new-payment-btn"
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 rounded-lg bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Plus size={14} />
            <span>New Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Clean KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block">Total Collected</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 tabular-nums tracking-tight">
              ৳{metrics.totalCollected.toLocaleString()}
            </div>
            <span className="text-xs font-medium text-emerald-700 mt-1 block tabular-nums">
              {metrics.completedCount} completed
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <Wallet size={17} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block">Today Collected</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 tabular-nums tracking-tight">
              ৳{metrics.todayCollected.toLocaleString()}
            </div>
            <span className="text-xs font-medium text-slate-500 mt-1 block">
              Daily settlement
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <TrendingUp size={17} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block">Pending Review</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 tabular-nums tracking-tight">
              ৳{metrics.pendingAmount.toLocaleString()}
            </div>
            <span className="text-xs font-medium text-amber-700 mt-1 block tabular-nums">
              {metrics.pendingCount} awaiting check
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <Clock size={17} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block">Digital MFS &amp; Bank</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 tabular-nums tracking-tight">
              ৳{metrics.digitalTotal.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-1 block truncate tabular-nums">
              bKash ৳{metrics.bkashTotal} · Nagad ৳{metrics.nagadTotal}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <CreditCard size={17} />
          </div>
        </div>
      </div>

      {/* Unified Filter & Record Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Search & Filter Controls */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                data-testid="payments-search-input"
                placeholder="Search by TrxID, mobile number, customer, or order #..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white text-[13px] text-slate-900 focus:outline-none focus:border-[#D71920]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={14} />
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
                className={`px-3 py-2 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer transition-colors tabular-nums ${
                  statusTab === 'failed'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <XCircle size={13} className={statusTab === 'failed' ? 'text-white' : 'text-red-600'} />
                <span>Failed ({metrics.failedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusTab(prev => (prev === 'flagged' ? 'all' : 'flagged'));
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer transition-colors tabular-nums ${
                  statusTab === 'flagged'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle size={13} className={statusTab === 'flagged' ? 'text-white' : 'text-amber-600'} />
                <span>Flagged ({metrics.flaggedCount})</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {gw.label} ({metrics.gatewayCounts[gw.id]})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: `All (${paymentSubmissions.length})` },
                  { id: 'pending', label: `Pending (${metrics.pendingCount})` },
                  { id: 'done', label: `Verified (${metrics.completedCount})` },
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
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap tabular-nums ${
                    statusTab === st.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List Sub-Header */}
        <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-slate-700 tabular-nums">
            Payments Record List <span className="text-slate-400 font-normal">({filteredRecords.length})</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Per page</span>
            <select
              value={perPage}
              onChange={e => {
                setPerPage(Number(e.target.value) || 10);
                setCurrentPage(1);
              }}
              aria-label="Records per page"
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 cursor-pointer tabular-nums"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Records Content */}
        {paginatedRecords.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CreditCard size={18} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No payment records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              New online transactions and manual verification submissions will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500 text-[11px] uppercase font-semibold tracking-wider">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Gateway</th>
                    <th className="py-3 px-4">TrxID &amp; Sender</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        #{rec.orderId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 truncate max-w-[180px]">{rec.customerName}</div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">{rec.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {rec.providerName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-900">{rec.transactionReference}</div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          {rec.senderIdentifier || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        ৳{rec.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            rec.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : rec.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {rec.status === 'approved'
                            ? 'Verified'
                            : rec.status === 'rejected'
                            ? 'Failed'
                            : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReceiptRecord(rec)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
                            title="View Receipt"
                            aria-label={`View receipt for order ${rec.orderId}`}
                          >
                            <Receipt size={14} />
                          </button>
                          {rec.source === 'submission' && rec.status === 'pending_verification' && (
                            <>
                              <button
                                type="button"
                                onClick={() => void onReviewSubmission(rec.id, 'approved')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingId(rec.id)}
                                className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
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
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedRecords.map(rec => (
                <div key={rec.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-slate-900">#{rec.orderId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                        rec.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rec.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {rec.status === 'approved'
                        ? 'Verified'
                        : rec.status === 'rejected'
                        ? 'Failed'
                        : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{rec.customerName}</div>
                      <div className="text-slate-500 font-mono tabular-nums">{rec.customerPhone}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-slate-900 tabular-nums">৳{rec.amount.toLocaleString()}</div>
                      <div className="text-slate-500">{rec.providerName}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1">
                    <span>
                      TrxID: <strong className="font-mono text-slate-900">{rec.transactionReference}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReceiptRecord(rec)}
                      className="text-slate-700 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt size={12} /> Receipt
                    </button>
                  </div>
                  {rec.source === 'submission' && rec.status === 'pending_verification' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void onReviewSubmission(rec.id, 'approved')}
                        className="py-2 bg-emerald-600 text-white font-semibold rounded-lg text-xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(rec.id)}
                        className="py-2 bg-white border border-red-200 text-red-600 font-semibold rounded-lg text-xs cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs bg-slate-50/40">
                <span className="text-slate-500 tabular-nums">
                  Page {safePage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium disabled:opacity-40 cursor-pointer"
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
          <div className="m-4 p-4 bg-red-50/70 rounded-xl border border-red-200 space-y-3">
            <h4 className="font-semibold text-xs text-red-700">Reason for Payment Rejection</h4>
            <input
              type="text"
              placeholder="e.g. Transaction ID was not found in statement"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#D71920]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-3.5 py-1.5 bg-white text-xs font-medium rounded-lg border border-slate-200 cursor-pointer"
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
                className="px-4 py-1.5 bg-[#D71920] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Payment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record New Payment</h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePaymentSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Order ID *</label>
                  <input
                    type="text"
                    required
                    value={newOrderId}
                    onChange={e => setNewOrderId(e.target.value)}
                    placeholder="MRB-123456"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gateway *</label>
                  <select
                    value={newProviderName}
                    onChange={e => setNewProviderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
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
                  <label className="block font-medium text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">TrxID *</label>
                  <input
                    type="text"
                    required
                    value={newTrxId}
                    onChange={e => setNewTrxId(e.target.value)}
                    placeholder="8J2K9901"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sender Number</label>
                  <input
                    type="text"
                    value={newSenderAcc}
                    onChange={e => setNewSenderAcc(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={newPayStatus}
                    onChange={e => setNewPayStatus(e.target.value as 'pending_verification' | 'approved')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="approved">Verified</option>
                    <option value="pending_verification">Pending Verification</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPayment}
                  className="px-4 py-2 rounded-lg bg-[#D71920] hover:bg-[#B9151B] text-white font-semibold cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Transaction Receipt · #{receiptRecord.orderId}
              </h3>
              <button
                type="button"
                onClick={() => setReceiptRecord(null)}
                aria-label="Close receipt"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Customer</span>
                <span className="font-semibold text-slate-900">{receiptRecord.customerName}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Gateway</span>
                <span className="font-semibold text-slate-900">{receiptRecord.providerName}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">TrxID</span>
                <span className="font-mono font-semibold text-slate-900">{receiptRecord.transactionReference}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-emerald-700 tabular-nums">৳{receiptRecord.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
