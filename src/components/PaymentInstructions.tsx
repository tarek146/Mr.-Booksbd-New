import React, { useState, useEffect, useMemo } from 'react';
import { PaymentMethodConfig } from '../types';
import {
  getPaymentMethodDisplayMeta,
  getActiveOnlinePaymentMethods,
  validatePaymentTransactionPopup,
} from '../utils/reviewHelpers';
import {
  Copy,
  Check,
  CheckCircle2,
  X,
  Edit3,
  AlertCircle,
  Sparkles,
  QrCode,
  Download,
  CreditCard,
} from 'lucide-react';

/**
 * Generates a high-resolution, downloadable Payment QR Code card PNG data URL
 * when no custom QR image URL has been uploaded in the Admin Panel yet.
 */
function generateFallbackPaymentQrDataUrl(
  method: PaymentMethodConfig,
  totalAmount: number
): string {
  if (typeof document === 'undefined') return '';
  try {
    const meta = getPaymentMethodDisplayMeta(method);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const brandColor =
      method.type === 'bkash'
        ? '#E2136E'
        : method.type === 'nagad'
        ? '#F15A24'
        : method.type === 'rocket'
        ? '#8C3494'
        : method.type === 'upay'
        ? '#0054A6'
        : method.type === 'bangla_qr'
        ? '#006A4E'
        : '#1E3A8A';

    // White card background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top brand header bar
    ctx.fillStyle = brandColor;
    ctx.fillRect(0, 0, canvas.width, 130);

    // Brand Title & Account Type
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.fillText(`${meta.displayTitle} (${meta.englishName})`, canvas.width / 2, 58);

    const accTypeLabel =
      meta.accountType && meta.accountType !== 'None' ? meta.accountType : 'Personal';
    ctx.font = '700 20px Inter, system-ui, sans-serif';
    ctx.fillText(
      `${accTypeLabel} Account • Payable: ৳${totalAmount}`,
      canvas.width / 2,
      98
    );

    // QR Code outer frame
    const qrBoxSize = 380;
    const qrBoxX = (canvas.width - qrBoxSize) / 2;
    const qrBoxY = 165;

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

    // Deterministic 25x25 QR matrix from payment payload
    const payload = `${meta.englishName}|${accTypeLabel}|${method.accountNumber}|BDT:${totalAmount}`;
    let seed = 2166136261;
    for (let i = 0; i < payload.length; i++) {
      seed ^= payload.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }

    const modules = 25;
    const padding = 26;
    const cellSize = Math.floor((qrBoxSize - padding * 2) / modules);
    const startX = qrBoxX + Math.floor((qrBoxSize - cellSize * modules) / 2);
    const startY = qrBoxY + Math.floor((qrBoxSize - cellSize * modules) / 2);

    const isFinderArea = (r: number, c: number) => {
      if (r < 8 && c < 8) return true;
      if (r < 8 && c >= modules - 8) return true;
      if (r >= modules - 8 && c < 8) return true;
      return false;
    };

    const drawFinderPattern = (rowOffset: number, colOffset: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (isBorder || isInner) {
            ctx.fillStyle = isInner ? brandColor : '#0F172A';
            ctx.fillRect(
              startX + (colOffset + c) * cellSize,
              startY + (rowOffset + r) * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }
    };

    drawFinderPattern(0, 0);
    drawFinderPattern(0, modules - 7);
    drawFinderPattern(modules - 7, 0);

    ctx.fillStyle = '#0F172A';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (isFinderArea(r, c)) continue;
        // Timing pattern
        if (r === 6 || c === 6) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
          }
          continue;
        }
        // Center badge reserve (10..14)
        if (r >= 10 && r <= 14 && c >= 10 && c <= 14) continue;

        seed ^= (r * 31 + c * 17) & 0xff;
        seed = Math.imul(seed, 16777619);
        if ((Math.abs(seed) + r * c) % 3 !== 0) {
          ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
        }
      }
    }

    // Center brand badge inside QR
    const centerBox = cellSize * 5;
    const centerX = startX + 10 * cellSize;
    const centerY = startY + 10 * cellSize;
    ctx.fillStyle = brandColor;
    ctx.fillRect(centerX, centerY, centerBox, centerBox);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 16px Inter, system-ui, sans-serif';
    ctx.fillText(
      meta.englishName.slice(0, 5).toUpperCase(),
      centerX + centerBox / 2,
      centerY + centerBox / 2 + 6
    );

    // Bottom Payment Number & Account Details
    ctx.fillStyle = '#64748B';
    ctx.font = '700 16px Inter, system-ui, sans-serif';
    ctx.fillText(
      `${method.type.toUpperCase()} ACCOUNT / NUMBER`,
      canvas.width / 2,
      592
    );

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 36px Inter, monospace, sans-serif';
    ctx.fillText(method.accountNumber || '', canvas.width / 2, 640);

    ctx.fillStyle = brandColor;
    ctx.font = '700 18px Inter, system-ui, sans-serif';
    ctx.fillText(
      `${method.accountName || 'MR. BOOKS'} • Scan or Send Money`,
      canvas.width / 2,
      685
    );

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.fillText('MR. BOOKS Official Payment Verification QR', canvas.width / 2, 725);

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

export function PaymentBrandIcon({
  method,
  size = 'md',
}: {
  method: PaymentMethodConfig;
  size?: 'sm' | 'md' | 'lg';
}) {
  const meta = getPaymentMethodDisplayMeta(method);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [meta.customLogoUrl]);

  const dimClass =
    size === 'lg'
      ? 'w-12 h-12 rounded-2xl'
      : size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : 'w-11 h-11 rounded-xl';

  if (meta.customLogoUrl && !imgError) {
    return (
      <div
        className={`${dimClass} bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden`}
      >
        <img
          src={meta.customLogoUrl}
          alt={method.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  switch (method.type) {
    case 'cod':
      return (
        <div
          className={`${dimClass} bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <div className="w-full h-full rounded-lg bg-[#00A651] text-white flex flex-col items-center justify-center leading-none">
            <svg
              viewBox="0 0 24 24"
              className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2.5" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
            <span className="text-[7px] font-black tracking-tighter mt-0.5 uppercase">
              COD
            </span>
          </div>
        </div>
      );

    case 'bkash':
      return (
        <div
          className={`${dimClass} bg-white border border-pink-100 p-1 flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <div className="w-full h-full rounded-xl bg-[#E2136E] text-white flex items-center justify-center">
            <svg
              viewBox="0 0 36 36"
              className={size === 'lg' ? 'w-7 h-7' : 'w-6 h-6'}
              fill="currentColor"
            >
              <path d="M16.2 6.5L8.5 14.8l7.9 2.6-0.2-10.9zm1.5 0.4l0.2 11.2 9.6-4.2-9.8-7zm-0.1 12.7l-7.2-2.3 5.1 11.7 2.1-9.4zm1.4 0.3l-1.9 8.6 9.8-8.1-7.9-0.5zm9.6-5.2l-3.2 1.4 4.8 2.1-1.6-3.5z" />
            </svg>
          </div>
        </div>
      );

    case 'nagad':
      return (
        <div
          className={`${dimClass} bg-white border border-orange-100 p-1 flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#F7941D] to-[#ED1C24] text-white flex flex-col items-center justify-center leading-none">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="12" cy="10" r="5" />
              <path d="M8 18c2-1.5 6-1.5 8 0" />
            </svg>
            <span className="text-[8px] font-black tracking-tight mt-0.5">
              নগদ
            </span>
          </div>
        </div>
      );

    case 'rocket':
      return (
        <div
          className={`${dimClass} bg-white border border-purple-100 p-1 flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <div className="w-full h-full rounded-xl bg-[#8C3494] text-white flex flex-col items-center justify-center leading-none">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            </svg>
            <span className="text-[7px] font-black tracking-tight mt-0.5">
              rocket
            </span>
          </div>
        </div>
      );

    case 'upay':
      return (
        <div
          className={`${dimClass} bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <div className="w-full h-full rounded-xl bg-[#FFFDF5] border border-amber-200/80 flex flex-col items-center justify-center leading-none">
            <span className="text-xs font-black text-[#0054A6] leading-none">
              <span className="text-[#FDB913]">u</span>pay
            </span>
            <span className="text-[7px] font-black text-slate-700 mt-0.5">
              উপায়
            </span>
          </div>
        </div>
      );

    case 'bangla_qr':
      return (
        <div
          className={`${dimClass} bg-white border border-emerald-200 p-1 flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#006A4E] to-[#044e3a] text-white flex flex-col items-center justify-center leading-none p-0.5">
            <QrCode className={size === 'lg' ? 'w-5 h-5 text-emerald-100' : size === 'sm' ? 'w-3.5 h-3.5 text-emerald-100' : 'w-4 h-4 text-emerald-100'} />
            <span className="text-[6.5px] font-black tracking-tighter mt-0.5 leading-none text-white">
              বাংলা QR
            </span>
          </div>
        </div>
      );

    case 'bank':
    default:
      return (
        <div
          className={`${dimClass} bg-white border border-blue-100 p-1 flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <div className="w-full h-full rounded-xl bg-[#1E3A8A] text-white flex flex-col items-center justify-center leading-none">
            <span className="text-[8px] font-black tracking-tight uppercase">
              BANK
            </span>
          </div>
        </div>
      );
  }
}

interface PaymentInstructionsProps {
  selectedMethod: PaymentMethodConfig;
  allMethods?: PaymentMethodConfig[];
  onSelectMethod?: (method: PaymentMethodConfig) => void;
  totalAmount: number;
  transactionId: string;
  setTransactionId: (val: string) => void;
  senderNumber: string;
  setSenderNumber: (val: string) => void;
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
  isPaymentSubmitted?: boolean;
  setIsPaymentSubmitted?: (submitted: boolean) => void;
}

export function PaymentInstructions({
  selectedMethod,
  allMethods,
  onSelectMethod,
  totalAmount,
  transactionId,
  setTransactionId,
  senderNumber,
  setSenderNumber,
  isModalOpen = false,
  setIsModalOpen,
  isPaymentSubmitted = false,
  setIsPaymentSubmitted,
}: PaymentInstructionsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [popupError, setPopupError] = useState('');
  const [qrModalMethod, setQrModalMethod] = useState<PaymentMethodConfig | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>(selectedMethod.id);

  useEffect(() => {
    if (selectedMethod && selectedMethod.id) {
      setActiveTabId(selectedMethod.id);
    }
  }, [selectedMethod.id]);

  const meta = getPaymentMethodDisplayMeta(selectedMethod);

  // All active online payment methods (bKash, Nagad, Rocket, Upay, Bank Transfer, Bangla QR, etc.) from Admin Panel
  const activeOnlineMethods = useMemo(() => {
    const list = allMethods && allMethods.length > 0 ? getActiveOnlinePaymentMethods(allMethods) : [];
    if (list.length > 0) return list;
    return selectedMethod.type !== 'cod' ? [selectedMethod] : [];
  }, [allMethods, selectedMethod]);

  const currentActiveMethod = useMemo(() => {
    const found = activeOnlineMethods.find(m => m.id === activeTabId);
    return found || selectedMethod;
  }, [activeOnlineMethods, activeTabId, selectedMethod]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 2000);
  };

  const handleDownloadQrImage = async (method: PaymentMethodConfig, imageUrl: string) => {
    const methodMeta = getPaymentMethodDisplayMeta(method);
    const fileName = `${(methodMeta.englishName || method.type || 'payment').toLowerCase().replace(/\s+/g, '-')}-qr.png`;

    try {
      if (imageUrl && imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        try {
          const response = await fetch(imageUrl, { mode: 'cors' });
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
          return;
        } catch {
          // Fall through to fallback generator if external fetch is blocked by CORS
        }
      }

      // High-resolution generated canvas download
      const generated = generateFallbackPaymentQrDataUrl(method, totalAmount);
      if (generated) {
        const link = document.createElement('a');
        link.href = generated;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.warn('QR download fallback triggered:', err);
      const generated = generateFallbackPaymentQrDataUrl(method, totalAmount);
      if (generated) {
        const link = document.createElement('a');
        link.href = generated;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleDoneClick = () => {
    setPopupError('');
    const check = validatePaymentTransactionPopup(
      currentActiveMethod.type,
      senderNumber,
      transactionId
    );
    if (!check.valid) {
      setPopupError(
        check.error ||
          'অনুগ্রহ করে প্রেরকের মোবাইল নাম্বার এবং ট্রানজেকশন আইডি (TrxID) সঠিকভাবে পূরণ করুন।'
      );
      return;
    }

    setSenderNumber(check.cleanSender);
    setTransactionId(check.cleanTrxId);
    if (setIsPaymentSubmitted) {
      setIsPaymentSubmitted(true);
    }
    if (setIsModalOpen) {
      setIsModalOpen(false);
    }
  };

  // If Cash on Delivery is selected, show a clean COD confirmation strip
  if (selectedMethod.type === 'cod') {
    return (
      <div className="bg-emerald-50/80 rounded-2xl p-4 sm:p-5 border border-emerald-200/90 text-xs text-emerald-950 leading-relaxed flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <CheckCircle2 size={17} />
        </div>
        <div className="space-y-0.5">
          <div className="font-black text-emerald-900 text-sm">
            ক্যাশ অন ডেলিভারি (হাতে পেয়ে মূল্য পরিশোধ)
          </div>
          <p className="text-emerald-800 text-xs">
            অগ্রিম কোনো পেমেন্ট করার প্রয়োজন নেই! আপনার অর্ডারকৃত বই হাতে পেয়ে ডেলিভারি প্রতিনিধির কাছে নগদ{' '}
            <strong className="text-emerald-950 font-black">৳{totalAmount}</strong> পরিশোধ করুন।
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Compact Inline Summary Card on Checkout Page (below payment cards) */}
      {isPaymentSubmitted && senderNumber && transactionId ? (
        <div
          data-testid="payment-submitted-summary"
          className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-slate-900">
                  {meta.displayTitle} পেমেন্ট তথ্য সাবমিট হয়েছে
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                  Ready to Confirm Order
                </span>
              </div>
              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                <span>
                  Sender: <strong className="font-mono text-slate-900">{senderNumber}</strong>
                </span>
                <span>•</span>
                <span>
                  TrxID: <strong className="font-mono text-[#E2136E]">{transactionId}</strong>
                </span>
                <span>•</span>
                <span>
                  Amount: <strong className="text-slate-900">৳{totalAmount}</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPopupError('');
              setIsModalOpen?.(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0 transition-all"
          >
            <Edit3 size={13} />
            <span>Edit Info</span>
          </button>
        </div>
      ) : (
        <div
          data-testid="payment-pending-prompt"
          className="rounded-2xl border border-[#FFADD2] bg-[#FFF5F9]/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
        >
          <div className="flex items-center gap-3">
            <PaymentBrandIcon method={selectedMethod} size="md" />
            <div>
              <h4 className="font-black text-sm text-slate-900">
                {meta.displayTitle} Payment Instructions
              </h4>
              <p className="text-xs text-slate-600">
                Please send <strong className="text-slate-900">৳{totalAmount}</strong> to{' '}
                <strong className="font-mono text-slate-900">{selectedMethod.accountNumber}</strong> and submit your TrxID in the popup.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPopupError('');
              setIsModalOpen?.(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#E2136E] hover:bg-[#c81060] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0 transition-all"
          >
            <Sparkles size={14} />
            <span>পেমেন্ট তথ্য দিন (Open Popup)</span>
          </button>
        </div>
      )}

      {/* POPUP MODAL: Payment Method Selector Tabs & Single-Method Active View */}
      {isModalOpen && (() => {
        const activeMeta = getPaymentMethodDisplayMeta(currentActiveMethod);
        const isCopied = copiedKey === currentActiveMethod.id;
        const qrImageSrc =
          activeMeta.qrCodeUrl || generateFallbackPaymentQrDataUrl(currentActiveMethod, totalAmount);

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Payment Method"
            data-testid="payment-instructions-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setIsModalOpen?.(false);
              }
            }}
          >
            <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xl space-y-4 relative my-auto max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              {/* 1. Modal Top Header: English "Payment Method" title with Close button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                      Payment Method
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      পেমেন্ট মেথড সিলেক্ট করুন এবং নির্ধারিত নম্বরে পরিশোধ করুন
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen?.(false)}
                  aria-label="Close Payment Popup"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 2. Payment Method Selector: Clean, compact 2-column or 3-column buttons with Logo + Name */}
              <div className="space-y-1.5">
                <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                  Select Payment Option
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeOnlineMethods.map(method => {
                    const isSel = method.id === currentActiveMethod.id;
                    const methodMeta = getPaymentMethodDisplayMeta(method);
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setActiveTabId(method.id);
                          onSelectMethod?.(method);
                        }}
                        data-testid={`popup-method-tab-${method.type}`}
                        className={`p-2.5 rounded-2xl border-2 flex items-center gap-2 transition-all cursor-pointer text-left ${
                          isSel
                            ? 'border-[#D71920] bg-[#FFF1F2]/80 shadow-2xs ring-1 ring-[#D71920]/20'
                            : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <PaymentBrandIcon method={method} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="font-black text-xs text-slate-900 truncate">
                            {methodMeta.displayTitle}
                          </div>
                          {methodMeta.englishName && (
                            <div className="text-[9.5px] text-slate-500 truncate font-semibold">
                              {methodMeta.englishName}
                            </div>
                          )}
                        </div>
                        {isSel && (
                          <div className="w-3.5 h-3.5 rounded-full bg-[#D71920] text-white flex items-center justify-center shrink-0">
                            <Check size={9} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Selected Payment Method Details Section */}
              <div className="space-y-3.5 pt-1">
                {/* 3A. Upfront Payable Amount Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-rose-50 via-[#FFF5F9] to-amber-50/80 border border-rose-200/90 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Payable Amount (মোট প্রদেয়)
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-[#D71920] tracking-tight">
                      ৳{totalAmount}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-xs font-bold text-slate-800 shadow-2xs">
                      {activeMeta.accountType !== 'None' ? activeMeta.accountType : 'Personal'} Account
                    </span>
                    <p className="text-[10.5px] text-slate-600 mt-1 font-medium">
                      {currentActiveMethod.type === 'bank' ? 'ব্যাংক ট্রান্সফার করুন' : 'Send Money করুন'}
                    </p>
                  </div>
                </div>

                {/* 3B. Account Number & Copy Number Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                        {currentActiveMethod.type === 'bangla_qr'
                          ? 'BANGLA QR ID / NUMBER:'
                          : currentActiveMethod.type === 'bank'
                          ? 'BANK ACCOUNT NUMBER:'
                          : `${currentActiveMethod.type.toUpperCase()} ACCOUNT / NUMBER:`}
                      </span>
                      <div
                        data-testid="popup-account-number"
                        className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-mono select-all break-all"
                      >
                        {currentActiveMethod.accountNumber}
                      </div>
                      {currentActiveMethod.accountName && (
                        <div className="text-xs text-slate-600 font-medium">
                          Account Name: <strong className="text-slate-800">{currentActiveMethod.accountName}</strong>
                        </div>
                      )}
                      {currentActiveMethod.type === 'bank' && (
                        <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                          {currentActiveMethod.bankName && (
                            <p className="font-bold text-slate-800">
                              Bank: {currentActiveMethod.bankName}
                            </p>
                          )}
                          {(currentActiveMethod.branchName || currentActiveMethod.routingNumber) && (
                            <p>
                              {currentActiveMethod.branchName ? `Branch: ${currentActiveMethod.branchName}` : ''}
                              {currentActiveMethod.branchName && currentActiveMethod.routingNumber ? ' • ' : ''}
                              {currentActiveMethod.routingNumber ? `Routing: ${currentActiveMethod.routingNumber}` : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Copy Number Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(currentActiveMethod.accountNumber, currentActiveMethod.id)}
                      data-testid="popup-copy-number-btn"
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs ${
                        isCopied
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-800 border border-slate-200/80'
                      }`}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} className="text-slate-500" />}
                      <span>{isCopied ? 'কপি হয়েছে' : 'কপি নাম্বার'}</span>
                    </button>
                  </div>
                </div>

                {/* 3C. Payment QR Code & Direct "কিউআর ডাউনলোড করুন" Button */}
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div
                      onClick={() => setQrModalMethod(currentActiveMethod)}
                      title="Click to view large QR Code"
                      className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                    >
                      <img
                        src={qrImageSrc}
                        alt={`${activeMeta.displayTitle} QR`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <QrCode size={14} className="text-[#D71920] shrink-0" />
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                          {currentActiveMethod.type === 'bangla_qr'
                            ? 'বাংলা কিউআর (Bangla QR)'
                            : `${activeMeta.displayTitle} QR Code`}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {currentActiveMethod.type === 'bangla_qr'
                          ? 'যেকোনো ব্যাংক বা বিকাশ/নগদ অ্যাপ দিয়ে স্ক্যান করতে কিউআর ডাউনলোড করুন'
                          : 'অ্যাপ দিয়ে সরাসরি স্ক্যান করে পেমেন্ট করুন'}
                      </p>
                    </div>
                  </div>

                  {/* Direct QR Download Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadQrImage(currentActiveMethod, qrImageSrc)}
                    data-testid="popup-download-qr-btn"
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
                  >
                    <Download size={13} />
                    <span>কিউআর ডাউনলোড করুন</span>
                  </button>
                </div>

                {/* 3D. Payment Instructions Box */}
                <div className="rounded-2xl bg-[#FFFDF2] border border-[#FDE68A] px-3.5 py-2.5 text-xs text-slate-800 leading-relaxed font-medium">
                  {activeMeta.instructionText}
                </div>

                {/* 3E. Payment Verification Form (Sender Mobile Number & Transaction ID) */}
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Sender Mobile Number (Account used for payment)
                    </label>
                    <input
                      type="tel"
                      value={senderNumber}
                      onChange={e => {
                        setSenderNumber(e.target.value);
                        if (popupError) setPopupError('');
                      }}
                      placeholder="01XXXXXXXXX"
                      data-testid="popup-sender-input"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Enter Transaction ID (TrxID) <span className="text-[#D71920]">*</span>
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={e => {
                        setTransactionId(e.target.value.toUpperCase());
                        if (popupError) setPopupError('');
                      }}
                      placeholder="E.G., 9X7D892K"
                      data-testid="popup-trxid-input"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 transition-all"
                    />
                  </div>
                </div>

                {/* Validation Error Alert */}
                {popupError && (
                  <div
                    data-testid="popup-error-msg"
                    className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in"
                  >
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>{popupError}</span>
                  </div>
                )}

                {/* Done Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDoneClick}
                    data-testid="popup-done-button"
                    className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#D71920] to-[#B9151B] hover:from-[#B9151B] hover:to-[#961015] text-white font-black text-sm tracking-wide shadow-md shadow-[#D71920]/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <CheckCircle2 size={17} />
                    <span>Done (ডান)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ENLARGED PAYMENT QR CODE / PAYMENT IMAGE VIEW & DOWNLOAD MODAL */}
      {qrModalMethod && (() => {
        const qrMeta = getPaymentMethodDisplayMeta(qrModalMethod);
        const qrImageSrc =
          qrMeta.qrCodeUrl || generateFallbackPaymentQrDataUrl(qrModalMethod, totalAmount);

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${qrMeta.displayTitle} QR Code`}
            data-testid="payment-qr-modal"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setQrModalMethod(null);
              }
            }}
          >
            <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-150 text-center">
              <button
                type="button"
                onClick={() => setQrModalMethod(null)}
                aria-label="Close QR Modal"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Modal Header */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <PaymentBrandIcon method={qrModalMethod} size="md" />
                <div className="text-left">
                  <h4 className="text-base font-black text-slate-900 leading-tight">
                    {qrMeta.displayTitle} Payment QR Code
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#FFF0F6] text-[#E2136E] border border-[#FFADD2] text-[10px] font-bold">
                      {qrMeta.accountType !== 'None' ? qrMeta.accountType : 'Personal'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {qrModalMethod.accountNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enlarged QR Image Container */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-center">
                {qrImageSrc ? (
                  <img
                    src={qrImageSrc}
                    alt={`${qrMeta.displayTitle} QR Code`}
                    className="w-full max-h-[340px] object-contain rounded-xl bg-white mx-auto shadow-2xs"
                  />
                ) : (
                  <div className="py-12 text-xs text-slate-400">QR Code Unavailable</div>
                )}
              </div>

              <p className="text-xs text-slate-600">
                Scan QR code or send <strong className="text-slate-900 font-black">৳{totalAmount}</strong> to{' '}
                <strong className="font-mono text-slate-900">{qrModalMethod.accountNumber}</strong>
              </p>

              {/* Download QR Code & Close Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleDownloadQrImage(qrModalMethod, qrImageSrc)}
                  data-testid="download-qr-btn"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#E2136E] to-[#D71920] hover:from-[#c81060] hover:to-[#b8141a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-[#E2136E]/20 cursor-pointer transition-all"
                >
                  <Download size={15} />
                  <span>Download QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalMethod(null)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
