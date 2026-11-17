import React from 'react';
import { BookOpen, Check, Plus, Trash2, Upload } from 'lucide-react';
import { compressImageFile, isValidImageUrl, sanitizeImageUrl } from '../../../utils/imageCompressor';
import {
  ADMIN_BRAND_COLOR_PRESETS,
  DEFAULT_ADMIN_BRAND_NAME,
  DEFAULT_ADMIN_ICON_BG_COLOR,
  DEFAULT_ADMIN_NAME_COLOR_1,
  DEFAULT_ADMIN_NAME_COLOR_2,
  DEFAULT_ADMIN_SUBTITLE,
  normalizeHexColor,
  resolveAdminPanelBranding,
} from '../../../utils/adminBrandingHelpers';
import {
  type CacheTelemetryState,
  type SettingsFormTabProps,
  SettingsSectionHeader,
  S_INPUT,
  S_LABEL,
  S_SELECT,
} from './settingsShared';

interface AdminSettingsHeaderTabProps extends SettingsFormTabProps {
  settingsSaving: boolean;
  setSettingsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  cacheTelemetry: CacheTelemetryState;
  refreshStoreCacheFirst: (forceNetwork?: boolean) => Promise<void>;
  clearLocalStoreCache: () => void;
}

export const AdminSettingsHeaderTab: React.FC<AdminSettingsHeaderTabProps> = ({
  settingsForm,
  setSettingsForm,
  updateSettings,
  setToast,
  settingsSaving,
  setSettingsSaving,
  cacheTelemetry,
  refreshStoreCacheFirst,
  clearLocalStoreCache,
}) => {
  const hasLogo = isValidImageUrl(settingsForm.logoUrl);
  const rawName = (settingsForm.storeName ?? '').trim();
  const hasName = rawName.length > 0;
  const showIcon = !hasLogo && hasName && settingsForm.showHeaderIcon !== false;
  const c1 = settingsForm.headerNameColor1 || '#171717';
  const c2 = settingsForm.headerNameColor2 || '#D71920';
  const adminBrandPreview = resolveAdminPanelBranding(settingsForm);

  return (
    <div className="divide-y divide-slate-200/80">
      {/* 1. Storefront Header Brand & Logo */}
      <div className="p-4 sm:px-5 space-y-4">
        <SettingsSectionHeader
          title="Storefront Header Brand & Favicon"
          description="Configure your top navigation logo, browser favicon, brand name, and contact hotline."
          action={
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
              {!hasLogo && !hasName ? (
                <span className="text-[11px] text-slate-400 italic">No Logo or Name</span>
              ) : (
                <>
                  {hasLogo && (
                    <img
                      src={settingsForm.logoUrl}
                      alt="Logo Preview"
                      onError={() => setSettingsForm(prev => ({ ...prev, logoUrl: '' }))}
                      className="h-6 w-auto max-w-[100px] object-contain"
                    />
                  )}
                  {showIcon && (
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: c2 }}
                    >
                      <BookOpen size={13} />
                    </span>
                  )}
                  {hasName && (
                    <div className="leading-none">
                      <div className="text-sm font-bold tracking-tight">
                        {(() => {
                          const parts = rawName.split(/\s+/);
                          if (parts.length <= 1) return <span style={{ color: c1 }}>{rawName}</span>;
                          const last = parts[parts.length - 1];
                          const first = parts.slice(0, -1).join(' ');
                          return (
                            <>
                              <span style={{ color: c1 }}>{first}</span>{' '}
                              <span style={{ color: c2 }}>{last}</span>
                            </>
                          );
                        })()}
                      </div>
                      {settingsForm.showHeaderTagline !== false && settingsForm.tagline && (
                        <div className="text-[8.5px] uppercase font-medium tracking-wider text-slate-500 mt-0.5">
                          {settingsForm.tagline}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          }
        />

        {/* Logo & Favicon Compact Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {hasLogo ? (
                <img
                  src={settingsForm.logoUrl}
                  alt="Header Logo Preview"
                  onError={() => setSettingsForm(prev => ({ ...prev, logoUrl: '' }))}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span className="text-[10px] text-slate-400">Logo</span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-800">Header Brand Logo</span>
                <div className="flex items-center gap-2">
                  {hasLogo && (
                    <button
                      type="button"
                      onClick={async () => {
                        setSettingsForm(prev => ({ ...prev, logoUrl: '' }));
                        await updateSettings({ logoUrl: '' });
                        setToast({ show: true, type: 'success', message: 'Header logo removed.' });
                      }}
                      className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <label className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium cursor-pointer inline-flex items-center gap-1 transition-colors">
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
                          setSettingsForm(prev => ({ ...prev, logoUrl: dataUrl }));
                          await updateSettings({ logoUrl: dataUrl });
                          setToast({ show: true, type: 'success', message: 'Header logo uploaded.' });
                        } catch (err: unknown) {
                          const message = err instanceof Error ? err.message : 'Failed to upload logo';
                          setToast({ show: true, type: 'error', message });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <input
                type="text"
                placeholder="Logo image URL (https://...)"
                value={hasLogo ? settingsForm.logoUrl : ''}
                onChange={e => setSettingsForm(prev => ({ ...prev, logoUrl: sanitizeImageUrl(e.target.value) }))}
                className={S_INPUT}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {isValidImageUrl(settingsForm.faviconUrl) ? (
                <img
                  src={settingsForm.faviconUrl}
                  alt="Favicon Preview"
                  onError={() => setSettingsForm(prev => ({ ...prev, faviconUrl: '' }))}
                  className="w-7 h-7 object-contain"
                />
              ) : (
                <span className="text-[10px] text-slate-400">ICO</span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-800">Website Favicon</span>
                <div className="flex items-center gap-2">
                  {isValidImageUrl(settingsForm.faviconUrl) && (
                    <button
                      type="button"
                      onClick={async () => {
                        setSettingsForm(prev => ({ ...prev, faviconUrl: '' }));
                        await updateSettings({ faviconUrl: '' });
                        setToast({ show: true, type: 'success', message: 'Favicon removed.' });
                      }}
                      className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <label className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium cursor-pointer inline-flex items-center gap-1 transition-colors">
                    <Upload size={11} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*,.ico,.svg"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const dataUrl = await compressImageFile(file, 128, 128, 0.92);
                          setSettingsForm(prev => ({ ...prev, faviconUrl: dataUrl }));
                          await updateSettings({ faviconUrl: dataUrl });
                          setToast({ show: true, type: 'success', message: 'Favicon updated.' });
                        } catch (err: unknown) {
                          const message = err instanceof Error ? err.message : 'Failed to upload favicon';
                          setToast({ show: true, type: 'error', message });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <input
                type="text"
                placeholder="Favicon image URL (https://...)"
                value={isValidImageUrl(settingsForm.faviconUrl) ? settingsForm.faviconUrl : ''}
                onChange={e => setSettingsForm(prev => ({ ...prev, faviconUrl: sanitizeImageUrl(e.target.value) }))}
                className={S_INPUT}
              />
            </div>
          </div>
        </div>

        {/* Store Name, Two-Tone Colors, Tagline & Contact */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600">Header Store Name</label>
                <label
                  className={`flex items-center gap-1 text-[11px] cursor-pointer ${
                    !rawName || hasLogo ? 'opacity-40 text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(rawName) && !hasLogo && settingsForm.showHeaderIcon !== false}
                    disabled={!rawName || Boolean(hasLogo)}
                    onChange={e => setSettingsForm(prev => ({ ...prev, showHeaderIcon: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-[#D71920]"
                  />
                  <span>Icon</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={settingsForm.storeName ?? ''}
                  onChange={e => setSettingsForm(prev => ({ ...prev, storeName: e.target.value }))}
                  placeholder="e.g. MR. BOOKS"
                  className={S_INPUT}
                />
                {settingsForm.storeName && (
                  <button
                    type="button"
                    onClick={() => setSettingsForm(prev => ({ ...prev, storeName: '' }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className={S_LABEL}>1st Word Color</label>
              <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-200 bg-white">
                <input
                  type="color"
                  value={c1}
                  onChange={e => setSettingsForm(prev => ({ ...prev, headerNameColor1: e.target.value }))}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                />
                <input
                  type="text"
                  value={c1}
                  onChange={e => setSettingsForm(prev => ({ ...prev, headerNameColor1: e.target.value }))}
                  className="w-full text-[11px] font-mono text-slate-800 focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className={S_LABEL}>2nd Word &amp; Icon</label>
              <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-200 bg-white">
                <input
                  type="color"
                  value={c2}
                  onChange={e => setSettingsForm(prev => ({ ...prev, headerNameColor2: e.target.value }))}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                />
                <input
                  type="text"
                  value={c2}
                  onChange={e => setSettingsForm(prev => ({ ...prev, headerNameColor2: e.target.value }))}
                  className="w-full text-[11px] font-mono text-slate-800 focus:outline-none uppercase"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600">Tagline</label>
                <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.showHeaderTagline !== false}
                    onChange={e => setSettingsForm(prev => ({ ...prev, showHeaderTagline: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-[#D71920]"
                  />
                  <span>Show</span>
                </label>
              </div>
              <input
                type="text"
                value={settingsForm.tagline || ''}
                onChange={e => setSettingsForm(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="Bookstore & Stationery"
                className={S_INPUT}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600">Header Hotline</label>
                <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.showHeaderContact !== false}
                    onChange={e => setSettingsForm(prev => ({ ...prev, showHeaderContact: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-[#D71920]"
                  />
                  <span>Show</span>
                </label>
              </div>
              <input
                type="text"
                value={settingsForm.phone || ''}
                onChange={e => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+880 1712-345678"
                className={S_INPUT}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Admin Panel Sidebar Branding */}
      <div
        id="admin-panel-branding-settings"
        data-testid="admin-panel-branding-settings"
        className="p-4 sm:px-5 space-y-3.5"
      >
        <SettingsSectionHeader
          title="Admin Sidebar Logo & Name"
          description="Customize the dark admin sidebar identity with a custom logo, title, subtitle, and text colors."
          action={
            <>
              <div
                data-testid="admin-brand-live-preview"
                className="px-3 py-1.5 rounded-lg bg-[#0F172A] border border-slate-800 flex items-center gap-2 min-w-[190px]"
              >
                {adminBrandPreview.isEmpty ? (
                  <span className="text-[11px] italic text-slate-400">Empty Brand</span>
                ) : (
                  <>
                    {adminBrandPreview.hasCustomLogo ? (
                      <img
                        src={adminBrandPreview.logoUrl}
                        alt="Admin Logo Preview"
                        onError={() => setSettingsForm(prev => ({ ...prev, adminLogoUrl: '' }))}
                        className="h-6 w-auto max-w-[100px] object-contain rounded shrink-0"
                      />
                    ) : adminBrandPreview.showIconBadge ? (
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: adminBrandPreview.iconBgColor }}
                      >
                        <BookOpen size={13} />
                      </span>
                    ) : null}
                    {(adminBrandPreview.displayName || adminBrandPreview.subtitle) && (
                      <div className="min-w-0 leading-tight">
                        {adminBrandPreview.displayName && (
                          <div className="font-bold text-xs tracking-tight truncate">
                            {adminBrandPreview.lastWord ? (
                              <>
                                <span className="mr-1" style={{ color: adminBrandPreview.color1 }}>
                                  {adminBrandPreview.firstPart}
                                </span>
                                <span style={{ color: adminBrandPreview.color2 }}>
                                  {adminBrandPreview.lastWord}
                                </span>
                              </>
                            ) : (
                              <span style={{ color: adminBrandPreview.color1 }}>
                                {adminBrandPreview.displayName}
                              </span>
                            )}
                          </div>
                        )}
                        {adminBrandPreview.subtitle && (
                          <div className="text-[9.5px] text-slate-400 truncate">
                            {adminBrandPreview.subtitle}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSettingsForm(prev => ({
                    ...prev,
                    adminLogoUrl: '',
                    showAdminIcon: true,
                    adminIconBgColor: DEFAULT_ADMIN_ICON_BG_COLOR,
                    adminBrandName: DEFAULT_ADMIN_BRAND_NAME,
                    adminPanelSubtitle: DEFAULT_ADMIN_SUBTITLE,
                    adminNameColor1: DEFAULT_ADMIN_NAME_COLOR_1,
                    adminNameColor2: DEFAULT_ADMIN_NAME_COLOR_2,
                    adminUseTwoToneName: false,
                  }));
                  setToast({
                    show: true,
                    type: 'success',
                    message: 'Admin branding reset to defaults.',
                  });
                }}
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
              >
                Reset
              </button>

              <button
                type="button"
                disabled={settingsSaving}
                data-testid="save-admin-brand-btn"
                onClick={async () => {
                  setSettingsSaving(true);
                  try {
                    await updateSettings({
                      adminLogoUrl: sanitizeImageUrl(settingsForm.adminLogoUrl),
                      showAdminIcon: settingsForm.showAdminIcon !== false,
                      adminIconBgColor: normalizeHexColor(
                        settingsForm.adminIconBgColor,
                        DEFAULT_ADMIN_ICON_BG_COLOR
                      ),
                      adminBrandName: settingsForm.adminBrandName ?? DEFAULT_ADMIN_BRAND_NAME,
                      adminPanelSubtitle: settingsForm.adminPanelSubtitle ?? DEFAULT_ADMIN_SUBTITLE,
                      adminNameColor1: normalizeHexColor(
                        settingsForm.adminNameColor1,
                        DEFAULT_ADMIN_NAME_COLOR_1
                      ),
                      adminNameColor2: normalizeHexColor(
                        settingsForm.adminNameColor2,
                        DEFAULT_ADMIN_NAME_COLOR_2
                      ),
                      adminUseTwoToneName: Boolean(settingsForm.adminUseTwoToneName),
                    });
                    setToast({ show: true, type: 'success', message: 'Admin branding saved.' });
                  } finally {
                    setSettingsSaving(false);
                  }
                }}
                className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-colors"
              >
                <Check size={12} />
                <span>{settingsSaving ? 'Saving...' : 'Apply Brand'}</span>
              </button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Admin Logo Upload & Default Icon */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-lg bg-[#0F172A] border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {isValidImageUrl(settingsForm.adminLogoUrl) ? (
                  <img
                    src={settingsForm.adminLogoUrl}
                    alt="Admin Logo Thumbnail"
                    onError={() => setSettingsForm(prev => ({ ...prev, adminLogoUrl: '' }))}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-white"
                    style={{
                      backgroundColor: normalizeHexColor(
                        settingsForm.adminIconBgColor,
                        DEFAULT_ADMIN_ICON_BG_COLOR
                      ),
                    }}
                  >
                    <BookOpen size={13} />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-800">Admin Logo Picture</span>
                  <div className="flex items-center gap-2">
                    {isValidImageUrl(settingsForm.adminLogoUrl) && (
                      <button
                        type="button"
                        data-testid="remove-admin-logo-btn"
                        onClick={async () => {
                          setSettingsForm(prev => ({ ...prev, adminLogoUrl: '' }));
                          await updateSettings({ adminLogoUrl: '' });
                          setToast({ show: true, type: 'success', message: 'Admin logo removed.' });
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
                        data-testid="admin-logo-file-input"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          try {
                            const dataUrl = await compressImageFile(file, 400, 400, 0.9);
                            setSettingsForm(prev => ({ ...prev, adminLogoUrl: dataUrl }));
                            await updateSettings({ adminLogoUrl: dataUrl });
                            setToast({ show: true, type: 'success', message: 'Admin logo uploaded.' });
                          } catch (err: unknown) {
                            const message = err instanceof Error ? err.message : 'Failed to upload admin logo';
                            setToast({ show: true, type: 'error', message });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  data-testid="admin-logo-url-input"
                  placeholder="Admin logo image URL (https://...)"
                  value={isValidImageUrl(settingsForm.adminLogoUrl) ? settingsForm.adminLogoUrl : ''}
                  onChange={e => setSettingsForm(prev => ({ ...prev, adminLogoUrl: sanitizeImageUrl(e.target.value) }))}
                  className={S_INPUT}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <label
                className={`flex items-center gap-1.5 text-xs cursor-pointer ${
                  isValidImageUrl(settingsForm.adminLogoUrl) ? 'opacity-45 text-slate-400' : 'text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={isValidImageUrl(settingsForm.adminLogoUrl)}
                  checked={!isValidImageUrl(settingsForm.adminLogoUrl) && settingsForm.showAdminIcon !== false}
                  onChange={e => setSettingsForm(prev => ({ ...prev, showAdminIcon: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-[#D71920]"
                />
                <span>Show default book icon</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Icon BG</span>
                <input
                  type="color"
                  disabled={isValidImageUrl(settingsForm.adminLogoUrl) || settingsForm.showAdminIcon === false}
                  value={normalizeHexColor(settingsForm.adminIconBgColor, DEFAULT_ADMIN_ICON_BG_COLOR)}
                  onChange={e => setSettingsForm(prev => ({ ...prev, adminIconBgColor: e.target.value }))}
                  className="w-6 h-6 rounded cursor-pointer border border-slate-200 bg-transparent p-0 disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          {/* Right: Admin Name, Subtitle & Color */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-600">Admin Panel Name</label>
                  {(settingsForm.adminBrandName ?? DEFAULT_ADMIN_BRAND_NAME) !== '' && (
                    <button
                      type="button"
                      data-testid="clear-admin-brand-name-btn"
                      onClick={() => setSettingsForm(prev => ({ ...prev, adminBrandName: '' }))}
                      className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  data-testid="admin-brand-name-input"
                  value={settingsForm.adminBrandName ?? DEFAULT_ADMIN_BRAND_NAME}
                  onChange={e => setSettingsForm(prev => ({ ...prev, adminBrandName: e.target.value }))}
                  placeholder="MR. BOOKS BD"
                  className={S_INPUT}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-600">Subtitle</label>
                  {(settingsForm.adminPanelSubtitle ?? DEFAULT_ADMIN_SUBTITLE) !== '' && (
                    <button
                      type="button"
                      onClick={() => setSettingsForm(prev => ({ ...prev, adminPanelSubtitle: '' }))}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                    >
                      Hide
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  data-testid="admin-brand-subtitle-input"
                  value={settingsForm.adminPanelSubtitle ?? DEFAULT_ADMIN_SUBTITLE}
                  onChange={e => setSettingsForm(prev => ({ ...prev, adminPanelSubtitle: e.target.value }))}
                  placeholder="Store Admin Console"
                  className={S_INPUT}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-200 bg-white w-32">
                <input
                  type="color"
                  data-testid="admin-brand-color1-picker"
                  value={normalizeHexColor(settingsForm.adminNameColor1, DEFAULT_ADMIN_NAME_COLOR_1)}
                  onChange={e => setSettingsForm(prev => ({ ...prev, adminNameColor1: e.target.value.toUpperCase() }))}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                />
                <input
                  type="text"
                  data-testid="admin-brand-color1-hex"
                  value={settingsForm.adminNameColor1 || DEFAULT_ADMIN_NAME_COLOR_1}
                  onChange={e => setSettingsForm(prev => ({ ...prev, adminNameColor1: e.target.value }))}
                  className="w-full text-[11px] font-mono text-slate-800 focus:outline-none uppercase"
                  placeholder="#FFFFFF"
                />
              </div>

              {settingsForm.adminUseTwoToneName && (
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-200 bg-white w-32">
                  <input
                    type="color"
                    data-testid="admin-brand-color2-picker"
                    value={normalizeHexColor(settingsForm.adminNameColor2, DEFAULT_ADMIN_NAME_COLOR_2)}
                    onChange={e => setSettingsForm(prev => ({ ...prev, adminNameColor2: e.target.value.toUpperCase() }))}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    data-testid="admin-brand-color2-hex"
                    value={settingsForm.adminNameColor2 || DEFAULT_ADMIN_NAME_COLOR_2}
                    onChange={e => setSettingsForm(prev => ({ ...prev, adminNameColor2: e.target.value }))}
                    className="w-full text-[11px] font-mono text-slate-800 focus:outline-none uppercase"
                    placeholder="#D71920"
                  />
                </div>
              )}

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="admin-brand-twotone-toggle"
                  checked={Boolean(settingsForm.adminUseTwoToneName)}
                  onChange={e =>
                    setSettingsForm(prev => ({
                      ...prev,
                      adminUseTwoToneName: e.target.checked,
                      adminNameColor2: prev.adminNameColor2 || DEFAULT_ADMIN_NAME_COLOR_2,
                    }))
                  }
                  className="w-3.5 h-3.5 accent-[#D71920]"
                />
                <span>Two-tone last word</span>
              </label>

              <div className="flex items-center gap-1.5 ml-auto">
                {ADMIN_BRAND_COLOR_PRESETS.map(preset => {
                  const isSelected =
                    normalizeHexColor(settingsForm.adminNameColor1, DEFAULT_ADMIN_NAME_COLOR_1) === preset.hex;
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      title={`${preset.label} (${preset.hex})`}
                      onClick={() => setSettingsForm(prev => ({ ...prev, adminNameColor1: preset.hex }))}
                      className={`w-4 h-4 rounded-full border cursor-pointer transition-transform ${
                        isSelected
                          ? 'ring-2 ring-offset-1 ring-slate-900 scale-110 border-slate-400'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Header Announcement Bar */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Header Announcement Bar"
          description="Manage scrolling notices displayed in the storefront header."
          action={
            <>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.showAnnouncementBar !== false}
                  onChange={e => setSettingsForm(prev => ({ ...prev, showAnnouncementBar: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-[#D71920]"
                />
                <span>Enabled</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const current = settingsForm.announcementItems || [];
                  setSettingsForm(prev => ({
                    ...prev,
                    announcementItems: [
                      ...current,
                      {
                        id: 'ann-' + Date.now(),
                        icon: '🔥',
                        title: 'SPECIAL OFFER:',
                        desc: 'Write your announcement text here...',
                        isActive: true,
                      },
                    ],
                  }));
                }}
                className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Notice</span>
              </button>
            </>
          }
        />

        {(settingsForm.announcementItems || []).length === 0 ? (
          <p className="text-xs text-slate-400">No announcements configured.</p>
        ) : (
          <div className="space-y-2">
            {(settingsForm.announcementItems || []).map((item, idx) => (
              <div key={item.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={item.icon}
                  onChange={e => {
                    const updated = [...(settingsForm.announcementItems || [])];
                    updated[idx] = { ...updated[idx], icon: e.target.value };
                    setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                  }}
                  placeholder="⚡"
                  className="sm:col-span-1 h-8 px-2 text-center rounded-lg border border-slate-200 bg-white text-xs"
                />
                <input
                  type="text"
                  value={item.title}
                  onChange={e => {
                    const updated = [...(settingsForm.announcementItems || [])];
                    updated[idx] = { ...updated[idx], title: e.target.value };
                    setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                  }}
                  placeholder="SPECIAL OFFER:"
                  className="sm:col-span-3 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#D71920]"
                />
                <input
                  type="text"
                  value={item.desc}
                  onChange={e => {
                    const updated = [...(settingsForm.announcementItems || [])];
                    updated[idx] = { ...updated[idx], desc: e.target.value };
                    setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                  }}
                  placeholder="Announcement details..."
                  className="sm:col-span-6 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                />
                <div className="sm:col-span-2 flex items-center justify-end gap-2">
                  <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isActive !== false}
                      onChange={e => {
                        const updated = [...(settingsForm.announcementItems || [])];
                        updated[idx] = { ...updated[idx], isActive: e.target.checked };
                        setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                      }}
                      className="w-3.5 h-3.5 accent-[#D71920]"
                    />
                    <span>Active</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (settingsForm.announcementItems || []).filter((_, i) => i !== idx);
                      setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                    aria-label="Delete announcement"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Display Theme, Skeleton Loader & Storefront Cache Strategy */}
      <div className="p-4 sm:px-5 space-y-4">
        <SettingsSectionHeader
          title="Theme, Loading & Cache Strategy"
          description="Manage visitor theme toggle, skeleton preloading, and IndexedDB cache-first data syncing."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.enableThemeToggle !== false}
              onChange={e => setSettingsForm(prev => ({ ...prev, enableThemeToggle: e.target.checked }))}
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Enable visitor dark mode switcher</span>
          </label>

          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.enableSkeletonLoading !== false}
              onChange={e => setSettingsForm(prev => ({ ...prev, enableSkeletonLoading: e.target.checked }))}
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Enable skeleton screen loading</span>
          </label>

          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.enableIndexedQuerySnapshots !== false}
              onChange={e => setSettingsForm(prev => ({ ...prev, enableIndexedQuerySnapshots: e.target.checked }))}
              className="w-3.5 h-3.5 accent-[#D71920]"
            />
            <span>Enable indexed query snapshots</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={S_LABEL}>Skeleton Style</label>
            <select
              value={settingsForm.skeletonAnimationStyle || 'shimmer'}
              onChange={e =>
                setSettingsForm(prev => ({
                  ...prev,
                  skeletonAnimationStyle: e.target.value as 'shimmer' | 'pulse',
                }))
              }
              className={S_SELECT}
            >
              <option value="shimmer">Shimmer Wave</option>
              <option value="pulse">Soft Pulse</option>
            </select>
          </div>

          <div>
            <label className={S_LABEL}>Max Skeleton Timeout</label>
            <select
              value={settingsForm.skeletonMaxDurationMs || 1200}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, skeletonMaxDurationMs: Number(e.target.value) }))
              }
              className={S_SELECT}
            >
              <option value={800}>Fast (800ms)</option>
              <option value={1200}>Balanced (1200ms)</option>
              <option value={2000}>Extended (2000ms)</option>
            </select>
          </div>

          <div>
            <label className={S_LABEL}>Data Fetch Strategy</label>
            <select
              value={settingsForm.firestoreFetchStrategy || 'cache-first'}
              onChange={e =>
                setSettingsForm(prev => ({
                  ...prev,
                  firestoreFetchStrategy: e.target.value as
                    | 'cache-first'
                    | 'realtime-snapshot'
                    | 'network-first',
                }))
              }
              className={S_SELECT}
            >
              <option value="cache-first">Cache-First (Recommended)</option>
              <option value="realtime-snapshot">Real-Time Snapshot Stream</option>
              <option value="network-first">Network-First Verification</option>
            </select>
          </div>

          <div>
            <label className={S_LABEL}>Initial Batch Limit</label>
            <select
              value={settingsForm.firestoreQueryLimit || 250}
              onChange={e =>
                setSettingsForm(prev => ({ ...prev, firestoreQueryLimit: Number(e.target.value) }))
              }
              className={S_SELECT}
            >
              <option value={100}>100 docs / query</option>
              <option value={250}>250 docs / query</option>
              <option value={500}>500 docs / query</option>
              <option value={1000}>1000 docs / query</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
          <span className="text-slate-500 tabular-nums">
            Source:{' '}
            <strong className="font-medium text-slate-700">
              {cacheTelemetry.lastSource === 'cache'
                ? 'IndexedDB Cache'
                : cacheTelemetry.lastSource === 'local-storage'
                  ? 'Local Cache'
                  : 'Network Snapshot'}
            </strong>{' '}
            · Hits: {cacheTelemetry.cacheHits} · Syncs: {cacheTelemetry.networkFetches}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void refreshStoreCacheFirst(false);
              }}
              className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium cursor-pointer"
            >
              Test Cache Fetch
            </button>
            <button
              type="button"
              onClick={() => {
                clearLocalStoreCache();
                void refreshStoreCacheFirst(true);
              }}
              className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium cursor-pointer"
            >
              Clear &amp; Re-Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
