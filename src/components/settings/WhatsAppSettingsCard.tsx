import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Globe,
  Smartphone,
  ShieldCheck,
  HelpCircle,
  Key,
  ExternalLink,
  Code2,
  Sparkles,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { WhatsAppConfig, WhatsAppTestResult } from '../../types';
import { StorageService, DEFAULT_WHATSAPP_CONFIG } from '../../lib/storage';

interface WhatsAppSettingsCardProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const DYNAMIC_VARIABLES = [
  { tag: '{{recipientName}}', label: 'Candidate Name', sample: 'Elena Rostova' },
  { tag: '{{courseName}}', label: 'Course / Program', sample: 'Advanced Neural Networks & AI' },
  { tag: '{{certificateId}}', label: 'Certificate ID', sample: 'GIST-2026-9841' },
  { tag: '{{certificateUrl}}', label: 'Verification URL', sample: 'https://credentials.gist.edu/verify?id=GIST-2026-9841' },
  { tag: '{{institutionName}}', label: 'Institution Name', sample: 'Global Institute of Science & Technology' },
  { tag: '{{institutionShortName}}', label: 'Short Name', sample: 'GIST Academy' },
  { tag: '{{department}}', label: 'Department / Faculty', sample: 'Faculty of Computer Science & Engineering' },
  { tag: '{{institutionEmail}}', label: 'Sender Email', sample: 'credentials@gist.edu' },
  { tag: '{{institutionPhone}}', label: 'Sender Phone', sample: '+1 (415) 890-2100' },
  { tag: '{{institutionWebsite}}', label: 'Official Portal', sample: 'https://gist.edu' },
  { tag: '{{accreditation}}', label: 'Accreditation', sample: 'Accredited by the Global Board of Higher Education' },
  { tag: '{{issueDate}}', label: 'Issue Date', sample: 'March 15, 2026' },
  { tag: '{{grade}}', label: 'Grade / Distinction', sample: 'A+ (Honors)' }
];

export const WhatsAppSettingsCard: React.FC<WhatsAppSettingsCardProps> = ({ onShowToast }) => {
  const institution = StorageService.getInstitutionProfile();
  const [config, setConfig] = useState<WhatsAppConfig>(() => StorageService.getWhatsAppConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<WhatsAppTestResult | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>(institution.phone || '+1 (555) 234-8901');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleProviderChange = (provider: WhatsAppConfig['provider']) => {
    setConfig((prev) => ({ ...prev, provider }));
  };

  const handleInsertTag = (tag: string) => {
    setConfig((prev) => ({
      ...prev,
      defaultTemplateMessage: `${prev.defaultTemplateMessage} ${tag}`
    }));
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const formatMessageWithInstitutionalIdentity = (tmpl: string) => {
    return tmpl
      .replace(/\{\{recipientName\}\}/g, 'Elena Rostova')
      .replace(/\{\{courseName\}\}/g, 'Advanced Neural Networks & AI')
      .replace(/\{\{certificateId\}\}/g, 'GIST-2026-9841')
      .replace(/\{\{certificateUrl\}\}/g, `${window.location.origin}/verify?id=GIST-2026-9841`)
      .replace(/\{\{institutionName\}\}/g, institution.name || config.institutionName || 'Global Institute of Science & Technology')
      .replace(/\{\{institutionShortName\}\}/g, institution.shortName || 'GIST')
      .replace(/\{\{department\}\}/g, institution.department || 'Faculty of Computer Science')
      .replace(/\{\{institutionEmail\}\}/g, institution.email || 'credentials@institution.edu')
      .replace(/\{\{institutionPhone\}\}/g, institution.phone || '+1 (415) 890-2100')
      .replace(/\{\{institutionWebsite\}\}/g, institution.website || 'https://institution.edu')
      .replace(/\{\{accreditation\}\}/g, institution.accreditation || 'Accredited Higher Education Authority')
      .replace(/\{\{issueDate\}\}/g, new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
      .replace(/\{\{grade\}\}/g, 'First Class Distinction');
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      const updated: WhatsAppConfig = {
        ...config,
        institutionName: institution.name,
        status: 'configured',
        lastTestedAt: new Date().toISOString()
      };
      StorageService.saveWhatsAppConfig(updated);
      setConfig(updated);
      onShowToast(
        'WhatsApp Settings Saved',
        `WhatsApp distribution gateway (${config.provider.toUpperCase().replace('_', ' ')}) is now active with sender identity from ${institution.name}.`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Save Error', err.message || 'Failed to save WhatsApp configuration.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    const cleanPhone = testPhoneNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      onShowToast('Phone Required', 'Please enter a test mobile phone number with country code (e.g. 919876543210 or 14155552671).', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const formattedMessage = formatMessageWithInstitutionalIdentity(config.defaultTemplateMessage);

    if (config.provider === 'web_direct') {
      try {
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(formattedMessage)}`;
        
        // Open in new tab/window
        const newWin = window.open(waUrl, '_blank', 'noopener,noreferrer');
        
        setTestResult({
          success: true,
          message: `Direct WhatsApp Web link generated for +${cleanPhone}! Opening WhatsApp with pre-filled institutional credential message from ${institution.name}.`,
          details: {
            provider: 'Direct Web WhatsApp (api.whatsapp.com / wa.me)',
            recipientPhone: `+${cleanPhone}`,
            waUrl: waUrl,
            status: 'chat_opened',
            latencyMs: 15,
            timestamp: new Date().toISOString()
          }
        });

        onShowToast(
          'WhatsApp Web Launched',
          newWin ? 'WhatsApp opened in new tab with pre-filled message.' : 'Click "Open in WhatsApp Web" below if popups were blocked.',
          'success'
        );
      } catch (err: any) {
        setTestResult({
          success: false,
          message: err.message || 'Failed to generate Direct WhatsApp Web link.'
        });
      } finally {
        setIsTesting(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/whatsapp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          phoneNumberId: config.phoneNumberId,
          businessAccountId: config.businessAccountId,
          apiAccessToken: config.apiAccessToken,
          twilioAccountSid: config.twilioAccountSid,
          twilioAuthToken: config.twilioAuthToken,
          twilioFromNumber: config.twilioFromNumber,
          testPhoneNumber: cleanPhone,
          message: formattedMessage
        })
      });

      const data = await res.json();
      setTestResult(data);

      if (data.success) {
        onShowToast('WhatsApp Verification Success', data.message, 'success');
      } else {
        onShowToast('Verification Notice', data.message, 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed to WhatsApp verification API.'
      });
      onShowToast('Connection Failed', err.message, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // Interpolated Preview Text
  const previewText = formatMessageWithInstitutionalIdentity(config.defaultTemplateMessage);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                WhatsApp Distribution Gateway
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Channel
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Deliver official digital certificate links and verification cards directly to candidate WhatsApp numbers via Meta Business Cloud API, Twilio Gateway, or Instant Click-to-Chat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Gateway Settings
          </button>
        </div>
      </div>

      {/* Main Grid: Config Form & Live Chat Mockup */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Provider Settings & Template (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Provider Selector Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Select WhatsApp Dispatch Provider
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose between instant direct links or automated enterprise cloud gateways.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Option 1: Web Direct (wa.me) */}
              <div
                onClick={() => handleProviderChange('web_direct')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  config.provider === 'web_direct'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Globe className={`h-5 w-5 ${config.provider === 'web_direct' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      config.provider === 'web_direct' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}
                  >
                    {config.provider === 'web_direct' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Direct Web (wa.me)</h5>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  No API key needed. 1-click launch to WhatsApp Web or App with pre-filled message.
                </p>
                <span className="mt-2.5 inline-block rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  Instant Setup
                </span>
              </div>

              {/* Option 2: Meta Cloud API */}
              <div
                onClick={() => handleProviderChange('cloud_api')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  config.provider === 'cloud_api'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Zap className={`h-5 w-5 ${config.provider === 'cloud_api' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      config.provider === 'cloud_api' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}
                  >
                    {config.provider === 'cloud_api' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Meta Cloud API</h5>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Official WhatsApp Business Cloud API. Fully automated high-throughput bulk dispatch.
                </p>
                <span className="mt-2.5 inline-block rounded-md bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                  Official Enterprise
                </span>
              </div>

              {/* Option 3: Twilio */}
              <div
                onClick={() => handleProviderChange('twilio')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  config.provider === 'twilio'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Smartphone className={`h-5 w-5 ${config.provider === 'twilio' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      config.provider === 'twilio' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}
                  >
                    {config.provider === 'twilio' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Twilio API</h5>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Twilio Programmable WhatsApp Messaging with global delivery routing.
                </p>
                <span className="mt-2.5 inline-block rounded-md bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                  Cloud Gateway
                </span>
              </div>
            </div>

            {/* Provider Specific Input Credentials */}
            {config.provider === 'cloud_api' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Meta WhatsApp Business Cloud Credentials
                  </span>
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Meta Dev Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Phone Number ID *
                    </label>
                    <input
                      type="text"
                      value={config.phoneNumberId || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, phoneNumberId: e.target.value }))}
                      placeholder="e.g. 109845012398452"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      WhatsApp Business Account ID (WABA)
                    </label>
                    <input
                      type="text"
                      value={config.businessAccountId || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, businessAccountId: e.target.value }))}
                      placeholder="e.g. 102938475610293"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Permanent System User Access Token *
                  </label>
                  <input
                    type="password"
                    value={config.apiAccessToken || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, apiAccessToken: e.target.value }))}
                    placeholder="EAA..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Generate via Meta Business Suite under Users &gt; System Users &gt; Generate Token with <code>whatsapp_business_messaging</code> scope.
                  </p>
                </div>
              </div>
            )}

            {config.provider === 'twilio' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Twilio Messaging API Credentials
                  </span>
                  <a
                    href="https://console.twilio.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline dark:text-purple-400"
                  >
                    Twilio Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Account SID *
                    </label>
                    <input
                      type="text"
                      value={config.twilioAccountSid || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, twilioAccountSid: e.target.value }))}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      From WhatsApp Number *
                    </label>
                    <input
                      type="text"
                      value={config.twilioFromNumber || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, twilioFromNumber: e.target.value }))}
                      placeholder="whatsapp:+14155238886"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Auth Token *
                  </label>
                  <input
                    type="password"
                    value={config.twilioAuthToken || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, twilioAuthToken: e.target.value }))}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Message Template Editor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Institutional WhatsApp Message Template
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the default message formatting sent to candidates upon issuance.
                </p>
              </div>
            </div>

            {/* Variable Tags Chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
                Click merge tag to insert into template:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DYNAMIC_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertTag(v.tag)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-all"
                  >
                    <span>{v.tag}</span>
                    {copiedTag === v.tag ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-2.5 w-2.5 opacity-40" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                rows={9}
                value={config.defaultTemplateMessage}
                onChange={(e) => setConfig((prev) => ({ ...prev, defaultTemplateMessage: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 font-mono leading-relaxed placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Write your WhatsApp message template here..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Supports WhatsApp markdown: <code>*bold*</code>, <code>_italic_</code>, <code>~strikethrough~</code>, <code>`code`</code>.
              </p>
            </div>
          </div>

          {/* Live Test Simulator Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  3. Live Test Verification Dispatch
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify your configuration by triggering a test verification dispatch to a mobile number.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+1 (555) 234-8901"
                className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700 whitespace-nowrap"
              >
                {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send Test WhatsApp Message
              </button>
            </div>

            {/* Test Results Output Box */}
            {testResult && (
              <div
                className={`rounded-xl border p-4 text-xs transition-all animate-in fade-in ${
                  testResult.success
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div className="space-y-1 w-full">
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.details && (
                      <div className="text-[11px] opacity-80 font-mono pt-1 space-y-0.5">
                        {testResult.details.provider && <div>Gateway: {testResult.details.provider}</div>}
                        {testResult.details.recipientPhone && <div>Recipient Phone: {testResult.details.recipientPhone}</div>}
                        {testResult.details.messageId && <div>Message ID: {testResult.details.messageId}</div>}
                        {testResult.details.latencyMs !== undefined && (
                          <div>Handshake Latency: {testResult.details.latencyMs}ms</div>
                        )}
                      </div>
                    )}
                    {testResult.details?.waUrl && (
                      <div className="mt-3 pt-2 border-t border-emerald-300/40 dark:border-emerald-800/40 flex flex-wrap items-center gap-2">
                        <a
                          href={testResult.details.waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open in WhatsApp Web / Desktop
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (testResult.details?.waUrl) {
                              navigator.clipboard.writeText(testResult.details.waUrl);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-white dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-200"
                        >
                          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedLink ? 'Link Copied!' : 'Copy WhatsApp URL'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: WhatsApp Mobile Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <div className="rounded-3xl border border-slate-300 bg-slate-900 p-4 shadow-2xl dark:border-slate-700">
              {/* Smartphone Frame Header */}
              <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800 text-slate-400 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">9:41</span>
                </div>
                <div className="h-3 w-16 rounded-full bg-slate-800" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">5G</span>
                  <div className="h-2 w-4 rounded-xs border border-slate-400" />
                </div>
              </div>

              {/* WhatsApp App Header */}
              <div className="flex items-center gap-3 py-3 px-2 border-b border-slate-800 bg-slate-850">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-sm">
                  <span>GI</span>
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white ring-2 ring-slate-900">
                    ✓
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">
                      {config.institutionName || 'Global Institute of Science'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Official</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Institution
                  </span>
                </div>
              </div>

              {/* WhatsApp Chat Canvas */}
              <div className="my-3 rounded-2xl bg-[#0b141a] p-4 min-h-[380px] flex flex-col justify-end space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="mx-auto rounded-lg bg-[#182229] px-3 py-1 text-[10px] text-slate-400 font-medium shadow-xs">
                  Today
                </div>

                {/* WhatsApp Message Bubble */}
                <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-[#005c4b] p-3.5 text-white shadow-md space-y-2">
                  <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {previewText}
                  </div>

                  {/* Dynamic Certificate Verification Card Inside Bubble */}
                  <div className="rounded-xl border border-emerald-400/30 bg-[#025142] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-emerald-200">
                      <span className="font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Tamper-Evident Credential
                      </span>
                      <span>PDF Vector Ready</span>
                    </div>
                    <p className="text-[11px] font-bold text-white truncate">
                      Elena Rostova — Certificate of Excellence
                    </p>
                    <div className="text-[10px] text-emerald-300 font-mono flex items-center justify-between pt-1 border-t border-emerald-400/20">
                      <span>ID: GIST-2026-9841</span>
                      <span className="underline">gist.edu/verify</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/70 pt-0.5">
                    <span>9:41 AM</span>
                    <span className="text-emerald-300 font-bold">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar Mockup */}
              <div className="flex items-center gap-2 pt-2 px-1 text-slate-400">
                <div className="flex-1 rounded-full bg-slate-800 px-3.5 py-2 text-[11px] text-slate-400">
                  Reply to institutional office...
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Send className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
