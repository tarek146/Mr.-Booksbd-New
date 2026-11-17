import React from 'react';
import { Upload } from 'lucide-react';
import { compressImageFile, isValidImageUrl, sanitizeImageUrl } from '../../../utils/imageCompressor';
import { DEFAULT_CANCEL_EXCHANGE_POLICY } from '../../../utils/storeEnhancementsHelpers';
import { DEFAULT_LIVE_CHAT_QUICK_REPLIES } from '../../../utils/chatSoundAndValidation';
import {
  type SettingsFormTabProps,
  SettingsSectionHeader,
  S_INPUT,
  S_LABEL,
  S_SELECT,
  S_TEXTAREA,
} from './settingsShared';

const DARK_FOOTER_PRESETS = [
  { label: 'Obsidian', bg: '#070A0F', card: '#0E1420' },
  { label: 'Classic', bg: '#121212', card: '#1c1c1e' },
  { label: 'Navy', bg: '#0b1120', card: '#131e33' },
  { label: 'Crimson', bg: '#170a0c', card: '#251216' },
];

const isDarkHexColor = (hex?: string, fallbackDark = false): boolean => {
  if (!hex || typeof hex !== 'string') return fallbackDark;
  const clean = hex.trim().replace(/^#/, '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map(ch => ch + ch)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallbackDark;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
};

export const AdminSettingsFooterTab: React.FC<SettingsFormTabProps> = ({
  settingsForm,
  setSettingsForm,
  updateSettings,
  setToast,
}) => {
  const hasFooterLogo = isValidImageUrl(settingsForm.footerLogoUrl);
  const hasPaymentBanner = isValidImageUrl(settingsForm.footerPaymentBannerUrl);
  const dayBg = settingsForm.footerBgColor || '#F8FAFC';
  const dayCard = settingsForm.footerCardBgColor || '#FFFFFF';
  const dayBgIsDark = isDarkHexColor(dayBg, false);
  const dayCardIsDark = isDarkHexColor(dayCard, false);
  const darkBg = settingsForm.footerDarkBgColor || '#070A0F';
  const darkCard = settingsForm.footerDarkCardBgColor || '#0E1420';
  const darkBgIsDark = isDarkHexColor(darkBg, true);
  const darkCardIsDark = isDarkHexColor(darkCard, true);

  return (
    <div className="divide-y divide-slate-200/80">
      {/* 1. Footer Color Theme (Side-by-Side Light & Dark) */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Footer Theme Colors"
          description="Set surface colors for light and dark theme footers."
          action={
            <div className="flex items-center gap-1.5 flex-wrap">
              {DARK_FOOTER_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setSettingsForm(prev => ({
                      ...prev,
                      footerDarkBgColor: preset.bg,
                      footerDarkCardBgColor: preset.card,
                    }))
                  }
                  className="h-7 px-2 rounded-md border border-slate-200 bg-white hover:border-slate-300 text-[11px] font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/15"
                    style={{ backgroundColor: preset.bg }}
                  />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Light Mode Column */}
          <div className="p-3 rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-800">Day Mode (Light)</span>
              <button
                type="button"
                onClick={() =>
                  setSettingsForm(prev => ({
                    ...prev,
                    footerBgColor: '#F8FAFC',
                    footerCardBgColor: '#FFFFFF',
                  }))
                }
                className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={S_LABEL}>Background</label>
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-200 bg-white">
                  <input
                    type="color"
                    value={dayBg}
                    onChange={e => setSettingsForm(prev => ({ ...prev, footerBgColor: e.target.value }))}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={dayBg}
                    onChange={e => setSettingsForm(prev => ({ ...prev, footerBgColor: e.target.value }))}
                    className="w-full text-[11px] font-mono text-slate-800 focus:outline-none uppercase"
                  />
                </div>
              </div>
              <div>
                <label className={S_LABEL}>Card Surface</label>
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-200 bg-white">
                  <input
                    type="color"
                    value={dayCard}
                    onChange={e => setSettingsForm(prev => ({ ...prev, footerCardBgColor: e.target.value }))}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={dayCard}
                    onChange={e => setSettingsForm(prev => ({ ...prev, footerCardBgColor: e.target.value }))}
                    className="w-full text-[11px] font-mono text-slate-800 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>
            <div
              className={`px-2.5 py-1.5 rounded-md border flex items-center justify-between ${
                dayBgIsDark ? 'border-white/15' : 'border-slate-200'
              }`}
              style={{ backgroundColor: dayBg }}
            >
              <div
                className={`px-2.5 py-1 rounded border text-[11px] font-bold ${
                  dayCardIsDark ? 'border-white/15' : 'border-slate-200/80'
                }`}
                style={{ backgroundColor: dayCard }}
              >
                <span className={dayCardIsDark ? 'text-white' : 'text-slate-900'}>MR. </span>
                <span className="text-[#D71920]">BOOKS</span>
              </div>
              <span className={`text-[10px] ${dayBgIsDark ? 'text-slate-300' : 'text-slate-500'}`}>
                Day Preview
              </span>
            </div>
          </div>

          {/* Dark Mode Column */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-100">Dark Mode</span>
              <button
                type="button"
                onClick={() =>
                  setSettingsForm(prev => ({
                    ...prev,
                    footerDarkBgColor: '#070A0F',
                    footerDarkCardBgColor: '#0E1420',
                  }))
                }
                className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Background</label>
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-700 bg-slate-800">
                  <input
                    type="color"
                    value={darkBg}
                    onChange={e => setSettingsForm(prev => ({ ...prev, footerDarkBgColor: e.target.value }))}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={darkBg}
                    onChange={e => setSettingsForm(prev => ({ ...prev, footerDarkBgColor: e.target.value }))}
                    className="w-full text-[11px] font-mono text-white focus:outline-none bg-transparent uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Card Surface</label>
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-700 bg-slate-800">
                  <input
                    type="color"
                    value={darkCard}
                    onChange={e => setSettingsForm(prev => ({ ...prev, footerDarkCardBgColor: e.target.value }))}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={darkCard}
                    onChange={e => setSettingsForm(prev => ({ ...prev, footerDarkCardBgColor: e.target.value }))}
                    className="w-full text-[11px] font-mono text-white focus:outline-none bg-transparent uppercase"
                  />
                </div>
              </div>
            </div>
            <div
              className={`px-2.5 py-1.5 rounded-md border flex items-center justify-between ${
                darkBgIsDark ? 'border-white/10' : 'border-slate-300'
              }`}
              style={{ backgroundColor: darkBg }}
            >
              <div
                className={`px-2.5 py-1 rounded border text-[11px] font-bold ${
                  darkCardIsDark ? 'border-white/10' : 'border-slate-300'
                }`}
                style={{ backgroundColor: darkCard }}
              >
                <span className={darkCardIsDark ? 'text-white' : 'text-slate-900'}>MR. </span>
                <span className="text-[#D71920]">BOOKS</span>
              </div>
              <span className={`text-[10px] ${darkBgIsDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Dark Preview
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Footer Logo, Payment Strip & Brand Details */}
      <div className="p-4 sm:px-5 space-y-4">
        <SettingsSectionHeader
          title="Footer Branding, Payment Picture & Copy"
          description="Upload footer logo, single payment banner image, contact address, and copyright note."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#1c1c1e] border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {hasFooterLogo ? (
                <img
                  src={settingsForm.footerLogoUrl}
                  alt="Footer Logo"
                  onError={() => setSettingsForm(prev => ({ ...prev, footerLogoUrl: '' }))}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span className="text-[10px] text-slate-400">Logo</span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-800">Footer Logo</span>
                <div className="flex items-center gap-2">
                  {hasFooterLogo && (
                    <button
                      type="button"
                      onClick={async () => {
                        setSettingsForm(prev => ({ ...prev, footerLogoUrl: '' }));
                        await updateSettings({ footerLogoUrl: '' });
                        setToast({ show: true, type: 'success', message: 'Footer logo removed.' });
                      }}
                      className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <label className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium cursor-pointer inline-flex items-center gap-1">
                    <Upload size={11} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*,.svg,.ico"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const dataUrl = await compressImageFile(file, 400, 400, 0.9);
                          setSettingsForm(prev => ({ ...prev, footerLogoUrl: dataUrl }));
                          await updateSettings({ footerLogoUrl: dataUrl });
                          setToast({ show: true, type: 'success', message: 'Footer logo uploaded.' });
                        } catch (err: unknown) {
                          const message = err instanceof Error ? err.message : 'Failed to upload footer logo';
                          setToast({ show: true, type: 'error', message });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <input
                type="text"
                placeholder="Footer logo image URL (https://...)"
                value={hasFooterLogo ? settingsForm.footerLogoUrl : ''}
                onChange={e => setSettingsForm(prev => ({ ...prev, footerLogoUrl: sanitizeImageUrl(e.target.value) }))}
                className={S_INPUT}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-20 h-11 rounded-lg bg-[#1c1c1e] border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 p-1">
              {hasPaymentBanner ? (
                <img
                  src={settingsForm.footerPaymentBannerUrl}
                  alt="Payment Banner"
                  onError={() => setSettingsForm(prev => ({ ...prev, footerPaymentBannerUrl: '' }))}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[9.5px] text-slate-400 text-center">Default Strip</span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-800">Payment Methods Picture</span>
                <div className="flex items-center gap-2">
                  {hasPaymentBanner && (
                    <button
                      type="button"
                      onClick={async () => {
                        setSettingsForm(prev => ({ ...prev, footerPaymentBannerUrl: '' }));
                        await updateSettings({ footerPaymentBannerUrl: '' });
                        setToast({ show: true, type: 'success', message: 'Payment picture removed.' });
                      }}
                      className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <label className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium cursor-pointer inline-flex items-center gap-1">
                    <Upload size={11} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*,.svg"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const dataUrl = await compressImageFile(file, 800, 300, 0.92);
                          setSettingsForm(prev => ({ ...prev, footerPaymentBannerUrl: dataUrl }));
                          await updateSettings({ footerPaymentBannerUrl: dataUrl });
                          setToast({ show: true, type: 'success', message: 'Payment picture uploaded.' });
                        } catch (err: unknown) {
                          const message = err instanceof Error ? err.message : 'Failed to upload payment picture';
                          setToast({ show: true, type: 'error', message });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <input
                type="text"
                placeholder="Payment banner image URL (https://...)"
                value={hasPaymentBanner ? settingsForm.footerPaymentBannerUrl : ''}
                onChange={e =>
                  setSettingsForm(prev => ({ ...prev, footerPaymentBannerUrl: sanitizeImageUrl(e.target.value) }))
                }
                className={S_INPUT}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-600">Footer Brand Name</label>
              <div className="flex items-center gap-3">
                {settingsForm.footerBrandName && (
                  <button
                    type="button"
                    onClick={() => setSettingsForm(prev => ({ ...prev, footerBrandName: '' }))}
                    className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <label
                  className={`flex items-center gap-1 text-[11px] cursor-pointer ${
                    !(settingsForm.footerBrandName || '').trim() || settingsForm.footerLogoUrl
                      ? 'opacity-40 text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      Boolean((settingsForm.footerBrandName || '').trim()) &&
                      !settingsForm.footerLogoUrl &&
                      settingsForm.showFooterIcon !== false
                    }
                    disabled={!(settingsForm.footerBrandName || '').trim() || Boolean(settingsForm.footerLogoUrl)}
                    onChange={e => setSettingsForm(prev => ({ ...prev, showFooterIcon: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-[#D71920]"
                  />
                  <span>Show Icon</span>
                </label>
              </div>
            </div>
            <input
              type="text"
              value={settingsForm.footerBrandName ?? ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, footerBrandName: e.target.value }))}
              placeholder="e.g. MR. BOOKS"
              className={S_INPUT}
            />
          </div>

          <div className="sm:col-span-3">
            <label className={S_LABEL}>1st Word Color</label>
            <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-200 bg-white">
              <input
                type="color"
                value={settingsForm.footerNameColor1 || '#FFFFFF'}
                onChange={e => setSettingsForm(prev => ({ ...prev, footerNameColor1: e.target.value }))}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
              />
              <input
                type="text"
                value={settingsForm.footerNameColor1 || '#FFFFFF'}
                onChange={e => setSettingsForm(prev => ({ ...prev, footerNameColor1: e.target.value }))}
                className="w-full text-[11px] font-mono text-slate-800 focus:outline-none uppercase"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className={S_LABEL}>2nd Word &amp; Icon</label>
            <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-200 bg-white">
              <input
                type="color"
                value={settingsForm.footerNameColor2 || '#D71920'}
                onChange={e => setSettingsForm(prev => ({ ...prev, footerNameColor2: e.target.value }))}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
              />
              <input
                type="text"
                value={settingsForm.footerNameColor2 || '#D71920'}
                onChange={e => setSettingsForm(prev => ({ ...prev, footerNameColor2: e.target.value }))}
                className="w-full text-[11px] font-mono text-slate-800 focus:outline-none uppercase"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={S_LABEL}>About Description</label>
            <textarea
              rows={2}
              value={settingsForm.footerDescription || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, footerDescription: e.target.value }))}
              placeholder="Bangladesh's premier online bookstore and stationery shop..."
              className={S_TEXTAREA}
            />
          </div>
          <div>
            <label className={S_LABEL}>Store Address</label>
            <input
              type="text"
              value={settingsForm.address || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
              className={S_INPUT}
            />
          </div>
          <div>
            <label className={S_LABEL}>Support Email</label>
            <input
              type="email"
              value={settingsForm.email || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, email: e.target.value }))}
              className={S_INPUT}
            />
          </div>
          <div>
            <label className={S_LABEL}>Copyright Text (Bottom Left)</label>
            <input
              type="text"
              value={settingsForm.copyrightText || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, copyrightText: e.target.value }))}
              className={S_INPUT}
            />
          </div>
          <div>
            <label className={S_LABEL}>Bottom Tagline (Bottom Right)</label>
            <input
              type="text"
              value={settingsForm.footerBottomTagline ?? 'Designed for book lovers in Bangladesh.'}
              onChange={e => setSettingsForm(prev => ({ ...prev, footerBottomTagline: e.target.value }))}
              className={S_INPUT}
            />
          </div>
        </div>
      </div>

      {/* 3. Footer Utility Strip (VIP Club, Tracking, Coupons) */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Footer Utility Strips"
          description="Enable or rename the footer subscription, order tracking, and coupons boxes."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer">
              <span>VIP Subscription Box</span>
              <input
                type="checkbox"
                checked={settingsForm.showFooterSubscription !== false}
                onChange={e => setSettingsForm(prev => ({ ...prev, showFooterSubscription: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[#D71920]"
              />
            </label>
            <input
              type="text"
              value={settingsForm.subscriptionTitle || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, subscriptionTitle: e.target.value }))}
              placeholder="Subscription heading"
              className={S_INPUT}
            />
            <input
              type="text"
              value={settingsForm.subscriptionDiscountBadge || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, subscriptionDiscountBadge: e.target.value }))}
              placeholder="Promo badge text"
              className={S_INPUT}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer">
              <span>Order Tracking Box</span>
              <input
                type="checkbox"
                checked={settingsForm.showFooterTracking !== false}
                onChange={e => setSettingsForm(prev => ({ ...prev, showFooterTracking: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[#D71920]"
              />
            </label>
            <input
              type="text"
              value={settingsForm.trackingTitle || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, trackingTitle: e.target.value }))}
              placeholder="Tracking heading"
              className={S_INPUT}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer">
              <span>Coupons Strip</span>
              <input
                type="checkbox"
                checked={settingsForm.showFooterCoupons !== false}
                onChange={e => setSettingsForm(prev => ({ ...prev, showFooterCoupons: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[#D71920]"
              />
            </label>
            <input
              type="text"
              value={settingsForm.couponsTitle ?? 'Coupons'}
              onChange={e => setSettingsForm(prev => ({ ...prev, couponsTitle: e.target.value }))}
              placeholder="Coupons title"
              className={S_INPUT}
            />
            <input
              type="text"
              value={settingsForm.couponsBadge ?? '3 Offers'}
              onChange={e => setSettingsForm(prev => ({ ...prev, couponsBadge: e.target.value }))}
              placeholder="Coupons badge"
              className={S_INPUT}
            />
          </div>
        </div>
      </div>

      {/* 4. Customer Live Chat Widget */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Customer Live Chat Widget"
          description="Configure live chat visibility, launcher behavior, sound alerts, and canned responses."
          action={
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.enableLiveChatSound !== false}
                  onChange={e => setSettingsForm(prev => ({ ...prev, enableLiveChatSound: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-[#D71920]"
                />
                <span>Sound</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.enableLiveChat !== false}
                  onChange={e => setSettingsForm(prev => ({ ...prev, enableLiveChat: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-[#D71920]"
                />
                <span>Enabled</span>
              </label>
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={S_LABEL}>Chat Header Title</label>
            <input
              type="text"
              value={settingsForm.liveChatTitle ?? 'MR. BOOKS Live Support'}
              onChange={e => setSettingsForm(prev => ({ ...prev, liveChatTitle: e.target.value }))}
              className={S_INPUT}
            />
          </div>
          <div>
            <label className={S_LABEL}>Welcome Note</label>
            <input
              type="text"
              value={settingsForm.liveChatWelcomeMessage ?? ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, liveChatWelcomeMessage: e.target.value }))}
              placeholder="Welcome message..."
              className={S_INPUT}
            />
          </div>
          <div>
            <label className={S_LABEL}>Auto-Hide Launcher Timer</label>
            <select
              data-testid="admin-livechat-autohide-select"
              value={String(settingsForm.liveChatAutoHideSeconds ?? 4)}
              onChange={e =>
                setSettingsForm(prev => ({
                  ...prev,
                  liveChatAutoHideSeconds: Number(e.target.value),
                }))
              }
              className={S_SELECT}
            >
              <option value="3">3 Seconds</option>
              <option value="4">4 Seconds (Default)</option>
              <option value="5">5 Seconds</option>
              <option value="0">Off (Always Visible)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-livechat-require-contact-checkbox"
              checked={Boolean(settingsForm.liveChatRequireContactInfo)}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, liveChatRequireContactInfo: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Require Name &amp; Phone</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              data-testid="admin-livechat-show-email-checkbox"
              checked={Boolean(settingsForm.liveChatShowEmailField)}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, liveChatShowEmailField: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Show Email Field</span>
          </label>
        </div>

        <div>
          <label className={S_LABEL}>Quick Canned Replies (one per line)</label>
          <textarea
            rows={2}
            value={(settingsForm.liveChatQuickReplies && settingsForm.liveChatQuickReplies.length > 0
              ? settingsForm.liveChatQuickReplies
              : DEFAULT_LIVE_CHAT_QUICK_REPLIES
            ).join('\n')}
            onChange={e =>
              setSettingsForm(prev => ({
                ...prev,
                liveChatQuickReplies: e.target.value
                  .split('\n')
                  .map(line => line.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="Write one quick reply per line..."
            className={S_TEXTAREA}
          />
        </div>
      </div>

      {/* 5. Cancel & Exchange Policy */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Cancel & Exchange Policy"
          description="Content displayed when visitors open the Cancel & Exchange policy popup from the footer."
          action={
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.showFooterPolicy !== false}
                onChange={e => setSettingsForm(prev => ({ ...prev, showFooterPolicy: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[#D71920]"
              />
              <span>Enabled</span>
            </label>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={S_LABEL}>Policy Button Title</label>
            <input
              type="text"
              value={settingsForm.policyTitle ?? 'Cancel & Exchange'}
              onChange={e => setSettingsForm(prev => ({ ...prev, policyTitle: e.target.value }))}
              className={S_INPUT}
            />
          </div>
          <div>
            <label className={S_LABEL}>Policy Badge</label>
            <input
              type="text"
              value={settingsForm.policyBadge ?? 'Policy'}
              onChange={e => setSettingsForm(prev => ({ ...prev, policyBadge: e.target.value }))}
              className={S_INPUT}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={S_LABEL}>Policy Popup Content</label>
            <textarea
              rows={2}
              value={settingsForm.cancelExchangePolicyText ?? DEFAULT_CANCEL_EXCHANGE_POLICY}
              onChange={e => setSettingsForm(prev => ({ ...prev, cancelExchangePolicyText: e.target.value }))}
              className={S_TEXTAREA}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
