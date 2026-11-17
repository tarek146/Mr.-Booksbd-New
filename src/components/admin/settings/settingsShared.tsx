import React from 'react';
import type { HomeConfig, SiteSettings, StoreSettings } from '../../../types';

export type SettingsSubTabId = 'header' | 'footer' | 'shipping' | 'social' | 'seo' | 'homepage';

export interface ToastSetter {
  (toast: { show: boolean; type: 'success' | 'error'; message: string }): void;
}

export interface CacheTelemetryState {
  lastSource: 'cache' | 'server' | 'local-storage';
  cacheHits: number;
  networkFetches: number;
  lastSyncAt: number;
}

export interface SettingsFormTabProps {
  settingsForm: StoreSettings;
  setSettingsForm: React.Dispatch<React.SetStateAction<StoreSettings>>;
  updateSettings: (patch: Partial<StoreSettings>) => Promise<void>;
  setToast: ToastSetter;
}

export interface HomeVisibilityTabProps {
  settings: StoreSettings;
  siteSettings: SiteSettings;
  homeConfig: HomeConfig;
  updateSiteSettings: (patch: Partial<SiteSettings>) => Promise<void>;
  updateHomeConfig: (patch: Partial<HomeConfig>) => Promise<void>;
  setToast: ToastSetter;
}

export const S_INPUT =
  'w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/10 transition-colors';

export const S_TEXTAREA =
  'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/10 transition-colors leading-relaxed';

export const S_SELECT =
  'w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/10 transition-colors cursor-pointer';

export const S_LABEL = 'block text-[11px] font-medium text-slate-600 mb-1';

export const SettingsSectionHeader: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
    <div className="min-w-0">
      <h3 className="text-[13px] font-semibold text-slate-900 leading-snug">{title}</h3>
      {description && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</p>}
    </div>
    {action && <div className="flex items-center gap-2 shrink-0 flex-wrap">{action}</div>}
  </div>
);

export const SettingsSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
  testId?: string;
  disabled?: boolean;
}> = ({ checked, onChange, ariaLabel, testId, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    data-testid={testId}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none disabled:opacity-50 ${
      checked ? 'bg-emerald-600' : 'bg-slate-300'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-150 ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);
