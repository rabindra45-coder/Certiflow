import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Clock,
  Trash2,
  Copy,
  Award,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { GeneratedCertificateRecord, RecipientRow } from '../../types';
import { StorageService } from '../../lib/storage';
import { renderRecipientToPdfBlob } from '../../lib/bulkPdfExport';

interface CertificateLibraryViewProps {
  onVerifyCert: (certId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CertificateLibraryView: React.FC<CertificateLibraryViewProps> = ({
  onVerifyCert,
  onShowToast
}) => {
  const [certificates, setCertificates] = useState<GeneratedCertificateRecord[]>(() =>
    StorageService.getGeneratedCertificates()
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  const uniqueCourses = useMemo(() => {
    const set = new Set<string>();
    certificates.forEach((c) => {
      if (c.courseName) set.add(c.courseName);
    });
    return Array.from(set);
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      if (courseFilter !== 'all' && c.courseName !== courseFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        c.recipientName.toLowerCase().includes(q) ||
        c.certificateId.toLowerCase().includes(q) ||
        c.recipientEmail.toLowerCase().includes(q) ||
        c.courseName.toLowerCase().includes(q)
      );
    });
  }, [certificates, searchTerm, courseFilter]);

  const handleCopyLink = (certId: string) => {
    const url = `${window.location.origin}/#verify?id=${certId}`;
    navigator.clipboard.writeText(url);
    onShowToast('Link Copied', `Public verification link copied to clipboard.`, 'success');
  };

  const handleDeleteCertificate = (id: string) => {
    const updated = certificates.filter((c) => c.id !== id);
    setCertificates(updated);
    StorageService.deleteGeneratedCertificate(id);
    onShowToast('Certificate Deleted', 'Removed from institutional ledger.', 'info');
  };

  const handleDownloadPdf = async (cert: GeneratedCertificateRecord) => {
    try {
      setDownloadingCertId(cert.id);
      const templates = StorageService.getTemplates();
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
      onShowToast('PDF Downloaded', `Official PDF for ${cert.recipientName} exported.`, 'success');
    } catch (err: any) {
      console.error('PDF download error:', err);
      onShowToast('Download Failed', err?.message || 'Could not export certificate PDF', 'error');
    } finally {
      setDownloadingCertId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Institutional Certificate Registry
            </h2>
            <p className="text-xs text-slate-500">
              Complete archive of {certificates.length} issued credentials with tamper-proof verification records.
            </p>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by recipient name, email, or Certificate ID..."
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Courses / Qualifications</option>
              {uniqueCourses.map((crs) => (
                <option key={crs} value={crs}>
                  {crs}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Certificates Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <th className="p-3.5">Recipient & Credential ID</th>
                <th className="p-3.5">Course / Qualification</th>
                <th className="p-3.5">Issued Date</th>
                <th className="p-3.5">Grade / Performance</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCertificates.length > 0 ? (
                filteredCertificates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{c.recipientName}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>{c.certificateId}</span>
                        <span>•</span>
                        <span>{c.recipientEmail}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      <div>{c.courseName}</div>
                      <span className="text-[10px] text-indigo-600 font-semibold dark:text-indigo-400">
                        {c.certificateType}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-500 dark:text-slate-400">
                      {c.issueDate}
                    </td>

                    <td className="p-3.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {c.metadata?.grade || 'Pass'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Verified</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadPdf(c)}
                          disabled={downloadingCertId === c.id}
                          title="Download high-resolution official PDF"
                          className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50/50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                        >
                          {downloadingCertId === c.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                          ) : (
                            <Download className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          )}
                          PDF
                        </button>
                        <button
                          onClick={() => handleCopyLink(c.certificateId)}
                          title="Copy public verification URL"
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onVerifyCert(c.certificateId)}
                          title="Verify in verification portal"
                          className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleDeleteCertificate(c.id)}
                          title="Delete certificate"
                          className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Award className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    No certificate records match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
