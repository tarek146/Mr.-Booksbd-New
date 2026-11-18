import React from 'react';
import { Check, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import type { HomeConfig, SiteSettings, StoreSettings } from '../../../types';
import {
  DEFAULT_ADMIN_BRAND_NAME,
  DEFAULT_ADMIN_ICON_BG_COLOR,
  DEFAULT_ADMIN_NAME_COLOR_1,
  DEFAULT_ADMIN_NAME_COLOR_2,
  DEFAULT_ADMIN_SUBTITLE,
} from '../../../utils/adminBrandingHelpers';
import { AdminSettingsFooterTab } from './AdminSettingsFooterTab';
import { AdminSettingsHeaderTab } from './AdminSettingsHeaderTab';
import { AdminSettingsHomeTab } from './AdminSettingsHomeTab';
import { AdminSettingsSeoTab } from './AdminSettingsSeoTab';
import { AdminSettingsShippingTab } from './AdminSettingsShippingTab';
import { AdminSettingsSocialTab } from './AdminSettingsSocialTab';
import type { CacheTelemetryState, SettingsSubTabId, ToastSetter } from './settingsShared';

interface AdminSettingsPanelProps {
  settings: StoreSettings;
  settingsForm: StoreSettings;
  setSettingsForm: React.Dispatch<React.SetStateAction<StoreSettings>>;
  settingsSubTab: SettingsSubTabId;
  setSettingsSubTab: React.Dispatch<React.SetStateAction<SettingsSubTabId>>;
  settingsSaving: boolean;
  setSettingsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  settingsSuccess: boolean;
  setSettingsSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  newSubAreaInput: string;
  setNewSubAreaInput: React.Dispatch<React.SetStateAction<string>>;
  updateSettings: (patch: Partial<StoreSettings>) => Promise<void>;
  siteSettings: SiteSettings;
  updateSiteSettings: (patch: Partial<SiteSettings>) => Promise<void>;
  homeConfig: HomeConfig;
  updateHomeConfig: (patch: Partial<HomeConfig>) => Promise<void>;
  cacheTelemetry: CacheTelemetryState;
  refreshStoreCacheFirst: (forceNetwork?: boolean) => Promise<void>;
  clearLocalStoreCache: () => void;
  setToast: ToastSetter;
  onOpenPaymentMethods: () => void;
  onOpenCapiManager: () => void;
}

const SETTINGS_TABS: { id: SettingsSubTabId; label: string }[] = [
  { id: 'header', label: 'Header & Admin' },
  { id: 'footer', label: 'Footer & Chat' },
  { id: 'shipping', label: 'Payment & Shipping' },
  { id: 'social', label: 'Social & Support' },
  { id: 'seo', label: 'SEO & Tracking' },
  { id: 'homepage', label: 'Home Visibility' },
];

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  settings,
  settingsForm,
  setSettingsForm,
  settingsSubTab,
  setSettingsSubTab,
  settingsSaving,
  setSettingsSaving,
  settingsSuccess,
  setSettingsSuccess,
  newSubAreaInput,
  setNewSubAreaInput,
  updateSettings,
  siteSettings,
  updateSiteSettings,
  homeConfig,
  updateHomeConfig,
  cacheTelemetry,
  refreshStoreCacheFirst,
  clearLocalStoreCache,
  setToast,
  onOpenPaymentMethods,
  onOpenCapiManager,
}) => {
  const handleSaveAll = async () => {
    setSettingsSaving(true);
    try {
      await updateSettings(settingsForm);
      setSettingsSuccess(true);
      setToast({ show: true, type: 'success', message: 'Settings saved and updated live.' });
      setTimeout(() => setSettingsSuccess(false), 3000);
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3.5" data-testid="admin-settings-panel">
      {/* Compact Header & Horizontal Underline Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">Settings</h2>
            <p className="text-[11px] text-slate-500">
              Manage storefront branding, delivery charges, tracking, and visibility
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSettingsForm(settings);
                setToast({ show: true, type: 'success', message: 'Synced latest settings from server.' });
              }}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Reload current saved settings"
            >
              <RefreshCw size={12} className="text-slate-500" />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (settingsSubTab === 'header') {
                  setSettingsForm(prev => ({ ...prev, logoUrl: '', faviconUrl: '', storeName: '', tagline: '' }));
                } else if (settingsSubTab === 'footer') {
                  setSettingsForm(prev => ({
                    ...prev,
                    footerLogoUrl: '',
                    footerBrandName: '',
                    footerPaymentBannerUrl: '',
                    footerDescription: '',
                  }));
                } else if (settingsSubTab === 'social') {
                  setSettingsForm(prev => ({ ...prev, socialLinks: [] }));
                } else if (settingsSubTab === 'seo') {
                  setSettingsForm(prev => ({ ...prev, metaTitle: '', metaDescription: '', ogImageUrl: '', keywords: '' }));
                }
                setToast({
                  show: true,
                  type: 'success',
                  message: 'Cleared fields in current section. Save to apply.',
                });
              }}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50/60 hover:border-red-200 text-slate-700 hover:text-red-600 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Clear fields in current tab"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsForm(prev => ({
                  ...prev,
                  storeName: 'MR. BOOKS',
                  tagline: 'Bookstore & Stationery',
                  logoUrl: '',
                  showHeaderIcon: true,
                  headerNameColor1: '#171717',
                  headerNameColor2: '#D71920',
                  headerBrandColorMode: 'two_tone',
                  headerWordColors: [],
                  headerLetterColors: [],
                  adminLogoUrl: '',
                  showAdminIcon: true,
                  adminIconBgColor: DEFAULT_ADMIN_ICON_BG_COLOR,
                  adminBrandName: DEFAULT_ADMIN_BRAND_NAME,
                  adminPanelSubtitle: DEFAULT_ADMIN_SUBTITLE,
                  adminNameColor1: DEFAULT_ADMIN_NAME_COLOR_1,
                  adminNameColor2: DEFAULT_ADMIN_NAME_COLOR_2,
                  adminUseTwoToneName: false,
                  footerLogoUrl: '',
                  showFooterIcon: true,
                  footerBrandName: 'MR. BOOKS',
                  footerNameColor1: '#FFFFFF',
                  footerNameColor2: '#D71920',
                  footerBgColor: '#121212',
                  footerCardBgColor: '#1c1c1e',
                  footerPaymentBannerUrl: '',
                }));
                setToast({
                  show: true,
                  type: 'success',
                  message: 'Restored default brand settings. Save to apply.',
                });
              }}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Reset brand colors and defaults"
            >
              <RefreshCw size={12} className="text-slate-500" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              disabled={settingsSaving}
              onClick={handleSaveAll}
              className="h-8 px-3.5 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-medium rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <Check size={13} />
              <span>{settingsSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Clean Single-Line Underline Navigation Bar */}
        <nav
          aria-label="Settings sections"
          className="px-3 sm:px-4 flex items-center gap-1 overflow-x-auto no-scrollbar bg-white"
        >
          {SETTINGS_TABS.map(tab => {
            const isActive = settingsSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`settings-tab-${tab.id}`}
                onClick={() => setSettingsSubTab(tab.id)}
                className={`py-2.5 px-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#D71920] text-[#D71920] font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {settingsSuccess && (
        <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>Settings saved and synced across the storefront.</span>
        </div>
      )}

      {settingsSubTab === 'homepage' ? (
        <AdminSettingsHomeTab
          settings={settings}
          siteSettings={siteSettings}
          homeConfig={homeConfig}
          updateSiteSettings={updateSiteSettings}
          updateHomeConfig={updateHomeConfig}
          setToast={setToast}
        />
      ) : (
        <form
          onSubmit={async e => {
            e.preventDefault();
            await handleSaveAll();
          }}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          {settingsSubTab === 'header' && (
            <AdminSettingsHeaderTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              updateSettings={updateSettings}
              setToast={setToast}
              settingsSaving={settingsSaving}
              setSettingsSaving={setSettingsSaving}
              cacheTelemetry={cacheTelemetry}
              refreshStoreCacheFirst={refreshStoreCacheFirst}
              clearLocalStoreCache={clearLocalStoreCache}
            />
          )}

          {settingsSubTab === 'footer' && (
            <AdminSettingsFooterTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              updateSettings={updateSettings}
              setToast={setToast}
            />
          )}

          {settingsSubTab === 'shipping' && (
            <AdminSettingsShippingTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              updateSettings={updateSettings}
              setToast={setToast}
              newSubAreaInput={newSubAreaInput}
              setNewSubAreaInput={setNewSubAreaInput}
              onOpenPaymentMethods={onOpenPaymentMethods}
            />
          )}

          {settingsSubTab === 'social' && (
            <AdminSettingsSocialTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              updateSettings={updateSettings}
              setToast={setToast}
            />
          )}

          {settingsSubTab === 'seo' && (
            <AdminSettingsSeoTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              updateSettings={updateSettings}
              setToast={setToast}
              onOpenCapiManager={onOpenCapiManager}
            />
          )}

          <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="h-8 px-4 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-medium rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <Check size={13} />
              <span>{settingsSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
