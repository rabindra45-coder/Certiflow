import React, { useState } from 'react';
import { Building, Server, FileSignature, MessageSquare, Palette } from 'lucide-react';
import { SmtpSettingsCard } from './SmtpSettingsCard';
import { InstitutionalIdentityCard } from './InstitutionalIdentityCard';
import { SignatureManagerCard } from './SignatureManagerCard';
import { WhatsAppSettingsCard } from './WhatsAppSettingsCard';
import { ThemeManagementCard } from './ThemeManagementCard';
import { ThemeConfig } from '../../types';

interface SettingsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onThemeChanged?: (theme: ThemeConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast, onThemeChanged }) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'identity' | 'signatures' | 'smtp' | 'whatsapp'>('theme');

  const handleNotify = (msg: string, type: 'success' | 'info' | 'error') => {
    onShowToast(
      type === 'success' ? 'Settings Updated' : type === 'error' ? 'Notice' : 'Information',
      msg,
      type
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Institutional Settings &amp; Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your workspace visual theme, organization branding, authorized signatures vault, live SMTP servers, and WhatsApp distribution gateways.
          </p>
        </div>

        {/* Setting Section Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'theme'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Theme &amp; Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'identity'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Institutional Identity &amp; Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signatures')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'signatures'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <FileSignature className="h-4 w-4" />
            <span>Signature Management System</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'smtp'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>SMTP Server &amp; Testing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp Gateway &amp; Dispatch</span>
          </button>
        </div>

        {/* Tab 0: Theme & Appearance */}
        {activeTab === 'theme' && (
          <ThemeManagementCard onNotify={handleNotify} onThemeChanged={onThemeChanged} />
        )}

        {/* Tab 1: Institutional Identity & Logo */}
        {activeTab === 'identity' && (
          <InstitutionalIdentityCard onNotify={handleNotify} />
        )}

        {/* Tab 2: Signature Management */}
        {activeTab === 'signatures' && (
          <SignatureManagerCard onNotify={handleNotify} />
        )}

        {/* Tab 3: SMTP Mail Server */}
        {activeTab === 'smtp' && (
          <SmtpSettingsCard onShowToast={onShowToast} />
        )}

        {/* Tab 4: WhatsApp Gateway */}
        {activeTab === 'whatsapp' && (
          <WhatsAppSettingsCard onShowToast={onShowToast} />
        )}
      </div>
    </div>
  );
};
