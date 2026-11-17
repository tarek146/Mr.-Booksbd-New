import React from 'react';
import { CreditCard, Plus, QrCode, Upload, X } from 'lucide-react';
import { compressImageFile, isValidImageUrl, sanitizeImageUrl } from '../../../utils/imageCompressor';
import {
  DEFAULT_SUB_AREA_LOCATIONS,
  getEffectiveSubAreaLocations,
  normalizeSubAreaList,
} from '../../../utils/storeEnhancementsHelpers';
import {
  type SettingsFormTabProps,
  SettingsSectionHeader,
  SettingsSwitch,
  S_INPUT,
  S_LABEL,
  S_SELECT,
  S_TEXTAREA,
} from './settingsShared';

interface AdminSettingsShippingTabProps extends SettingsFormTabProps {
  newSubAreaInput: string;
  setNewSubAreaInput: React.Dispatch<React.SetStateAction<string>>;
  onOpenPaymentMethods: () => void;
}

export const AdminSettingsShippingTab: React.FC<AdminSettingsShippingTabProps> = ({
  settingsForm,
  setSettingsForm,
  updateSettings,
  setToast,
  newSubAreaInput,
  setNewSubAreaInput,
  onOpenPaymentMethods,
}) => {
  const activeSubAreas = getEffectiveSubAreaLocations(settingsForm);
  const handleAddSubArea = () => {
    const cleaned = newSubAreaInput.trim();
    if (!cleaned) return;
    const nextList = normalizeSubAreaList([...activeSubAreas, cleaned]);
    setSettingsForm(prev => ({ ...prev, subAreaLocations: nextList }));
    setNewSubAreaInput('');
  };
  const handleRemoveSubArea = (name: string) => {
    const nextList = activeSubAreas.filter(a => a.toLowerCase() !== name.toLowerCase());
    setSettingsForm(prev => ({ ...prev, subAreaLocations: nextList }));
  };
  const missingDefaults = DEFAULT_SUB_AREA_LOCATIONS.filter(
    d => !activeSubAreas.some(a => a.toLowerCase() === d.toLowerCase())
  );

  return (
    <div className="divide-y divide-slate-200/80">
      {/* 1. Delivery Charges & Payment Gateway Link */}
      <div className="p-4 sm:px-5 space-y-4">
        <SettingsSectionHeader
          title="Delivery Rates & Payment Accounts"
          description="Set flat regional delivery rates, free shipping minimum, weight surcharge, and manage active payment gateways."
          action={
            <button
              type="button"
              onClick={onOpenPaymentMethods}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard size={13} className="text-[#D71920]" />
              <span>Payment Methods</span>
            </button>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={S_LABEL}>Inside Dhaka (৳)</label>
            <input
              type="number"
              required
              value={settingsForm.insideDhakaCharge ?? 60}
              onChange={e => setSettingsForm(prev => ({ ...prev, insideDhakaCharge: Number(e.target.value) }))}
              className={`${S_INPUT} font-semibold tabular-nums`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Sub Area (৳)</label>
            <input
              type="number"
              required
              value={settingsForm.subAreaCharge ?? 90}
              onChange={e => setSettingsForm(prev => ({ ...prev, subAreaCharge: Number(e.target.value) }))}
              className={`${S_INPUT} font-semibold tabular-nums`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Outside Dhaka (৳)</label>
            <input
              type="number"
              required
              value={settingsForm.outsideDhakaCharge ?? 120}
              onChange={e => setSettingsForm(prev => ({ ...prev, outsideDhakaCharge: Number(e.target.value) }))}
              className={`${S_INPUT} font-semibold tabular-nums`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Hub Delivery Fee (৳)</label>
            <input
              type="number"
              value={settingsForm.sundarbanDeliveryCharge ?? 120}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, sundarbanDeliveryCharge: Number(e.target.value) }))
              }
              className={`${S_INPUT} font-semibold tabular-nums`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Free Delivery Min (৳)</label>
            <input
              type="number"
              value={settingsForm.freeShippingThreshold ?? 2000}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, freeShippingThreshold: Number(e.target.value) }))
              }
              className={`${S_INPUT} tabular-nums`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Extra Weight / Kg (৳)</label>
            <input
              type="number"
              value={settingsForm.extraWeightChargePerKg ?? 20}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, extraWeightChargePerKg: Number(e.target.value) }))
              }
              className={`${S_INPUT} tabular-nums`}
            />
          </div>
          <div className="col-span-2">
            <label className={S_LABEL}>Official bKash Number</label>
            <input
              type="text"
              value={settingsForm.bkashNumber || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, bkashNumber: e.target.value }))}
              placeholder="01XXXXXXXXX"
              className={`${S_INPUT} tabular-nums`}
            />
          </div>
        </div>
      </div>

      {/* 2. Sub-Area Locations Manager */}
      <div data-testid="admin-sub-area-locations-manager" className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title={`Sub-Area Locations (${activeSubAreas.length})`}
          description={`Areas listed here automatically apply the Sub Area rate (৳${settingsForm.subAreaCharge ?? 90}) at checkout.`}
          action={
            <button
              type="button"
              onClick={async () => {
                await updateSettings({
                  subAreaCharge: settingsForm.subAreaCharge ?? 90,
                  subAreaLocations: activeSubAreas,
                });
                setToast({
                  show: true,
                  type: 'success',
                  message: 'Sub-Area fee & locations saved.',
                });
              }}
              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
            >
              Save Sub-Areas
            </button>
          }
        />

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            data-testid="admin-sub-area-input"
            value={newSubAreaInput}
            onChange={e => setNewSubAreaInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSubArea();
              }
            }}
            placeholder="Add area or district (e.g. Gazipur, Savar, Uttara, Ashulia)..."
            className={`${S_INPUT} flex-1`}
          />
          <button
            type="button"
            data-testid="admin-sub-area-add-btn"
            onClick={handleAddSubArea}
            className="h-8 px-3 rounded-lg bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-medium inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
          >
            <Plus size={13} />
            <span>Add Location</span>
          </button>
        </div>

        {activeSubAreas.length === 0 ? (
          <p className="text-xs text-slate-400">
            No sub-area locations added yet. Add an area above or pick from suggestions.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activeSubAreas.map(area => (
              <span
                key={area}
                data-testid={`sub-area-chip-${area}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs"
              >
                <span>{area}</span>
                <button
                  type="button"
                  aria-label={`Remove ${area}`}
                  onClick={() => handleRemoveSubArea(area)}
                  className="text-slate-400 hover:text-[#D71920] cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {missingDefaults.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="text-slate-500">Quick add:</span>
            {missingDefaults.map(suggestion => (
              <button
                key={`quick-${suggestion}`}
                type="button"
                onClick={() => {
                  const nextList = normalizeSubAreaList([...activeSubAreas, suggestion]);
                  setSettingsForm(prev => ({ ...prev, subAreaLocations: nextList }));
                }}
                className="px-2 py-0.5 rounded border border-dashed border-slate-300 text-slate-600 hover:border-[#D71920] hover:text-[#D71920] cursor-pointer transition-colors"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Checkout Experience & Labels */}
      <div className="p-4 sm:px-5 space-y-3.5">
        <SettingsSectionHeader
          title="Checkout Experience & Saved Address"
          description="Control returning customer autofill, checkout option labels, and payment icons."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <span>Use Saved Address</span>
              <SettingsSwitch
                checked={settingsForm.enableUseOldAddress !== false}
                ariaLabel="Toggle returning customer saved address button"
                onChange={() =>
                  setSettingsForm(prev => ({
                    ...prev,
                    enableUseOldAddress: !(prev.enableUseOldAddress !== false),
                  }))
                }
              />
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {settingsForm.enableUseOldAddress !== false && (
            <div>
              <label className={S_LABEL}>Saved Address Button Label</label>
              <input
                type="text"
                value={settingsForm.oldAddressButtonLabel ?? 'Use Saved Address'}
                onChange={e => setSettingsForm(prev => ({ ...prev, oldAddressButtonLabel: e.target.value }))}
                placeholder="Use Saved Address"
                className={S_INPUT}
              />
            </div>
          )}

          <div>
            <label className={S_LABEL}>Hub Delivery Option Title</label>
            <input
              type="text"
              value={settingsForm.hubDeliveryLabel ?? 'Standard Hub Delivery / Point Delivery'}
              onChange={e => setSettingsForm(prev => ({ ...prev, hubDeliveryLabel: e.target.value }))}
              placeholder="Standard Hub Delivery / Point Delivery"
              className={S_INPUT}
            />
          </div>

          <div>
            <label className={S_LABEL}>Cash on Delivery Icon URL</label>
            <input
              type="text"
              value={settingsForm.codPaymentIconUrl ?? ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, codPaymentIconUrl: e.target.value }))}
              placeholder="Default vector icon"
              className={S_INPUT}
            />
          </div>

          <div>
            <label className={S_LABEL}>Online Payment Icon URL</label>
            <input
              type="text"
              value={settingsForm.onlinePaymentIconUrl ?? ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, onlinePaymentIconUrl: e.target.value }))}
              placeholder="Default vector icon"
              className={S_INPUT}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-show-checkout-coupons-checkbox"
              checked={settingsForm.showCheckoutCoupons !== false}
              onChange={e => setSettingsForm(prev => ({ ...prev, showCheckoutCoupons: e.target.checked }))}
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Show quick coupon suggestions</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-show-sundarban-checkout-checkbox"
              checked={settingsForm.showSundarbanOnCheckout !== false}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, showSundarbanOnCheckout: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Show Standard Hub Delivery option</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-show-checkout-progress-checkbox"
              checked={settingsForm.showCheckoutProgress !== false}
              onChange={e => setSettingsForm(prev => ({ ...prev, showCheckoutProgress: e.target.checked }))}
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Show form completion progress</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-direct-order-isolates-cart-checkbox"
              checked={settingsForm.directOrderIsolatesCart !== false}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, directOrderIsolatesCart: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Isolate &ldquo;Order Now&rdquo; from cart</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-allow-checkout-item-removal-checkbox"
              checked={settingsForm.allowCheckoutItemRemoval !== false}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, allowCheckoutItemRemoval: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Allow removing items on checkout</span>
          </label>
        </div>
      </div>

      {/* 4. Shipping Label & Customer Invoice */}
      <div data-testid="admin-label-invoice-settings-card" className="p-4 sm:px-5 space-y-3.5">
        <SettingsSectionHeader
          title="Shipping Label & Customer Invoice"
          description="Set default paper dimensions, merchant ID, and line-item visibility when printing order documents."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={S_LABEL}>Merchant ID</label>
            <input
              type="text"
              data-testid="admin-merchant-id-input"
              value={settingsForm.merchantId ?? 'KUSXCIG'}
              onChange={e => setSettingsForm(prev => ({ ...prev, merchantId: e.target.value }))}
              placeholder="KUSXCIG"
              className={`${S_INPUT} font-mono`}
            />
          </div>

          <div>
            <label className={S_LABEL}>Default Label Size</label>
            <select
              data-testid="admin-default-label-size-select"
              value={settingsForm.defaultLabelSize ?? '3x3'}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, defaultLabelSize: e.target.value as '3x3' | '2x3' }))
              }
              className={S_SELECT}
            >
              <option value="3x3">3 × 3 in</option>
              <option value="2x3">2 × 3 in</option>
            </select>
          </div>

          <div>
            <label className={S_LABEL}>Default Invoice Size</label>
            <select
              data-testid="admin-default-invoice-size-select"
              value={settingsForm.defaultInvoiceSize ?? 'A4'}
              onChange={e =>
                setSettingsForm(prev => ({
                  ...prev,
                  defaultInvoiceSize: e.target.value as 'A4' | 'A5' | '3in',
                }))
              }
              className={S_SELECT}
            >
              <option value="A4">A4 Sheet</option>
              <option value="A5">A5 Half Sheet</option>
              <option value="3in">3in Thermal</option>
            </select>
          </div>

          <div>
            <label className={S_LABEL}>Courier Footer Tag</label>
            <input
              type="text"
              value={settingsForm.labelLogisticsText ?? 'steadfast.com.bd'}
              onChange={e => setSettingsForm(prev => ({ ...prev, labelLogisticsText: e.target.value }))}
              placeholder="steadfast.com.bd"
              className={S_INPUT}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className={S_LABEL}>Invoice Thank-You Note</label>
            <input
              type="text"
              value={settingsForm.invoiceFooterNote ?? ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, invoiceFooterNote: e.target.value }))}
              placeholder="e.g. Thank you for shopping with MR. BOOKS BD!"
              className={S_INPUT}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-0.5">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-invoice-show-images-checkbox"
              checked={settingsForm.invoiceShowProductImage !== false}
              onChange={e => setSettingsForm(prev => ({ ...prev, invoiceShowProductImage: e.target.checked }))}
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Show product thumbnails on invoice</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-invoice-show-breakdown-checkbox"
              checked={settingsForm.invoiceShowPricingBreakdown !== false}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, invoiceShowPricingBreakdown: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Show discount, delivery &amp; COD breakdown</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-label-show-items-checkbox"
              checked={settingsForm.labelShowItemDetails !== false}
              onChange={e => setSettingsForm(prev => ({ ...prev, labelShowItemDetails: e.target.checked }))}
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Show item summary on shipping label</span>
          </label>
        </div>
      </div>

      {/* 5. Orders Workspace & Fraud Check */}
      <div data-testid="admin-orders-workspace-settings-card" className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Orders Workspace Preferences"
          description="Set default Orders table density, row thumbnails, and quick fraud check visibility."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className={S_LABEL}>Default Table Density</label>
            <select
              data-testid="admin-orders-density-select"
              value={settingsForm.ordersDefaultDensity ?? 'comfortable'}
              onChange={e =>
                setSettingsForm(prev => ({
                  ...prev,
                  ordersDefaultDensity: e.target.value as 'comfortable' | 'compact',
                }))
              }
              className={S_SELECT}
            >
              <option value="comfortable">Comfortable (Balanced)</option>
              <option value="compact">Compact (High Density)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 h-8 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-orders-show-fraud-btn-checkbox"
              checked={settingsForm.ordersShowFraudCheckButton !== false}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, ordersShowFraudCheckButton: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Show inline Fraud Check button</span>
          </label>

          <label className="flex items-center gap-2 h-8 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-orders-show-thumbs-checkbox"
              checked={settingsForm.ordersShowItemThumbnails !== false}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, ordersShowItemThumbnails: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Show item thumbnails in rows</span>
          </label>
        </div>
      </div>

      {/* 6. Bangla QR Payment */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Bangla QR Payment"
          description="Display a unified Bangla QR code inside checkout so customers can scan with any banking or MFS app."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <span>{settingsForm.enableBanglaQr !== false ? 'Enabled' : 'Disabled'}</span>
              <SettingsSwitch
                checked={settingsForm.enableBanglaQr !== false}
                ariaLabel="Toggle Bangla QR payment"
                onChange={() =>
                  setSettingsForm(prev => ({ ...prev, enableBanglaQr: !(prev.enableBanglaQr !== false) }))
                }
              />
            </div>
          }
        />

        {settingsForm.enableBanglaQr !== false && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={S_LABEL}>Merchant / Account Name</label>
                <input
                  type="text"
                  value={settingsForm.banglaQrAccountName ?? 'MR. BOOKS BD'}
                  onChange={e => setSettingsForm(prev => ({ ...prev, banglaQrAccountName: e.target.value }))}
                  placeholder="MR. BOOKS BD"
                  className={S_INPUT}
                />
              </div>
              <div>
                <label className={S_LABEL}>Merchant ID / Account Number</label>
                <input
                  type="text"
                  value={settingsForm.banglaQrNumber ?? '01712345678'}
                  onChange={e => setSettingsForm(prev => ({ ...prev, banglaQrNumber: e.target.value }))}
                  placeholder="01712345678"
                  className={`${S_INPUT} tabular-nums`}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                {isValidImageUrl(settingsForm.banglaQrImageUrl) ? (
                  <img
                    src={settingsForm.banglaQrImageUrl}
                    alt="Bangla QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <QrCode size={18} />
                    <span className="text-[8px] mt-0.5">Auto QR</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-800">QR Code Image</span>
                  <div className="flex items-center gap-2">
                    {isValidImageUrl(settingsForm.banglaQrImageUrl) && (
                      <button
                        type="button"
                        onClick={() => setSettingsForm(prev => ({ ...prev, banglaQrImageUrl: '' }))}
                        className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                    <label className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium cursor-pointer inline-flex items-center gap-1">
                      <Upload size={11} />
                      <span>Upload QR</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          try {
                            const compressed = await compressImageFile(file, 700, 700, 0.88);
                            setSettingsForm(prev => ({ ...prev, banglaQrImageUrl: compressed }));
                            await updateSettings({ banglaQrImageUrl: compressed });
                            setToast({ show: true, type: 'success', message: 'Bangla QR image uploaded.' });
                          } catch (err: unknown) {
                            const message = err instanceof Error ? err.message : 'Failed to upload QR image';
                            setToast({ show: true, type: 'error', message });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Paste QR code image URL (https://...)"
                  value={isValidImageUrl(settingsForm.banglaQrImageUrl) ? settingsForm.banglaQrImageUrl : ''}
                  onChange={e =>
                    setSettingsForm(prev => ({ ...prev, banglaQrImageUrl: sanitizeImageUrl(e.target.value) }))
                  }
                  className={`${S_INPUT} font-mono`}
                />
              </div>
            </div>

            <div>
              <label className={S_LABEL}>Payment Instructions</label>
              <textarea
                rows={2}
                value={
                  settingsForm.banglaQrInstructions ??
                  'বিকাশ, নগদ, রকেট, উপায় বা যেকোনো ব্যাংক অ্যাপের বাংলা কিউআর (Bangla QR) স্ক্যানার দিয়ে স্ক্যান করে পেমেন্ট করুন এবং ট্রানজেকশন আইডি নিচে দিন।'
                }
                onChange={e => setSettingsForm(prev => ({ ...prev, banglaQrInstructions: e.target.value }))}
                className={S_TEXTAREA}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
