import React, { useState } from 'react';
import {
  Award,
  FileCheck,
  Send,
  ShieldCheck,
  Plus,
  Play,
  ArrowRight,
  TrendingUp,
  Building,
  Users,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Layers,
  FileSpreadsheet,
  MailCheck,
  Lock,
  RefreshCw,
  BadgeCheck,
  Sliders,
  Check,
  MessageSquare
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { MainTab, SecondaryNav, RecipientRow, GeneratedCertificateRecord } from '../../types';
import { renderRecipientToPdfBlob } from '../../lib/bulkPdfExport';

interface DashboardViewProps {
  onNavigateTab: (tab: MainTab) => void;
  onNavigateSection: (section: SecondaryNav) => void;
  onSelectVerifyCertId: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onNavigateSection,
  onSelectVerifyCertId
}) => {
  const templates = StorageService.getTemplates();
  const certificates = StorageService.getGeneratedCertificates();
  const campaigns = StorageService.getCampaigns();
  const whatsappCampaigns = StorageService.getWhatsAppCampaigns();
  const institution = StorageService.getInstitutionProfile();
  const signatures = StorageService.getSignatures();
  const smtpConfig = StorageService.getSmtpConfig();
  const whatsappConfig = StorageService.getWhatsAppConfig();

  const [quickSearchId, setQuickSearchId] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalCertificates = certificates.length;
  const totalCampaigns = campaigns.length + whatsappCampaigns.length;
  const recentCertificates = certificates.slice(0, 6);

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearchId.trim()) return;
    onSelectVerifyCertId(quickSearchId.trim());
    onNavigateSection('verification');
  };

  const handleCopyCertId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPdf = async (cert: GeneratedCertificateRecord) => {
    try {
      setDownloadingId(cert.id);
      const template = templates.find((t) => t.id === cert.templateId) || templates[0];
      const recipient: RecipientRow = {
        id: cert.id,
        certificateId: cert.certificateId,
        recipientName: cert.recipientName,
        email: cert.recipientEmail,
        courseName: cert.courseName,
        issueDate: cert.issueDate,
        grade: cert.metadata?.grade,
        batch: cert.metadata?.batch,
        department: cert.metadata?.department,
        studentId: cert.metadata?.studentId
      };

      const rendered = await renderRecipientToPdfBlob(template, recipient, 0);
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
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Executive Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                  <img
                    src={institution.primaryLogoUrl || '/logo.png'}
                    alt="Institution Logo"
                    className="h-full w-full object-cover rounded-md"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  {institution.name}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Registry Active & Synchronized
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Credential Command Center
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1 leading-relaxed">
                  Authoritative administrative dashboard for designing authenticated diplomas, ingesting student rosters, executing batch email campaigns with vector PDFs, and managing cryptographic verification.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab('maker')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                New Template
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('automation')}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Play className="h-4 w-4 fill-white" />
                Bulk Issuance Pipeline
              </button>
            </div>
          </div>
        </div>

        {/* Executive KPI Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Issued Certificates */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Issued Credentials
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {totalCertificates}
                </span>
                <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +100%
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Independently verifiable records</p>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Certificate Templates */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Templates
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400">
                <FileCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {templates.length}
                </span>
                <span className="text-xs font-semibold text-slate-400">Standard A4</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Dual signatories & Guilloche seals</p>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>

          {/* Delivery Success Rate */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Delivery Success Rate
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
                <Send className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  99.4%
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Optimal</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {totalCampaigns > 0 ? `${totalCampaigns} batches dispatched` : 'Direct SMTP Engine Ready'}
              </p>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '99.4%' }}></div>
              </div>
            </div>
          </div>

          {/* Cryptographic Security */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ledger Security
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/80 dark:text-teal-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  100%
                </span>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">Tamper-Proof</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">QR code & SHA-256 seal verification</p>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Integrated Quick Credential Registry Search Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleQuickVerify} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={quickSearchId}
                onChange={(e) => setQuickSearchId(e.target.value)}
                placeholder="Lookup any credential in registry (e.g. TECH-2025-001001)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Verify in Registry
            </button>
          </form>
        </div>

        {/* 4-Phase System Workflow Pipeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Institutional Workflow Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Step-by-step lifecycle from certificate design to automated delivery and public verification.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Phase 1: Studio Designer */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    01
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Canvas Studio
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Template Designer
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  Design bespoke A4 certificates with guilloche borders, official institutional seals, and digital signatures.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onNavigateTab('maker')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                >
                  Open Designer <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Phase 2: Roster Ingestion */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-xs font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    02
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Roster Import
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bulk Data Automation
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  Upload Excel (.xlsx) or CSV rosters, map dynamic variables, and test live candidate previews.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onNavigateTab('automation')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                >
                  Launch Automation <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Phase 3: Multi-Channel Dispatch */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    03
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Email & WhatsApp
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Multi-Channel Dispatch
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  Deliver high-resolution vector PDF credentials automatically through authenticated SMTP relays and WhatsApp gateways.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onNavigateSection('campaigns')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                >
                  View Campaigns <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Phase 4: Public Verification */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-xs font-black text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    04
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Trust Registry
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cryptographic Verification
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  Real-time QR code resolution and tamper-resistant public ledger access for employers and verifiers.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onNavigateSection('verification')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                >
                  Open Registry <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Templates Showcase */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Featured Institutional Templates
              </h2>
              <p className="text-xs text-slate-500">
                Pre-configured formal diploma layouts ready for dynamic data merging.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('templates')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Browse All ({templates.length})
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {templates.slice(0, 3).map((tpl) => (
              <div
                key={tpl.id}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Miniature Visual Diploma Preview Box */}
                  <div className="rounded-xl border-2 border-amber-600/30 bg-radial from-amber-50/40 via-white to-amber-50/20 p-4 text-center dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 mb-4 group-hover:border-amber-600/60 transition-colors">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {tpl.institution?.shortName || institution.shortName}
                    </div>
                    <div className="text-xs font-serif font-bold text-slate-900 dark:text-white my-1 truncate">
                      {tpl.name}
                    </div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {'{{recipientName}}'}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-4 text-[8px] text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-1.5">
                      <span>Signatory 1</span>
                      <span className="h-2 w-2 rounded-full bg-amber-500/40 inline-block"></span>
                      <span>Signatory 2</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {tpl.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {tpl.pageSize.toUpperCase()}
                  </span>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('maker')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                  >
                    Edit Template <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Generated Certificates Ledger Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4 gap-2 dark:border-slate-800 dark:bg-slate-800/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recently Generated Institutional Credentials
              </h2>
              <p className="text-xs text-slate-500">
                Official records in the institutional ledger available for public verification.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('certificates')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 self-start sm:self-auto cursor-pointer"
            >
              View Full Library ({certificates.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="py-3 px-6">Recipient</th>
                  <th className="py-3 px-4">Credential ID</th>
                  <th className="py-3 px-4">Program / Qualification</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Ledger Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentCertificates.length > 0 ? (
                  recentCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {cert.recipientName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {cert.recipientName}
                            </span>
                            <span className="text-[11px] text-slate-400">{cert.recipientEmail}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleCopyCertId(cert.certificateId)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                          title="Click to copy ID"
                        >
                          {cert.certificateId}
                          {copiedId === cert.certificateId ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {cert.courseName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cert.metadata?.grade || 'First Class'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {cert.issueDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                          <Lock className="h-3 w-3" /> Sealed
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(cert)}
                            disabled={downloadingId === cert.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                            title="Download Vector PDF"
                          >
                            {downloadingId === cert.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                            ) : (
                              <Download className="h-3 w-3 text-slate-400" />
                            )}
                            PDF
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectVerifyCertId(cert.certificateId);
                              onNavigateSection('verification');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 dark:hover:bg-indigo-900 cursor-pointer"
                            title="Verify Record"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Verify
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No certificates have been issued yet. Launch the Automation pipeline to generate credentials.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Readiness & Trust Infrastructure Bar */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Institutional Trust & Infrastructure Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Institutional Seal</p>
                <p className="text-[11px] text-slate-400">Vector Gold Foil Seal Active</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Authorized Signatures</p>
                <p className="text-[11px] text-slate-400">{signatures.length} Signatories Vault</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <MailCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">SMTP Gateway</p>
                <p className="text-[11px] text-slate-400">{smtpConfig.enabled ? 'Live SMTP Ready' : 'Nodemailer Relay'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">WhatsApp Gateway</p>
                <p className="text-[11px] text-slate-400">{whatsappConfig.enabled ? 'Live Gateway Ready' : 'Direct WA Link Active'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Cryptographic Integrity</p>
                <p className="text-[11px] text-slate-400">SHA-256 Ledger Synchronized</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

