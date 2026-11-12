import React, { useState, useEffect, useMemo } from 'react';
import { StoreSettings } from '../../types';
import {
  calculateCapiHealthMetrics,
  trackFacebookConversionEvent,
  getCapiEventLogs,
  clearCapiEventLogs,
  validateFacebookCapiConnection,
  resolveDashboardHeaderCapiStatus,
  CapiConnectionValidationResult,
  CapiEventLogEntry,
  FacebookStandardEventName,
} from '../../utils/facebookCapiHelpers';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  Trash2,
  Play,
  Copy,
  Sparkles,
  Server,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface AdminConversionApiManagerProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

export function AdminConversionApiManager({
  settings,
  onUpdateSettings,
  onShowToast,
}: AdminConversionApiManagerProps) {
  const [pixelId, setPixelId] = useState(settings.facebookPixelId || '');
  const [capiToken, setCapiToken] = useState(settings.facebookCapiToken || '');
  const [capiEnabled, setCapiEnabled] = useState(settings.facebookCapiEnabled !== false);
  const [testEventCode, setTestEventCode] = useState(settings.facebookTestEventCode || '');
  const [testModeEnabled, setTestModeEnabled] = useState(Boolean(settings.facebookTestModeEnabled));
  const [capiVersion, setCapiVersion] = useState(settings.facebookCapiVersion || 'v19.0');
  const [domainVerification, setDomainVerification] = useState(settings.facebookDomainVerification || '');
  const [enableAdvancedMatching, setEnableAdvancedMatching] = useState(
    settings.facebookEnableAdvancedMatching !== false
  );

  // Event toggles
  const [trackPageView, setTrackPageView] = useState(settings.facebookTrackPageView !== false);
  const [trackViewContent, setTrackViewContent] = useState(settings.facebookTrackViewContent !== false);
  const [trackAddToCart, setTrackAddToCart] = useState(settings.facebookTrackAddToCart !== false);
  const [trackInitiateCheckout, setTrackInitiateCheckout] = useState(
    settings.facebookTrackInitiateCheckout !== false
  );
  const [trackAddPaymentInfo, setTrackAddPaymentInfo] = useState(
    settings.facebookTrackAddPaymentInfo !== false
  );
  const [trackPurchase, setTrackPurchase] = useState(settings.facebookTrackPurchase !== false);
  const [trackSearch, setTrackSearch] = useState(settings.facebookTrackSearch !== false);
  const [trackAddToWishlist, setTrackAddToWishlist] = useState(
    settings.facebookTrackAddToWishlist !== false
  );

  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validatingConnection, setValidatingConnection] = useState(false);
  const [lastValidationResult, setLastValidationResult] =
    useState<CapiConnectionValidationResult | null>(null);
  const [testingEvent, setTestingEvent] = useState<FacebookStandardEventName | null>(null);
  const [eventLogs, setEventLogs] = useState<CapiEventLogEntry[]>(() => getCapiEventLogs());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setPixelId(settings.facebookPixelId || '');
    setCapiToken(settings.facebookCapiToken || '');
    setCapiEnabled(settings.facebookCapiEnabled !== false);
    setTestEventCode(settings.facebookTestEventCode || '');
    setTestModeEnabled(Boolean(settings.facebookTestModeEnabled));
    setCapiVersion(settings.facebookCapiVersion || 'v19.0');
    setDomainVerification(settings.facebookDomainVerification || '');
    setEnableAdvancedMatching(settings.facebookEnableAdvancedMatching !== false);
    setTrackPageView(settings.facebookTrackPageView !== false);
    setTrackViewContent(settings.facebookTrackViewContent !== false);
    setTrackAddToCart(settings.facebookTrackAddToCart !== false);
    setTrackInitiateCheckout(settings.facebookTrackInitiateCheckout !== false);
    setTrackAddPaymentInfo(settings.facebookTrackAddPaymentInfo !== false);
    setTrackPurchase(settings.facebookTrackPurchase !== false);
    setTrackSearch(settings.facebookTrackSearch !== false);
    setTrackAddToWishlist(settings.facebookTrackAddToWishlist !== false);
  }, [settings]);

  const liveDraftSettings: Partial<StoreSettings> = useMemo(
    () => ({
      ...settings,
      facebookPixelId: pixelId.trim(),
      facebookCapiToken: capiToken.trim(),
      facebookCapiEnabled: capiEnabled,
      facebookTestEventCode: testEventCode.trim(),
      facebookTestModeEnabled: testModeEnabled,
      facebookCapiVersion: capiVersion,
      facebookDomainVerification: domainVerification.trim(),
      facebookEnableAdvancedMatching: enableAdvancedMatching,
      facebookTrackPageView: trackPageView,
      facebookTrackViewContent: trackViewContent,
      facebookTrackAddToCart: trackAddToCart,
      facebookTrackInitiateCheckout: trackInitiateCheckout,
      facebookTrackAddPaymentInfo: trackAddPaymentInfo,
      facebookTrackPurchase: trackPurchase,
      facebookTrackSearch: trackSearch,
      facebookTrackAddToWishlist: trackAddToWishlist,
    }),
    [
      settings,
      pixelId,
      capiToken,
      capiEnabled,
      testEventCode,
      testModeEnabled,
      capiVersion,
      domainVerification,
      enableAdvancedMatching,
      trackPageView,
      trackViewContent,
      trackAddToCart,
      trackInitiateCheckout,
      trackAddPaymentInfo,
      trackPurchase,
      trackSearch,
      trackAddToWishlist,
    ]
  );

  const metrics = useMemo(
    () =>
      calculateCapiHealthMetrics(liveDraftSettings, {
        email: settings.adminProfile?.email || 'customer@mrbooks.bd',
        phone: settings.callNumber || '01712345678',
        fullName: 'Tanvir Ahmed',
        city: 'Dhaka',
        state: 'Dhaka',
        zipCode: '1207',
        country: 'bd',
      }),
    [liveDraftSettings, settings.adminProfile?.email, settings.callNumber]
  );

  const headerConnectionState = useMemo(
    () => resolveDashboardHeaderCapiStatus(liveDraftSettings),
    [liveDraftSettings]
  );

  const handleValidateConnection = async () => {
    setValidatingConnection(true);
    try {
      const result = await validateFacebookCapiConnection(liveDraftSettings);
      setLastValidationResult(result);
      setEventLogs(getCapiEventLogs());
      await onUpdateSettings({
        facebookPixelId: pixelId.trim(),
        facebookCapiToken: capiToken.trim(),
        facebookCapiEnabled: capiEnabled,
        facebookTestEventCode: testEventCode.trim(),
        facebookTestModeEnabled: testModeEnabled,
        facebookCapiVersion: capiVersion,
        facebookDomainVerification: domainVerification.trim(),
        facebookEnableAdvancedMatching: enableAdvancedMatching,
        facebookConnectionStatus: result.status,
        facebookLastResponseCode: result.responseCode,
        facebookLastCheckedAt: result.checkedAt,
        facebookLastTraceId: result.fbtraceId || '',
        facebookLastValidationMessage: result.message,
      });
      if (result.isConnected) {
        onShowToast?.(
          `Connected! HTTP ${result.responseCode}: ${result.message}`,
          'success'
        );
      } else {
        onShowToast?.(
          `Disconnected (HTTP ${result.responseCode || 'ERR'}): ${result.message}`,
          'error'
        );
      }
    } catch (err: any) {
      onShowToast?.(err?.message || 'Failed to validate connection', 'error');
    } finally {
      setValidatingConnection(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validation = await validateFacebookCapiConnection(liveDraftSettings);
      setLastValidationResult(validation);
      setEventLogs(getCapiEventLogs());
      await onUpdateSettings({
        facebookPixelId: pixelId.trim(),
        facebookCapiToken: capiToken.trim(),
        facebookCapiEnabled: capiEnabled,
        facebookTestEventCode: testEventCode.trim(),
        facebookTestModeEnabled: testModeEnabled,
        facebookCapiVersion: capiVersion,
        facebookDomainVerification: domainVerification.trim(),
        facebookEnableAdvancedMatching: enableAdvancedMatching,
        facebookTrackPageView: trackPageView,
        facebookTrackViewContent: trackViewContent,
        facebookTrackAddToCart: trackAddToCart,
        facebookTrackInitiateCheckout: trackInitiateCheckout,
        facebookTrackAddPaymentInfo: trackAddPaymentInfo,
        facebookTrackPurchase: trackPurchase,
        facebookTrackSearch: trackSearch,
        facebookTrackAddToWishlist: trackAddToWishlist,
        facebookConnectionStatus: validation.status,
        facebookLastResponseCode: validation.responseCode,
        facebookLastCheckedAt: validation.checkedAt,
        facebookLastTraceId: validation.fbtraceId || '',
        facebookLastValidationMessage: validation.message,
      });
      onShowToast?.(
        `Saved & Verified (${validation.isConnected ? 'Connected' : 'Disconnected'} • HTTP ${validation.responseCode})`,
        validation.isConnected ? 'success' : 'error'
      );
    } catch (err: any) {
      onShowToast?.(err?.message || 'Failed to save Conversion API settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEvent = async (eventName: FacebookStandardEventName) => {
    setTestingEvent(eventName);
    try {
      const sampleCustomData =
        eventName === 'ViewContent'
          ? {
              content_name: 'Paradoxical Sajid 2 (Single Product Page Test)',
              content_category: 'Islamic Books',
              content_ids: ['prod-1'],
              content_type: 'product' as const,
              contents: [
                {
                  id: 'prod-1',
                  quantity: 1,
                  item_price: 350,
                  title: 'Paradoxical Sajid 2',
                  category: 'Islamic Books',
                  brand: 'Guardian Publications',
                  delivery_category: 'home_delivery' as const,
                },
              ],
              value: 350,
              currency: 'BDT',
              num_items: 1,
            }
          : eventName === 'InitiateCheckout'
            ? {
                content_name: 'Checkout Cart (2 Books)',
                content_category: 'Books & Stationery',
                content_ids: ['prod-1', 'prod-2'],
                content_type: 'product' as const,
                contents: [
                  { id: 'prod-1', quantity: 1, item_price: 350, delivery_category: 'home_delivery' as const },
                  { id: 'prod-2', quantity: 1, item_price: 320, delivery_category: 'home_delivery' as const },
                ],
                value: 730,
                shipping: 60,
                currency: 'BDT',
                num_items: 2,
              }
            : eventName === 'Purchase'
              ? {
                  order_id: `TEST-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                  content_name: 'Verified Book Order',
                  content_category: 'Books & Stationery',
                  content_ids: ['prod-1'],
                  content_type: 'product' as const,
                  contents: [
                    { id: 'prod-1', quantity: 1, item_price: 350, delivery_category: 'home_delivery' as const },
                  ],
                  value: 410,
                  shipping: 60,
                  currency: 'BDT',
                  num_items: 1,
                  status: 'completed',
                }
              : {
                  content_name: 'Storefront PageView',
                  currency: 'BDT',
                };

      const entry = await trackFacebookConversionEvent({
        eventName,
        settings: liveDraftSettings,
        customData: sampleCustomData,
        customerProfile: {
          fullName: 'Tanvir Ahmed',
          phone: '01712345678',
          email: settings.adminProfile?.email || 'customer@mrbooks.bd',
          city: 'Dhaka',
          state: 'Dhaka',
          zipCode: '1207',
          country: 'bd',
        },
        uniqueKey: `admin_test_${Date.now()}`,
        forceSend: true,
      });

      setEventLogs(getCapiEventLogs());
      if (entry) {
        const isOk =
          entry.capiResponseStatus === 'delivered' ||
          entry.capiResponseStatus === 'browser-only';
        await onUpdateSettings({
          facebookConnectionStatus: isOk ? 'connected' : 'disconnected',
          facebookLastResponseCode: entry.httpResponseCode ?? (isOk ? 200 : 400),
          facebookLastCheckedAt: Date.now(),
          facebookLastTraceId: entry.fbtraceId || '',
          facebookLastValidationMessage: isOk
            ? `${eventName} event accepted (HTTP ${entry.httpResponseCode || 200})`
            : entry.errorMessage || 'Data event rejected by endpoint',
        });
      }
      if (entry?.capiResponseStatus === 'delivered') {
        onShowToast?.(
          `${eventName} delivered to Meta CAPI & Browser Pixel! (HTTP ${entry.httpResponseCode || 200} • EMQ: ${entry.emqScore}/10)`,
          'success'
        );
      } else if (entry?.capiResponseStatus === 'error') {
        onShowToast?.(
          `${eventName} logged (HTTP ${entry.httpResponseCode || 400}: ${entry.errorMessage || 'Check Pixel ID / Token'})`,
          'error'
        );
      } else {
        onShowToast?.(
          `${eventName} test event dispatched with deduplicated event_id (${entry?.eventId})!`,
          'success'
        );
      }
    } finally {
      setTestingEvent(null);
    }
  };

  const handleCopy = (label: string, text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isValidatorConnected = lastValidationResult?.isConnected ?? headerConnectionState.isConnected;
  const currentHttpCode =
    lastValidationResult?.responseCode ??
    headerConnectionState.responseCode ??
    (headerConnectionState.isConnected ? 200 : 400);
  const isHttpOk = currentHttpCode >= 200 && currentHttpCode < 300;

  return (
    <div className="space-y-5">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Facebook Pixel &amp; Conversions API
            </h2>
            <span
              className={`text-xs font-medium ${
                metrics.isDualChannelActive
                  ? 'text-emerald-700'
                  : metrics.isPixelConfigured
                    ? 'text-blue-700'
                    : 'text-amber-700'
              }`}
            >
              {metrics.isDualChannelActive
                ? '· Dual-Channel Active'
                : metrics.isPixelConfigured
                  ? '· Browser Pixel Only'
                  : '· Setup Required'}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-500">
            SHA-256 customer matching, deterministic <code className="font-mono text-slate-700">event_id</code> deduplication, and server event sync
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCapiEnabled(!capiEnabled)}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer inline-flex items-center gap-2 shrink-0 self-start sm:self-auto ${
            capiEnabled
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 size={14} />
          <span>{capiEnabled ? 'Tracking Enabled' : 'Tracking Paused'}</span>
        </button>
      </div>

      {/* 5 Clean KPI Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Event Match Quality</span>
            <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-2xl font-bold text-slate-900">{metrics.overallEmqScore}</span>
            <span className="text-xs font-medium text-slate-400">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">SHA-256 + _fbp + _fbc + IP</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Data Transfer Ratio</span>
            <TrendingUp size={15} className="text-blue-600 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-2xl font-bold text-slate-900">{metrics.dataTransferRatio}</span>
            <span className="text-xs font-medium text-slate-400">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">Event ID deduplicated</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Product Page</span>
            <Activity size={15} className="text-slate-400 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-2xl font-bold text-slate-900">{metrics.singleProductPageScore}</span>
            <span className="text-xs font-medium text-slate-400">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">ViewContent &amp; AddToCart</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Checkout Page</span>
            <Activity size={15} className="text-slate-400 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-2xl font-bold text-slate-900">{metrics.checkoutPageScore}</span>
            <span className="text-xs font-medium text-slate-400">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">InitiateCheckout &amp; Payment</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Purchase Event</span>
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-2xl font-bold text-slate-900">{metrics.purchasePageScore}</span>
            <span className="text-xs font-medium text-slate-400">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">Customer &amp; order match</p>
        </div>
      </div>

      {/* Connection Validator Bar */}
      <div
        data-testid="capi-connection-validator-module"
        className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
              isValidatorConnected
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {isValidatorConnected ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-900">
                Connection Validator
              </h3>
              <span
                data-testid="capi-validator-status-badge"
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border inline-flex items-center gap-1 ${
                  isValidatorConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <Activity size={11} />
                <span>{isValidatorConnected ? 'Connected' : 'Disconnected'}</span>
              </span>
              <span
                data-testid="capi-validator-http-code"
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border tabular-nums ${
                  isHttpOk
                    ? 'bg-slate-50 text-slate-700 border-slate-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                HTTP {currentHttpCode} {isHttpOk ? 'OK' : 'ERR'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {lastValidationResult?.message ||
                settings.facebookLastValidationMessage ||
                headerConnectionState.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span>
                Mode:{' '}
                <strong className="font-medium text-slate-800">
                  {lastValidationResult?.channelMode === 'dual-capi-pixel' || metrics.isDualChannelActive
                    ? 'Server CAPI + Browser Pixel'
                    : metrics.isPixelConfigured
                      ? 'Browser Pixel (fbq)'
                      : 'Unconfigured'}
                </strong>
              </span>
              {(lastValidationResult?.fbtraceId || settings.facebookLastTraceId) && (
                <span>
                  Trace ID:{' '}
                  <code className="font-mono text-slate-700">
                    {lastValidationResult?.fbtraceId || settings.facebookLastTraceId}
                  </code>
                </span>
              )}
              {(lastValidationResult?.checkedAt || settings.facebookLastCheckedAt) && (
                <span className="tabular-nums">
                  Checked:{' '}
                  <strong className="font-medium text-slate-700">
                    {new Date(
                      lastValidationResult?.checkedAt || settings.facebookLastCheckedAt || Date.now()
                    ).toLocaleTimeString()}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          data-testid="validate-capi-connection-btn"
          disabled={validatingConnection}
          onClick={handleValidateConnection}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors whitespace-nowrap"
        >
          <RefreshCw size={13} className={validatingConnection ? 'animate-spin' : ''} />
          <span>
            {validatingConnection ? 'Validating...' : 'Validate Connection'}
          </span>
        </button>
      </div>

      {/* Main Configuration Form Card */}
      <form onSubmit={handleSaveConfig} className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        {/* Credentials Section */}
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Dataset &amp; Token Credentials</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your Meta Pixel Dataset ID and Conversions API access token.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">
                  Facebook Pixel ID (Dataset ID) *
                </label>
                {pixelId && (
                  <button
                    type="button"
                    onClick={() => handleCopy('pixel', pixelId)}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{copiedField === 'pixel' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. 123456789012345"
                value={pixelId}
                onChange={e => setPixelId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-[#D71920]"
              />
              <p className="text-[11px] text-slate-500">
                Meta Events Manager → Data Sources → Settings → Dataset ID
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">
                  Conversions API (CAPI) Access Token *
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showToken ? 'Hide' : 'Show'}</span>
                  </button>
                  {capiToken && (
                    <button
                      type="button"
                      onClick={() => handleCopy('token', capiToken)}
                      className="text-[11px] font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={11} />
                      <span>{copiedField === 'token' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="Paste Meta CAPI Access Token (EAAB...)"
                value={capiToken}
                onChange={e => setCapiToken(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-[#D71920]"
              />
              <p className="text-[11px] text-slate-500">
                Meta Events Manager → Settings → Conversions API → Generate token
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">Test Event Code</label>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testModeEnabled}
                    onChange={e => setTestModeEnabled(e.target.checked)}
                    className="rounded accent-[#D71920]"
                  />
                  <span>Active</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="e.g. TEST48291"
                value={testEventCode}
                onChange={e => {
                  setTestEventCode(e.target.value);
                  if (e.target.value.trim()) setTestModeEnabled(true);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Graph API Version</label>
              <select
                value={capiVersion}
                onChange={e => setCapiVersion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-[#D71920]"
              >
                <option value="v21.0">v21.0 (Latest)</option>
                <option value="v20.0">v20.0</option>
                <option value="v19.0">v19.0 (Recommended)</option>
                <option value="v18.0">v18.0</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Domain Verification Tag</label>
              <input
                type="text"
                placeholder="e.g. abc123xyz456..."
                value={domainVerification}
                onChange={e => setDomainVerification(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>
          </div>
        </div>

        {/* Standard Events Section */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Standard Events &amp; Deduplication</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatches matching Browser Pixel (<code className="font-mono">fbq</code>) and Server CAPI events via shared <code className="font-mono">event_id</code>.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAdvancedMatching}
                onChange={e => setEnableAdvancedMatching(e.target.checked)}
                className="rounded accent-[#D71920]"
              />
              <span>SHA-256 Advanced Matching</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { label: 'PageView (All Pages)', state: trackPageView, setter: setTrackPageView },
              { label: 'ViewContent (Product)', state: trackViewContent, setter: setTrackViewContent },
              { label: 'AddToCart (Cart & Buy)', state: trackAddToCart, setter: setTrackAddToCart },
              { label: 'InitiateCheckout', state: trackInitiateCheckout, setter: setTrackInitiateCheckout },
              { label: 'AddPaymentInfo', state: trackAddPaymentInfo, setter: setTrackAddPaymentInfo },
              { label: 'Purchase (Completed)', state: trackPurchase, setter: setTrackPurchase },
              { label: 'Search (Catalog)', state: trackSearch, setter: setTrackSearch },
              { label: 'AddToWishlist', state: trackAddToWishlist, setter: setTrackAddToWishlist },
            ].map((item, idx) => (
              <label
                key={idx}
                className={`px-3 py-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                  item.state
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={e => item.setter(e.target.checked)}
                  className="rounded accent-[#D71920]"
                />
                <span className="truncate">{item.label}</span>
              </label>
            ))}
          </div>

          {/* Match Parameters Summary Line */}
          <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
            <span className="font-medium text-slate-800">Active Match Keys (14):</span>
            <span className="text-slate-500 font-mono text-[11px]">
              em · ph · fn · ln · ct · st · zp · country · external_id · _fbp · _fbc · client_ip · user_agent · event_id
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Test event:</span>
            {(['ViewContent', 'InitiateCheckout', 'Purchase'] as FacebookStandardEventName[]).map(evName => (
              <button
                key={evName}
                type="button"
                disabled={testingEvent !== null}
                onClick={() => handleSendTestEvent(evName)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Play size={11} className="text-slate-500" />
                <span>{testingEvent === evName ? `Sending...` : evName}</span>
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-semibold rounded-lg text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save Pixel &amp; CAPI Settings</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Event Diagnostic Log */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tabular-nums">
              Conversion API &amp; Pixel Event Log ({eventLogs.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recent events dispatched across product views, checkouts, and completed orders
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setEventLogs(getCapiEventLogs())}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Refresh</span>
            </button>
            {eventLogs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearCapiEventLogs();
                  setEventLogs([]);
                }}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-slate-200 text-red-600 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {eventLogs.length === 0 ? (
          <div className="p-10 text-center space-y-1.5">
            <p className="text-sm font-medium text-slate-800">
              No conversion events logged in this session
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Run Validate Connection or send a test event above to inspect live HTTP response codes and deduplication keys.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold uppercase text-slate-500">
                    <th className="py-2.5 px-4">Event</th>
                    <th className="py-2.5 px-4">Event ID</th>
                    <th className="py-2.5 px-4">HTTP</th>
                    <th className="py-2.5 px-4">Value</th>
                    <th className="py-2.5 px-4">EMQ</th>
                    <th className="py-2.5 px-4">Transfer</th>
                    <th className="py-2.5 px-4">Channel Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eventLogs.slice(0, 12).map(log => {
                    const httpCode =
                      log.httpResponseCode ??
                      (log.capiResponseStatus === 'error' ? 400 : 200);
                    const isCodeOk = httpCode >= 200 && httpCode < 300;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {log.eventName}
                          <span className="block text-[10px] font-normal text-slate-400 tabular-nums">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                          {log.eventId}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-medium text-[11px] border ${
                              isCodeOk
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {httpCode} {isCodeOk ? 'OK' : 'ERR'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 tabular-nums">
                          {log.value !== undefined ? `৳${log.value} ${log.currency}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-emerald-700 font-medium">
                          {log.emqScore}/10
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-blue-700 font-medium">
                          {log.dataTransferRatio}/10
                        </td>
                        <td className="py-2.5 px-4">
                          {log.capiResponseStatus === 'delivered' ? (
                            <span className="text-emerald-700 font-medium text-[11px]">
                              Delivered {log.fbtraceId ? `(${log.fbtraceId.slice(0, 8)})` : ''}
                            </span>
                          ) : log.capiResponseStatus === 'browser-only' ? (
                            <span className="text-blue-700 font-medium text-[11px]">
                              Browser Pixel Fired
                            </span>
                          ) : log.capiResponseStatus === 'error' ? (
                            <span className="text-amber-700 font-medium text-[11px]" title={log.errorMessage}>
                              CAPI Error: {log.errorMessage?.slice(0, 36)}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-medium text-[11px]">
                              Verified ({log.matchedParams.length} params)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Event Feed */}
            <div className="md:hidden divide-y divide-slate-100">
              {eventLogs.slice(0, 12).map(log => {
                const httpCode =
                  log.httpResponseCode ??
                  (log.capiResponseStatus === 'error' ? 400 : 200);
                const isCodeOk = httpCode >= 200 && httpCode < 300;
                return (
                  <div key={log.id} className="p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{log.eventName}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium border tabular-nums ${
                          isCodeOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {httpCode} {isCodeOk ? 'OK' : 'ERR'}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 truncate">{log.eventId}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 tabular-nums">
                      <span>EMQ {log.emqScore}/10 · Ratio {log.dataTransferRatio}/10</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
