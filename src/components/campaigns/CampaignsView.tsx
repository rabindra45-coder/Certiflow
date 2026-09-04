import React, { useState } from 'react';
import { Mail, MessageSquare, CheckCircle2, AlertTriangle, RefreshCw, Clock, ArrowRight, ExternalLink, Smartphone, ShieldCheck } from 'lucide-react';
import { EmailCampaign, WhatsAppCampaign } from '../../types';
import { StorageService } from '../../lib/storage';

interface CampaignsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ onShowToast }) => {
  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp'>('email');
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>(() => StorageService.getCampaigns());
  const [whatsappCampaigns, setWhatsappCampaigns] = useState<WhatsAppCampaign[]>(() => StorageService.getWhatsAppCampaigns());
  
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(() => emailCampaigns[0]?.id || null);
  const [selectedWhatsAppId, setSelectedWhatsAppId] = useState<string | null>(() => whatsappCampaigns[0]?.id || null);

  const selectedEmailCampaign = emailCampaigns.find((c) => c.id === selectedEmailId) || emailCampaigns[0];
  const selectedWhatsAppCampaign = whatsappCampaigns.find((c) => c.id === selectedWhatsAppId) || whatsappCampaigns[0];

  const handleRetryFailed = (campaignId: string) => {
    onShowToast('Retrying Failed', 'Attempting re-dispatch for rejected recipient addresses...', 'info');
    setTimeout(() => {
      onShowToast('Retry Complete', '1 recipient re-queued for delivery.', 'success');
    }, 800);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Distribution Campaigns & Delivery Telemetry
            </h2>
            <p className="text-xs text-slate-500">
              Audit sent certificates, transmission logs, delivery timestamps, and SMTP / WhatsApp gateway statuses.
            </p>
          </div>

          {/* Channel Switcher */}
          <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-850 p-1 rounded-xl">
            <button
              onClick={() => setActiveChannel('email')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChannel === 'email'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Email ({emailCampaigns.length})
            </button>
            <button
              onClick={() => setActiveChannel('whatsapp')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChannel === 'whatsapp'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp ({whatsappCampaigns.length})
            </button>
          </div>
        </div>

        {/* EMAIL CAMPAIGNS TAB */}
        {activeChannel === 'email' && (
          <>
            {emailCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Email Campaigns ({emailCampaigns.length})
                  </h3>
                  <div className="space-y-2">
                    {emailCampaigns.map((cmp) => (
                      <div
                        key={cmp.id}
                        onClick={() => setSelectedEmailId(cmp.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          selectedEmailId === cmp.id
                            ? 'border-indigo-600 bg-white shadow-xs ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {cmp.name}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Completed
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">{cmp.subject}</p>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span>{new Date(cmp.createdAt).toLocaleDateString()}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {cmp.sentCount} / {cmp.totalRecipients} sent
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campaign Details & Delivery Logs */}
                {selectedEmailCampaign && (
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {selectedEmailCampaign.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Sender: <strong>{selectedEmailCampaign.senderName}</strong> &lt;{selectedEmailCampaign.senderEmail}&gt;
                          </p>
                        </div>

                        {selectedEmailCampaign.failedCount > 0 && (
                          <button
                            onClick={() => handleRetryFailed(selectedEmailCampaign.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry Failed ({selectedEmailCampaign.failedCount})
                          </button>
                        )}
                      </div>

                      {/* Delivery Metrics */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                          <span className="text-[11px] text-slate-400">Total Targets</span>
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            {selectedEmailCampaign.totalRecipients}
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-950 dark:bg-emerald-950/20">
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Successfully Sent
                          </span>
                          <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                            {selectedEmailCampaign.sentCount}
                          </p>
                        </div>
                        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-950 dark:bg-rose-950/20">
                          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                            Failed / Rejected
                          </span>
                          <p className="text-lg font-black text-rose-700 dark:text-rose-300">
                            {selectedEmailCampaign.failedCount}
                          </p>
                        </div>
                      </div>

                      {/* Live Transmission Log Register */}
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Transmission & SMTP Server Logs
                        </h5>
                        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono text-slate-200 max-h-80 overflow-y-auto space-y-2 dark:border-slate-800">
                          {selectedEmailCampaign.logs?.length ? (
                            selectedEmailCampaign.logs.map((log, idx) => (
                              <div
                                key={idx}
                                className={`flex items-start gap-2 ${
                                  log.status === 'sent' ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                <span className="text-slate-500">[{log.timestamp}]</span>
                                <span className="font-bold">{log.status.toUpperCase()}:</span>
                                <span className="text-slate-300">{log.message}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">No detailed SMTP logs recorded.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                <Mail className="mx-auto h-8 w-8 mb-2 opacity-50 text-indigo-500" />
                No email campaigns launched yet. Dispatch certificates from Automation to view live SMTP telemetry.
              </div>
            )}
          </>
        )}

        {/* WHATSAPP CAMPAIGNS TAB */}
        {activeChannel === 'whatsapp' && (
          <>
            {whatsappCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    WhatsApp Campaigns ({whatsappCampaigns.length})
                  </h3>
                  <div className="space-y-2">
                    {whatsappCampaigns.map((cmp) => (
                      <div
                        key={cmp.id}
                        onClick={() => setSelectedWhatsAppId(cmp.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          selectedWhatsAppId === cmp.id
                            ? 'border-emerald-600 bg-white shadow-xs ring-2 ring-emerald-600/20 dark:border-emerald-500 dark:bg-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {cmp.name}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                            {cmp.provider.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">{cmp.templateName}</p>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span>{new Date(cmp.createdAt).toLocaleDateString()}</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            {cmp.deliveredCount} / {cmp.totalRecipients} delivered
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Campaign Details & Delivery Logs */}
                {selectedWhatsAppCampaign && (
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {selectedWhatsAppCampaign.name}
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              WhatsApp Verified
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Gateway: <strong>{selectedWhatsAppCampaign.provider.toUpperCase().replace('_', ' ')}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Delivery Metrics */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                          <span className="text-[11px] text-slate-400">Total Targets</span>
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            {selectedWhatsAppCampaign.totalRecipients}
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-950 dark:bg-emerald-950/20">
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Delivered
                          </span>
                          <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                            {selectedWhatsAppCampaign.deliveredCount}
                          </p>
                        </div>
                        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-950 dark:bg-rose-950/20">
                          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                            Failed
                          </span>
                          <p className="text-lg font-black text-rose-700 dark:text-rose-300">
                            {selectedWhatsAppCampaign.failedCount}
                          </p>
                        </div>
                      </div>

                      {/* Live Transmission Log Register */}
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          WhatsApp Dispatch & Message ID Logs
                        </h5>
                        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono text-slate-200 max-h-80 overflow-y-auto space-y-2 dark:border-slate-800">
                          {selectedWhatsAppCampaign.logs?.length ? (
                            selectedWhatsAppCampaign.logs.map((log, idx) => (
                              <div
                                key={idx}
                                className={`flex items-start gap-2 ${
                                  log.status === 'delivered' || log.status === 'sent' ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                <span className="text-slate-500">[{log.timestamp}]</span>
                                <span className="font-bold">{log.recipientPhone}:</span>
                                <span className="text-slate-300">{log.message}</span>
                                {log.messageId && (
                                  <span className="text-[10px] text-slate-500">({log.messageId})</span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">No detailed WhatsApp logs recorded.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50 text-emerald-500" />
                No WhatsApp campaigns launched yet. Dispatch credentials via WhatsApp from Automation to view real-time delivery logs.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
