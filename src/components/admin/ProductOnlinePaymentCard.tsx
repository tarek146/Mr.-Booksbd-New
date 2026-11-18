import React, { useEffect, useState } from 'react';
import {
  clampOnlinePaymentPercent,
  ONLINE_PAYMENT_PERCENT_PRESETS,
} from '../../utils/onlinePaymentPolicyHelpers';

export interface ProductOnlinePaymentCardProps {
  requireOnlinePayment: boolean;
  onToggleRequireOnlinePayment: (next: boolean) => void;
  onlinePaymentPercent: number;
  onChangeOnlinePaymentPercent: (next: number) => void;
  samplePrice: number;
}

export const ProductOnlinePaymentCard: React.FC<ProductOnlinePaymentCardProps> = ({
  requireOnlinePayment,
  onToggleRequireOnlinePayment,
  onlinePaymentPercent,
  onChangeOnlinePaymentPercent,
  samplePrice,
}) => {
  const [percentDraft, setPercentDraft] = useState<string>(String(onlinePaymentPercent));

  useEffect(() => {
    setPercentDraft(String(onlinePaymentPercent));
  }, [onlinePaymentPercent]);

  const commitDraft = (raw: string) => {
    const parsed = parseInt(raw, 10);
    const clamped = clampOnlinePaymentPercent(parsed, 100);
    onChangeOnlinePaymentPercent(clamped);
    setPercentDraft(String(clamped));
  };

  const basePrice = Math.max(0, Math.round(Number(samplePrice) || 0));
  const previewAdvance =
    onlinePaymentPercent >= 100
      ? basePrice
      : Math.round((basePrice * onlinePaymentPercent) / 100);
  const previewRemaining = Math.max(0, basePrice - previewAdvance);

  return (
    <div
      data-testid="product-online-payment-card"
      className="bg-white border border-slate-200 rounded-xl p-5 text-slate-900 space-y-4"
    >
      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
        Online Payment Policy
      </h4>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-900">
            Require Online Payment
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Disable Cash on Delivery when this item is ordered
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={requireOnlinePayment}
          aria-label="Require online payment for this product"
          data-testid="product-online-payment-toggle"
          onClick={() => onToggleRequireOnlinePayment(!requireOnlinePayment)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D71920]/30 ${
            requireOnlinePayment ? 'bg-[#D71920]' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              requireOnlinePayment ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {requireOnlinePayment && (
        <div
          data-testid="product-online-payment-config"
          className="pt-3 border-t border-slate-100 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="product-online-payment-percent-input"
              className="text-xs font-semibold text-slate-700"
            >
              Advance Required (%)
            </label>
            <span className="text-[11px] font-semibold text-[#D71920] tabular-nums">
              {onlinePaymentPercent >= 100
                ? '100% Full Payment'
                : `${onlinePaymentPercent}% Advance`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {ONLINE_PAYMENT_PERCENT_PRESETS.map(preset => {
              const isSelected = onlinePaymentPercent === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  data-testid={`product-online-percent-preset-${preset}`}
                  onClick={() => {
                    onChangeOnlinePaymentPercent(preset);
                    setPercentDraft(String(preset));
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#D71920] text-white border-[#D71920]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset}%
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
              Custom %:
            </span>
            <div className="relative flex-1">
              <input
                id="product-online-payment-percent-input"
                type="number"
                min={1}
                max={100}
                data-testid="product-online-payment-percent-input"
                value={percentDraft}
                onChange={e => {
                  const raw = e.target.value;
                  setPercentDraft(raw);
                  const parsed = parseInt(raw, 10);
                  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 100) {
                    onChangeOnlinePaymentPercent(parsed);
                  }
                }}
                onBlur={() => commitDraft(percentDraft)}
                className="w-full pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#D71920] tabular-nums"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 pointer-events-none">
                %
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2 text-[11px] text-slate-600 leading-relaxed">
            {onlinePaymentPercent >= 100 ? (
              <span>
                Customer must pay <strong className="text-slate-900">100%</strong> of the order total online before confirmation. Cash on Delivery is disabled.
              </span>
            ) : (
              <span>
                Customer pays{' '}
                <strong className="text-slate-900 tabular-nums">
                  {onlinePaymentPercent}% (৳{previewAdvance} on ৳{basePrice})
                </strong>{' '}
                online now, and{' '}
                <strong className="text-slate-900 tabular-nums">
                  ৳{previewRemaining} + delivery
                </strong>{' '}
                via Cash on Delivery.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
