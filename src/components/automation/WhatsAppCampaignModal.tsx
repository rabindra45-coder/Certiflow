import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Smartphone,
  Copy,
  Check,
  Search,
  Users,
  Sparkles,
  Zap,
  Globe,
  RefreshCw,
  Eye,
  FileCheck,
  Play,
  SkipForward,
  CheckCheck,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { GeneratedCertificateRecord, WhatsAppCampaign, WhatsAppConfig } from '../../types';
import { StorageService } from '../../lib/storage';

interface WhatsAppCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: GeneratedCertificateRecord[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const DYNAMIC_TAGS = [
  { tag: '{{recipientName}}', label: 'Candidate' },
  { tag: '{{courseName}}', label: 'Program' },
  { tag: '{{certificateId}}', label: 'Cert ID' },
  { tag: '{{certificateUrl}}', label: 'Verify URL' },
  { tag: '{{institutionName}}', label: 'Institution' },
  { tag: '{{institutionShortName}}', label: 'Short Name' },
  { tag: '{{department}}', label: 'Department' },
  { tag: '{{institutionPhone}}', label: 'Inst. Phone' },
  { tag: '{{institutionWebsite}}', label: 'Inst. Website' },
  { tag: '{{accreditation}}', label: 'Accreditation' },
  { tag: '{{issueDate}}', label: 'Issue Date' }
];

export const WhatsAppCampaignModal: React.FC<WhatsAppCampaignModalProps> = ({
  isOpen,
  onClose,
  certificates,
  onShowToast
}) => {
  const institution = useMemo(() => StorageService.getInstitutionProfile(), [isOpen]);
  const whatsappConfig = useMemo<WhatsAppConfig>(() => StorageService.getWhatsAppConfig(), [isOpen]);

  const [campaignName, setCampaignName] = useState<string>(
    `WhatsApp Credential Broadcast — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  );
  const [messageTemplate, setMessageTemplate] = useState<string>(whatsappConfig.defaultTemplateMessage);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(certificates.map((c) => c.id))
  );
  const [recipientPhones, setRecipientPhones] = useState<Record<string, string>>(() => {
    const phones: Record<string, string> = {};
    certificates.forEach((c) => {
      phones[c.id] = c.recipientPhone || (c.metadata as any)?.phone || (c.metadata as any)?.whatsapp || institution.phone || '+1 (555) 234-8901';
    });
    return phones;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number; success: number; failed: number }>({
    current: 0,
    total: 0,
    success: 0,
    failed: 0
  });

  // Track individual candidate dispatch status in Direct Web mode
  const [dispatchedStatusMap, setDispatchedStatusMap] = useState<Record<string, 'sent' | 'opened' | 'failed'>>({});
  const [activeCandidateIndex, setActiveCandidateIndex] = useState<number>(0);
  const [interactiveModeActive, setInteractiveModeActive] = useState<boolean>(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCerts = certificates.filter((c) => {
    const query = searchQuery.toLowerCase();
    const phone = recipientPhones[c.id] || '';
    return (
      c.recipientName.toLowerCase().includes(query) ||
      c.certificateId.toLowerCase().includes(query) ||
      phone.includes(query)
    );
  });

  const selectedCerts = certificates.filter((c) => selectedIds.has(c.id));

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === certificates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(certificates.map((c) => c.id)));
    }
  };

  const handlePhoneChange = (id: string, value: string) => {
    setRecipientPhones((prev) => ({ ...prev, [id]: value }));
  };

  const handleInsertTag = (tag: string) => {
    setMessageTemplate((prev) => `${prev} ${tag}`);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  // Interpolate message for a specific candidate with full Institutional Identity
  const formatMessageForCandidate = (cert: GeneratedCertificateRecord) => {
    const phone = recipientPhones[cert.id] || cert.recipientPhone || '';
    const verifyUrl = cert.verificationUrl || `${window.location.origin}/verify?id=${cert.certificateId}`;

    return messageTemplate
      .replace(/\{\{recipientName\}\}/g, cert.recipientName || 'Candidate')
      .replace(/\{\{courseName\}\}/g, cert.courseName || 'Credential Program')
      .replace(/\{\{certificateId\}\}/g, cert.certificateId || 'ID-0000')
      .replace(/\{\{certificateUrl\}\}/g, verifyUrl)
      .replace(/\{\{verificationUrl\}\}/g, verifyUrl)
      .replace(/\{\{certificateType\}\}/g, cert.certificateType || 'Accredited Certificate')
      .replace(/\{\{institutionName\}\}/g, institution.name || cert.institutionName || 'Global Institute of Science & Technology')
      .replace(/\{\{institutionShortName\}\}/g, institution.shortName || 'GIST Academy')
      .replace(/\{\{department\}\}/g, institution.department || 'Examination and Certification Division')
      .replace(/\{\{institutionEmail\}\}/g, institution.email || 'credentials@institution.edu')
      .replace(/\{\{institutionPhone\}\}/g, institution.phone || '+1 (415) 890-2100')
      .replace(/\{\{institutionWebsite\}\}/g, institution.website || 'https://gist.edu')
      .replace(/\{\{accreditation\}\}/g, institution.accreditation || 'Accredited by Global Board of Higher Education')
      .replace(/\{\{issueDate\}\}/g, cert.issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
      .replace(/\{\{grade\}\}/g, (cert.metadata as any)?.grade || 'First Class Honors')
      .replace(/\{\{phone\}\}/g, phone);
  };

  // Direct Click-to-Chat (wa.me / api.whatsapp.com) URL Generator
  const getDirectWhatsAppUrl = (cert: GeneratedCertificateRecord) => {
    const rawPhone = recipientPhones[cert.id] || cert.recipientPhone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(formatMessageForCandidate(cert));
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
  };

  // Open Direct WhatsApp Chat for a specific candidate
  const handleOpenDirectChat = (cert: GeneratedCertificateRecord) => {
    const rawPhone = recipientPhones[cert.id] || cert.recipientPhone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      onShowToast('Phone Required', `Please enter a valid phone number for ${cert.recipientName}.`, 'error');
      return;
    }

    const url = getDirectWhatsAppUrl(cert);
    const win = window.open(url, '_blank', 'noopener,noreferrer');

    // Mark candidate as opened in WhatsApp
    setDispatchedStatusMap((prev) => ({ ...prev, [cert.id]: 'opened' }));
    cert.whatsappStatus = 'sent';
    cert.whatsappSentAt = new Date().toISOString();
    cert.whatsappPhone = cleanPhone;

    // Save state
    StorageService.saveGeneratedCertificates(StorageService.getGeneratedCertificates());

    onShowToast(
      'WhatsApp Web Launched',
      win ? `Opened WhatsApp chat for ${cert.recipientName}. Click Send inside WhatsApp.` : `Popup blocked: Click "Open" directly.`,
      'info'
    );
  };

  const activeCertForPreview = selectedCerts[activeCandidateIndex] || filteredCerts[0] || certificates[0];
  const activeMessagePreview = activeCertForPreview ? formatMessageForCandidate(activeCertForPreview) : '';

  // Guided Sequential Sender Action (Next Candidate in Line)
  const handleSequentialSendAndNext = () => {
    if (!activeCertForPreview) return;
    handleOpenDirectChat(activeCertForPreview);

    if (activeCandidateIndex < selectedCerts.length - 1) {
      setActiveCandidateIndex((prev) => prev + 1);
    } else {
      onShowToast('Batch Completed', 'All selected candidates have been opened in WhatsApp!', 'success');
    }
  };

  // Batch Open All in Tabs
  const handleBatchOpenAllTabs = async () => {
    if (selectedCerts.length === 0) return;
    
    setIsSending(true);
    let opened = 0;

    for (let i = 0; i < selectedCerts.length; i++) {
      const cert = selectedCerts[i];
      const rawPhone = recipientPhones[cert.id] || cert.recipientPhone || '';
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      
      if (cleanPhone) {
        const url = getDirectWhatsAppUrl(cert);
        window.open(url, '_blank', 'noopener,noreferrer');
        setDispatchedStatusMap((prev) => ({ ...prev, [cert.id]: 'opened' }));
        cert.whatsappStatus = 'sent';
        cert.whatsappSentAt = new Date().toISOString();
        cert.whatsappPhone = cleanPhone;
        opened++;
      }

      // Small pacing delay between tab opens
      await new Promise((r) => setTimeout(r, 450));
    }

    StorageService.saveGeneratedCertificates(StorageService.getGeneratedCertificates());

    // Record campaign
    const newCampaign: WhatsAppCampaign = {
      id: `wa-camp-${Date.now()}`,
      name: campaignName,
      templateId: certificates[0]?.templateId || 'default',
      templateName: certificates[0]?.templateName || 'Institutional Credential',
      messageText: messageTemplate,
      provider: 'web_direct',
      createdAt: new Date().toISOString(),
      totalRecipients: selectedCerts.length,
      sentCount: opened,
      deliveredCount: opened,
      failedCount: selectedCerts.length - opened,
      status: 'completed',
      logs: selectedCerts.map((c) => ({
        timestamp: new Date().toISOString(),
        recipientPhone: recipientPhones[c.id] || '',
        recipientName: c.recipientName,
        certificateId: c.certificateId,
        status: 'sent',
        message: 'Dispatched via Direct WhatsApp Web'
      }))
    };

    StorageService.saveWhatsAppCampaign(newCampaign);
    setIsSending(false);
    onShowToast('Campaign Launched', `Opened WhatsApp Web tabs for ${opened} candidate(s).`, 'success');
  };

  // Automated API Dispatch Loop for Meta Cloud API or Twilio
  const handleStartApiDispatch = async () => {
    const targetCerts = selectedCerts;
    if (targetCerts.length === 0) {
      onShowToast('No Recipients Selected', 'Please select at least one recipient to dispatch WhatsApp messages.', 'error');
      return;
    }

    setIsSending(true);
    setSendProgress({ current: 0, total: targetCerts.length, success: 0, failed: 0 });

    const campaignLogs: WhatsAppCampaign['logs'] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < targetCerts.length; i++) {
      const cert = targetCerts[i];
      const phone = recipientPhones[cert.id] || cert.recipientPhone || '';
      const formattedMessage = formatMessageForCandidate(cert);

      try {
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: whatsappConfig,
            recipientPhone: phone,
            recipientName: cert.recipientName,
            messageText: formattedMessage,
            certificateId: cert.certificateId,
            verificationUrl: cert.verificationUrl
          })
        });

        const contentType = res.headers.get('content-type') || '';
        let data: any;
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          data = {
            success: false,
            message: (res.status === 404 || text.includes('<!DOCTYPE'))
              ? 'Backend API (/api/whatsapp/send) not reachable.'
              : `Server returned non-JSON response (${res.status}).`
          };
        }
        if (data.success) {
          successCount++;
          campaignLogs.push({
            timestamp: new Date().toISOString(),
            recipientPhone: phone,
            recipientName: cert.recipientName,
            certificateId: cert.certificateId,
            status: 'delivered',
            message: data.message || 'Delivered',
            messageId: data.messageId
          });
          cert.whatsappStatus = 'delivered';
          cert.whatsappSentAt = new Date().toISOString();
          cert.whatsappPhone = phone;
          setDispatchedStatusMap((prev) => ({ ...prev, [cert.id]: 'sent' }));
        } else {
          failedCount++;
          campaignLogs.push({
            timestamp: new Date().toISOString(),
            recipientPhone: phone,
            recipientName: cert.recipientName,
            certificateId: cert.certificateId,
            status: 'failed',
            message: data.message || 'Delivery failed'
          });
          cert.whatsappStatus = 'failed';
          setDispatchedStatusMap((prev) => ({ ...prev, [cert.id]: 'failed' }));
        }
      } catch (err: any) {
        failedCount++;
        campaignLogs.push({
          timestamp: new Date().toISOString(),
          recipientPhone: phone,
          recipientName: cert.recipientName,
          certificateId: cert.certificateId,
          status: 'failed',
          message: err.message || 'Network exception'
        });
        cert.whatsappStatus = 'failed';
        setDispatchedStatusMap((prev) => ({ ...prev, [cert.id]: 'failed' }));
      }

      setSendProgress({
        current: i + 1,
        total: targetCerts.length,
        success: successCount,
        failed: failedCount
      });

      await new Promise((r) => setTimeout(r, 120));
    }

    // Save Campaign Record
    const newCampaign: WhatsAppCampaign = {
      id: `wa-camp-${Date.now()}`,
      name: campaignName,
      templateId: certificates[0]?.templateId || 'default',
      templateName: certificates[0]?.templateName || 'Institutional Certificate',
      messageText: messageTemplate,
      provider: whatsappConfig.provider,
      createdAt: new Date().toISOString(),
      totalRecipients: targetCerts.length,
      sentCount: successCount + failedCount,
      deliveredCount: successCount,
      failedCount: failedCount,
      status: 'completed',
      logs: campaignLogs
    };

    StorageService.saveWhatsAppCampaign(newCampaign);
    StorageService.saveGeneratedCertificates(StorageService.getGeneratedCertificates());

    setIsSending(false);
    onShowToast(
      'WhatsApp Campaign Complete',
      `Successfully delivered ${successCount} of ${targetCerts.length} WhatsApp notifications.`,
      successCount > 0 ? 'success' : 'error'
    );
    onClose();
  };

  const isDirectWeb = whatsappConfig.provider === 'web_direct';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  WhatsApp Certificate Distribution
                </h3>
                <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 uppercase tracking-wide">
                  {isDirectWeb ? 'Direct Web (wa.me)' : whatsappConfig.provider.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Sender Authority: <strong className="text-slate-800 dark:text-slate-200">{institution.name}</strong></span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Column: Recipient Table & Message Config (7 cols) */}
          <div className="p-6 space-y-5 lg:col-span-7">
            {/* Campaign Name & Stats */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Tag Insertion Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Institutional Message Template
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {messageTemplate.length} chars
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {DYNAMIC_TAGS.map((t) => (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => handleInsertTag(t.tag)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-mono text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-all"
                    >
                      <span>{t.tag}</span>
                    </button>
                  ))}
                </div>
                <textarea
                  rows={6}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-mono text-slate-900 leading-relaxed placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Recipient Selection Table with Live Phone Editing & Direct Web Launch */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Target Recipients ({selectedIds.size} of {certificates.length} selected)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {selectedIds.size === certificates.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Search filter */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by candidate name, certificate ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Recipient List Box */}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                {filteredCerts.map((cert, index) => {
                  const isChecked = selectedIds.has(cert.id);
                  const phone = recipientPhones[cert.id] || '';
                  const status = dispatchedStatusMap[cert.id] || (cert.whatsappStatus === 'delivered' ? 'sent' : cert.whatsappStatus);

                  return (
                    <div
                      key={cert.id}
                      className={`flex items-center justify-between gap-3 p-2.5 transition-all ${
                        isChecked ? 'bg-white dark:bg-slate-800/80' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(cert.id)}
                          className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div
                          className="min-w-0 cursor-pointer"
                          onClick={() => {
                            const selIdx = selectedCerts.findIndex((c) => c.id === cert.id);
                            if (selIdx >= 0) setActiveCandidateIndex(selIdx);
                          }}
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {cert.recipientName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {cert.certificateId} • {cert.courseName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => handlePhoneChange(cert.id, e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-slate-800 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        
                        {/* Direct Web Open Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenDirectChat(cert)}
                          title="Open WhatsApp chat with pre-filled institutional message"
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                            status === 'opened' || status === 'sent'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                          }`}
                        >
                          {status === 'opened' || status === 'sent' ? (
                            <>
                              <CheckCheck className="h-3 w-3 text-emerald-600" />
                              <span>Opened</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-3 w-3" />
                              <span>Open Web</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Chat Mockup & Guided Dispatcher (5 cols) */}
          <div className="p-6 bg-slate-50/70 dark:bg-slate-900/40 space-y-4 lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Candidate WhatsApp Preview
                </span>
                <span className="text-[11px] font-mono text-emerald-600 font-bold">
                  {activeCertForPreview?.recipientName || 'Candidate'}
                </span>
              </div>

              {/* Chat Bubble Canvas */}
              <div className="rounded-2xl border border-slate-300 bg-[#0b141a] p-3.5 text-white shadow-lg space-y-2.5 dark:border-slate-700 min-h-[290px] flex flex-col justify-between">
                <div className="rounded-xl rounded-tl-xs bg-[#005c4b] p-3 text-xs leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                  <p>{activeMessagePreview}</p>
                  <div className="rounded-lg border border-emerald-400/30 bg-[#025142] p-2 text-[10px] space-y-1">
                    <span className="font-bold flex items-center gap-1 text-emerald-200">
                      <FileCheck className="h-3 w-3" /> Cryptographic Credential Record
                    </span>
                    <div className="text-emerald-300 font-mono truncate">
                      {activeCertForPreview?.certificateId} • {activeCertForPreview?.courseName}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/70 pt-0.5">
                    <span>Just now</span>
                    <span className="text-emerald-300 font-bold">✓✓</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-850 p-2 text-center text-[10px] text-slate-300 border border-slate-800 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Sender: <strong>{institution.name}</strong></span>
                </div>
              </div>

              {/* Guided Step Walkthrough for Direct Web Mode */}
              {isDirectWeb && selectedCerts.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-emerald-600" />
                      Guided 1-by-1 Dispatcher
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                      {activeCandidateIndex + 1} of {selectedCerts.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {activeCertForPreview?.recipientName}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono truncate">
                        {recipientPhones[activeCertForPreview?.id || ''] || 'No phone'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {activeCandidateIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveCandidateIndex((prev) => Math.max(0, prev - 1))}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          Prev
                        </button>
                      )}
                      {activeCandidateIndex < selectedCerts.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setActiveCandidateIndex((prev) => Math.min(selectedCerts.length - 1, prev + 1))}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          Skip <SkipForward className="h-2.5 w-2.5 inline" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSequentialSendAndNext}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open WhatsApp for {activeCertForPreview?.recipientName} &amp; Next
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar (Visible while sending) */}
            {isSending && (
              <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    Dispatching WhatsApp Messages...
                  </span>
                  <span>
                    {sendProgress.current} / {sendProgress.total}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200/60 dark:bg-emerald-900/60">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-200"
                    style={{
                      width: `${(sendProgress.current / Math.max(sendProgress.total, 1)) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-emerald-700 dark:text-emerald-300">
                  <span>✓ Delivered: {sendProgress.success}</span>
                  <span>⚠ Failed: {sendProgress.failed}</span>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="w-full sm:w-auto flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"
              >
                Close
              </button>

              {isDirectWeb ? (
                <button
                  type="button"
                  onClick={handleBatchOpenAllTabs}
                  disabled={isSending || selectedIds.size === 0}
                  className="w-full sm:w-auto flex-2 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open All ({selectedIds.size}) in WhatsApp Tabs
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartApiDispatch}
                  disabled={isSending || selectedIds.size === 0}
                  className="w-full sm:w-auto flex-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                >
                  {isSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send via {whatsappConfig.provider.replace('_', ' ')} ({selectedIds.size})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
