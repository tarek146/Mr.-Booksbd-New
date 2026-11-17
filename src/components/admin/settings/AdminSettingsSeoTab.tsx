import React from 'react';
import { Server } from 'lucide-react';
import {
  type SettingsFormTabProps,
  SettingsSectionHeader,
  S_INPUT,
  S_LABEL,
  S_TEXTAREA,
} from './settingsShared';

interface AdminSettingsSeoTabProps extends SettingsFormTabProps {
  onOpenCapiManager: () => void;
}

export const AdminSettingsSeoTab: React.FC<AdminSettingsSeoTabProps> = ({
  settingsForm,
  setSettingsForm,
  onOpenCapiManager,
}) => {
  return (
    <div className="divide-y divide-slate-200/80">
      {/* SEO & Open Graph Metadata */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="SEO & Open Graph Metadata"
          description="Search engine title, description, social share image, and target keywords."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={S_LABEL}>Meta Title</label>
            <input
              type="text"
              value={settingsForm.metaTitle || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, metaTitle: e.target.value }))}
              className={S_INPUT}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={S_LABEL}>Meta Description</label>
            <textarea
              rows={2}
              value={settingsForm.metaDescription || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, metaDescription: e.target.value }))}
              className={S_TEXTAREA}
            />
          </div>
          <div>
            <label className={S_LABEL}>Open Graph Image URL</label>
            <input
              type="text"
              value={settingsForm.ogImageUrl || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, ogImageUrl: e.target.value }))}
              className={S_INPUT}
            />
          </div>
          <div>
            <label className={S_LABEL}>Keywords</label>
            <input
              type="text"
              value={settingsForm.keywords || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, keywords: e.target.value }))}
              className={S_INPUT}
            />
          </div>
        </div>
      </div>

      {/* Marketing & Conversion Tracking */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Marketing & Conversion Tracking"
          description="Connect Facebook Pixel, server-side Conversions API, Google Analytics (GA4), and TikTok Pixel."
          action={
            <button
              type="button"
              onClick={onOpenCapiManager}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Server size={12} className="text-[#1877F2]" />
              <span>Conversion API Manager</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className={S_LABEL}>Facebook Pixel ID</label>
            <input
              type="text"
              placeholder="e.g. 123456789012345"
              value={settingsForm.facebookPixelId || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, facebookPixelId: e.target.value }))}
              className={`${S_INPUT} font-mono`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Facebook CAPI Access Token</label>
            <input
              type="password"
              placeholder="EAABsbCS1iHgBO..."
              value={settingsForm.facebookCapiToken || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, facebookCapiToken: e.target.value }))}
              className={`${S_INPUT} font-mono`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Test Event Code (Optional)</label>
            <input
              type="text"
              placeholder="e.g. TEST12345"
              value={settingsForm.facebookTestEventCode || ''}
              onChange={e =>
                setSettingsForm(prev => ({
                  ...prev,
                  facebookTestEventCode: e.target.value,
                  facebookTestModeEnabled: Boolean(e.target.value.trim()),
                }))
              }
              className={`${S_INPUT} font-mono`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Google Analytics (GA4) ID</label>
            <input
              type="text"
              value={settingsForm.gaMeasurementId || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, gaMeasurementId: e.target.value }))}
              className={`${S_INPUT} font-mono`}
            />
          </div>
          <div>
            <label className={S_LABEL}>TikTok Pixel ID</label>
            <input
              type="text"
              value={settingsForm.tiktokPixelId || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, tiktokPixelId: e.target.value }))}
              className={`${S_INPUT} font-mono`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
