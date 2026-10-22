import React, { useState, useEffect } from 'react';
import { PaymentMethodConfig } from '../types';
import {
   getPaymentMethodDisplayMeta,
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
} from 'lucide-react';

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
  const [copied, setCopied] = useState(false);
  const [popupError, setPopupError] = useState('');

  const meta = getPaymentMethodDisplayMeta(selectedMethod);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDoneClick = () => {
    setPopupError('');
    const check = validatePaymentTransactionPopup(
      selectedMethod.type,
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

  const accountLabel = `${selectedMethod.type.toUpperCase()} ACCOUNT / NUMBER:`;

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

      {/* POPUP MODAL matching Demo Image 3 (image_b58ae1c7.png) with "Done" Button */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${meta.displayTitle} Payment Instructions`}
          data-testid="payment-instructions-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setIsModalOpen?.(false);
            }
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-2xl space-y-5 relative my-auto animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen?.(false)}
              aria-label="Close Payment Popup"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header: Icon + "{Method} Payment Instructions" + "Personal" Badge + Subtitle */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 pr-8">
              <PaymentBrandIcon method={selectedMethod} size="lg" />
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {meta.displayTitle} Payment Instructions
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FFF0F6] text-[#E2136E] border border-[#FFADD2] text-xs font-bold">
                    {selectedMethod.accountType || 'Personal'}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-snug">
                  Please send <strong className="text-slate-900 font-black">৳{totalAmount}</strong> to the number below and submit payment info:
                </p>
              </div>
            </div>

            {/* Account / Number Card with Copy Number Button */}
            <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  {accountLabel}
                </span>
                <div
                  data-testid="popup-account-number"
                  className="text-lg sm:text-xl font-black text-slate-900 tracking-tight select-all break-all"
                >
                  {selectedMethod.accountNumber}
                </div>
                {selectedMethod.type === 'bank' && selectedMethod.bankName && (
                  <p className="text-[11px] text-slate-500">
                    {selectedMethod.bankName} ({selectedMethod.accountName})
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCopy(selectedMethod.accountNumber)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-800 border border-slate-200/80'
                }`}
              >
                {copied ? <Check size={15} /> : <Copy size={15} className="text-slate-500" />}
                <span>{copied ? 'Copied!' : 'Copy Number'}</span>
              </button>
            </div>

            {/* Warm Amber Instruction Box */}
            <div className="rounded-2xl bg-[#FFFDF2] border border-[#FDE68A] px-4 py-3.5 text-xs sm:text-[13.5px] text-slate-900 leading-relaxed font-medium">
              {meta.instructionText}
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-[13px] font-bold text-slate-800 mb-1.5">
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E2136E] focus:ring-2 focus:ring-[#E2136E]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-bold text-slate-800 mb-1.5">
                  Enter Transaction ID (TrxID) <span className="text-[#E2136E]">*</span>
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E2136E] focus:ring-2 focus:ring-[#E2136E]/15 transition-all"
                />
              </div>
            </div>

            {popupError && (
              <div
                data-testid="popup-error-msg"
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2"
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
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#E2136E] to-[#D71920] hover:from-[#c81060] hover:to-[#b8141a] text-white font-black text-sm tracking-wide shadow-lg shadow-[#E2136E]/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 size={18} />
                <span>Done (ডান)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

