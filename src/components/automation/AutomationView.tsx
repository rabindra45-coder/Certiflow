import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileCheck,
  Send,
  Download,
  Eye,
  Archive,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Play,
  FileSignature,
  MessageSquare
} from 'lucide-react';
import {
  CertificateTemplate,
  RecipientRow,
  FieldMappingConfig,
  GeneratedCertificateRecord,
  EmailCampaign,
  SignatureConfig
} from '../../types';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { FieldMapper } from './FieldMapper';
import { EmailCampaignModal } from './EmailCampaignModal';
import { WhatsAppCampaignModal } from './WhatsAppCampaignModal';
import { CertificateCanvas } from '../maker/CertificateCanvas';
import { TemplateSignatureSelector } from './TemplateSignatureSelector';
import {
  parseSpreadsheetFile,
  autoDetectFieldMappings,
  applyMappingsToRows,
  validateRecipients,
  downloadSampleCsv
} from '../../lib/csvHelper';
import {
  generateCertificateId,
  generateQrCodeDataUrl,
  exportCertificateAsPdf,
  exportCertificateAsPng,
  exportSinglePdfBlob,
  createBulkCertificatesZip,
  buildRecipientDataContext
} from '../../lib/certificateGenerator';
import {
  INITIAL_SAMPLE_RECIPIENTS,
  StorageService
} from '../../lib/storage';
import { generateAndDownloadCertificatesZip } from '../../lib/bulkPdfExport';

interface AutomationViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToCertificates: () => void;
}

export const AutomationView: React.FC<AutomationViewProps> = ({
  onShowToast,
  onNavigateToCertificates
}) => {
  // Step in workflow: 1: Select Template, 2: Import Data, 3: Map Fields, 4: Validate, 5: Preview, 6: Generate, 7: Review & Download
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Available templates
  const [templates, setTemplates] = useState<CertificateTemplate[]>(() => StorageService.getTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => templates[0]?.id || '');

  // Uploaded dataset
  const [rawColumns, setRawColumns] = useState<string[]>([
    'Student Name',
    'Email Address',
    'Course Name',
    'Department',
    'Batch',
    'Grade',
    'Score',
    'Student ID',
    'Issue Date'
  ]);
  const [recipients, setRecipients] = useState<RecipientRow[]>(() => INITIAL_SAMPLE_RECIPIENTS);
  const [fieldMappings, setFieldMappings] = useState<FieldMappingConfig[]>(() =>
    autoDetectFieldMappings(rawColumns)
  );

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(
    () => new Set(INITIAL_SAMPLE_RECIPIENTS.map((r) => r.id))
  );

  // Preview & Generation
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{
    completed: number;
    total: number;
    failed: number;
  }>({ completed: 0, total: 0, failed: 0 });

  const [generatedRecords, setGeneratedRecords] = useState<GeneratedCertificateRecord[]>([]);

  // Bulk ZIP generation state
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  // Distribution Email Modal
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLDivElement | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const activePreviewRecipient = recipients[previewIndex] || recipients[0];

  // Update preview QR code
  useEffect(() => {
    if (!selectedTemplate || !activePreviewRecipient) return;
    const certId = generateCertificateId(selectedTemplate, previewIndex);
    const verifyUrl = `${selectedTemplate.verification.verificationBaseUrl}?id=${certId}`;
    generateQrCodeDataUrl(verifyUrl).then((url) => {
      setPreviewQrDataUrl(url);
    });
  }, [selectedTemplate, previewIndex, activePreviewRecipient]);

  // Handle File Upload (Excel or CSV)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onShowToast('Parsing File', `Loading ${file.name}...`, 'info');
      const { columns, rows } = await parseSpreadsheetFile(file);
      if (rows.length === 0) {
        onShowToast('Empty File', 'The uploaded spreadsheet contains no records.', 'error');
        return;
      }

      setRawColumns(columns);
      const autoMappings = autoDetectFieldMappings(columns);
      setFieldMappings(autoMappings);

      const mappedRecipients = applyMappingsToRows(rows, autoMappings);
      const { validRows, invalidRows } = validateRecipients(mappedRecipients);
      const allRows = [...validRows, ...invalidRows];

      setRecipients(allRows);
      setSelectedRowIds(new Set(allRows.map((r) => r.id)));
      onShowToast('Import Successful', `Loaded ${allRows.length} recipients from ${file.name}.`, 'success');
      setCurrentStep(3); // Go to Map Fields
    } catch (err) {
      onShowToast('Import Failed', 'Unable to parse spreadsheet. Ensure valid Excel/CSV.', 'error');
    }
  };

  const handleLoadSampleData = () => {
    setRecipients(INITIAL_SAMPLE_RECIPIENTS);
    setSelectedRowIds(new Set(INITIAL_SAMPLE_RECIPIENTS.map((r) => r.id)));
    onShowToast('Sample Data Loaded', 'Populated 5 realistic university student records.', 'info');
    setCurrentStep(4);
  };

  const handleUpdateRow = (id: string, updatedData: Partial<RecipientRow>) => {
    const updated = recipients.map((r) => (r.id === id ? { ...r, ...updatedData } : r));
    const { validRows, invalidRows } = validateRecipients(updated);
    setRecipients([...validRows, ...invalidRows]);
  };

  const handleDeleteRow = (id: string) => {
    const updated = recipients.filter((r) => r.id !== id);
    setRecipients(updated);
    const newSelected = new Set(selectedRowIds);
    newSelected.delete(id);
    setSelectedRowIds(newSelected);
  };

  const handleToggleSelectRow = (id: string) => {
    const updated = new Set(selectedRowIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedRowIds(updated);
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === recipients.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(recipients.map((r) => r.id)));
    }
  };

  // Update signatures for active template (sourced exclusively from Signature Management)
  const handleUpdateTemplateSignatures = (newSignatures: SignatureConfig[]) => {
    if (!selectedTemplate) return;
    const updatedTemplate: CertificateTemplate = {
      ...selectedTemplate,
      signatures: newSignatures
    };
    StorageService.saveTemplate(updatedTemplate);
    setTemplates((prev) => prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
  };

  const handleProceedFromStep1 = () => {
    if (!selectedTemplate) {
      onShowToast('Template Required', 'Please select a certificate template to proceed.', 'error');
      return;
    }
    if (!selectedTemplate.signatures || selectedTemplate.signatures.length === 0) {
      onShowToast(
        'Signatory Notice',
        'We recommend selecting at least 1 authorized signatory from Signature Management to stamp on the certificates.',
        'info'
      );
    }
    setCurrentStep(2);
  };

  // Run Bulk Certificate Generation
  const handleStartBulkGeneration = async () => {
    if (!selectedTemplate) return;

    const targetRecipients = recipients.filter((r) => selectedRowIds.has(r.id));
    if (targetRecipients.length === 0) {
      onShowToast('No Recipients Selected', 'Select at least one recipient row to generate certificates.', 'error');
      return;
    }

    setIsGenerating(true);
    setCurrentStep(6); // Generation progress step
    setGenerationProgress({ completed: 0, total: targetRecipients.length, failed: 0 });

    const newRecords: GeneratedCertificateRecord[] = [];

    // Process certificates
    for (let i = 0; i < targetRecipients.length; i++) {
      const rec = targetRecipients[i];
      const certId = rec.certificateId || generateCertificateId(selectedTemplate, i);
      rec.certificateId = certId;
      rec.status = 'generated';
      const verifyUrl = `${selectedTemplate.verification.verificationBaseUrl}?id=${certId}`;

      // Simulate generation step
      await new Promise((resolve) => setTimeout(resolve, 300));

      const record: GeneratedCertificateRecord = {
        id: `gen-${Date.now()}-${i}`,
        certificateId: certId,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        recipientName: rec.recipientName,
        recipientEmail: rec.email,
        courseName: rec.courseName,
        institutionName: selectedTemplate.institution.name,
        certificateType: selectedTemplate.certificateType,
        issueDate: rec.issueDate || new Date().toLocaleDateString(),
        verificationUrl: verifyUrl,
        generatedAt: new Date().toISOString(),
        emailStatus: 'not_sent',
        metadata: {
          grade: rec.grade,
          batch: rec.batch,
          department: rec.department,
          studentId: rec.studentId
        }
      };

      newRecords.push(record);
      setGenerationProgress({
        completed: i + 1,
        total: targetRecipients.length,
        failed: 0
      });
    }

    // Save to storage
    StorageService.addGeneratedCertificates(newRecords);
    
    // Update recipient records in state so certificateId is preserved across email modal & downloads
    setRecipients((prev) =>
      prev.map((r) => {
        const found = newRecords.find(
          (nr) =>
            (nr.recipientEmail && r.email && nr.recipientEmail.toLowerCase() === r.email.toLowerCase()) ||
            nr.recipientName.toLowerCase() === r.recipientName.toLowerCase()
        );
        if (found) {
          return { ...r, certificateId: found.certificateId, status: 'generated' };
        }
        return r;
      })
    );

    // Update the template's starting number for next batch and sync in-memory templates
    const updatedTemplate = {
      ...selectedTemplate,
      verification: {
        ...selectedTemplate.verification,
        startingNumber: (selectedTemplate.verification?.startingNumber || 1001) + targetRecipients.length
      }
    };
    StorageService.saveTemplate(updatedTemplate);
    setTemplates((prev) => prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
    
    setGeneratedRecords(newRecords);
    setIsGenerating(false);
    setCurrentStep(7); // Review & Download
    onShowToast(
      'Bulk Generation Complete',
      `Successfully generated ${newRecords.length} institutional certificates.`,
      'success'
    );
  };

  // Bulk ZIP Download
  const handleDownloadZip = async () => {
    let targetRecipients = recipients.filter((r) => selectedRowIds.has(r.id));
    if (targetRecipients.length === 0) {
      targetRecipients = recipients.length > 0 ? recipients : INITIAL_SAMPLE_RECIPIENTS;
    }

    if (targetRecipients.length === 0) {
      onShowToast('No Recipients Available', 'Please upload or add recipient data first.', 'error');
      return;
    }

    setIsZipping(true);
    setZipProgress({ current: 0, total: targetRecipients.length, name: targetRecipients[0]?.recipientName || '' });

    try {
      onShowToast(
        'Packaging ZIP Archive',
        `Generating ${targetRecipients.length} personalized PDF certificates and assembling archive...`,
        'info'
      );

      const count = await generateAndDownloadCertificatesZip(
        selectedTemplate,
        targetRecipients,
        (current, total, name) => {
          setZipProgress({ current, total, name });
        }
      );

      onShowToast(
        'ZIP Download Complete',
        `Successfully generated and packaged ${count} official certificates.`,
        'success'
      );
    } catch (err: any) {
      console.error('ZIP generation error', err);
      onShowToast('ZIP Generation Failed', err?.message || 'Could not assemble certificate archive.', 'error');
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  // Step names
  const steps = [
    { num: 1, label: 'Select Template' },
    { num: 2, label: 'Import Data' },
    { num: 3, label: 'Map Fields' },
    { num: 4, label: 'Validate Data' },
    { num: 5, label: 'Live Preview' },
    { num: 6, label: 'Generate' },
    { num: 7, label: 'Review & Distribute' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Automation Top Workflow Bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                TAB 2
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Certificate Automation & Bulk Issuance Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generate, personalize, and distribute hundreds or thousands of institutional certificates in bulk.
            </p>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {steps.map((s) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => isPast && setCurrentStep(s.num)}
                  disabled={!isPast && !isActive}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isPast
                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[10px]">
                    {isPast ? '✓' : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workflow Body */}
      <div className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
        {/* STEP 1: SELECT TEMPLATE */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 1: Choose Saved Certificate Template
                </h3>
                <p className="text-xs text-slate-500">
                  Pick the verified institutional template to merge with recipient dataset.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 shadow-md dark:border-indigo-500 dark:bg-indigo-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {tpl.certificateType}
                    </span>
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        selectedTemplateId === tpl.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      }`}
                    >
                      {selectedTemplateId === tpl.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tpl.name}</h4>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{tpl.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 dark:border-slate-800">
                    <span>{tpl.institution.shortName || tpl.institution.name}</span>
                    <span>{tpl.signatures.length} Signatories</span>
                  </div>
                </div>
              ))}
            </div>

            {/* STEP 1B: CONFIGURE SIGNATURES FROM SIGNATURE MANAGEMENT */}
            {selectedTemplate && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Authorized Signatories Configuration</span>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                        For: {selectedTemplate.name}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select authorized signatories from your institutional Signature Management vault to be stamped on this certificate batch.
                    </p>
                  </div>
                </div>

                <TemplateSignatureSelector
                  selectedSignatures={selectedTemplate.signatures || []}
                  onUpdateSignatures={handleUpdateTemplateSignatures}
                  onNotify={onShowToast}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Selected Template:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedTemplate?.name}</span>
                <span>•</span>
                <span>{selectedTemplate?.signatures?.length || 0} Signatories Configured</span>
              </div>

              <button
                onClick={handleProceedFromStep1}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                Proceed to Data Import
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: IMPORT DATA */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 2: Import Recipient Data Spreadsheet
              </h3>
              <p className="text-xs text-slate-500">
                Upload your college or institute Excel (.xlsx, .xls) or CSV file with candidate information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Drag-and-drop / file selector box */}
              <div className="lg:col-span-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900 flex flex-col items-center justify-center hover:border-indigo-500 transition-colors">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-4">
                  <Upload className="h-7 w-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Upload Excel or CSV Recipient Roster
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Drag and drop your recipient spreadsheet here, or browse files from your computer. Supports .xlsx, .xls, and .csv.
                </p>

                <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700">
                  <FileSpreadsheet className="h-4 w-4" />
                  Select File from Computer
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Quick sample option */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Fast Institutional Trial</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Need instant test data?
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Load pre-configured sample recipients (Sophia Montgomery, Alexander Chen, Amina Al-Mansoor) with grades, distinctions, and student IDs.
                  </p>
                </div>

                <div className="space-y-2 mt-6">
                  <button
                    onClick={handleLoadSampleData}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Load 5 Sample Recipients
                  </button>

                  <button
                    onClick={downloadSampleCsv}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Sample CSV Template
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Template
              </button>
              {recipients.length > 0 && (
                <button
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  Configure Field Mappings
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: MAP FIELDS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <FieldMapper
              sourceColumns={rawColumns}
              mappings={fieldMappings}
              onChangeMapping={(target, newSource) => {
                const updated = fieldMappings.map((m) =>
                  m.targetField === target ? { ...m, sourceColumn: newSource } : m
                );
                setFieldMappings(updated);
                const remapped = applyMappingsToRows(recipients, updated);
                setRecipients(remapped);
              }}
              onAutoMap={() => {
                const detected = autoDetectFieldMappings(rawColumns);
                setFieldMappings(detected);
                const remapped = applyMappingsToRows(recipients, detected);
                setRecipients(remapped);
                onShowToast('Auto-Mapped', 'Columns matched automatically based on headers.', 'success');
              }}
            />

            <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                Validate Spreadsheet Data
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: VALIDATE DATA (Spreadsheet Interface) */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 4: Recipient Roster & Data Validation
              </h3>
              <p className="text-xs text-slate-500">
                Review recipient entries, detect missing information or duplicate emails, and edit rows inline.
              </p>
            </div>

            <SpreadsheetGrid
              rows={recipients}
              onUpdateRow={handleUpdateRow}
              onDeleteRow={handleDeleteRow}
              selectedRowIds={selectedRowIds}
              onToggleSelectRow={handleToggleSelectRow}
              onToggleSelectAll={handleToggleSelectAll}
              onDownloadSampleCsv={downloadSampleCsv}
            />

            <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Mappings
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                disabled={selectedRowIds.size === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Preview Certificates ({selectedRowIds.size})
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PREVIEW CERTIFICATES WITH LIVE DATA */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 5: Live Recipient Certificate Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Cycle through recipients to inspect text wrapping, dynamic dates, and QR code placement.
                </p>
              </div>

              {/* Recipient Navigator */}
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
                  disabled={previewIndex === 0}
                  className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Recipient {previewIndex + 1} of {recipients.length}
                </span>
                <button
                  onClick={() => setPreviewIndex((p) => Math.min(recipients.length - 1, p + 1))}
                  disabled={previewIndex >= recipients.length - 1}
                  className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Signatories on this batch banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <FileSignature className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Affixed Signatures ({selectedTemplate.signatures?.length || 0}):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedTemplate.signatures && selectedTemplate.signatures.length > 0 ? (
                    selectedTemplate.signatures.map((sig, idx) => (
                      <span
                        key={sig.id || idx}
                        className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300"
                      >
                        {sig.name} ({sig.designation})
                      </span>
                    ))
                  ) : (
                    <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                      No signatures assigned
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
              >
                Configure Signatories
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Canvas Preview Container */}
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-200/50 p-8 overflow-auto dark:border-slate-800 dark:bg-slate-950">
              <CertificateCanvas
                template={selectedTemplate}
                recipientContext={{
                  ...activePreviewRecipient,
                  qrDataUrl: previewQrDataUrl
                }}
                scale={0.8}
                interactive={false}
                forwardRef={previewCanvasRef}
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Spreadsheet
              </button>
              <button
                onClick={handleStartBulkGeneration}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
              >
                <Play className="h-4 w-4 fill-white" />
                Generate {selectedRowIds.size} Certificates Now
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: BULK GENERATION IN PROGRESS */}
        {currentStep === 6 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 max-w-xl mx-auto space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Generating Institutional Credentials
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Interpolating dynamic candidate data, creating tamper-evident certificate IDs, generating QR codes, and rendering printable vector pages.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">
                  Processed: {generationProgress.completed} / {generationProgress.total}
                </span>
                <span className="text-indigo-600 font-mono">
                  {Math.round((generationProgress.completed / Math.max(1, generationProgress.total)) * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{
                    width: `${(generationProgress.completed / Math.max(1, generationProgress.total)) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW, DOWNLOAD & DISTRIBUTE */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 dark:border-emerald-900 dark:bg-emerald-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                    {generatedRecords.length} Certificates Successfully Generated
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    All records are registered in the verification repository and ready for packaging or immediate email dispatch.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 transition-all"
                >
                  {isZipping ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  <span>
                    {isZipping && zipProgress
                      ? `Archiving ${zipProgress.current}/${zipProgress.total}...`
                      : 'Download Bulk ZIP Archive'}
                  </span>
                </button>

                <button
                  onClick={() => setEmailModalOpen(true)}
                  disabled={isZipping}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-60 transition-all"
                >
                  <Send className="h-4 w-4" />
                  Email Campaign
                </button>

                <button
                  onClick={() => setWhatsappModalOpen(true)}
                  disabled={isZipping}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 disabled:opacity-60 transition-all"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp Campaign
                </button>
              </div>
            </div>

            {/* Generated Items Table Preview */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 font-bold text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                Generated Credentials Register
              </div>
              <div className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {generatedRecords.slice(0, 5).map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between p-3.5">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{rec.recipientName}</span>
                      <span className="ml-2 text-slate-500 font-mono text-[11px]">{rec.certificateId}</span>
                      <p className="text-[11px] text-slate-500">{rec.courseName} • {rec.metadata?.grade || 'Pass'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Generated
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Spreadsheet
              </button>
              <button
                onClick={onNavigateToCertificates}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
              >
                <FileCheck className="h-4 w-4" />
                View in Certificate Library
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email Campaign Modal */}
      {emailModalOpen && (
        <EmailCampaignModal
          template={selectedTemplate}
          recipients={
            recipients.filter((r) => selectedRowIds.has(r.id)).length > 0
              ? recipients.filter((r) => selectedRowIds.has(r.id))
              : recipients.length > 0
              ? recipients
              : INITIAL_SAMPLE_RECIPIENTS
          }
          onClose={() => setEmailModalOpen(false)}
          onCampaignComplete={(cmp) => {
            setEmailModalOpen(false);
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* WhatsApp Campaign Modal */}
      {whatsappModalOpen && (
        <WhatsAppCampaignModal
          isOpen={whatsappModalOpen}
          certificates={generatedRecords}
          onClose={() => setWhatsappModalOpen(false)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
