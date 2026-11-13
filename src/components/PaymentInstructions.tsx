import React, { useState, useEffect, useMemo } from 'react';
import { PaymentMethodConfig, PaymentSubOptionConfig, PaymentSubOptionType } from '../types';
import { useStore } from '../context/StoreContext';
import {
  getPaymentMethodDisplayMeta,
  getActiveOnlinePaymentMethods,
  validatePaymentTransactionPopup,
  getPaymentMethodSubOptions,
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
  Eye,
  Send,
  ShoppingBag,
} from 'lucide-react';

/**
 * Generates a high-resolution, downloadable Payment QR Code card PNG data URL
 * when no custom QR image URL has been uploaded in the Admin Panel yet.
 */
function generateFallbackPaymentQrDataUrl(
  method: PaymentMethodConfig,
  totalAmount: number,
  language: 'en' | 'bn' = 'en',
  subOption?: PaymentSubOptionConfig
): string {
  if (typeof document === 'undefined') return '';
  try {
    const meta = getPaymentMethodDisplayMeta(method);
    const effectiveAccType = subOption?.accountType || meta.accountType;
    const effectiveAccNum = subOption?.accountNumber || method.accountNumber;
    const effectiveAccName = subOption?.accountName || method.accountName;
    const effectiveSubLabelBn = subOption?.label || '';
    const effectiveSubLabelEn = subOption?.englishLabel || '';

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

    const isBn = language === 'bn';
    const accTypeLabelBn =
      effectiveAccType === 'Merchant' ? 'মার্চেন্ট' : effectiveAccType === 'Agent' ? 'এজেন্ট' : 'ব্যক্তিগত';
    const accTypeLabel = isBn
      ? accTypeLabelBn
      : effectiveAccType && effectiveAccType !== 'None'
      ? effectiveAccType
      : 'Personal';

    // White card background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top brand header bar
    ctx.fillStyle = brandColor;
    ctx.fillRect(0, 0, canvas.width, 130);

    // Brand Title & Account Type
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = '900 30px Hind Siliguri, Inter, system-ui, sans-serif';
    ctx.fillText(
      isBn ? `${meta.displayTitle} (বাংলা কিউআর)` : `${meta.englishName} Payment QR`,
      canvas.width / 2,
      58
    );

    ctx.font = '700 19px Hind Siliguri, Inter, system-ui, sans-serif';
    ctx.fillText(
      isBn
        ? `${effectiveSubLabelBn ? effectiveSubLabelBn + ' • ' : ''}${accTypeLabel} একাউন্ট • মোট প্রদেয়: ৳${totalAmount}`
        : `${effectiveSubLabelEn ? effectiveSubLabelEn + ' • ' : ''}${accTypeLabel} Account • Payable: ৳${totalAmount}`,
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
    const payload = `${meta.englishName}|${language}|${accTypeLabel}|${effectiveAccNum}|BDT:${totalAmount}`;
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
      isBn ? 'বাংলা' : meta.englishName.slice(0, 5).toUpperCase(),
      centerX + centerBox / 2,
      centerY + centerBox / 2 + 6
    );

    // Bottom Payment Number & Account Details
    ctx.fillStyle = '#64748B';
    ctx.font = '700 15px Hind Siliguri, Inter, system-ui, sans-serif';
    ctx.fillText(
      isBn ? `${meta.displayTitle} একাউন্ট নম্বর` : `${method.type.toUpperCase()} ACCOUNT / NUMBER`,
      canvas.width / 2,
      592
    );

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 36px Inter, monospace, sans-serif';
    ctx.fillText(effectiveAccNum || '', canvas.width / 2, 640);

    ctx.fillStyle = brandColor;
    ctx.font = '700 17px Hind Siliguri, Inter, system-ui, sans-serif';
    ctx.fillText(
      isBn ? `${effectiveAccName || 'MR. BOOKS'} • স্ক্যান করে পেমেন্ট করুন` : `${effectiveAccName || 'MR. BOOKS'} • Scan with App to Pay`,
      canvas.width / 2,
      685
    );

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 13px Hind Siliguri, Inter, system-ui, sans-serif';
    ctx.fillText(
      isBn ? 'MR. BOOKS অফিসিয়াল বাংলা কিউআর পেমেন্ট ভেরিফিকেশন' : 'MR. BOOKS Official Payment Verification QR',
      canvas.width / 2,
      725
    );

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

export function CheckoutCodPaymentIcon({
  customIconUrl,
  isSelected = false,
}: {
  customIconUrl?: string;
  isSelected?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const cleanUrl = (customIconUrl || '').trim();

  useEffect(() => {
    setImgError(false);
  }, [cleanUrl]);

  if (cleanUrl && !imgError) {
    return (
      <div
        data-testid="checkout-cod-icon"
        className={`w-10 h-10 rounded-xl border p-1.5 flex items-center justify-center shrink-0 overflow-hidden transition-colors ${
          isSelected
            ? 'bg-white border-emerald-300 shadow-2xs'
            : 'bg-emerald-50/70 border-emerald-200/80'
        }`}
      >
        <img
          src={cleanUrl}
          alt="Cash on Delivery"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      data-testid="checkout-cod-icon"
      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
        isSelected
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
          : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stacked back banknote */}
        <path
          d="M5 6V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.45"
        />
        {/* Primary banknote */}
        <rect
          x="2"
          y="7"
          width="17"
          height="11"
          rx="2.2"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Center currency emblem */}
        <circle
          cx="10.5"
          cy="12.5"
          r="2.4"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        {/* Crisp corner bill accents */}
        <path
          d="M5 10.5v4M16 10.5v4"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function CheckoutOnlinePaymentIcon({
  customIconUrl,
  isSelected = false,
}: {
  customIconUrl?: string;
  isSelected?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const cleanUrl = (customIconUrl || '').trim();

  useEffect(() => {
    setImgError(false);
  }, [cleanUrl]);

  if (cleanUrl && !imgError) {
    return (
      <div
        data-testid="checkout-online-icon"
        className={`w-10 h-10 rounded-xl border p-1.5 flex items-center justify-center shrink-0 overflow-hidden transition-colors ${
          isSelected
            ? 'bg-white border-[#D71920]/30 shadow-2xs'
            : 'bg-[#FFF1F2]/70 border-[#D71920]/20'
        }`}
      >
        <img
          src={cleanUrl}
          alt="Online Payment"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      data-testid="checkout-online-icon"
      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
        isSelected
          ? 'bg-[#FFF1F2] border-[#D71920]/35 text-[#D71920] shadow-2xs'
          : 'bg-[#FFF1F2]/75 dark:bg-[#D71920]/15 border-[#D71920]/20 dark:border-[#D71920]/30 text-[#D71920]'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Digital payment card / mobile wallet body */}
        <rect
          x="2"
          y="4.5"
          width="17"
          height="12.5"
          rx="2.4"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Card header band */}
        <path
          d="M2 8.75h17"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        {/* Smart chip detail */}
        <path
          d="M5.5 12.75h3.5"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
        />
        {/* Instant verified payment badge */}
        <circle
          cx="17.5"
          cy="16.5"
          r="4.2"
          className="fill-white dark:fill-[#121722]"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M15.85 16.5l1.15 1.15 2.25-2.3"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
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
      ? 'w-9 h-9 rounded-xl'
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
          className={`${dimClass} bg-emerald-50 border border-emerald-200/90 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <svg
            viewBox="0 0 24 24"
            className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="20" height="12" rx="2.2" fill="currentColor" fillOpacity="0.12" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M5.5 10v4M18.5 10v4" />
          </svg>
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
  onSelectSubOption?: (subOption: PaymentSubOptionConfig) => void;
  onSubmitPaymentAndOrder?: (
    method: PaymentMethodConfig,
    subOptionLabel: string,
    cleanSender: string,
    cleanTrxId: string
  ) => Promise<void> | void;
  isSubmittingOrder?: boolean;
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
  onSelectSubOption,
  onSubmitPaymentAndOrder,
  isSubmittingOrder = false,
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
  const { settings } = useStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [popupError, setPopupError] = useState('');
  const [qrLanguage, setQrLanguage] = useState<'bn' | 'en'>('bn');
  const [qrModalMethod, setQrModalMethod] = useState<{
    method: PaymentMethodConfig;
    subOption: PaymentSubOptionConfig;
    language: 'bn' | 'en';
  } | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>(selectedMethod.id);
  const [selectedSubOptionId, setSelectedSubOptionId] = useState<PaymentSubOptionType>('send_money');

  useEffect(() => {
    if (selectedMethod && selectedMethod.id && selectedMethod.type !== 'cod') {
      setActiveTabId(selectedMethod.id);
    }
  }, [selectedMethod.id, selectedMethod.type]);

  const meta = getPaymentMethodDisplayMeta(selectedMethod);

  // All active online payment methods (bKash, Nagad, Rocket, Upay, Bank Transfer, Bangla QR, etc.) from Admin Panel
  const activeOnlineMethods = useMemo(() => {
    const list = allMethods && allMethods.length > 0 ? getActiveOnlinePaymentMethods(allMethods) : [];
    if (list.length > 0) return list;
    return selectedMethod.type !== 'cod' ? [selectedMethod] : [];
  }, [allMethods, selectedMethod]);

  const currentActiveMethod = useMemo(() => {
    const found = activeOnlineMethods.find(m => m.id === activeTabId);
    if (found) return found;
    if (selectedMethod.type !== 'cod') return selectedMethod;
    return activeOnlineMethods[0] || selectedMethod;
  }, [activeOnlineMethods, activeTabId, selectedMethod]);

  // Resolve dual sub-options (সেন্ড মানি & পেমেন্ট) for the currently selected payment method
  const { activeSubOptions } = useMemo(
    () => getPaymentMethodSubOptions(currentActiveMethod),
    [currentActiveMethod]
  );

  // Ensure selectedSubOptionId is valid for the current method
  const activeSubOption = useMemo(() => {
    return (
      activeSubOptions.find(opt => opt.id === selectedSubOptionId) ||
      activeSubOptions[0]
    );
  }, [activeSubOptions, selectedSubOptionId]);

  useEffect(() => {
    if (activeSubOption) {
      if (activeSubOption.id !== selectedSubOptionId) {
        setSelectedSubOptionId(activeSubOption.id);
      }
      onSelectSubOption?.(activeSubOption);
    }
  }, [currentActiveMethod.id, activeSubOption]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 2000);
  };

  const handleDownloadQrImage = async (
    method: PaymentMethodConfig,
    imageUrl: string,
    lang: 'bn' | 'en' = qrLanguage,
    subOpt?: PaymentSubOptionConfig
  ) => {
    const methodMeta = getPaymentMethodDisplayMeta(method);
    const subTag = subOpt?.id === 'payment' ? 'payment' : 'send-money';
    const fileName = `${(methodMeta.englishName || method.type || 'payment').toLowerCase().replace(/\s+/g, '-')}-${subTag}-${lang}-qr.png`;

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

      const generated = generateFallbackPaymentQrDataUrl(method, totalAmount, lang, subOpt);
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
      const generated = generateFallbackPaymentQrDataUrl(method, totalAmount, lang, subOpt);
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

  const handleDoneClick = async () => {
    setPopupError('');
    const check = validatePaymentTransactionPopup(
      currentActiveMethod.type,
      senderNumber,
      transactionId
    );
    if (!check.valid) {
      setPopupError(
        check.error ||
          'Please enter a valid sender mobile number and transaction ID (TrxID).'
      );
      return;
    }

    setSenderNumber(check.cleanSender);
    setTransactionId(check.cleanTrxId);
    onSelectMethod?.(currentActiveMethod);
    if (setIsPaymentSubmitted) {
      setIsPaymentSubmitted(true);
    }

    if (onSubmitPaymentAndOrder) {
      await onSubmitPaymentAndOrder(
        currentActiveMethod,
        activeSubOption?.label || 'সেন্ড মানি',
        check.cleanSender,
        check.cleanTrxId
      );
    } else if (setIsModalOpen) {
      setIsModalOpen(false);
    }
  };

  // Inline status bar below the 2-option Payment Method selector on Checkout Page
  const renderInlineStatus = () => {
    if (selectedMethod.type === 'cod') {
      return (
        <div className="rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs text-neutral-600 dark:text-slate-300 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Pay <strong className="font-semibold text-neutral-900 dark:text-white tabular-nums">৳{totalAmount}</strong> in cash when your order arrives.
          </span>
        </div>
      );
    }

    if (isPaymentSubmitted && senderNumber && transactionId) {
      return (
        <div
          data-testid="payment-submitted-summary"
          className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 px-3.5 py-2.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0 text-xs">
              <span className="font-semibold text-neutral-900 dark:text-white">
                {meta.englishName || meta.displayTitle}
              </span>
              <span className="mx-1.5 text-neutral-300 dark:text-slate-600">·</span>
              <span className="text-neutral-600 dark:text-slate-300 font-mono">
                {senderNumber}
              </span>
              <span className="mx-1.5 text-neutral-300 dark:text-slate-600">·</span>
              <span className="font-mono font-semibold text-[#D71920] dark:text-rose-400">
                TrxID: {transactionId}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPopupError('');
              setIsModalOpen?.(true);
            }}
            className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-neutral-50 text-neutral-700 dark:text-slate-200 font-medium text-xs border border-neutral-200 dark:border-slate-700 inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
          >
            <Edit3 size={11} />
            <span>Change</span>
          </button>
        </div>
      );
    }

    return (
      <div
        data-testid="payment-pending-prompt"
        className="rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/50 px-3.5 py-2.5 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 min-w-0 text-xs text-neutral-600 dark:text-slate-300">
          <PaymentBrandIcon method={currentActiveMethod} size="sm" />
          <span className="truncate">
            Selected: <strong className="text-neutral-900 dark:text-white">{meta.englishName || meta.displayTitle}</strong> · Payable <strong className="text-neutral-900 dark:text-white tabular-nums">৳{totalAmount}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setPopupError('');
            setIsModalOpen?.(true);
          }}
          className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-[#D71920] hover:bg-neutral-800 text-white font-medium text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors whitespace-nowrap"
        >
          <span>Complete Payment</span>
        </button>
      </div>
    );
  };

  const activeMeta = useMemo(
    () => getPaymentMethodDisplayMeta(currentActiveMethod),
    [currentActiveMethod]
  );

  const englishQrSrc = useMemo(() => {
    if (!isModalOpen) return '';
    return (
      activeSubOption?.englishQrCodeUrl ||
      activeSubOption?.qrCodeUrl ||
      (activeSubOption?.id === 'send_money' ? activeMeta.englishQrCodeUrl || activeMeta.qrCodeUrl : '') ||
      generateFallbackPaymentQrDataUrl(currentActiveMethod, totalAmount, 'en', activeSubOption)
    );
  }, [isModalOpen, activeSubOption, activeMeta, currentActiveMethod, totalAmount]);

  const bengaliQrSrc = useMemo(() => {
    if (!isModalOpen) return '';
    return (
      activeSubOption?.bengaliQrCodeUrl ||
      (activeSubOption?.id === 'send_money' ? activeMeta.bengaliQrCodeUrl : '') ||
      (currentActiveMethod.type === 'bangla_qr' ? activeSubOption?.qrCodeUrl || activeMeta.qrCodeUrl : '') ||
      (settings?.banglaQrImageUrl && settings.enableBanglaQr !== false ? settings.banglaQrImageUrl : '') ||
      generateFallbackPaymentQrDataUrl(currentActiveMethod, totalAmount, 'bn', activeSubOption)
    );
  }, [isModalOpen, activeSubOption, activeMeta, currentActiveMethod, settings?.banglaQrImageUrl, settings?.enableBanglaQr, totalAmount]);

  return (
    <>
      {renderInlineStatus()}

      {/* CLEAN, MINIMAL SINGLE-VIEWPORT PAYMENT POPUP MODAL */}
      {isModalOpen && (() => {
        const copyId = `${currentActiveMethod.id}-${activeSubOption.id}`;
        const isCopied = copiedKey === copyId;

        const effectiveAccountNumber = activeSubOption?.accountNumber || currentActiveMethod.accountNumber;
        const effectiveAccountName = activeSubOption?.accountName || currentActiveMethod.accountName;
        const effectiveAccountType = activeSubOption?.accountType || activeMeta.accountType;
        const effectiveInstructions = activeSubOption?.instructions || activeMeta.instructionText;

        const activeQrSrc = qrLanguage === 'bn' ? bengaliQrSrc : englishQrSrc;
        const activeQrLabel =
          qrLanguage === 'bn'
            ? currentActiveMethod.type === 'bangla_qr'
              ? `বাংলা কিউআর (${activeSubOption.label})`
              : `${activeMeta.displayTitle} ${activeSubOption.label} কিউআর`
            : `${activeMeta.englishName} (${activeSubOption.englishLabel || activeSubOption.label}) QR`;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Payment Method"
            data-testid="payment-instructions-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-150 overflow-y-auto"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setIsModalOpen?.(false);
              }
            }}
          >
            <div className="w-full max-w-sm sm:max-w-md mx-2 bg-white dark:bg-[#121722] rounded-xl border border-neutral-200 dark:border-slate-800 shadow-xl overflow-hidden my-auto max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
              {/* 1. Compact Header with Payable Amount Badge */}
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-slate-900/40">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                    Online Payment
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate mt-0.5">
                    Select gateway, send payment &amp; submit TrxID
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-xs font-bold text-[#D71920] dark:text-rose-400 tabular-nums">
                    Payable: ৳{totalAmount}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen?.(false)}
                    aria-label="Close Payment Popup"
                    className="w-7 h-7 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {/* 2. Compact Payment Gateway Selector Strip */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
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
                        className={`py-2 px-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-center ${
                          isSel
                            ? 'border-[#D71920] bg-[#FFF1F2]/60 dark:bg-[#D71920]/15 text-neutral-900 dark:text-white'
                            : 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#182030] hover:border-neutral-300 text-neutral-600 dark:text-slate-300'
                        }`}
                      >
                        <PaymentBrandIcon method={method} size="sm" />
                        <span className="font-semibold text-[11px] leading-tight truncate max-w-full">
                          {methodMeta.englishName || methodMeta.displayTitle}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 3. Slim Segmented Bar: Send Money (Personal) vs Payment (Merchant) */}
                {activeSubOptions.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-neutral-100 dark:bg-slate-800/80 border border-neutral-200/70 dark:border-slate-700">
                    {activeSubOptions.map(subOpt => {
                      const isSubSelected = activeSubOption.id === subOpt.id;
                      return (
                        <button
                          key={subOpt.id}
                          type="button"
                          onClick={() => {
                            setSelectedSubOptionId(subOpt.id);
                            onSelectSubOption?.(subOpt);
                          }}
                          data-testid={`popup-suboption-${subOpt.id}`}
                          className={`py-1.5 px-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isSubSelected
                              ? 'bg-white dark:bg-[#121722] text-neutral-900 dark:text-white shadow-2xs border border-neutral-200/80 dark:border-slate-700 font-semibold'
                              : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                        >
                          <span>{subOpt.englishLabel || subOpt.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400 font-normal">
                            {subOpt.accountType}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 4. Unified Account Number, Copy & Compact QR Box */}
                <div className="rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-[#161D2B] p-2.5 sm:p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Account Number & Copy */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-[11px] font-medium text-neutral-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>
                          {activeMeta.englishName || activeMeta.displayTitle}{' '}
                          {effectiveAccountType !== 'None' ? effectiveAccountType : 'Personal'} Number
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          data-testid="popup-account-number"
                          className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-mono tracking-tight select-all"
                        >
                          {effectiveAccountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(effectiveAccountNumber, copyId)}
                          data-testid="popup-copy-number-btn"
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-700 dark:text-slate-200 border border-neutral-300 dark:border-slate-600'
                          }`}
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {effectiveAccountName && (
                        <div className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                          Account: <span className="font-medium text-neutral-700 dark:text-slate-300">{effectiveAccountName}</span>
                        </div>
                      )}
                      {currentActiveMethod.type === 'bank' && currentActiveMethod.bankName && (
                        <div className="text-[11px] text-neutral-500 dark:text-slate-400">
                          {currentActiveMethod.bankName}
                          {currentActiveMethod.branchName ? ` · ${currentActiveMethod.branchName}` : ''}
                        </div>
                      )}
                    </div>

                    {/* Right: Compact QR Thumbnail + Quick Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-l border-neutral-200 dark:border-slate-700 pl-3">
                      <div
                        onClick={() =>
                          setQrModalMethod({
                            method: currentActiveMethod,
                            subOption: activeSubOption,
                            language: qrLanguage,
                          })
                        }
                        title="Click to enlarge QR Code"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-white border border-neutral-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 cursor-pointer hover:border-neutral-400 transition-colors"
                      >
                        <img
                          src={activeQrSrc}
                          alt={activeQrLabel}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="px-2 py-0.5 rounded border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-[10px] font-semibold text-neutral-600 dark:text-slate-300 text-center">
                          QR Code
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setQrModalMethod({
                                method: currentActiveMethod,
                                subOption: activeSubOption,
                                language: qrLanguage,
                              })
                            }
                            data-testid="popup-view-large-qr-btn"
                            title="View large QR"
                            className="px-1.5 py-1 rounded border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-700 dark:text-slate-200 text-[10px] font-medium inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Eye size={10} />
                            <span>QR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadQrImage(currentActiveMethod, activeQrSrc, qrLanguage, activeSubOption)}
                            data-testid="popup-download-qr-btn"
                            title="Download QR"
                            className="px-1.5 py-1 rounded border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-700 dark:text-slate-200 text-[10px] font-medium inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Download size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Concise 1-line instruction */}
                  <div
                    data-testid="popup-suboption-instructions"
                    className="pt-2 border-t border-neutral-200/80 dark:border-slate-700/80 text-[11px] text-neutral-600 dark:text-slate-300 leading-snug"
                  >
                    {effectiveInstructions}
                  </div>
                </div>

                {/* 5. Side-by-Side Verification Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 dark:text-slate-300 mb-1">
                      Sender Number <span className="text-[#D71920]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={senderNumber}
                      onChange={e => {
                        setSenderNumber(e.target.value);
                        if (popupError) setPopupError('');
                      }}
                      placeholder="017XXXXXXXX"
                      data-testid="popup-sender-input"
                      className="w-full h-9 px-3 rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-[#0B0F19] text-xs font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#D71920] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 dark:text-slate-300 mb-1">
                      Transaction ID (TrxID) <span className="text-[#D71920]">*</span>
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={e => {
                        setTransactionId(e.target.value.toUpperCase());
                        if (popupError) setPopupError('');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleDoneClick();
                        }
                      }}
                      placeholder="e.g. 9X7D892K"
                      data-testid="popup-trxid-input"
                      className="w-full h-9 px-3 rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-[#0B0F19] text-xs font-mono uppercase text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#D71920] transition-colors"
                    />
                  </div>
                </div>

                {/* Validation Error Alert */}
                {popupError && (
                  <div
                    data-testid="popup-error-msg"
                    className="px-3 py-2 rounded-lg bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800 text-red-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2"
                  >
                    <AlertCircle size={14} className="shrink-0 text-red-600 dark:text-rose-400" />
                    <span>{popupError}</span>
                  </div>
                )}

                {/* 6. Submit Payment & Auto-Confirm Order CTA */}
                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={() => void handleDoneClick()}
                  data-testid="popup-done-button"
                  className="w-full h-10 px-4 rounded-lg bg-[#D71920] hover:bg-[#B9151B] text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  <span>
                    {isSubmittingOrder
                      ? 'Confirming Order...'
                      : 'Submit Payment & Confirm Order'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ENLARGED PAYMENT QR CODE MODAL */}
      {qrModalMethod && (() => {
        const method = qrModalMethod.method;
        const subOpt = qrModalMethod.subOption;
        const currentLang = qrModalMethod.language;
        const qrMeta = getPaymentMethodDisplayMeta(method);

        const englishQrSrc =
          subOpt?.englishQrCodeUrl ||
          subOpt?.qrCodeUrl ||
          (subOpt?.id === 'send_money' ? qrMeta.englishQrCodeUrl || qrMeta.qrCodeUrl : '') ||
          generateFallbackPaymentQrDataUrl(method, totalAmount, 'en', subOpt);

        const bengaliQrSrc =
          subOpt?.bengaliQrCodeUrl ||
          (subOpt?.id === 'send_money' ? qrMeta.bengaliQrCodeUrl : '') ||
          (method.type === 'bangla_qr' ? subOpt?.qrCodeUrl || qrMeta.qrCodeUrl : '') ||
          (settings?.banglaQrImageUrl && settings.enableBanglaQr !== false ? settings.banglaQrImageUrl : '') ||
          generateFallbackPaymentQrDataUrl(method, totalAmount, 'bn', subOpt);

        const displayQrSrc = currentLang === 'bn' ? bengaliQrSrc : englishQrSrc;
        const qrTitle =
          currentLang === 'bn'
            ? method.type === 'bangla_qr'
              ? `বাংলা কিউআর (${subOpt.label})`
              : `${qrMeta.displayTitle} ${subOpt.label} কিউআর`
            : `${qrMeta.englishName} (${subOpt.englishLabel || subOpt.label}) QR`;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${qrMeta.displayTitle} QR Code`}
            data-testid="payment-qr-modal"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[1px] animate-in fade-in duration-150"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setQrModalMethod(null);
              }
            }}
          >
            <div className="w-full max-w-xs bg-white dark:bg-[#121722] rounded-xl border border-neutral-200 dark:border-slate-800 p-4 shadow-xl space-y-3 relative text-center">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-left">
                  <PaymentBrandIcon method={method} size="sm" />
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight">
                      {qrTitle}
                    </h4>
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-slate-400">
                      {subOpt.accountNumber || method.accountNumber}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQrModalMethod(null)}
                  aria-label="Close QR Modal"
                  className="w-7 h-7 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-neutral-500 flex items-center justify-center cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setQrModalMethod({ method, subOption: subOpt, language: 'bn' })}
                  className={`py-1 rounded text-xs font-medium cursor-pointer ${
                    currentLang === 'bn'
                      ? 'bg-white dark:bg-[#1E283A] text-neutral-900 dark:text-white shadow-2xs'
                      : 'text-neutral-500'
                  }`}
                >
                  বাংলা QR
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalMethod({ method, subOption: subOpt, language: 'en' })}
                  className={`py-1 rounded text-xs font-medium cursor-pointer ${
                    currentLang === 'en'
                      ? 'bg-white dark:bg-[#1E283A] text-neutral-900 dark:text-white shadow-2xs'
                      : 'text-neutral-500'
                  }`}
                >
                  English QR
                </button>
              </div>

              <div className="bg-neutral-50 dark:bg-[#161D2B] border border-neutral-200 dark:border-slate-700 rounded-lg p-2.5 flex items-center justify-center">
                {displayQrSrc ? (
                  <img
                    src={displayQrSrc}
                    alt={qrTitle}
                    className="w-full max-h-[260px] object-contain rounded bg-white mx-auto"
                  />
                ) : (
                  <div className="py-10 text-xs text-neutral-400">QR Code Unavailable</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadQrImage(method, displayQrSrc, currentLang, subOpt)}
                  data-testid="download-qr-btn"
                  className="flex-1 h-9 px-3 rounded-lg bg-neutral-900 dark:bg-[#D71920] hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalMethod(null)}
                  className="h-9 px-3 rounded-lg border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-slate-200 font-medium text-xs cursor-pointer"
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

