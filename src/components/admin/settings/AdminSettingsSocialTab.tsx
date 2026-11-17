import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type SettingsFormTabProps, SettingsSectionHeader, S_INPUT, S_LABEL } from './settingsShared';

export const AdminSettingsSocialTab: React.FC<SettingsFormTabProps> = ({
  settingsForm,
  setSettingsForm,
}) => {
  return (
    <div className="divide-y divide-slate-200/80">
      {/* Footer Social Media Links */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Footer Social Links"
          description="Manage social profile URLs displayed in your storefront footer."
          action={
            <button
              type="button"
              onClick={() => {
                const current = settingsForm.socialLinks || [];
                setSettingsForm(prev => ({
                  ...prev,
                  socialLinks: [
                    ...current,
                    {
                      id: 'soc-' + Date.now(),
                      name: 'Facebook',
                      url: 'https://facebook.com',
                      icon: 'facebook',
                      isActive: true,
                    },
                  ],
                }));
              }}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Link</span>
            </button>
          }
        />

        <div className="max-w-xs">
          <label className={S_LABEL}>Section Heading</label>
          <input
            type="text"
            value={settingsForm.footerSocialTitle ?? 'Social Media'}
            onChange={e => setSettingsForm(prev => ({ ...prev, footerSocialTitle: e.target.value }))}
            placeholder="Social Media"
            className={S_INPUT}
          />
        </div>

        {(settingsForm.socialLinks || []).length === 0 ? (
          <p className="text-xs text-slate-400">No social links configured yet.</p>
        ) : (
          <div className="space-y-2 pt-1">
            {(settingsForm.socialLinks || []).map((soc, idx) => (
              <div key={soc.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Platform Name (e.g. Facebook)"
                  value={soc.name}
                  onChange={e => {
                    const updated = [...(settingsForm.socialLinks || [])];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                  }}
                  className={`${S_INPUT} sm:col-span-4`}
                />
                <input
                  type="text"
                  placeholder="URL (https://...)"
                  value={soc.url}
                  onChange={e => {
                    const updated = [...(settingsForm.socialLinks || [])];
                    updated[idx] = { ...updated[idx], url: e.target.value };
                    setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                  }}
                  className={`${S_INPUT} sm:col-span-6`}
                />
                <div className="sm:col-span-2 flex items-center justify-end gap-2">
                  <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soc.isActive}
                      onChange={e => {
                        const updated = [...(settingsForm.socialLinks || [])];
                        updated[idx] = { ...updated[idx], isActive: e.target.checked };
                        setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                      }}
                      className="w-3.5 h-3.5 accent-[#D71920]"
                    />
                    <span>Active</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (settingsForm.socialLinks || []).filter((_, i) => i !== idx);
                      setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                    aria-label="Remove social link"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Support Contact Channels */}
      <div className="p-4 sm:px-5 space-y-3">
        <SettingsSectionHeader
          title="Direct Product Page Support Channels"
          description="Quick contact buttons shown to shoppers on book and product detail pages."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={S_LABEL}>WhatsApp Number</label>
            <input
              type="text"
              placeholder="+880 1712-345678"
              value={settingsForm.whatsappNumber || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
              className={`${S_INPUT} tabular-nums`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Hotline / Call Number</label>
            <input
              type="text"
              placeholder="01712345678"
              value={settingsForm.callNumber || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, callNumber: e.target.value }))}
              className={`${S_INPUT} tabular-nums`}
            />
          </div>
          <div>
            <label className={S_LABEL}>Telegram URL</label>
            <input
              type="text"
              placeholder="https://t.me/mrbooksbd"
              value={settingsForm.telegramUrl || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, telegramUrl: e.target.value }))}
              className={S_INPUT}
            />
          </div>
          <div>
            <label className={S_LABEL}>Facebook Messenger URL</label>
            <input
              type="text"
              placeholder="https://m.me/mrbooksbd"
              value={settingsForm.messengerUrl || ''}
              onChange={e => setSettingsForm(prev => ({ ...prev, messengerUrl: e.target.value }))}
              className={S_INPUT}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
