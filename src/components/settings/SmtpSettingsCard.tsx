import React, { useState, useEffect } from 'react';
import {
  Mail,
  Server,
  Key,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  HelpCircle,
  Clock,
  Terminal,
  Save,
  Check
} from 'lucide-react';
import { SmtpConfig, SmtpTestResult } from '../../types';
import { StorageService } from '../../lib/storage';

interface SmtpSettingsCardProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

interface PresetOption {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  notes: string;
  defaultUser?: string;
}

const PRESETS: PresetOption[] = [
  {
    id: 'gmail',
    name: 'Gmail (STARTTLS 587)',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    notes: 'Standard STARTTLS on port 587. Requires 2-Step Verification & a 16-character App Password generated in your Google Account security settings.'
  },
  {
    id: 'gmail-ssl',
    name: 'Gmail (SSL 465)',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    notes: 'Direct SSL/TLS on port 465. Requires 2-Step Verification & a 16-character App Password generated in your Google Account security settings.'
  },
  {
    id: 'outlook',
    name: 'Microsoft 365 / Outlook',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    notes: 'Standard Office 365 / Outlook relay using STARTTLS on port 587.'
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    defaultUser: 'apikey',
    notes: 'Username is always "apikey" and password is your SendGrid API key.'
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    notes: 'Use your Mailgun domain SMTP credentials on port 587.'
  },
  {
    id: 'ses',
    name: 'Amazon SES',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    notes: 'Enter your AWS SES SMTP username and generated SMTP password.'
  },
  {
    id: 'custom',
    name: 'Custom SMTP Server',
    host: '',
    port: 587,
    secure: false,
    notes: 'Enter your institutional or corporate relay server details.'
  }
];

export const SmtpSettingsCard: React.FC<SmtpSettingsCardProps> = ({ onShowToast }) => {
  const [config, setConfig] = useState<SmtpConfig>(() => StorageService.getSmtpConfig());
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('gmail');

  // Testing states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<SmtpTestResult | null>(null);

  const [testRecipient, setTestRecipient] = useState('tanetra.technologies@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [sendTestResult, setSendTestResult] = useState<SmtpTestResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Detect matching preset
    const match = PRESETS.find(
      (p) => p.host && p.host.toLowerCase() === config.host.toLowerCase() && p.port === config.port
    );
    if (match) {
      setSelectedPreset(match.id);
    } else {
      setSelectedPreset('custom');
    }
  }, []);

  const handleApplyPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.id !== 'custom') {
      setConfig((prev) => ({
        ...prev,
        host: preset.host,
        port: preset.port,
        secure: preset.secure,
        user: preset.defaultUser || prev.user
      }));
    }
  };

  const handleSave = () => {
    const isSecure = config.port === 465 || (config.secure && config.port !== 587 && config.port !== 25);
    const toSave = { ...config, secure: isSecure, enabled: true };
    setConfig(toSave);
    StorageService.saveSmtpConfig(toSave);
    onShowToast('SMTP Configuration Saved', 'Mail server parameters stored and enabled successfully.', 'success');
  };

  // Real Test 1: Verify Connection Handshake via Backend
  const handleVerifyConnection = async () => {
    if (!config.host || !config.port) {
      onShowToast('Missing Host or Port', 'Please provide a valid SMTP server hostname and port.', 'error');
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);

    // Auto-resolve protocol match: Port 465 is direct SSL, 587/25 is STARTTLS
    const resolvedSecure = config.port === 465;

    try {
      const response = await fetch('/api/smtp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          secure: resolvedSecure,
          user: config.user,
          pass: config.pass,
          ignoreTls: config.ignoreTls
        })
      });

      const text = await response.text();
      let data: SmtpTestResult;

      try {
        data = JSON.parse(text);
      } catch {
        if (response.status === 404 || text.includes('<!DOCTYPE') || text.includes('<html')) {
          data = {
            success: false,
            message: `Backend SMTP API endpoint not reachable or function error (${response.status}). Check server logs.`,
            details: { latencyMs: 0 }
          };
        } else {
          data = {
            success: false,
            message: `Server response error (${response.status}): ${text.slice(0, 150)}`,
            details: { latencyMs: 0 }
          };
        }
      }

      setVerifyResult(data);

      if (data.success) {
        // Automatically persist working configuration
        const toSave = { ...config, secure: resolvedSecure, enabled: true };
        setConfig(toSave);
        StorageService.saveSmtpConfig(toSave);
        onShowToast('SMTP Handshake Verified', `${data.message} Parameters automatically saved.`, 'success');
      } else {
        onShowToast('SMTP Handshake Failed', data.message, 'error');
      }
    } catch (err: any) {
      const result: SmtpTestResult = {
        success: false,
        message: err?.message?.includes('string did not match')
          ? 'Backend endpoint unreachable (received invalid non-JSON response). Check server connection.'
          : (err?.message || 'Failed to reach local server verification endpoint.'),
        details: { latencyMs: 0 }
      };
      setVerifyResult(result);
      onShowToast('Verification Error', result.message, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Real Test 2: Send Real Live Test Email via Backend
  const handleSendRealTest = async () => {
    if (!config.host || !config.port) {
      onShowToast('Incomplete Configuration', 'Configure SMTP server host and port before sending.', 'error');
      return;
    }

    if (!testRecipient || !testRecipient.includes('@')) {
      onShowToast('Invalid Test Email', 'Please enter a valid recipient email address.', 'error');
      return;
    }

    setIsSendingTest(true);
    setSendTestResult(null);

    const resolvedSecure = config.port === 465;

    try {
      const response = await fetch('/api/smtp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...config,
            secure: resolvedSecure
          },
          recipientEmail: testRecipient,
          subject: 'CertiFlow Live SMTP Verification Dispatch'
        })
      });

      const text = await response.text();
      let data: SmtpTestResult;

      try {
        data = JSON.parse(text);
      } catch {
        if (response.status === 404 || text.includes('<!DOCTYPE') || text.includes('<html')) {
          data = {
            success: false,
            message: `Backend email dispatcher endpoint not reachable or function error (${response.status}). Check server logs.`,
            details: {}
          };
        } else {
          data = {
            success: false,
            message: `Server response error (${response.status}): ${text.slice(0, 150)}`,
            details: {}
          };
        }
      }

      setSendTestResult(data);

      if (data.success) {
        // Automatically save working configuration so campaigns can use it immediately
        const toSave = { ...config, secure: resolvedSecure, enabled: true };
        setConfig(toSave);
        StorageService.saveSmtpConfig(toSave);
        onShowToast('Test Email Sent!', `Live test email delivered to ${testRecipient}. SMTP configuration saved!`, 'success');
      } else {
        onShowToast('Dispatch Failed', data.message, 'error');
      }
    } catch (err: any) {
      const result: SmtpTestResult = {
        success: false,
        message: err?.message?.includes('string did not match')
          ? 'Backend email dispatcher endpoint unreachable.'
          : (err?.message || 'Failed to communicate with test email dispatcher.'),
        details: {}
      };
      setSendTestResult(result);
      onShowToast('Dispatch Error', result.message, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const activePreset = PRESETS.find((p) => p.id === selectedPreset);

  return (
    <div className="space-y-6">
      {/* Main Configuration Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              SMTP Mail Server Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your official institutional mail server to dispatch real personalized certificates and credentials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                checked={config.enabled || false}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Enable Live Mail Delivery</span>
            </label>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              Save Config
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Quick Provider Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  selectedPreset === p.id
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 font-bold dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                <span className="text-xs">{p.name}</span>
              </button>
            ))}
          </div>

          {activePreset?.notes && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-indigo-50/60 p-2.5 text-[11px] text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
              <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{activePreset.notes}</span>
            </div>
          )}
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              SMTP Host / Server Address *
            </label>
            <input
              type="text"
              placeholder="e.g. smtp.gmail.com"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Port Number *
            </label>
            <input
              type="number"
              placeholder="587, 465, or 25"
              value={config.port}
              onChange={(e) => {
                const newPort = parseInt(e.target.value) || 587;
                setConfig({
                  ...config,
                  port: newPort,
                  secure: newPort === 465
                });
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Encryption Protocol
            </label>
            <select
              value={config.port === 465 || config.secure ? 'ssl' : 'starttls'}
              onChange={(e) => {
                const isSsl = e.target.value === 'ssl';
                setConfig({
                  ...config,
                  secure: isSsl,
                  port: isSsl ? 465 : (config.port === 465 ? 587 : config.port)
                });
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="starttls">STARTTLS (Port 587 / 25 - Standard)</option>
              <option value="ssl">Direct SSL / TLS (Port 465)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Authentication Username / Email
            </label>
            <input
              type="text"
              placeholder="your-email@institution.edu or apikey"
              value={config.user}
              onChange={(e) => setConfig({ ...config, user: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Password / App Password / API Key
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••••••"
                value={config.pass}
                onChange={(e) => setConfig({ ...config, pass: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 pr-9 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              From Display Name
            </label>
            <input
              type="text"
              placeholder="Academic Credentials Office"
              value={config.fromName}
              onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              From Email Address
            </label>
            <input
              type="email"
              placeholder="no-reply@institution.edu"
              value={config.fromEmail}
              onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Reply-To Address (Optional)
            </label>
            <input
              type="email"
              placeholder="support@institution.edu"
              value={config.replyTo || ''}
              onChange={(e) => setConfig({ ...config, replyTo: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Security Options'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/50 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.ignoreTls || false}
                  onChange={(e) => setConfig({ ...config, ignoreTls: e.target.checked })}
                  className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Allow self-signed or unverified TLS certificates (useful for private intranet mail relays)
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Real SMTP Testing Suite */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 shadow-xs dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Real SMTP Server Testing & Verification
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Probe your mail server in real time. Perform a TLS handshake authentication test or dispatch an actual test email to your inbox to guarantee delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test 1: Handshake Test */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Test 1: Connection & Auth Handshake
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  /api/smtp/verify
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tests TCP connection to <strong>{config.host || 'host'}:{config.port}</strong>, initiates TLS encryption, and authenticates the user credentials.
              </p>
            </div>

            {verifyResult && (
              <div
                className={`rounded-lg p-3 text-xs border ${
                  verifyResult.success
                    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {verifyResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div className="space-y-1 w-full">
                    <p className="font-semibold">{verifyResult.message}</p>
                    {verifyResult.details?.latencyMs !== undefined && (
                      <div className="flex items-center gap-2 text-[11px] opacity-80">
                        <Clock className="h-3 w-3" />
                        <span>Round-trip latency: {verifyResult.details.latencyMs}ms</span>
                      </div>
                    )}
                    {verifyResult.details?.code && (
                      <p className="font-mono text-[10px] bg-white/70 p-1 rounded dark:bg-black/40">
                        Error Code: {verifyResult.details.code} {verifyResult.details.responseCode ? `(${verifyResult.details.responseCode})` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleVerifyConnection}
              disabled={isVerifying}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  Probing SMTP Server Handshake...
                </>
              ) : (
                <>
                  <Terminal className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  Test Handshake Connection
                </>
              )}
            </button>
          </div>

          {/* Test 2: Live Test Email Dispatcher */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  Test 2: Live Real Email Delivery
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  /api/smtp/send-test
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transmits an authentic verification message to your actual inbox to test spam filters, DKIM/SPF alignment, and inbox arrival.
              </p>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Send Real Test Email To:
                </label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
                />
              </div>
            </div>

            {sendTestResult && (
              <div
                className={`rounded-lg p-3 text-xs border ${
                  sendTestResult.success
                    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {sendTestResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div className="space-y-1 w-full">
                    <p className="font-semibold">{sendTestResult.message}</p>
                    {sendTestResult.details?.messageId && (
                      <p className="font-mono text-[10px] bg-white/70 p-1 rounded dark:bg-black/40 break-all">
                        Message-ID: {sendTestResult.details.messageId}
                      </p>
                    )}
                    {sendTestResult.success && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        Check <strong>{testRecipient}</strong> (and your Spam / Promotions folder) now!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSendRealTest}
              disabled={isSendingTest}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isSendingTest ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                  Dispatching Live Test Email...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Live Test Email Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
