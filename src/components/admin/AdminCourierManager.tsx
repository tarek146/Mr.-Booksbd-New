import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Send,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Search,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  Settings,
  Phone,
  Package,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Order, StoreSettings, CourierProviderConfig } from '../../types';
import {
  resolveCourierProviders,
  getActiveCourierProviders,
  getDefaultCourierProvider,
  calculateOrderCodAmount,
  detectCourierDeliveryType,
  getCourierStatusBadgeMeta,
  computeCourierDashboardMetrics,
  transferOrderToCourier,
  bulkTransferOrdersToCourier,
  syncCourierOrderStatus,
  checkCustomerFraudByPhone,
  steadfastGetBalance,
  steadfastPing,
  STEADFAST_DEFAULT_BASE_URL,
  SteadfastFraudCheckReport,
} from '../../utils/steadfastCourierService';

interface AdminCourierManagerProps {
  orders: Order[];
  settings: StoreSettings;
  onUpdateOrderTracking: (orderId: string, data: Partial<Order>) => Promise<void>;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  setToast: (t: { show: boolean; type: 'success' | 'error'; message: string }) => void;
  initialSubTab?: 'dashboard' | 'transfer' | 'fraud' | 'settings';
  initialFraudPhone?: string;
}

export function AdminCourierManager({
  orders,
  settings,
  onUpdateOrderTracking,
  onUpdateSettings,
  setToast,
  initialSubTab = 'dashboard',
  initialFraudPhone = '',
}: AdminCourierManagerProps) {
  const [subTab, setSubTab] = useState<'dashboard' | 'transfer' | 'fraud' | 'settings'>(initialSubTab);

  const allCouriers = useMemo(() => resolveCourierProviders(settings), [settings]);
  const activeCouriers = useMemo(() => getActiveCourierProviders(settings), [settings]);
  const defaultCourier = useMemo(() => getDefaultCourierProvider(settings), [settings]);

  const metrics = useMemo(() => computeCourierDashboardMetrics(orders), [orders]);

  // Live Steadfast balance & ping state
  const [liveBalance, setLiveBalance] = useState<{
    balance: number | null;
    mode: 'live' | 'sandbox';
    errorMessage?: string;
  } | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [pingStatus, setPingStatus] = useState<{ mode: 'live' | 'sandbox'; message: string } | null>(null);

  // Order Transfer & Sync state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unsent' | 'sent' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [selectedCourierByOrder, setSelectedCourierByOrder] = useState<Record<string, string>>({});
  const [customCodByOrder, setCustomCodByOrder] = useState<Record<string, number>>({});
  const [customDeliveryTypeByOrder, setCustomDeliveryTypeByOrder] = useState<Record<string, 0 | 1>>({});
  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fraud Checker state
  const [fraudPhoneInput, setFraudPhoneInput] = useState(initialFraudPhone || '');
  const [fraudLoading, setFraudLoading] = useState(false);
  const [fraudResult, setFraudResult] = useState<SteadfastFraudCheckReport | null>(null);

  // Multi-Courier & Steadfast Settings state
  const [couriersDraft, setCouriersDraft] = useState<CourierProviderConfig[]>(() => resolveCourierProviders(settings));
  const [defaultCourierIdDraft, setDefaultCourierIdDraft] = useState<string>(
    settings.defaultCourierId || defaultCourier.id || 'steadfast'
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // New Custom Courier Form state
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierType, setNewCourierType] = useState<CourierProviderConfig['providerType']>('custom');
  const [newCourierTrackingTemplate, setNewCourierTrackingTemplate] = useState('');

  useEffect(() => {
    setCouriersDraft(resolveCourierProviders(settings));
    setDefaultCourierIdDraft(settings.defaultCourierId || getDefaultCourierProvider(settings).id);
  }, [settings]);

  const steadfastConfig = useMemo(
    () => allCouriers.find(c => c.providerType === 'steadfast' || c.id === 'steadfast') || defaultCourier,
    [allCouriers, defaultCourier]
  );

  // Sync external initialFraudPhone if triggered from Orders tab
  useEffect(() => {
    if (initialFraudPhone) {
      setFraudPhoneInput(initialFraudPhone);
      setSubTab('fraud');
      void handleRunFraudCheck(initialFraudPhone);
    }
  }, [initialFraudPhone]);

  const handleCheckBalanceAndPing = async () => {
    setLoadingBalance(true);
    try {
      const [bal, ping] = await Promise.all([
        steadfastGetBalance(steadfastConfig, orders),
        steadfastPing(steadfastConfig),
      ]);
      setLiveBalance({
        balance: bal.current_balance,
        mode: bal.mode,
        errorMessage: bal.errorMessage,
      });
      setPingStatus({ mode: ping.mode, message: ping.message });
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: err?.message || 'Could not check Steadfast status.' });
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    void handleCheckBalanceAndPing();
  }, [steadfastConfig.apiKey, steadfastConfig.secretKey, orders.length]);

  const activeOrders = useMemo(() => orders.filter(o => !o.isTrashed), [orders]);

  const filteredOrders = useMemo(() => {
    return activeOrders.filter(order => {
      const hasCourier = Boolean(order.consignmentId || order.trackingCode || order.courierDeliveryStatus);
      const rawStatus = (order.courierDeliveryStatus || '').toLowerCase();

      if (filterMode === 'unsent' && hasCourier) return false;
      if (filterMode === 'sent' && !hasCourier) return false;
      if (filterMode === 'delivered') {
        const isDel = rawStatus === 'delivered' || rawStatus === 'partial_delivered' || order.orderStatus === 'delivered';
        if (!isDel) return false;
      }
      if (filterMode === 'cancelled') {
        const isCan = rawStatus === 'cancelled' || order.orderStatus === 'cancelled';
        if (!isCan) return false;
      }
      if (filterMode === 'pending') {
        if (!hasCourier) return false;
        const isFinal =
          rawStatus === 'delivered' ||
          rawStatus === 'partial_delivered' ||
          rawStatus === 'cancelled' ||
          order.orderStatus === 'delivered' ||
          order.orderStatus === 'cancelled';
        if (isFinal) return false;
      }

      if (courierFilter !== 'all') {
        const cId = (order.courierId || order.courierName || '').toLowerCase();
        if (!cId.includes(courierFilter.toLowerCase())) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchId = order.id.toLowerCase().includes(q);
        const matchName = (order.customerName || '').toLowerCase().includes(q);
        const matchPhone = (order.phone || '').toLowerCase().includes(q);
        const matchTrack = String(order.trackingCode || '').toLowerCase().includes(q);
        const matchCid = String(order.consignmentId || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchPhone && !matchTrack && !matchCid) return false;
      }

      return true;
    });
  }, [activeOrders, filterMode, courierFilter, searchQuery]);

  const handleCopy = (text: string, label: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 1500);
    setToast({ show: true, type: 'success', message: `${label} copied!` });
  };

  // 1. One-Click Order Transfer
  const handleOneClickTransfer = async (order: Order) => {
    const chosenCourierId = selectedCourierByOrder[order.id] || order.courierId || defaultCourier.id;
    const provider = allCouriers.find(c => c.id === chosenCourierId) || defaultCourier;
    const codAmount =
      customCodByOrder[order.id] !== undefined
        ? customCodByOrder[order.id]
        : calculateOrderCodAmount(order);
    const deliveryType =
      customDeliveryTypeByOrder[order.id] !== undefined
        ? customDeliveryTypeByOrder[order.id]
        : detectCourierDeliveryType(order);

    setSendingOrderId(order.id);
    try {
      const result = await transferOrderToCourier(provider, order, {
        codAmount,
        deliveryType,
      });

      await onUpdateOrderTracking(order.id, {
        courierId: provider.id,
        courierName: provider.name,
        consignmentId: result.consignmentId,
        trackingCode: result.trackingCode,
        trackingUrl: result.trackingLink,
        courierDeliveryStatus: result.status,
        courierCodAmount: result.codAmount,
        courierDeliveryType: result.deliveryType,
        courierSentAt: Date.now(),
        courierLastSyncedAt: Date.now(),
        orderStatus: order.orderStatus === 'pending' ? 'shipped' : order.orderStatus,
        courierTrackingSteps: result.trackingSteps,
      });

      setToast({
        show: true,
        type: 'success',
        message: result.message,
      });
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: err?.message || 'Failed to transfer order to courier.',
      });
    } finally {
      setSendingOrderId(null);
    }
  };

  // Bulk Transfer Unsent Confirmed/Pending Orders
  const handleBulkTransferUnsent = async () => {
    const unsentOrders = activeOrders.filter(
      o =>
        !o.consignmentId &&
        !o.trackingCode &&
        o.orderStatus !== 'cancelled' &&
        o.orderStatus !== 'delivered'
    );

    if (unsentOrders.length === 0) {
      setToast({
        show: true,
        type: 'error',
        message: 'No unsent active orders available for bulk transfer.',
      });
      return;
    }

    setBulkSending(true);
    try {
      const batch = unsentOrders.slice(0, 50);
      const res = await bulkTransferOrdersToCourier(defaultCourier, batch);

      for (const r of res.results) {
        if (r.success && r.result) {
          await onUpdateOrderTracking(r.orderId, {
            courierId: defaultCourier.id,
            courierName: defaultCourier.name,
            consignmentId: r.result.consignmentId,
            trackingCode: r.result.trackingCode,
            trackingUrl: r.result.trackingLink,
            courierDeliveryStatus: r.result.status,
            courierCodAmount: r.result.codAmount,
            courierDeliveryType: r.result.deliveryType,
            courierSentAt: Date.now(),
            courierLastSyncedAt: Date.now(),
            orderStatus: 'shipped',
            courierTrackingSteps: r.result.trackingSteps,
          });
        }
      }

      setToast({
        show: true,
        type: res.successCount > 0 ? 'success' : 'error',
        message: `Bulk Transfer complete: ${res.successCount} sent to ${defaultCourier.name}${
          res.failedCount > 0 ? `, ${res.failedCount} failed` : ''
        }.`,
      });
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: err?.message || 'Bulk transfer failed.',
      });
    } finally {
      setBulkSending(false);
    }
  };

  // 6. Order Sync (Single Order)
  const handleSyncSingleOrder = async (order: Order) => {
    const provider =
      allCouriers.find(c => c.id === order.courierId || c.name === order.courierName) ||
      defaultCourier;

    setSyncingOrderId(order.id);
    try {
      const res = await syncCourierOrderStatus(provider, order);

      const patch: Partial<Order> = {
        courierDeliveryStatus: res.deliveryStatus,
        courierLastSyncedAt: Date.now(),
        orderStatus: res.orderStatus,
        paymentStatus: res.paymentStatus,
        ...(res.trackingSteps.length > 0 ? { courierTrackingSteps: res.trackingSteps } : {}),
      };

      await onUpdateOrderTracking(order.id, patch);
      setToast({
        show: true,
        type: 'success',
        message: `Order #${order.id} synced: ${res.deliveryStatus.toUpperCase()}`,
      });
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: err?.message || 'Failed to sync courier status.',
      });
    } finally {
      setSyncingOrderId(null);
    }
  };

  // 6. Order Sync (All Sent Orders)
  const handleSyncAllCourierOrders = async () => {
    const sentOrders = activeOrders.filter(
      o => (o.consignmentId || o.trackingCode) && o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
    );
    if (sentOrders.length === 0) {
      setToast({
        show: true,
        type: 'success',
        message: 'All active courier parcels are already synced.',
      });
      return;
    }

    setSyncingAll(true);
    let syncedCount = 0;
    try {
      for (const order of sentOrders) {
        const provider =
          allCouriers.find(c => c.id === order.courierId || c.name === order.courierName) ||
          defaultCourier;
        const res = await syncCourierOrderStatus(provider, order);
        syncedCount += 1;
        await onUpdateOrderTracking(order.id, {
          courierDeliveryStatus: res.deliveryStatus,
          courierLastSyncedAt: Date.now(),
          orderStatus: res.orderStatus,
          paymentStatus: res.paymentStatus,
          ...(res.trackingSteps.length > 0 ? { courierTrackingSteps: res.trackingSteps } : {}),
        });
      }
      setToast({
        show: true,
        type: 'success',
        message: `Synced live delivery status for ${syncedCount} courier parcel(s).`,
      });
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: err?.message || 'Batch courier sync encountered an error.',
      });
    } finally {
      setSyncingAll(false);
    }
  };

  // 3. Fraud Checker
  const handleRunFraudCheck = async (phoneOverride?: string) => {
    const targetPhone = (phoneOverride ?? fraudPhoneInput).trim();
    if (!targetPhone) {
      setToast({ show: true, type: 'error', message: 'Please enter a valid 11-digit mobile number (01XXXXXXXXX).' });
      return;
    }
    setFraudLoading(true);
    try {
      const res = await checkCustomerFraudByPhone(steadfastConfig, targetPhone, orders);
      setFraudResult(res);
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: err?.message || 'Fraud check failed.' });
    } finally {
      setFraudLoading(false);
    }
  };

  // 7. Save Multiple Courier & Steadfast Settings to Firebase
  const handleSaveCourierSettings = async () => {
    setSavingSettings(true);
    try {
      const sfProvider = couriersDraft.find(c => c.providerType === 'steadfast' || c.id === 'steadfast');
      const normalizedProviders = couriersDraft.map(c => ({
        ...c,
        isDefault: c.id === defaultCourierIdDraft,
      }));

      await onUpdateSettings({
        courierProviders: normalizedProviders,
        defaultCourierId: defaultCourierIdDraft,
        steadfastApiKey: sfProvider?.apiKey || '',
        steadfastSecretKey: sfProvider?.secretKey || '',
        steadfastBaseUrl: sfProvider?.baseUrl || STEADFAST_DEFAULT_BASE_URL,
        steadfastSandboxMode: sfProvider?.sandboxMode ?? true,
      });

      setToast({
        show: true,
        type: 'success',
        message: 'Steadfast API & Multi-Courier settings saved to Firebase!',
      });
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: err?.message || 'Failed to save courier settings.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCustomCourier = () => {
    const name = newCourierName.trim();
    if (!name) {
      setToast({ show: true, type: 'error', message: 'Please enter a courier name.' });
      return;
    }
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-3);
    const created: CourierProviderConfig = {
      id,
      name,
      providerType: newCourierType,
      isActive: true,
      isDefault: false,
      apiKey: '',
      secretKey: '',
      baseUrl: STEADFAST_DEFAULT_BASE_URL,
      sandboxMode: true,
      trackingUrlTemplate:
        newCourierTrackingTemplate.trim() || `https://steadfast.com.bd/t/{tracking_code}`,
    };
    setCouriersDraft(prev => [...prev, created]);
    setNewCourierName('');
    setNewCourierTrackingTemplate('');
    setToast({ show: true, type: 'success', message: `${name} added! Click "Save Courier Settings" to persist.` });
  };

  const totalPendingInTransit =
    metrics.inReviewCount + metrics.pendingInTransitCount + metrics.holdCount + metrics.approvalPendingCount;
  const totalPendingCod =
    metrics.inReviewCod + metrics.pendingInTransitCod + metrics.holdCod + metrics.approvalPendingCod;

  return (
    <div className="space-y-6" data-testid="admin-courier-manager">
      {/* Top Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Steadfast &amp; Multi-Courier Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Packzy API v1 Ready
              </span>
              {pingStatus && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1 ${
                    pingStatus.mode === 'live'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      pingStatus.mode === 'live' ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                  />
                  {pingStatus.mode === 'live' ? 'Live API Online' : 'Smart Sandbox Active'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              1-Click Order Transfer · Automatic Tracking · Customer Fraud Checker · COD Management · Multi-Courier Sync
            </p>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
          {[
            { id: 'dashboard', label: 'Courier Dashboard', icon: Activity },
            { id: 'transfer', label: `Order Transfer (${activeOrders.length})`, icon: Send },
            { id: 'fraud', label: 'Fraud Checker', icon: ShieldAlert },
            { id: 'settings', label: `Couriers & API (${activeCouriers.length})`, icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`courier-subtab-${tab.id}`}
                onClick={() => setSubTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={14} className={active ? 'text-[#D71920]' : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUB-TAB 1: COURIER DASHBOARD (4. Courier Dashboard + 5. COD + 6. Sync) */}
      {/* ===================================================================== */}
      {subTab === 'dashboard' && (
        <div className="space-y-5">
          {/* Quick Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <DollarSign size={15} className="text-emerald-700" />
                <div className="text-xs">
                  <span className="text-emerald-700 font-semibold">Steadfast Balance: </span>
                  <span className="font-black text-emerald-900 tabular-nums" data-testid="steadfast-balance-value">
                    {loadingBalance
                      ? 'Checking...'
                      : liveBalance && liveBalance.balance !== null
                      ? `৳${liveBalance.balance.toLocaleString()}`
                      : '৳0'}
                  </span>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                Default Courier: <strong className="text-slate-900">{defaultCourier.name}</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCheckBalanceAndPing}
                disabled={loadingBalance}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} className={loadingBalance ? 'animate-spin' : ''} />
                <span>Check Balance</span>
              </button>

              <button
                type="button"
                data-testid="sync-all-courier-btn"
                onClick={handleSyncAllCourierOrders}
                disabled={syncingAll}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={13} className={syncingAll ? 'animate-spin' : ''} />
                <span>{syncingAll ? 'Syncing Parcels...' : 'Sync All Statuses'}</span>
              </button>

              <button
                type="button"
                data-testid="bulk-transfer-unsent-btn"
                onClick={handleBulkTransferUnsent}
                disabled={bulkSending}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Send size={13} />
                <span>
                  {bulkSending
                    ? 'Sending Bulk...'
                    : `1-Click Bulk Send (${metrics.unsentReadyCount})`}
                </span>
              </button>
            </div>
          </div>

          {/* 4 Main Courier Parcel KPI Cards: মোট পাঠানো, Delivered, Pending/In Review, Cancelled */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              data-testid="courier-kpi-total-sent"
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  মোট পাঠানো (Total Sent)
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {metrics.totalSent}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Unsent Ready: <strong className="text-amber-700">{metrics.unsentReadyCount}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('unsent');
                    setSubTab('transfer');
                  }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Send Now →
                </button>
              </div>
            </div>

            <div
              data-testid="courier-kpi-delivered"
              className="bg-white border border-emerald-200 rounded-2xl p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Delivered (ডেলিভারড)
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums">
                {metrics.deliveredCount}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Success Rate: <strong className="text-emerald-700">{metrics.successRate}%</strong></span>
                <span>Partial: {metrics.partialCount}</span>
              </div>
            </div>

            <div
              data-testid="courier-kpi-pending"
              className="bg-white border border-amber-200 rounded-2xl p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Pending &amp; In Transit
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 tabular-nums">
                {totalPendingInTransit}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>In Review: <strong>{metrics.inReviewCount}</strong></span>
                <span>Hold: <strong>{metrics.holdCount}</strong> · Approval: <strong>{metrics.approvalPendingCount}</strong></span>
              </div>
            </div>

            <div
              data-testid="courier-kpi-cancelled"
              className="bg-white border border-red-200 rounded-2xl p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                  Cancelled (বাতিল)
                </span>
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <XCircle size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-red-600 tabular-nums">
                {metrics.cancelledCount}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Cancel Rate: <strong className="text-red-600">{metrics.cancelRate}%</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('cancelled');
                    setSubTab('transfer');
                  }}
                  className="text-red-600 font-bold hover:underline cursor-pointer"
                >
                  View →
                </button>
              </div>
            </div>
          </div>

          {/* COD Management & Multi-Courier Distribution Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 5. COD Management Summary */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    COD Management (ক্যাশ অন ডেলিভারি হিসাব)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatic collectible COD calculation &amp; settlement tracking across courier parcels
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  Auto COD Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Total Dispatched COD
                  </span>
                  <span className="text-lg font-black text-slate-900 tabular-nums mt-0.5 block">
                    ৳{metrics.totalDispatchedCod.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[11px] font-semibold text-emerald-700 block">
                    Collected COD (Delivered)
                  </span>
                  <span className="text-lg font-black text-emerald-800 tabular-nums mt-0.5 block">
                    ৳{(metrics.deliveredCod + metrics.partialCod).toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[11px] font-semibold text-amber-800 block">
                    Pending COD in Transit
                  </span>
                  <span className="text-lg font-black text-amber-900 tabular-nums mt-0.5 block">
                    ৳{totalPendingCod.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <span>
                  <strong>Rule:</strong> Paid orders automatically send <code className="font-mono font-bold text-slate-800">cod_amount = ৳0</code>; Unpaid/COD orders send <code className="font-mono font-bold text-slate-800">cod_amount = Order Total</code>.
                </span>
                <button
                  type="button"
                  onClick={() => setSubTab('transfer')}
                  className="text-[#D71920] font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  Manage COD →
                </button>
              </div>
            </div>

            {/* 7. Multi-Courier Distribution */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Multi-Courier Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parcels by courier service provider
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubTab('settings')}
                  className="text-xs font-bold text-[#D71920] hover:underline cursor-pointer"
                >
                  + Add / Configure
                </button>
              </div>

              <div className="space-y-2.5">
                {metrics.byCourier.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200/70">
                    No orders dispatched to a courier yet. Use <strong>1-Click Send</strong> to dispatch your first parcel.
                  </div>
                ) : (
                  metrics.byCourier.map(stat => (
                    <div
                      key={stat.courierName}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{stat.courierName}</div>
                        <div className="text-[11px] text-slate-500">
                          COD Dispatched: ৳{stat.codTotal.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Total: {stat.total}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Delivered: {stat.delivered}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Pending: {stat.pending}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: ONE-CLICK ORDER TRANSFER & AUTOMATIC TRACKING & SYNC        */}
      {/* ===================================================================== */}
      {subTab === 'transfer' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: `All (${activeOrders.length})` },
                { id: 'unsent', label: `Not Sent (${metrics.unsentReadyCount})` },
                { id: 'sent', label: `Sent (${metrics.totalSent})` },
                { id: 'pending', label: `Pending (${totalPendingInTransit})` },
                { id: 'delivered', label: `Delivered (${metrics.deliveredCount})` },
                { id: 'cancelled', label: `Cancelled (${metrics.cancelledCount})` },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    filterMode === f.id
                      ? 'bg-[#D71920] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={courierFilter}
                onChange={e => setCourierFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#D71920]"
              >
                <option value="all">All Couriers</option>
                {allCouriers.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Order #, Phone, Tracking..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </div>
          </div>

          {/* Orders Courier Transfer List */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                <Package size={32} className="mx-auto text-slate-300" />
                <div className="text-sm font-bold text-slate-800">No Matching Orders</div>
                <p className="text-xs text-slate-500">
                  Try switching the filter tab or clearing your search query.
                </p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isSent = Boolean(order.consignmentId || order.trackingCode);
                const statusBadge = getCourierStatusBadgeMeta(order.courierDeliveryStatus);
                const selectedCourierId =
                  selectedCourierByOrder[order.id] || order.courierId || defaultCourier.id;
                const codVal =
                  customCodByOrder[order.id] !== undefined
                    ? customCodByOrder[order.id]
                    : order.courierCodAmount !== undefined
                    ? order.courierCodAmount
                    : calculateOrderCodAmount(order);
                const delivType =
                  customDeliveryTypeByOrder[order.id] !== undefined
                    ? customDeliveryTypeByOrder[order.id]
                    : order.courierDeliveryType !== undefined
                    ? order.courierDeliveryType
                    : detectCourierDeliveryType(order);

                return (
                  <div
                    key={order.id}
                    data-testid={`courier-order-row-${order.id}`}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Col 1: Order & Customer Info (4 cols) */}
                      <div className="lg:col-span-4 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                            #{order.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold uppercase">
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                              order.paymentStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {order.paymentMethodName || 'COD'} ({order.paymentStatus})
                          </span>
                        </div>

                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                          <span>{order.customerName}</span>
                          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {order.phone}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setFraudPhoneInput(order.phone);
                              setSubTab('fraud');
                              void handleRunFraudCheck(order.phone);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            title="Check Customer Courier Fraud Score"
                          >
                            <ShieldAlert size={11} />
                            <span>Fraud Check</span>
                          </button>
                        </div>

                        <div className="text-xs text-slate-500 truncate">
                          📍 {[order.address, order.city, order.district].filter(Boolean).join(', ')}
                        </div>
                      </div>

                      {/* Col 2: COD Management & Delivery Type (3 cols) */}
                      <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">
                            COD Collectible (৳)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={1000000}
                            value={codVal}
                            onChange={e =>
                              setCustomCodByOrder(prev => ({
                                ...prev,
                                [order.id]: Math.max(0, Number(e.target.value) || 0),
                              }))
                            }
                            className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono font-black text-xs text-slate-900 focus:outline-none focus:border-[#D71920]"
                          />
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">
                            Delivery Type
                          </label>
                          <select
                            value={delivType}
                            onChange={e =>
                              setCustomDeliveryTypeByOrder(prev => ({
                                ...prev,
                                [order.id]: Number(e.target.value) === 1 ? 1 : 0,
                              }))
                            }
                            className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-[#D71920]"
                          >
                            <option value={0}>0 · Home Delivery</option>
                            <option value={1}>1 · Hub / Point Pickup</option>
                          </select>
                        </div>
                      </div>

                      {/* Col 3: Tracking ID & Courier Live Status (2. Automatic Tracking) (2 cols) */}
                      <div className="lg:col-span-2 space-y-1.5">
                        {isSent ? (
                          <>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border ${statusBadge.badgeClass}`}
                            >
                              {statusBadge.shortLabel}
                            </span>

                            <div className="text-[11px] font-mono text-slate-700 flex items-center gap-1">
                              <span className="truncate">
                                ID: <strong>{order.trackingCode || order.consignmentId}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(
                                    String(order.trackingCode || order.consignmentId || ''),
                                    'Tracking Code',
                                    `trk-${order.id}`
                                  )
                                }
                                className="text-slate-400 hover:text-slate-800 cursor-pointer"
                              >
                                {copiedKey === `trk-${order.id}` ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>

                            {order.trackingUrl && (
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D71920] hover:underline"
                              >
                                <span>Live Track</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                            Not Dispatched
                          </span>
                        )}
                      </div>

                      {/* Col 4: Courier Selector + 1-Click Send & Sync Buttons (3 cols) */}
                      <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center justify-end gap-2">
                        <select
                          value={selectedCourierId}
                          onChange={e =>
                            setSelectedCourierByOrder(prev => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          aria-label={`Select courier for ${order.id}`}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#D71920]"
                        >
                          {activeCouriers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        {!isSent ? (
                          <button
                            type="button"
                            data-testid={`one-click-send-${order.id}`}
                            disabled={sendingOrderId === order.id}
                            onClick={() => void handleOneClickTransfer(order)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 shrink-0"
                          >
                            <Send size={13} />
                            <span>
                              {sendingOrderId === order.id ? 'Sending...' : '1-Click Send'}
                            </span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              data-testid={`sync-order-status-${order.id}`}
                              disabled={syncingOrderId === order.id}
                              onClick={() => void handleSyncSingleOrder(order)}
                              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                              title="Sync Live Status from Courier"
                            >
                              <RefreshCw
                                size={12}
                                className={syncingOrderId === order.id ? 'animate-spin' : ''}
                              />
                              <span>Sync</span>
                            </button>

                            <button
                              type="button"
                              disabled={sendingOrderId === order.id}
                              onClick={() => void handleOneClickTransfer(order)}
                              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                              title="Re-send or transfer to another courier"
                            >
                              Re-Send
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step-by-step tracking timeline preview if available */}
                    {order.courierTrackingSteps && order.courierTrackingSteps.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-600">
                        <span className="font-bold text-slate-800 shrink-0">Latest Tracking:</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium truncate">
                          {order.courierTrackingSteps[0].text}
                        </span>
                        <span className="text-slate-400 shrink-0">
                          ({new Date(order.courierTrackingSteps[0].created_at).toLocaleString()})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 3: CUSTOMER FRAUD CHECKER (3. Fraud Checker)                  */}
      {/* ===================================================================== */}
      {subTab === 'fraud' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="max-w-2xl space-y-1">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#D71920]" />
                <span>Customer Courier Fraud &amp; Delivery History Checker</span>
              </h3>
              <p className="text-xs text-slate-500">
                Verify any customer&apos;s 11-digit mobile number (<code className="font-mono">01XXXXXXXXX</code>) against Steadfast Packzy <code className="font-mono">/fraud_check/score/&#123;phone&#125;</code> and your store&apos;s delivery history before dispatching COD parcels.
              </p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                void handleRunFraudCheck();
              }}
              className="flex flex-col sm:flex-row gap-2.5 max-w-xl"
            >
              <div className="relative flex-1">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  data-testid="fraud-check-phone-input"
                  value={fraudPhoneInput}
                  onChange={e => setFraudPhoneInput(e.target.value)}
                  placeholder="Enter 11-digit mobile number (e.g. 01712345678)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-[#D71920]"
                />
              </div>
              <button
                type="submit"
                data-testid="fraud-check-submit-btn"
                disabled={fraudLoading}
                className="px-5 py-2.5 rounded-xl bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Search size={14} />
                <span>{fraudLoading ? 'Checking...' : 'Check History'}</span>
              </button>
            </form>

            {/* Quick Phone Chips from Recent Orders */}
            {activeOrders.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Recent Customers:</span>
                {Array.from(new Set(activeOrders.map(o => o.phone).filter(Boolean)))
                  .slice(0, 6)
                  .map(ph => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => {
                        setFraudPhoneInput(ph);
                        void handleRunFraudCheck(ph);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                    >
                      {ph}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Fraud Check Result Display */}
          {fraudResult && (
            <div
              data-testid="fraud-check-result-card"
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-black text-slate-900">
                      {fraudResult.phone}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black border ${
                        fraudResult.riskSignal === 'high_risk'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : fraudResult.riskSignal === 'moderate'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : fraudResult.riskSignal === 'trusted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {fraudResult.riskLabel}
                    </span>
                    {fraudResult.mode === 'local_intelligence' && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10.5px] font-semibold">
                        Store History Intelligence
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{fraudResult.riskSummary}</p>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-500">
                  <div>
                    Volume Band:{' '}
                    <strong className="uppercase text-slate-900">
                      {fraudResult.volume_band || 'none'}
                    </strong>{' '}
                    ({fraudResult.volume_range || '0'} parcels)
                  </div>
                  <div>
                    Fraud Reports:{' '}
                    <strong
                      className={
                        fraudResult.total_reports > 0 ? 'text-red-600' : 'text-emerald-700'
                      }
                    >
                      {fraudResult.total_reports}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Ratio Progress & Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">
                    Delivery Success Ratio
                  </span>
                  <div className="text-2xl font-black text-emerald-800 tabular-nums mt-1">
                    {fraudResult.delivery_ratio !== null ? `${fraudResult.delivery_ratio}%` : 'New'}
                  </div>
                  <span className="text-[11px] text-emerald-700">
                    Delivered Parcels: <strong>{fraudResult.delivered_count ?? 0}</strong>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200">
                  <span className="text-[11px] font-bold text-red-700 uppercase">
                    Cancellation Ratio
                  </span>
                  <div className="text-2xl font-black text-red-700 tabular-nums mt-1">
                    {fraudResult.cancellation_ratio !== null
                      ? `${fraudResult.cancellation_ratio}%`
                      : '0%'}
                  </div>
                  <span className="text-[11px] text-red-700">
                    Cancelled Parcels: <strong>{fraudResult.cancelled_count ?? 0}</strong>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Parcel Volume Range
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-1 uppercase">
                    {fraudResult.volume_band || 'New'} ({fraudResult.volume_range || '0'})
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Store Orders: {fraudResult.localStoreOrdersCount} (In Flight: {fraudResult.in_flight_count})
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Fraud Reports Filed
                  </span>
                  <div className="text-2xl font-black text-slate-900 tabular-nums mt-1">
                    {fraudResult.total_reports}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {Object.keys(fraudResult.fraud_categories).length > 0
                      ? Object.entries(fraudResult.fraud_categories)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')
                      : 'No fraud categories reported'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 4: MULTIPLE COURIER SUPPORT & STEADFAST API SETTINGS          */}
      {/* ===================================================================== */}
      {subTab === 'settings' && (
        <div className="space-y-6">
          {/* Save Header Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Multi-Courier Providers &amp; Steadfast API Credentials
              </h3>
              <p className="text-xs text-slate-500">
                Configure Steadfast Packzy API v1 keys (<code className="font-mono">Api-Key</code> &amp; <code className="font-mono">Secret-Key</code>) and manage multiple courier services dynamically in Firebase.
              </p>
            </div>
            <button
              type="button"
              data-testid="save-courier-settings-btn"
              disabled={savingSettings}
              onClick={handleSaveCourierSettings}
              className="px-5 py-2.5 rounded-xl bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Check size={15} />
              <span>{savingSettings ? 'Saving to Firebase...' : 'Save Courier Settings'}</span>
            </button>
          </div>

          {/* Courier Provider Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {couriersDraft.map((courier, idx) => {
              const isDefault = defaultCourierIdDraft === courier.id;
              const showSecret = Boolean(showSecrets[courier.id]);

              const updateCourierField = (patch: Partial<CourierProviderConfig>) => {
                setCouriersDraft(prev =>
                  prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
                );
              };

              return (
                <div
                  key={courier.id}
                  data-testid={`courier-provider-card-${courier.id}`}
                  className={`bg-white border rounded-2xl p-5 space-y-4 shadow-2xs ${
                    courier.isActive ? 'border-slate-200' : 'border-slate-200/60 bg-slate-50/60 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                          courier.providerType === 'steadfast'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {courier.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-slate-900">{courier.name}</h4>
                          {isDefault && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 uppercase font-mono">
                          Type: {courier.providerType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isDefault && courier.isActive && (
                        <button
                          type="button"
                          onClick={() => setDefaultCourierIdDraft(courier.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          Set Default
                        </button>
                      )}

                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={courier.isActive}
                          onChange={e => updateCourierField({ isActive: e.target.checked })}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                        <span>{courier.isActive ? 'Active' : 'Off'}</span>
                      </label>

                      {courier.providerType === 'custom' && (
                        <button
                          type="button"
                          onClick={() =>
                            setCouriersDraft(prev => prev.filter(c => c.id !== courier.id))
                          }
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                          title="Remove custom courier"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* API Credentials Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                        API Key (<code className="font-mono">Api-Key</code>)
                      </label>
                      <input
                        type="text"
                        value={courier.apiKey || ''}
                        onChange={e => updateCourierField({ apiKey: e.target.value, sandboxMode: !e.target.value })}
                        placeholder="Enter Courier API Key"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#D71920]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                        Secret Key (<code className="font-mono">Secret-Key</code>)
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={courier.secretKey || ''}
                          onChange={e => updateCourierField({ secretKey: e.target.value })}
                          placeholder="Enter Secret Key"
                          className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#D71920]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowSecrets(prev => ({ ...prev, [courier.id]: !prev[courier.id] }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                        Base URL
                      </label>
                      <input
                        type="text"
                        value={courier.baseUrl || ''}
                        onChange={e => updateCourierField({ baseUrl: e.target.value })}
                        placeholder={STEADFAST_DEFAULT_BASE_URL}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-800 focus:outline-none focus:border-[#D71920]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                        Public Tracking Link Template
                      </label>
                      <input
                        type="text"
                        value={courier.trackingUrlTemplate || ''}
                        onChange={e => updateCourierField({ trackingUrlTemplate: e.target.value })}
                        placeholder="https://steadfast.com.bd/t/{tracking_code}"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-800 focus:outline-none focus:border-[#D71920]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Courier Provider Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Plus size={16} className="text-[#D71920]" />
              <span>Add Another Courier Service (Multiple Courier Support)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
              <div className="sm:col-span-4">
                <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                  Courier Name
                </label>
                <input
                  type="text"
                  value={newCourierName}
                  onChange={e => setNewCourierName(e.target.value)}
                  placeholder="e.g. eCourier / SA Paribahan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-[#D71920]"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                  Provider Type
                </label>
                <select
                  value={newCourierType}
                  onChange={e => setNewCourierType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-[#D71920]"
                >
                  <option value="custom">Custom Courier</option>
                  <option value="steadfast">Steadfast Compatible</option>
                  <option value="pathao">Pathao Courier</option>
                  <option value="redx">RedX Delivery</option>
                  <option value="sundarban">Sundarban Courier</option>
                  <option value="paperfly">Paperfly</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1">
                  Tracking URL Template
                </label>
                <input
                  type="text"
                  value={newCourierTrackingTemplate}
                  onChange={e => setNewCourierTrackingTemplate(e.target.value)}
                  placeholder="https://example.com/track/{tracking_code}"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900 focus:outline-none focus:border-[#D71920]"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddCustomCourier}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Courier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
