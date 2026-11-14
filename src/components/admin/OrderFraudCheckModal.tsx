import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Phone,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Order, StoreSettings } from '../../types';
import { buildCustomerOrderHistorySummary } from '../../utils/adminOrderAndPaymentHelpers';
import {
  SteadfastFraudCheckReport,
  checkCustomerFraudByPhone,
  getDefaultCourierProvider,
} from '../../utils/steadfastCourierService';

interface OrderFraudCheckModalProps {
  order: Order;
  orders: Order[];
  settings?: Partial<StoreSettings> | null;
  onOpenFullFraudChecker?: (phone: string) => void;
  onClose: () => void;
}

export function OrderFraudCheckModal({
  order,
  orders,
  settings,
  onOpenFullFraudChecker,
  onClose,
}: OrderFraudCheckModalProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SteadfastFraudCheckReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const historySummary = useMemo(
    () => buildCustomerOrderHistorySummary(order.phone, orders),
    [order.phone, orders]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMsg(null);
    const provider = getDefaultCourierProvider(settings);
    checkCustomerFraudByPhone(provider, order.phone, orders)
      .then(res => {
        if (!active) return;
        setReport(res);
      })
      .catch(err => {
        if (!active) return;
        setErrorMsg(err?.message || 'Could not fetch courier fraud score.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [order.phone, orders, settings]);

  const riskSignal = report?.riskSignal || (historySummary.cancelledCount >= 2 ? 'high_risk' : historySummary.cancelledCount === 1 ? 'moderate' : historySummary.deliveredCount > 0 ? 'trusted' : 'unknown_new');

  const riskToneClass =
    riskSignal === 'high_risk'
      ? 'bg-red-50 text-red-700 border-red-200'
      : riskSignal === 'moderate'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : riskSignal === 'trusted'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  const deliveryDisplay =
    report?.delivery_ratio !== null && report?.delivery_ratio !== undefined
      ? `${report.delivery_ratio}%`
      : historySummary.successRatePercent !== null
      ? `${historySummary.successRatePercent}%`
      : 'New';

  const cancelDisplay =
    report?.cancellation_ratio !== null && report?.cancellation_ratio !== undefined
      ? `${report.cancellation_ratio}%`
      : historySummary.cancellationRatePercent !== null
      ? `${historySummary.cancellationRatePercent}%`
      : '0%';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Fraud Check for ${order.customerName}`}
      data-testid="order-fraud-check-modal"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">Customer Fraud &amp; Order Check</h3>
              <span className="text-xs font-medium text-slate-500">
                · {historySummary.customerRankLabel}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 flex-wrap">
              <span className="font-semibold text-slate-900">{order.customerName}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-800 tabular-nums">
                <Phone size={12} className="text-slate-400" />
                {order.phone}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-500">Order #{order.id}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close fraud check modal"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Risk Verdict Strip */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {riskSignal === 'high_risk' ? (
                  <ShieldAlert size={16} className="text-red-600 shrink-0" />
                ) : riskSignal === 'moderate' ? (
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                ) : riskSignal === 'trusted' ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <ShieldCheck size={16} className="text-slate-600 shrink-0" />
                )}
                <span className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${riskToneClass}`}>
                  {loading ? 'Checking courier history...' : report?.riskLabel || 'Store History Summary'}
                </span>
              </div>
              {!loading && report && (
                <span className="text-[11px] font-medium text-slate-500">
                  {report.mode === 'live' ? 'Steadfast Packzy Live API' : 'Store Order Intelligence'}
                </span>
              )}
            </div>

            {errorMsg ? (
              <p className="text-xs text-amber-700">{errorMsg} Showing store order records below.</p>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                {loading
                  ? 'Evaluating delivery success ratio, cancellations, and previous orders placed with this phone number...'
                  : report?.riskSummary}
              </p>
            )}
          </div>

          {/* 4-Column Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <div className="text-[11px] font-medium text-slate-500">Total Store Orders</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {historySummary.totalOrders}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {historySummary.isFirstTimeCustomer ? '1st Time Buyer' : 'Repeat Buyer'}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <div className="text-[11px] font-medium text-slate-500">Success Ratio</div>
              <div className="text-xl font-bold text-emerald-700 tabular-nums mt-0.5">
                {deliveryDisplay}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                {report?.delivered_count ?? historySummary.deliveredCount} delivered
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <div className="text-[11px] font-medium text-slate-500">Cancellation Rate</div>
              <div
                className={`text-xl font-bold tabular-nums mt-0.5 ${
                  historySummary.cancelledCount > 0 ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                {cancelDisplay}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                {report?.cancelled_count ?? historySummary.cancelledCount} cancelled
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <div className="text-[11px] font-medium text-slate-500">Fraud Reports</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {report?.total_reports ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                ৳{historySummary.totalSpent.toLocaleString()} spent
              </div>
            </div>
          </div>

          {/* Complete Order History List for This Phone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-800">
                Customer Order History ({historySummary.orders.length})
              </h4>
              <span className="text-[11px] text-slate-500 tabular-nums">
                Active in-flight: {historySummary.inFlightCount}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {historySummary.orders.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No previous orders found for this mobile number.
                </div>
              ) : (
                historySummary.orders.map((entry, idx) => {
                  const isCurrent = entry.id === order.id;
                  const dt = new Date(entry.createdAt);
                  const dateLabel = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                  return (
                    <div
                      key={entry.id}
                      className={`px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs ${
                        isCurrent ? 'bg-slate-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          #{historySummary.orders.length - idx}
                        </span>
                        <span className="font-mono font-semibold text-slate-900">#{entry.id}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[10px] font-semibold">
                            Current
                          </span>
                        )}
                        <span className="text-slate-400" aria-hidden="true">·</span>
                        <span className="text-slate-500 tabular-nums">{dateLabel}</span>
                        <span className="text-slate-400" aria-hidden="true">·</span>
                        <span className="text-slate-600 tabular-nums">{entry.itemsCount} item(s)</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-slate-900 tabular-nums">
                          ৳{entry.total.toLocaleString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                            entry.orderStatus === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700'
                              : entry.orderStatus === 'cancelled'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {entry.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
          {onOpenFullFraudChecker ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullFraudChecker(order.phone);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ExternalLink size={12} />
              <span>Open Full Courier Fraud Tab</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
