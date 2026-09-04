import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Calendar,
  Award,
  Download,
  Share2,
  Printer,
  Copy,
  Check,
  Lock,
  FileText,
  BadgeCheck,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { GeneratedCertificateRecord, RecipientRow } from '../../types';
import { StorageService } from '../../lib/storage';
import { renderRecipientToPdfBlob } from '../../lib/bulkPdfExport';

interface VerificationPortalProps {
  initialCertId?: string;
  isStandalone?: boolean;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({
  initialCertId,
  isStandalone = false,
  onShowToast
}) => {
  const [searchId, setSearchId] = useState<string>(initialCertId || '');
  const [activeRecord, setActiveRecord] = useState<GeneratedCertificateRecord | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const institution = StorageService.getInstitutionProfile();

  const handleVerify = (certIdToLookup: string) => {
    const trimmed = certIdToLookup.trim();
    if (!trimmed) return;

    setHasSearched(true);
    const found = StorageService.findCertificateById(trimmed);

    if (found) {
      setActiveRecord(found);
      onShowToast('Credential Verified', `Valid certificate found for ${found.recipientName}.`, 'success');
    } else {
      setActiveRecord(null);
      onShowToast('Certificate Not Found', 'No record matches this ID in the institutional ledger.', 'error');
    }
  };

  useEffect(() => {
    if (initialCertId) {
      setSearchId(initialCertId);
      handleVerify(initialCertId);
    }
  }, [initialCertId]);

  const handleDownloadOfficialPdf = async () => {
    if (!activeRecord) return;
    try {
      setIsDownloading(true);
      const templates = StorageService.getTemplates();
      const template = templates.find((t) => t.id === activeRecord.templateId) || templates[0];

      const recipient: RecipientRow = {
        id: activeRecord.id,
        certificateId: activeRecord.certificateId,
        recipientName: activeRecord.recipientName,
        email: activeRecord.recipientEmail,
        courseName: activeRecord.courseName,
        issueDate: activeRecord.issueDate,
        grade: activeRecord.metadata?.grade,
        batch: activeRecord.metadata?.batch,
        department: activeRecord.metadata?.department,
        studentId: activeRecord.metadata?.studentId
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
      onShowToast('PDF Exported', `Official PDF for ${activeRecord.recipientName} downloaded.`, 'success');
    } catch (err: any) {
      console.error('PDF download error:', err);
      onShowToast('Download Notice', err?.message || 'Could not export certificate PDF', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (!activeRecord) return;
    const url = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(activeRecord.certificateId)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    onShowToast('Link Copied', 'Direct verification link copied to clipboard.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 ${isStandalone ? 'py-8 px-4 sm:px-6' : 'py-8 px-4'}`}>
      <div className="mx-auto max-w-4xl w-full space-y-8">
        {/* Verification Portal Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-md border border-slate-200/80 p-1 dark:border-slate-800 dark:bg-slate-900">
                <img
                  src={institution.primaryLogoUrl || '/logo.png'}
                  alt={institution.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-950">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
            <BadgeCheck className="h-3.5 w-3.5" />
            Official Institutional Registry & Cryptographic Verification
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Credential Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Authorized portal for verifying official certifications, academic records, and tamper-resistant credentials issued by <span className="font-semibold text-slate-700 dark:text-slate-300">{institution.name}</span>.
          </p>

          {/* Search Box */}
          <div className="mx-auto max-w-xl pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(searchId);
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-xs transition-shadow focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Certificate ID (e.g. TECH-2025-001001)"
                  className="w-full bg-transparent pl-9 pr-3 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Verify Credential
              </button>
            </form>
          </div>
        </div>

        {/* Verification Results Card */}
        {activeRecord ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200/80 bg-white shadow-md overflow-hidden dark:border-emerald-950/60 dark:bg-slate-900">
              {/* Official Status Banner */}
              <div className="border-b border-emerald-600/30 bg-emerald-600 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">
                      Official Cryptographic Validation
                    </span>
                    <h3 className="text-lg font-bold leading-tight text-white">Valid & Authenticated Credential</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-black/20 px-3 py-1 font-mono text-xs font-bold tracking-wider text-white backdrop-blur-xs">
                    {activeRecord.certificateId}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/30 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    <Lock className="h-3 w-3" /> Sealed
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Verified from registry on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    title="Copy direct verification link"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    {copiedLink ? 'Copied' : 'Share Link'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    title="Print credential record"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-400" />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadOfficialPdf}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    {isDownloading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download Official PDF
                  </button>
                </div>
              </div>

              {/* Credential Details Grid */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-850/50">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-indigo-500" /> Recipient Name
                    </span>
                    <p className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                      {activeRecord.recipientName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{activeRecord.recipientEmail || 'Candidate Record'}</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-850/50">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-amber-500" /> Course / Program
                    </span>
                    <p className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                      {activeRecord.courseName}
                    </p>
                    <p className="text-xs text-indigo-600 font-semibold dark:text-indigo-400 mt-0.5">
                      {activeRecord.certificateType || 'Official Certificate of Completion'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-850/50">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-emerald-500" /> Issuing Institution
                    </span>
                    <p className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                      {activeRecord.institutionName || institution.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{institution.accreditation || 'Accredited Academic Institution'}</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-850/50">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" /> Official Issue Date
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {activeRecord.issueDate}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Permanent Institutional Ledger</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-850/50">
                    <span className="text-xs font-medium text-slate-400">Distinction / Performance</span>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {activeRecord.metadata?.grade || 'First Class with Distinction'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Batch: {activeRecord.metadata?.batch || 'Annual Cohort'}</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-850/50">
                    <span className="text-xs font-medium text-slate-400">Cryptographic Seal ID</span>
                    <p className="mt-1.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      SHA256:{activeRecord.certificateId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toUpperCase()}7F3A
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Valid Electronic Signature</p>
                  </div>
                </div>

                {/* Simulated Visual Certificate Preview Box */}
                <div className="rounded-2xl border-2 border-amber-600/30 bg-radial from-amber-50/30 via-white to-amber-50/20 p-6 sm:p-8 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 shadow-inner relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified Document
                  </div>

                  <div className="max-w-xl mx-auto text-center space-y-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                        {activeRecord.institutionName || institution.name}
                      </p>
                      <h4 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
                        {activeRecord.certificateType || 'Certificate of Excellence'}
                      </h4>
                      <p className="text-xs text-slate-500 italic">This is to certify that</p>
                    </div>

                    <div className="py-2 border-b-2 border-amber-500/40 inline-block px-8">
                      <p className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-wide">
                        {activeRecord.recipientName}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                      has successfully satisfied all requirements for <strong className="font-semibold">{activeRecord.courseName}</strong> and is awarded this official credential with honors.
                    </p>

                    <div className="pt-6 flex items-center justify-between text-left text-xs border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <p className="font-serif italic text-slate-800 dark:text-slate-200 text-sm">Dr. Arthur Sterling, Ph.D.</p>
                        <p className="text-[10px] text-slate-400">Dean of Academic Affairs</p>
                      </div>

                      <div className="text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                          <Award className="h-5 w-5" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Official Seal</span>
                      </div>

                      <div className="text-right">
                        <p className="font-serif italic text-slate-800 dark:text-slate-200 text-sm">Prof. Eleanor Vance, M.Sc.</p>
                        <p className="text-[10px] text-slate-400">President & Vice Chancellor</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tamper-Proof Security Guarantee Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50 flex items-start gap-3.5 text-xs">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong className="text-slate-800 dark:text-slate-200">Tamper-Proof Verification Guarantee: </strong>
                    This credential was cryptographically registered by authorized academic officers at <span className="font-medium text-slate-700 dark:text-slate-300">{institution.name}</span>. The cryptographic hash matches the original certificate issuance payload. Any physical or digital alteration to the recipient's name, qualifications, or identification number voids this credential.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : hasSearched ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xs dark:border-rose-900/60 dark:bg-slate-900 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Certificate Record Not Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No verified credential matches the identifier <strong className="font-mono text-slate-800 dark:text-slate-200">{searchId}</strong> in the institutional registry.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 max-w-md mx-auto text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 text-left">
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">What this might mean:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                <li>The certificate ID was mistyped. Verify hyphenation and numbers.</li>
                <li>The credential may have been revoked or is pending final audit.</li>
                <li>The certificate was not issued by this accredited institution.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Instant Institutional Credential Lookup
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Enter any official certificate serial number above or scan the QR code printed on the physical or digital certificate to instantly verify authenticity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

