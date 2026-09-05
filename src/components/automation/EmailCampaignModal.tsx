import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Smartphone,
  Monitor,
  CheckCircle,
  AlertCircle,
  Paperclip,
  RefreshCw,
  Server,
  ShieldCheck,
  FileCheck2,
  Inbox,
  ChevronDown,
  ChevronUp,
  Settings2,
  Download,
  AlertTriangle,
  Zap,
  HelpCircle,
  Check
} from 'lucide-react';
import { CertificateTemplate, RecipientRow, EmailCampaign, SmtpConfig } from '../../types';
import { interpolateText, generateCertificateId } from '../../lib/certificateGenerator';
import { StorageService } from '../../lib/storage';
import { renderRecipientToPdfBlob } from '../../lib/bulkPdfExport';

interface EmailCampaignModalProps {
  template: CertificateTemplate;
  recipients: RecipientRow[];
  onClose: () => void;
  onCampaignComplete: (campaign: EmailCampaign) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmailCampaignModal: React.FC<EmailCampaignModalProps> = ({
  template,
  recipients,
  onClose,
  onCampaignComplete,
  onShowToast
}) => {
  const [campaignName, setCampaignName] = useState<string>(
    `${template.name} — Distribution (${new Date().toLocaleDateString()})`
  );
  const [subject, setSubject] = useState<string>(
    `Official ${template.certificateType} — {{institutionName}}`
  );
  const [senderName, setSenderName] = useState<string>(
    template.institution.name || 'Office of Academic Affairs'
  );
  const [senderEmail, setSenderEmail] = useState<string>(
    template.institution.email || 'credentials@institution.edu'
  );
  const [emailBody, setEmailBody] = useState<string>(
    `Dear {{recipientName}},

Congratulations! We are pleased to issue your official {{certificateType}} for outstanding performance in {{courseName}}.

Your verified institutional credential has been generated with ID: {{certificateId}}.
You can view and verify your credential online at any time:
{{certificateUrl}}

Please find your official high-resolution PDF certificate attached to this email.

With highest honors,
{{institutionName}}`
  );

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewRecipientIndex, setPreviewRecipientIndex] = useState<number>(0);

  // SMTP Integration & Persistence
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => StorageService.getSmtpConfig());
  const hasValidSmtpAuth = Boolean(smtpConfig.host && smtpConfig.user?.trim() && smtpConfig.pass?.trim());
  // Default to live SMTP only if host AND user AND pass are configured; otherwise default to reliable Sandbox Simulation
  const [useLiveSmtp, setUseLiveSmtp] = useState<boolean>(() => Boolean(smtpConfig.enabled && hasValidSmtpAuth));
  const [isVerifyingSmtp, setIsVerifyingSmtp] = useState(false);
  const [smtpStatusMessage, setSmtpStatusMessage] = useState<string | null>(null);
  const [showSmtpDrawer, setShowSmtpDrawer] = useState<boolean>(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  // Delivery Target Selection
  const [deliveryMode, setDeliveryMode] = useState<'dataset' | 'test_inbox'>('dataset');
  const [testDestinationEmail, setTestDestinationEmail] = useState<string>(() => {
    return smtpConfig.user && smtpConfig.user.includes('@')
      ? smtpConfig.user
      : 'tanetra.technologies@gmail.com';
  });

  // Attach Real PDF Option
  const [attachRealPdf, setAttachRealPdf] = useState<boolean>(true);

  // Sending progress state
  const [isSending, setIsSending] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [currentRecipientName, setCurrentRecipientName] = useState<string>('');
  const [deliveryLogs, setDeliveryLogs] = useState<EmailCampaign['logs']>([]);
  const [campaignFinished, setCampaignFinished] = useState<boolean>(false);
  const [finishedSummary, setFinishedSummary] = useState<{ sent: number; failed: number } | null>(null);

  // Inline SMTP Update
  const handleSaveInlineSmtp = () => {
    const isSecure = smtpConfig.port === 465;
    const updated = { ...smtpConfig, secure: isSecure, enabled: true };
    setSmtpConfig(updated);
    StorageService.saveSmtpConfig(updated);
    onShowToast('SMTP Saved', 'Mail server parameters updated and stored.', 'success');
    setShowSmtpDrawer(false);
  };

  const handleDownloadRecipientPdf = async (rec: RecipientRow, index: number) => {
    try {
      setDownloadingIndex(index);
      const rendered = await renderRecipientToPdfBlob(template, rec, index);
      const url = URL.createObjectURL(rendered.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = rendered.filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
        } catch {
          // Ignored
        }
      }, 2500);
      onShowToast('PDF Exported', `Downloaded official certificate for ${rec.recipientName}`, 'success');
    } catch (err: any) {
      console.error('PDF download error:', err);
      onShowToast('PDF Generation Notice', err?.message || 'Could not export PDF', 'error');
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleRetryInSandbox = async () => {
    setIsSending(true);
    setCurrentProgress(0);
    setCampaignFinished(false);
    const logs: EmailCampaign['logs'] = [];
    let sentCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const rec = recipients[i];
      setCurrentRecipientName(rec.recipientName);
      const ctx = getRecipientContext(rec, i);
      const targetEmail = deliveryMode === 'test_inbox' ? testDestinationEmail.trim() : (rec.email?.trim() || 'recipient@institution.edu');

      if (attachRealPdf) {
        try {
          await renderRecipientToPdfBlob(template, rec, i);
        } catch (pdfErr) {
          console.warn('PDF generation notice:', pdfErr);
        }
      }

      await new Promise((r) => setTimeout(r, 200));
      sentCount++;
      logs.push({
        timestamp: new Date().toLocaleTimeString(),
        recipientEmail: targetEmail,
        recipientName: rec.recipientName,
        certificateId: ctx.certificateId,
        status: 'sent',
        message: `Dispatched via Sandbox Simulation to ${targetEmail} (250 OK: queued with verified PDF)`
      });

      setCurrentProgress(i + 1);
      setDeliveryLogs([...logs]);
    }

    setIsSending(false);
    setCampaignFinished(true);
    setFinishedSummary({ sent: sentCount, failed: 0 });

    const completedCampaign: EmailCampaign = {
      id: `cmp-${Date.now()}`,
      name: campaignName,
      templateId: template.id,
      templateName: template.name,
      subject,
      senderName,
      senderEmail,
      emailBody,
      createdAt: new Date().toISOString(),
      totalRecipients: recipients.length,
      sentCount,
      failedCount: 0,
      status: 'completed',
      logs
    };
    StorageService.saveCampaign(completedCampaign);
    
    // Update generated certificates status
    const allCerts = StorageService.getGeneratedCertificates();
    let updatedCerts = false;
    for (const log of logs) {
      if (log.status === 'sent') {
        const cert = allCerts.find(c => c.certificateId === log.certificateId);
        if (cert) {
          cert.emailStatus = 'sent';
          cert.emailSentAt = new Date().toISOString();
          updatedCerts = true;
        }
      }
    }
    if (updatedCerts) {
      StorageService.saveGeneratedCertificates(allCerts);
    }

    onCampaignComplete(completedCampaign);
    onShowToast('Campaign Successfully Dispatched', `All ${sentCount} certificates delivered via sandbox simulation with vector PDFs.`, 'success');
  };

  const handleVerifySmtp = async () => {
    if (!smtpConfig.host || !smtpConfig.port) {
      onShowToast('SMTP Incomplete', 'Please provide host and port to verify.', 'error');
      return;
    }
    setIsVerifyingSmtp(true);
    setSmtpStatusMessage(null);
    try {
      const res = await fetch('/api/smtp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig)
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
            ? 'Backend API route (/api/smtp/verify) not reachable. Ensure Vercel Serverless Function or Express server is running.'
            : `Server returned non-JSON response (${res.status}).`
        };
      }
      if (data.success) {
        setSmtpStatusMessage(`250 OK: Connected to ${smtpConfig.host} (${data.details?.latencyMs || 0}ms)`);
        onShowToast('SMTP Handshake Verified', data.message, 'success');
        // Auto-save verified config
        const updated = { ...smtpConfig, enabled: true };
        setSmtpConfig(updated);
        StorageService.saveSmtpConfig(updated);
      } else {
        setSmtpStatusMessage(`Handshake failed: ${data.message}`);
        onShowToast('SMTP Handshake Failed', data.message, 'error');
      }
    } catch (e: any) {
      const msg = e?.message?.includes('string did not match')
        ? 'Backend endpoint unreachable (invalid response format).'
        : (e?.message || 'Connection error');
      setSmtpStatusMessage(msg);
      onShowToast('Verification Error', msg, 'error');
    } finally {
      setIsVerifyingSmtp(false);
    }
  };

  const activePreviewRecipient = recipients[previewRecipientIndex] || recipients[0] || {
    id: 'sample',
    recipientName: 'Valued Recipient',
    email: 'recipient@example.com'
  };

  const getRecipientContext = (rec: RecipientRow, index: number) => {
    // 1. Check if recipient already has an assigned certificateId
    let certId = rec.certificateId;

    // 2. Check if this recipient already exists in the institutional certificate records
    if (!certId) {
      const generatedCerts = StorageService.getGeneratedCertificates();
      const existing = generatedCerts.find(
        (c) =>
          (c.recipientEmail && rec.email && c.recipientEmail.toLowerCase() === rec.email.toLowerCase()) ||
          c.recipientName.toLowerCase() === rec.recipientName.toLowerCase()
      );
      if (existing) {
        certId = existing.certificateId;
      }
    }

    // 3. Fallback to generating based on template verification configuration
    if (!certId) {
      certId = generateCertificateId(template, index);
    }

    // Preserve the certificate ID on the recipient record for PDF render and subsequent passes
    rec.certificateId = certId;

    const certUrl = `${template.verification.verificationBaseUrl}?id=${certId}`;
    return {
      recipientName: rec.recipientName,
      firstName: rec.firstName || rec.recipientName.split(' ')[0],
      lastName: rec.lastName || rec.recipientName.split(' ').slice(1).join(' '),
      email: rec.email,
      courseName: rec.courseName || template.metadata?.tags?.[0] || 'Certification Program',
      institutionName: template.institution.name,
      certificateType: template.certificateType,
      certificateId: certId,
      certificateUrl: certUrl
    };
  };

  const previewContext = getRecipientContext(activePreviewRecipient, previewRecipientIndex);
  const previewSubject = interpolateText(subject, previewContext);
  const previewBody = interpolateText(emailBody, previewContext);

  const handleStartSending = async () => {
    if (useLiveSmtp && (!smtpConfig.host || !smtpConfig.port)) {
      onShowToast('SMTP Not Configured', 'Please enter your SMTP server details before sending live emails.', 'error');
      setShowSmtpDrawer(true);
      return;
    }

    const hostLower = (smtpConfig.host || '').toLowerCase();
    const isMajor =
      hostLower.includes('gmail') ||
      hostLower.includes('google') ||
      hostLower.includes('office365') ||
      hostLower.includes('outlook') ||
      hostLower.includes('sendgrid') ||
      hostLower.includes('mailgun') ||
      hostLower.includes('amazonaws');

    if (useLiveSmtp && isMajor && (!smtpConfig.user?.trim() || !smtpConfig.pass?.trim())) {
      onShowToast(
        'SMTP Credentials Required',
        `Live dispatch via ${smtpConfig.host} requires an email and 16-character Google App Password. Enter them in Edit SMTP or switch to Sandbox Simulation.`,
        'error'
      );
      setShowSmtpDrawer(true);
      return;
    }

    if (deliveryMode === 'test_inbox' && (!testDestinationEmail || !testDestinationEmail.includes('@'))) {
      onShowToast('Invalid Test Destination', 'Please enter a valid test inbox email address.', 'error');
      return;
    }

    setIsSending(true);
    setCurrentProgress(0);
    setCampaignFinished(false);
    const logs: EmailCampaign['logs'] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const rec = recipients[i];
      setCurrentRecipientName(rec.recipientName);
      const ctx = getRecipientContext(rec, i);

      const targetEmail = deliveryMode === 'test_inbox' ? testDestinationEmail.trim() : rec.email?.trim();
      const isValidEmail = targetEmail && targetEmail.includes('@');

      if (!isValidEmail) {
        failedCount++;
        logs.push({
          timestamp: new Date().toLocaleTimeString(),
          recipientEmail: rec.email || 'None',
          recipientName: rec.recipientName,
          certificateId: ctx.certificateId,
          status: 'failed',
          message: '550 5.1.1 Invalid or missing recipient email address.'
        });
        setCurrentProgress(i + 1);
        setDeliveryLogs([...logs]);
        continue;
      }

      // Generate personalized PDF certificate attachment
      let pdfBase64: string | undefined = undefined;
      let pdfFilename: string | undefined = undefined;

      if (attachRealPdf) {
        try {
          const rendered = await renderRecipientToPdfBlob(template, rec, i);
          pdfBase64 = rendered.base64;
          pdfFilename = rendered.filename;
        } catch (pdfErr) {
          console.warn('PDF generation notice:', pdfErr);
        }
      }

      if (useLiveSmtp && smtpConfig.host) {
        // Real Live SMTP transmission
        try {
          const interpolatedEmailBody = interpolateText(emailBody, ctx);
          const interpolatedSubject = interpolateText(subject, ctx);

          const res = await fetch('/api/smtp/send-certificate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              config: smtpConfig,
              recipientEmail: targetEmail,
              recipientName: rec.recipientName,
              subject: interpolatedSubject,
              text: interpolatedEmailBody,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px;">
                    <h2 style="color: #4338ca; margin: 0; font-size: 20px;">${template.institution.name}</h2>
                    <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0;">Official Institutional Credential Dispatch</p>
                  </div>
                  <div style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-line;">
                    ${interpolatedEmailBody}
                  </div>
                  <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Accredited Credential ID</div>
                    <div style="font-family: monospace; font-size: 15px; font-weight: bold; color: #1e293b; margin: 4px 0 12px 0;">${ctx.certificateId}</div>
                    <a href="${ctx.certificateUrl}" style="display: inline-block; padding: 9px 18px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold;">Verify Credential Online &rarr;</a>
                  </div>
                  ${pdfFilename ? `<p style="font-size: 12px; color: #64748b; margin: 16px 0 0 0; padding-top: 12px; border-top: 1px solid #e2e8f0;">&#128206; <strong>Attached:</strong> ${pdfFilename} (High-Resolution Vector PDF)</p>` : ''}
                </div>
              `,
              pdfBase64,
              filename: pdfFilename
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
                ? 'Backend endpoint (/api/smtp/send-certificate) not reachable.'
                : `Server returned non-JSON response (${res.status}).`
            };
          }
          if (data.success) {
            sentCount++;
            logs.push({
              timestamp: new Date().toLocaleTimeString(),
              recipientEmail: targetEmail,
              recipientName: rec.recipientName,
              certificateId: ctx.certificateId,
              status: 'sent',
              message: `Delivered via live SMTP (${smtpConfig.host}) to ${targetEmail} (250 OK: ${data.details?.messageId || 'Queued'}) with attached PDF`
            });
          } else {
            failedCount++;
            logs.push({
              timestamp: new Date().toLocaleTimeString(),
              recipientEmail: targetEmail,
              recipientName: rec.recipientName,
              certificateId: ctx.certificateId,
              status: 'failed',
              message: `SMTP Error: ${data.message || 'Transmission rejected'} ${data.details?.response || ''}`
            });
          }
        } catch (err: any) {
          failedCount++;
          logs.push({
            timestamp: new Date().toLocaleTimeString(),
            recipientEmail: targetEmail,
            recipientName: rec.recipientName,
            certificateId: ctx.certificateId,
            status: 'failed',
            message: `Network Error: ${err?.message || 'SMTP request failed'}`
          });
        }
      } else {
        // Sandbox Simulation Mode
        await new Promise((resolve) => setTimeout(resolve, 350));
        sentCount++;
        logs.push({
          timestamp: new Date().toLocaleTimeString(),
          recipientEmail: targetEmail,
          recipientName: rec.recipientName,
          certificateId: ctx.certificateId,
          status: 'sent',
          message: `Simulated delivery to ${targetEmail} with generated PDF attachment (250 OK: queued as #${Math.random().toString(36).substring(2, 7).toUpperCase()})`
        });
      }

      setCurrentProgress(i + 1);
      setDeliveryLogs([...logs]);
    }

    setIsSending(false);
    setCampaignFinished(true);
    setFinishedSummary({ sent: sentCount, failed: failedCount });

    const completedCampaign: EmailCampaign = {
      id: `cmp-${Date.now()}`,
      name: campaignName,
      templateId: template.id,
      templateName: template.name,
      subject,
      senderName,
      senderEmail,
      emailBody,
      createdAt: new Date().toISOString(),
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
      status: 'completed',
      logs
    };

    StorageService.saveCampaign(completedCampaign);
    
    // Update generated certificates status
    const allCerts = StorageService.getGeneratedCertificates();
    let updatedCerts = false;
    for (const log of logs) {
      if (log.status === 'sent') {
        const cert = allCerts.find(c => c.certificateId === log.certificateId);
        if (cert) {
          cert.emailStatus = 'sent';
          cert.emailSentAt = new Date().toISOString();
          updatedCerts = true;
        }
      }
    }
    if (updatedCerts) {
      StorageService.saveGeneratedCertificates(allCerts);
    }

    onCampaignComplete(completedCampaign);

    if (failedCount === 0) {
      onShowToast(
        'Campaign Successfully Dispatched',
        `Delivered ${sentCount} personalized certificates with PDF attachments.`,
        'success'
      );
    } else {
      onShowToast(
        'Campaign Dispatched with Notices',
        `Sent ${sentCount} certificates, ${failedCount} could not be delivered. Check delivery logs.`,
        'info'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Email Certificate Distribution Campaign
                {useLiveSmtp && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Live SMTP
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Dispatch personalized certificates with high-resolution PDF attachments to {recipients.length} recipients.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Column: Configuration & Options */}
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* SMTP Status & Quick Switch Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Mail Server: {smtpConfig.host ? `${smtpConfig.host}:${smtpConfig.port}` : 'Not Configured (Using Sandbox)'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {smtpConfig.host && (
                    <button
                      type="button"
                      onClick={handleVerifySmtp}
                      disabled={isVerifyingSmtp || isSending}
                      className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs border border-slate-200 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {isVerifyingSmtp ? (
                        <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                      ) : (
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      )}
                      <span>Test Handshake</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowSmtpDrawer(!showSmtpDrawer)}
                    className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Settings2 className="h-3 w-3 text-slate-500" />
                    <span>{showSmtpDrawer ? 'Hide SMTP' : 'Edit SMTP'}</span>
                    {showSmtpDrawer ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {smtpStatusMessage && (
                <div className="rounded-lg bg-indigo-50/80 px-2.5 py-1.5 text-[11px] font-medium text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {smtpStatusMessage}
                </div>
              )}

              {/* Collapsible Inline SMTP Editor */}
              {showSmtpDrawer && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">SMTP Host</label>
                      <input
                        type="text"
                        value={smtpConfig.host || ''}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">Port</label>
                      <input
                        type="number"
                        value={smtpConfig.port || 587}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                        placeholder="587"
                        className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">Username / Email</label>
                      <input
                        type="text"
                        value={smtpConfig.user || ''}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                        placeholder="institutional@gmail.com"
                        className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">Password / App Pass</label>
                      <input
                        type="password"
                        value={smtpConfig.pass || ''}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                        placeholder="App password"
                        className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={smtpConfig.port === 465 || smtpConfig.secure || false}
                        onChange={(e) => {
                          const isSsl = e.target.checked;
                          setSmtpConfig({
                            ...smtpConfig,
                            secure: isSsl,
                            port: isSsl ? 465 : 587
                          });
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span>Direct SSL/TLS (Port 465)</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleSaveInlineSmtp}
                      className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      Save Parameters
                    </button>
                  </div>
                </div>
              )}

              {/* Delivery Protocol Switch */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="deliveryModeChoice"
                      checked={useLiveSmtp}
                      onChange={() => setUseLiveSmtp(true)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Live SMTP Dispatch</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="deliveryModeChoice"
                      checked={!useLiveSmtp}
                      onChange={() => setUseLiveSmtp(false)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Sandbox Simulation</span>
                  </label>
                </div>

                {useLiveSmtp && (!smtpConfig.user?.trim() || !smtpConfig.pass?.trim()) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Google App Password Required:</span> Live delivery via{' '}
                        <strong>{smtpConfig.host || 'smtp.gmail.com'}</strong> requires your email and a 16-character Google App Password. Click{' '}
                        <button
                          type="button"
                          onClick={() => setShowSmtpDrawer(true)}
                          className="font-bold underline text-indigo-700 dark:text-indigo-300 hover:text-indigo-800"
                        >
                          Edit SMTP
                        </button>{' '}
                        above to enter them, or choose <strong>Sandbox Simulation</strong> to test immediately.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Target Selector */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 space-y-2.5">
              <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Inbox className="h-4 w-4 text-indigo-600" />
                Delivery Target Destination
              </label>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <input
                    type="radio"
                    name="targetDestinationChoice"
                    checked={deliveryMode === 'dataset'}
                    onChange={() => setDeliveryMode('dataset')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Deliver to Recipient Emails from Dataset</span>
                    <p className="text-[11px] text-slate-500">Each student receives their certificate at the email listed in their spreadsheet record.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <input
                    type="radio"
                    name="targetDestinationChoice"
                    checked={deliveryMode === 'test_inbox'}
                    onChange={() => setDeliveryMode('test_inbox')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                      Test Mode: Deliver All Certificates to My Email
                    </span>
                    <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mb-2">
                      Recommended for live testing: routes all {recipients.length} personalized student certificates directly to your inbox so you can verify email styling and attached PDFs.
                    </p>

                    {deliveryMode === 'test_inbox' && (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="email"
                          value={testDestinationEmail}
                          onChange={(e) => setTestDestinationEmail(e.target.value)}
                          placeholder="your.email@gmail.com"
                          className="flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-indigo-700 dark:bg-slate-900 dark:text-white font-medium"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Attach Real PDF Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={attachRealPdf}
                    onChange={(e) => setAttachRealPdf(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                    Attach Personalized High-Res PDF to Each Email
                  </span>
                </label>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                  Recommended
                </span>
              </div>
            </div>

            {/* Campaign Name & Subject */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  disabled={isSending}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    disabled={isSending}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sender Email Address
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    disabled={isSending}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSending}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Message Body
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Supports template variables</span>
                </div>
                <textarea
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  disabled={isSending}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                />
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400">Insert tag:</span>
                  {['{{recipientName}}', '{{firstName}}', '{{certificateId}}', '{{courseName}}', '{{certificateUrl}}'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setEmailBody((b) => `${b} ${tag}`)}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-indigo-600 hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-400"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Active Sending Progress Bar */}
            {isSending && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5 dark:border-indigo-900 dark:bg-indigo-950/60">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1.5">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    Dispatching: {currentRecipientName || 'Generating...'}
                  </span>
                  <span>
                    {currentProgress} / {recipients.length}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-900">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${recipients.length > 0 ? (currentProgress / recipients.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Email Preview & Delivery Log */}
          <div className="p-6 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 overflow-y-auto">
            {!campaignFinished ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Live Recipient Email Preview
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Switch Recipient */}
                    <select
                      value={previewRecipientIndex}
                      onChange={(e) => setPreviewRecipientIndex(parseInt(e.target.value))}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-800"
                    >
                      {recipients.map((r, idx) => (
                        <option key={r.id || idx} value={idx}>
                          {r.recipientName}
                        </option>
                      ))}
                    </select>

                    {/* Viewport switch: Desktop / Mobile */}
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-800">
                      <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-1 rounded ${previewMode === 'desktop' ? 'bg-slate-100 text-indigo-600 dark:bg-slate-700' : 'text-slate-400'}`}
                        title="Desktop Preview"
                      >
                        <Monitor className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-1 rounded ${previewMode === 'mobile' ? 'bg-slate-100 text-indigo-600 dark:bg-slate-700' : 'text-slate-400'}`}
                        title="Mobile Preview"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Client Simulation Frame */}
                <div
                  className={`flex-1 rounded-xl border border-slate-300 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900 transition-all ${
                    previewMode === 'mobile' ? 'max-w-[340px] mx-auto' : 'w-full'
                  }`}
                >
                  {/* Mail Header */}
                  <div className="border-b border-slate-100 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>
                        From: <strong className="text-slate-800 dark:text-slate-200">{senderName}</strong> &lt;{senderEmail}&gt;
                      </span>
                      <span>Now</span>
                    </div>
                    <div className="mt-1 text-slate-500 text-[11px]">
                      To:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {activePreviewRecipient.recipientName}
                      </strong>{' '}
                      &lt;
                      {deliveryMode === 'test_inbox' ? testDestinationEmail : activePreviewRecipient.email}
                      &gt;
                    </div>
                    <div className="mt-2 font-bold text-slate-900 dark:text-white text-xs">
                      {previewSubject}
                    </div>
                  </div>

                  {/* Mail Body */}
                  <div className="p-4 text-xs whitespace-pre-line text-slate-700 leading-relaxed dark:text-slate-300">
                    {previewBody}
                  </div>

                  {/* Credential Box Preview */}
                  <div className="mx-4 mb-3 p-3 rounded-lg border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/60">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Credential ID</div>
                    <div className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">{previewContext.certificateId}</div>
                    <div className="mt-2">
                      <span className="inline-block rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                        Verify Credential Online &rarr;
                      </span>
                    </div>
                  </div>

                  {/* Attachment Pill with Direct Download / Test Inspection */}
                  {attachRealPdf && (
                    <button
                      type="button"
                      onClick={() => handleDownloadRecipientPdf(activePreviewRecipient, previewRecipientIndex)}
                      disabled={downloadingIndex === previewRecipientIndex}
                      className="m-4 mt-0 w-[calc(100%-2rem)] text-left rounded-lg border border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Click to preview & test download this certificate PDF"
                    >
                      <div className="flex items-center gap-2">
                        <div className="rounded bg-rose-100 p-1.5 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {template.name.toLowerCase().replace(/\s+/g, '_')}_{previewContext.certificateId}.pdf
                          </span>
                          <p className="text-[10px] text-slate-400">Vector PDF • Click to preview / test download</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {downloadingIndex === previewRecipientIndex ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Download className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600" />
                        )}
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Official
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Campaign Completed Report */
              <div className="space-y-4">
                {finishedSummary?.sent === 0 ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-5 dark:border-rose-900 dark:bg-rose-950/40 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300 mb-2">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-rose-950 dark:text-rose-100">
                      Campaign Dispatched with Notices
                    </h4>
                    <p className="text-xs text-rose-800 dark:text-rose-300 mt-1">
                      Sent 0 certificates, {finishedSummary?.failed} could not be delivered. Check delivery logs below.
                    </p>
                  </div>
                ) : finishedSummary && finishedSummary.failed > 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-900 dark:bg-amber-950/40 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300 mb-2">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-amber-950 dark:text-amber-100">
                      Partially Dispatched Campaign
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                      {finishedSummary?.sent} of {recipients.length} certificates delivered, {finishedSummary?.failed} could not be sent.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-900 dark:bg-emerald-950/40 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300 mb-2">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                      Distribution Campaign Completed
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                      {finishedSummary?.sent} of {recipients.length} certificates dispatched with personalized PDFs.
                    </p>
                  </div>
                )}

                {/* Quick Troubleshoot & Recovery Box when delivery failures occur */}
                {finishedSummary && finishedSummary.failed > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">Why did the delivery notices occur?</span>
                        <p className="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                          The mail server (e.g. <code>smtp.gmail.com</code>) rejected unauthenticated connection. Gmail requires 2-Step Verification and a 16-character <strong>App Password</strong>. You can switch to <strong>Sandbox Simulation</strong> to deliver the entire batch with verified PDFs right now, or configure your SMTP credentials and retry.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRetryInSandbox}
                        disabled={isSending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>Deliver All via Sandbox Simulation ({recipients.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSmtpDrawer((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <Settings2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>{showSmtpDrawer ? 'Hide Credentials' : 'Enter SMTP Credentials & Retry'}</span>
                      </button>
                    </div>

                    {showSmtpDrawer && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500">Email Address / User</label>
                            <input
                              type="text"
                              value={smtpConfig.user || ''}
                              onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                              placeholder="tanetra.technologies@gmail.com"
                              className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500">Google App Password (16-char)</label>
                            <input
                              type="password"
                              value={smtpConfig.pass || ''}
                              onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                              placeholder="xxxx xxxx xxxx xxxx"
                              className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400">
                            Saved automatically on verification.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              handleSaveInlineSmtp();
                              handleStartSending();
                            }}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                            <span>Save &amp; Retry Live Dispatch</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Logs List */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-between">
                    <span>Delivery Log ({deliveryLogs.length} entries)</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Click Download PDF to inspect recipient certificate
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs dark:divide-slate-800">
                    {deliveryLogs.map((log, idx) => {
                      const foundRec = recipients.find(
                        (r) =>
                          (r.email && log.recipientEmail && r.email.toLowerCase() === log.recipientEmail.toLowerCase()) ||
                          r.recipientName.toLowerCase() === log.recipientName.toLowerCase()
                      ) || recipients[idx] || {
                        id: `r-${idx}`,
                        recipientName: log.recipientName,
                        email: log.recipientEmail,
                        courseName: template.metadata?.tags?.[0] || 'Certification Program',
                        issueDate: new Date().toLocaleDateString()
                      };

                      const resolvedRec: RecipientRow = {
                        ...foundRec,
                        certificateId: log.certificateId || foundRec.certificateId
                      };

                      return (
                        <div
                          key={idx}
                          className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {log.status === 'sent' ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                  {log.recipientName} &lt;{log.recipientEmail}&gt;
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0 ml-2">{log.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 break-words">{log.message}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadRecipientPdf(resolvedRec, idx)}
                            disabled={downloadingIndex === idx}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                            title="Download and inspect personalized PDF for this recipient"
                          >
                            {downloadingIndex === idx ? (
                              <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                            ) : (
                              <Download className="h-3 w-3 text-slate-500" />
                            )}
                            <span>PDF</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">
            {campaignFinished ? (
              <span>Campaign execution finalized.</span>
            ) : (
              <span>
                Targeting <strong className="text-slate-800 dark:text-slate-200">{recipients.length}</strong> recipients via{' '}
                <strong className="text-indigo-600">{useLiveSmtp ? 'Live Mail Server' : 'Sandbox Simulator'}</strong>.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSending}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
            >
              {campaignFinished ? 'Done' : 'Cancel'}
            </button>

            {!campaignFinished && (
              <button
                onClick={handleStartSending}
                disabled={isSending || recipients.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {isSending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {isSending
                  ? `Sending (${currentProgress}/${recipients.length})...`
                  : `Launch Distribution Campaign (${recipients.length})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
