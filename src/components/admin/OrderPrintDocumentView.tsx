import React, { useMemo, useState } from 'react';
import { ArrowLeft, Edit3, FileText, Package, Printer, ShoppingCart } from 'lucide-react';
import { Order, Product, StoreSettings } from '../../types';
import {
  buildQrMatrix,
  computeOrderDocumentFinancials,
  encodeCode128B,
  formatOrderAddressLine,
  InvoicePaperSize,
  LabelPaperSize,
  resolveOrderDocumentMeta,
} from '../../utils/orderDocumentHelpers';

interface OrderPrintDocumentViewProps {
  mode: 'label' | 'invoice';
  order: Order;
  products: Product[];
  settings?: Partial<StoreSettings> | null;
  onChangeMode: (nextMode: 'label' | 'invoice') => void;
  onEditOrder: (orderId: string) => void;
  onClose: () => void;
}

function Code128SvgBarcode({
  value,
  height = 42,
  className = '',
}: {
  value: string;
  height?: number;
  className?: string;
}) {
  const encoded = useMemo(() => encodeCode128B(value), [value]);
  return (
    <svg
      viewBox={`0 0 ${encoded.totalWidth} ${height}`}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Barcode ${encoded.encodedText}`}
    >
      <rect x={0} y={0} width={encoded.totalWidth} height={height} fill="#FFFFFF" />
      {encoded.bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y={0}
          width={bar.width}
          height={height}
          fill="#0F172A"
        />
      ))}
    </svg>
  );
}

function QrMatrixSvg({
  payload,
  sizePx = 60,
  className = '',
}: {
  payload: string;
  sizePx?: number;
  className?: string;
}) {
  const matrix = useMemo(() => buildQrMatrix(payload), [payload]);
  const quiet = 1;
  const vb = matrix.size + quiet * 2;
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox={`0 0 ${vb} ${vb}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Order Verification QR Code"
    >
      <rect x={0} y={0} width={vb} height={vb} fill="#FFFFFF" />
      {matrix.rects.map((r, i) => (
        <rect
          key={i}
          x={r.x + quiet}
          y={r.y + quiet}
          width={1}
          height={1}
          fill="#0F172A"
        />
      ))}
    </svg>
  );
}

export function OrderPrintDocumentView({
  mode,
  order,
  products,
  settings,
  onChangeMode,
  onEditOrder,
  onClose,
}: OrderPrintDocumentViewProps) {
  const [labelSize, setLabelSize] = useState<LabelPaperSize>(
    settings?.defaultLabelSize === '2x3' ? '2x3' : '3x3'
  );
  const [invoiceSize, setInvoiceSize] = useState<InvoicePaperSize>(
    settings?.defaultInvoiceSize === 'A5' || settings?.defaultInvoiceSize === '3in'
      ? settings.defaultInvoiceSize
      : 'A4'
  );

  const meta = useMemo(
    () => resolveOrderDocumentMeta(order, products, settings),
    [order, products, settings]
  );
  const financials = useMemo(
    () => computeOrderDocumentFinancials(order, products),
    [order, products]
  );

  const showProductImages = settings?.invoiceShowProductImage !== false;
  const showPricingBreakdown = settings?.invoiceShowPricingBreakdown !== false;
  const showLabelItems = settings?.labelShowItemDetails !== false;

  const qrPayload = useMemo(
    () =>
      `INV:${meta.invoiceNoDisplay}|PID:${meta.parcelIdDisplay}|TO:${order.customerName}|PH:${order.phone}|COD:${financials.amountToCollect}`,
    [meta.invoiceNoDisplay, meta.parcelIdDisplay, order.customerName, order.phone, financials.amountToCollect]
  );

  const fullAddress = useMemo(
    () => formatOrderAddressLine(order),
    [order.address, order.city, order.district]
  );

  const handlePrint = () => {
    window.print();
  };

  if (mode === 'label') {
    const isCompact = labelSize === '2x3';
    return (
      <div
        data-testid="order-label-preview-screen"
        className="print-document-overlay fixed inset-0 z-[100] bg-[#DCE2EA] overflow-y-auto py-5 sm:py-8 px-3 sm:px-6 print:static print:bg-white print:p-0 print:overflow-visible"
        role="dialog"
        aria-modal="true"
        aria-label={`Shipping Label for ${meta.invoiceNoDisplay}`}
      >
        {/* Top Floating Toolbar (matches reference image 2) */}
        <div className="print:hidden max-w-[540px] mx-auto mb-5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          <button
            type="button"
            data-testid="doc-back-btn"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-neutral-50 border border-neutral-300/90 text-neutral-800 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <button
            type="button"
            data-testid="doc-switch-invoice-btn"
            onClick={() => onChangeMode('invoice')}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-neutral-50 border border-neutral-300/90 text-neutral-800 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <span>Invoice</span>
          </button>

          <button
            type="button"
            data-testid="doc-edit-order-btn"
            onClick={() => onEditOrder(order.id)}
            className="px-3 py-2 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>

          <button
            type="button"
            data-testid="doc-print-label-btn"
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <Printer size={14} />
            <span>Print Label</span>
          </button>

          <div className="inline-flex rounded-lg overflow-hidden border border-neutral-300/90 bg-white shadow-2xs">
            <button
              type="button"
              data-testid="label-size-3x3"
              onClick={() => setLabelSize('3x3')}
              className={`px-3 py-2 text-xs font-bold cursor-pointer ${
                labelSize === '3x3'
                  ? 'bg-[#1A56DB] text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              3 × 3 in
            </button>
            <button
              type="button"
              data-testid="label-size-2x3"
              onClick={() => setLabelSize('2x3')}
              className={`px-3 py-2 text-xs font-bold border-l border-neutral-300/90 cursor-pointer ${
                labelSize === '2x3'
                  ? 'bg-[#1A56DB] text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              2 × 3 in
            </button>
          </div>
        </div>

        {/* Shipping Label Paper Sheet */}
        <div className="flex justify-center">
          <div
            id="print-document-sheet"
            data-testid="shipping-label-card"
            data-label-size={labelSize}
            style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
            className={`print-document-paper bg-white text-slate-950 border border-neutral-300 shadow-[0_8px_28px_rgba(15,23,42,0.12)] print:shadow-none print:border-neutral-800 mx-auto ${
              isCompact ? 'w-[244px] min-h-[336px] p-2.5' : 'w-[348px] max-w-full min-h-[348px] p-3.5'
            }`}
          >
            {/* Brand + Merchant Header */}
            <div className="flex items-center justify-between gap-2 pb-2">
              <div
                className={`rounded-full bg-neutral-300/80 border border-neutral-300 flex items-center justify-center overflow-hidden shrink-0 ${
                  isCompact ? 'w-7 h-7' : 'w-9 h-9'
                }`}
              >
                {settings?.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={meta.storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingCart size={isCompact ? 13 : 16} className="text-white" />
                )}
              </div>

              <div className="text-right min-w-0">
                <div
                  className={`font-extrabold text-slate-950 leading-tight truncate ${
                    isCompact ? 'text-[11px]' : 'text-[12.5px]'
                  }`}
                >
                  {meta.storeName}
                </div>
                <div
                  className={`text-slate-500 font-medium leading-tight ${
                    isCompact ? 'text-[8.5px]' : 'text-[9.5px]'
                  }`}
                >
                  Merchant ID: {meta.merchantId}
                </div>
              </div>
            </div>

            <div className="border-t-[1.5px] border-neutral-900" />

            {/* 1D Scannable Barcode Block */}
            <div className="py-2 flex flex-col items-center justify-center">
              <Code128SvgBarcode
                value={meta.barcodeValue}
                height={isCompact ? 28 : 34}
                className={isCompact ? 'w-[175px] h-7' : 'w-[238px] h-[34px]'}
              />
              <div
                className={`font-mono font-bold tracking-[0.18em] text-slate-900 mt-1 ${
                  isCompact ? 'text-[9px]' : 'text-[10.5px]'
                }`}
              >
                {meta.barcodeValue}
              </div>
            </div>

            <div className="border-t border-neutral-200" />

            {/* QR Code + Order Metadata Grid */}
            <div className="py-2 flex items-center gap-3">
              <div className="shrink-0">
                <QrMatrixSvg
                  payload={qrPayload}
                  sizePx={isCompact ? 46 : 58}
                  className="border border-neutral-100"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`uppercase font-semibold tracking-wider text-slate-500 ${
                      isCompact ? 'text-[8px]' : 'text-[9px]'
                    }`}
                  >
                    INVOICE
                  </span>
                  <span
                    className={`font-bold text-slate-950 truncate ${
                      isCompact ? 'text-[9.5px]' : 'text-[10.5px]'
                    }`}
                  >
                    {meta.invoiceCode}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`uppercase font-semibold tracking-wider text-slate-500 ${
                      isCompact ? 'text-[8px]' : 'text-[9px]'
                    }`}
                  >
                    DELIVERY
                  </span>
                  <span
                    className={`font-bold text-slate-950 ${
                      isCompact ? 'text-[9.5px]' : 'text-[10.5px]'
                    }`}
                  >
                    {meta.deliveryTypeLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`uppercase font-semibold tracking-wider text-slate-500 ${
                      isCompact ? 'text-[8px]' : 'text-[9px]'
                    }`}
                  >
                    WEIGHT
                  </span>
                  <span
                    className={`font-bold text-slate-950 ${
                      isCompact ? 'text-[9.5px]' : 'text-[10.5px]'
                    }`}
                  >
                    {meta.weightLabel}
                  </span>
                </div>
                {financials.totalSavings > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`uppercase font-semibold tracking-wider text-slate-500 ${
                        isCompact ? 'text-[8px]' : 'text-[9px]'
                      }`}
                    >
                      OFFER SAVED
                    </span>
                    <span
                      className={`font-bold text-emerald-700 ${
                        isCompact ? 'text-[9.5px]' : 'text-[10.5px]'
                      }`}
                    >
                      -৳{financials.totalSavings}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-200" />

            {/* Recipient + Item + Note Table */}
            <div className={`py-2 space-y-1 ${isCompact ? 'text-[9px]' : 'text-[10.5px]'}`}>
              <div className="grid grid-cols-12 gap-1 items-baseline">
                <span className="col-span-3 uppercase font-semibold text-slate-500 text-[8.5px]">
                  NAME
                </span>
                <span className="col-span-9 font-extrabold text-slate-950 leading-snug break-words">
                  {order.customerName}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1 items-baseline">
                <span className="col-span-3 uppercase font-semibold text-slate-500 text-[8.5px]">
                  PHONE
                </span>
                <span className="col-span-9 font-bold text-slate-950 font-mono leading-snug">
                  {order.phone}
                  {order.optionalPhone ? ` / ${order.optionalPhone}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1 items-baseline">
                <span className="col-span-3 uppercase font-semibold text-slate-500 text-[8.5px]">
                  ADDRESS
                </span>
                <span className="col-span-9 font-bold text-slate-900 leading-snug break-words">
                  {fullAddress}
                </span>
              </div>

              {showLabelItems && (
                <div className="grid grid-cols-12 gap-1 items-baseline">
                  <span className="col-span-3 uppercase font-semibold text-slate-500 text-[8.5px]">
                    ITEM
                  </span>
                  <div className="col-span-9 font-bold text-slate-950 leading-snug break-words space-y-0.5">
                    {financials.items.map((it, idx) => (
                      <div key={`${it.productId}-${idx}`}>
                        {it.title} ({it.variantName}) x{it.quantity}
                        {financials.items.length > 1 ? ` — ৳${it.lineTotal}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-12 gap-1 items-baseline">
                <span className="col-span-3 uppercase font-semibold text-slate-500 text-[8.5px]">
                  NOTE
                </span>
                <span className="col-span-9 italic text-slate-700 leading-snug break-words">
                  {order.notes?.trim()
                    ? order.notes
                    : `Delivery Method: ${
                        order.courierDeliveryType === 1
                          ? 'Standard Hub Pickup'
                          : 'Standard Home Delivery'
                      }`}
                </span>
              </div>
            </div>

            {/* Bordered Cash On Delivery / Paid Box */}
            <div className="mt-1 mb-2.5 border-[1.5px] border-neutral-900 px-2.5 py-1.5 flex items-center justify-between gap-2">
              <span
                className={`uppercase font-extrabold tracking-wide text-slate-900 ${
                  isCompact ? 'text-[8.5px]' : 'text-[9.5px]'
                }`}
              >
                {financials.isPaidOnline ? 'PAID ONLINE' : 'CASH ON DELIVERY'}
              </span>
              <span
                data-testid="label-cod-amount"
                className={`font-black text-slate-950 tabular-nums ${
                  isCompact ? 'text-sm' : 'text-[15px]'
                }`}
              >
                ৳ {financials.amountToCollect}
              </span>
            </div>

            {/* Label Footer */}
            <div
              className={`border-t border-neutral-200 pt-1.5 flex items-center justify-between gap-2 text-slate-500 ${
                isCompact ? 'text-[7.5px]' : 'text-[8.5px]'
              }`}
            >
              <span>Printed: {meta.printedAtLabel}</span>
              <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                <span className="inline-block w-2 h-2 rotate-45 bg-emerald-600 rounded-[1px]" />
                <span>{meta.logisticsText}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // INVOICE MODE (matches reference image 3 cleanly across A4 / A5 / 3in)
  // =========================================================================
  const isThermal3In = invoiceSize === '3in';
  const isA5 = invoiceSize === 'A5';

  return (
    <div
      data-testid="order-invoice-preview-screen"
      className="print-document-overlay fixed inset-0 z-[100] bg-[#ECF0F4] overflow-y-auto py-5 sm:py-8 px-3 sm:px-6 print:static print:bg-white print:p-0 print:overflow-visible"
      role="dialog"
      aria-modal="true"
      aria-label={`Customer Invoice ${meta.invoiceNoDisplay}`}
    >
      {/* Top Toolbar Bar (matches reference image 3) */}
      <div
        className={`print:hidden mx-auto mb-5 flex flex-wrap items-center justify-between gap-2.5 ${
          isThermal3In ? 'max-w-[360px]' : isA5 ? 'max-w-[580px]' : 'max-w-[780px]'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="doc-back-btn"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-neutral-50 border border-neutral-300/90 text-neutral-800 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to parcel</span>
          </button>

          <button
            type="button"
            data-testid="doc-switch-label-btn"
            onClick={() => onChangeMode('label')}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-neutral-50 border border-neutral-300/90 text-neutral-800 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Label
          </button>

          <button
            type="button"
            data-testid="doc-edit-order-btn"
            onClick={() => onEditOrder(order.id)}
            className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
          >
            <Edit3 size={13} />
            <span>Edit Order</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg overflow-hidden border border-neutral-300/90 bg-white shadow-2xs">
            {(['A4', 'A5', '3in'] as const).map((sz, i) => (
              <button
                key={sz}
                type="button"
                data-testid={`invoice-size-${sz.toLowerCase()}`}
                onClick={() => setInvoiceSize(sz)}
                className={`px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  i > 0 ? 'border-l border-neutral-300/90' : ''
                } ${
                  invoiceSize === sz
                    ? 'bg-neutral-950 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          <button
            type="button"
            data-testid="doc-print-invoice-btn"
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <Printer size={14} />
            <span>Print invoice</span>
          </button>
        </div>
      </div>

      {/* White Invoice Sheet */}
      <div className="flex justify-center">
        <div
          id="print-document-sheet"
          data-testid="customer-invoice-sheet"
          data-invoice-size={invoiceSize}
          style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
          className={`print-document-paper bg-white text-slate-950 rounded-xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-neutral-200/90 print:shadow-none print:rounded-none print:border-0 mx-auto w-full ${
            isThermal3In
              ? 'max-w-[310px] p-4'
              : isA5
              ? 'max-w-[560px] p-6 sm:p-7'
              : 'max-w-[780px] p-6 sm:p-10'
          }`}
        >
          {/* Store Header & INVOICE Title */}
          <div
            className={`flex justify-between gap-4 ${
              isThermal3In ? 'flex-col' : 'flex-col sm:flex-row items-start'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                {settings?.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt={meta.storeName}
                    className={`rounded-lg object-cover border border-neutral-200 shrink-0 ${
                      isThermal3In ? 'w-7 h-7' : 'w-9 h-9'
                    }`}
                  />
                )}
                <h1
                  className={`font-black text-slate-950 tracking-tight ${
                    isThermal3In ? 'text-base' : 'text-xl'
                  }`}
                >
                  {meta.storeName}
                </h1>
              </div>
              <div className={`text-slate-500 ${isThermal3In ? 'text-[10.5px]' : 'text-xs'}`}>
                Merchant ID: {meta.merchantId}
              </div>
              <div className={`text-slate-600 ${isThermal3In ? 'text-[10.5px]' : 'text-xs'}`}>
                {meta.storePhone}
              </div>
              <div className={`text-slate-500 max-w-xs ${isThermal3In ? 'text-[10.5px]' : 'text-xs'}`}>
                {meta.storeAddress}
              </div>
            </div>

            <div className={isThermal3In ? 'text-left' : 'sm:text-right w-full sm:w-auto'}>
              <div
                className={`font-black tracking-[0.06em] text-slate-950 ${
                  isThermal3In ? 'text-lg mb-1.5' : 'text-2xl mb-2'
                }`}
              >
                INVOICE
              </div>
              <div
                className={`space-y-1 ${isThermal3In ? 'text-[10.5px]' : 'text-xs'}`}
              >
                <div className="flex sm:justify-end gap-4">
                  <span className="text-slate-400 font-medium">Invoice no</span>
                  <span className="font-bold text-slate-950 min-w-[110px] sm:text-right">
                    {meta.invoiceNoDisplay}
                  </span>
                </div>
                <div className="flex sm:justify-end gap-4">
                  <span className="text-slate-400 font-medium">Parcel ID</span>
                  <span className="font-bold text-slate-950 min-w-[110px] sm:text-right">
                    {meta.parcelIdDisplay}
                  </span>
                </div>
                <div className="flex sm:justify-end gap-4">
                  <span className="text-slate-400 font-medium">Date</span>
                  <span className="font-bold text-slate-950 min-w-[110px] sm:text-right">
                    {meta.invoiceDateLabel}
                  </span>
                </div>
                <div className="flex sm:justify-end gap-4">
                  <span className="text-slate-400 font-medium">Tracking</span>
                  <span className="font-mono font-bold text-slate-950 min-w-[110px] sm:text-right break-all">
                    {meta.trackingDisplay}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thick Black Divider (exact match to reference image 3) */}
          <div className={`border-t-[2px] border-neutral-900 ${isThermal3In ? 'my-3.5' : 'my-6'}`} />

          {/* DELIVER TO + Barcode & QR Code Row */}
          <div
            className={`flex justify-between gap-4 pb-5 border-b border-neutral-200 ${
              isThermal3In ? 'flex-col' : 'flex-col md:flex-row md:items-center'
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                DELIVER TO
              </div>
              <div
                className={`font-black text-slate-950 ${
                  isThermal3In ? 'text-xs' : 'text-sm'
                }`}
              >
                {order.customerName}
              </div>
              <div className="text-xs font-bold text-slate-900 font-mono">
                {order.phone}
                {order.optionalPhone ? ` · ${order.optionalPhone}` : ''}
              </div>
              <div className="text-xs text-slate-600 leading-relaxed max-w-sm">
                {fullAddress}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1 text-[11px] text-slate-500">
                <span>
                  Delivery: <strong className="text-slate-800">{meta.deliveryTypeLabel}</strong>
                </span>
                <span>
                  Weight: <strong className="text-slate-800">{meta.weightLabel}</strong>
                </span>
                <span>
                  Method: <strong className="text-slate-800">{order.paymentMethodName || 'COD'}</strong>
                </span>
              </div>
              {order.notes && (
                <div className="text-[11px] italic text-slate-500 pt-0.5">
                  Note: {order.notes}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
              <div className="flex flex-col items-center">
                <Code128SvgBarcode
                  value={meta.barcodeValue}
                  height={isThermal3In ? 34 : 44}
                  className={isThermal3In ? 'w-[140px] h-[34px]' : 'w-[175px] h-[44px]'}
                />
                <span className="font-mono font-bold text-[10px] tracking-[0.16em] text-slate-900 mt-1">
                  {meta.barcodeValue}
                </span>
              </div>

              <QrMatrixSvg
                payload={qrPayload}
                sizePx={isThermal3In ? 54 : 68}
                className="border border-neutral-100 shrink-0"
              />
            </div>
          </div>

          {/* Items Table Header */}
          <div className="pt-5">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-900 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>

            {/* Items List with Product Images, Price, Quantity, Offer Savings */}
            <div className="divide-y divide-neutral-100">
              {financials.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  data-testid={`invoice-item-row-${idx}`}
                  className="py-3.5 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {showProductImages && (
                      <div
                        className={`rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0 flex items-center justify-center ${
                          isThermal3In ? 'w-9 h-9' : 'w-12 h-12'
                        }`}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={18} className="text-slate-400" />
                        )}
                      </div>
                    )}

                    <div className="min-w-0 space-y-0.5">
                      <div
                        className={`font-bold text-slate-950 leading-snug ${
                          isThermal3In ? 'text-xs' : 'text-[13.5px]'
                        }`}
                      >
                        {item.title}{' '}
                        {item.variantName ? `(${item.variantName})` : ''} × {item.quantity}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500">
                        <span>
                          Unit Price:{' '}
                          <strong className="text-slate-800">৳{item.unitPrice}</strong> ×{' '}
                          {item.quantity}
                        </span>
                        {item.hasOfferDiscount && (
                          <>
                            <span className="line-through text-slate-400">
                              ৳{item.regularUnitPrice}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9.5px] font-bold">
                              Offer Save ৳{item.itemDiscountTotal}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-medium">
                        Parcel #{meta.parcelIdDisplay}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold text-slate-950 tabular-nums ${
                        isThermal3In ? 'text-xs' : 'text-sm'
                      }`}
                    >
                      ৳{item.lineTotal}
                    </div>
                    {item.hasOfferDiscount && (
                      <div className="text-[11px] text-slate-400 line-through tabular-nums">
                        ৳{item.lineRegularTotal}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Edit item description link (exact match to reference image 3) */}
            <div className="pt-1 pb-3 border-b border-neutral-200 print:hidden">
              <button
                type="button"
                data-testid="invoice-edit-description-link"
                onClick={() => onEditOrder(order.id)}
                className="text-xs font-bold text-[#059669] hover:text-[#047857] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <FileText size={12} />
                <span>Edit item description</span>
              </button>
            </div>
          </div>

          {/* Detailed Financial Breakdown: Regular Price, Offer Savings, Subtotal, Coupon, Delivery, COD Charge */}
          {showPricingBreakdown && (
            <div className="py-4 border-b border-neutral-200 flex justify-end">
              <div className={`w-full space-y-1.5 text-xs ${isThermal3In ? '' : 'sm:max-w-[330px]'}`}>
                {financials.itemsOfferDiscountTotal > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Regular Price ({financials.items.reduce((s, i) => s + i.quantity, 0)} pcs)</span>
                      <span className="font-semibold line-through tabular-nums">৳{financials.itemsRegularTotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>Product / Offer Discount</span>
                      <span className="font-bold tabular-nums">-৳{financials.itemsOfferDiscountTotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-dashed border-neutral-200">
                      <span>Discounted Items Subtotal</span>
                      <span className="font-bold text-slate-900 tabular-nums">৳{financials.subtotal}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Items Subtotal ({financials.items.reduce((s, i) => s + i.quantity, 0)} pcs)</span>
                    <span className="font-bold text-slate-900 tabular-nums">৳{financials.subtotal}</span>
                  </div>
                )}

                {financials.orderDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>
                      Coupon / Promo Discount {order.couponCode ? `(${order.couponCode})` : ''}
                    </span>
                    <span className="font-bold tabular-nums">-৳{financials.orderDiscount}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery Charge ({meta.deliveryTypeLabel})</span>
                  <span className="font-bold text-slate-900 tabular-nums">৳{financials.deliveryCharge}</span>
                </div>

                {financials.codCharge > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>COD Handling Charge</span>
                    <span className="font-bold text-slate-900 tabular-nums">৳{financials.codCharge}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-slate-950 font-black text-sm">
                  <span>Order Total</span>
                  <span data-testid="invoice-order-total" className="tabular-nums">৳{financials.grandTotal}</span>
                </div>

                {financials.isPaidOnline && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold text-xs">
                    <span>Paid Online ({order.paymentMethodName})</span>
                    <span className="tabular-nums">-৳{financials.paidAmount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emerald-Bordered AMOUNT TO COLLECT Box (exact match to reference image 3) */}
          <div className="mt-5 rounded-lg border-[1.5px] border-[#10B981] bg-[#ECFDF5]/60 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
            <div>
              <div
                className={`font-extrabold uppercase tracking-wider text-slate-950 ${
                  isThermal3In ? 'text-[11px]' : 'text-xs'
                }`}
              >
                AMOUNT TO COLLECT
              </div>
              {financials.isPaidOnline && (
                <div className="text-[10.5px] font-bold text-emerald-700 mt-0.5">
                  PAID IN FULL VIA {order.paymentMethodName?.toUpperCase() || 'ONLINE PAYMENT'}
                </div>
              )}
            </div>
            <div
              data-testid="invoice-amount-to-collect"
              className={`font-black text-slate-950 tabular-nums ${
                isThermal3In ? 'text-xl' : 'text-2xl'
              }`}
            >
              ৳{financials.amountToCollect}
            </div>
          </div>

          {settings?.invoiceFooterNote && (
            <div className="mt-5 pt-3 border-t border-neutral-100 text-center text-[11px] text-slate-500">
              {settings.invoiceFooterNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
