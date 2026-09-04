import React, { useState } from 'react';
import {
  Building2,
  Award,
  FileText,
  Users,
  PenTool,
  Stamp,
  ShieldCheck,
  Palette,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Upload,
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react';
import {
  CertificateTemplate,
  CertificateType,
  InstitutionDetails,
  SignatureConfig,
  StampConfig,
  VerificationConfig,
  CanvasElement
} from '../../types';
import { DEFAULT_INSTITUTION, StorageService } from '../../lib/storage';

interface SetupWizardProps {
  onComplete: (template: CertificateTemplate) => void;
  onCancel: () => void;
}

const CERTIFICATE_TYPES: CertificateType[] = [
  'Certificate of Completion',
  'Certificate of Participation',
  'Certificate of Achievement',
  'Certificate of Excellence',
  'Internship Certificate',
  'Training Certificate',
  'Workshop Certificate',
  'Course Certificate',
  'Appreciation Certificate',
  'Award Certificate',
  'Employment/Experience Certificate',
  'Volunteer Certificate',
  'Custom Certificate'
];

const STYLE_PRESETS = [
  {
    id: 'academic',
    name: 'Academic & University Honors',
    desc: 'Regal gold border, dual signatures, official academic seal, and formal serif typography.',
    category: 'Academic',
    borderColor: '#b8860b',
    borderPreset: 'classic-gold',
    fontTitle: 'Cinzel',
    fontBody: 'Cormorant Garamond'
  },
  {
    id: 'modern',
    name: 'Modern Tech & Cloud Engineering',
    desc: 'Vibrant indigo and cyan geometry, high-contrast sans-serif, and prominent QR verification.',
    category: 'Modern',
    borderColor: '#4f46e5',
    borderPreset: 'geometric-tech',
    fontTitle: 'Montserrat',
    fontBody: 'Montserrat'
  },
  {
    id: 'corporate',
    name: 'Corporate Executive & Internship',
    desc: 'Deep emerald teal double border, distinguished leadership signatories, and clean layout.',
    category: 'Corporate',
    borderColor: '#0f766e',
    borderPreset: 'double-academic',
    fontTitle: 'Playfair Display',
    fontBody: 'Cormorant Garamond'
  },
  {
    id: 'luxury',
    name: 'Black & Gold Luxury Masterclass',
    desc: 'Sophisticated dark slate canvas with polished gold frame and script calligraphy signatures.',
    category: 'Luxury',
    borderColor: '#d4af37',
    borderPreset: 'ornate-royal',
    fontTitle: 'Playfair Display',
    fontBody: 'Playfair Display'
  },
  {
    id: 'minimal',
    name: 'Minimalist Contemporary Studio',
    desc: 'Ultra-clean razor border, generous negative space, refined modern editorial aesthetic.',
    category: 'Minimal',
    borderColor: '#334155',
    borderPreset: 'modern-minimal',
    fontTitle: 'Montserrat',
    fontBody: 'Montserrat'
  }
];

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Institution Info
  const [institution, setInstitution] = useState<InstitutionDetails>(() => StorageService.getInstitution());

  // Step 2: Certificate Type
  const [certType, setCertType] = useState<CertificateType>('Certificate of Excellence');
  const [customCertType, setCustomCertType] = useState<string>('');

  // Step 3: Certificate Content
  const [title, setTitle] = useState<string>('CERTIFICATE OF EXCELLENCE');
  const [subtitle, setSubtitle] = useState<string>('FACULTY OF ADVANCED COMPUTING & RESEARCH');
  const [introText, setIntroText] = useState<string>('THIS HONOR IS PROUDLY CONFERRED UPON');
  const [bodyText, setBodyText] = useState<string>(
    'for outstanding academic distinction and exceptional performance in {{courseName}}, achieving Grade {{grade}} in Batch {{batch}}.'
  );
  const [issueDateText, setIssueDateText] = useState<string>('Given on this day {{issueDate}}');
  const [customFields, setCustomFields] = useState<string[]>(['grade', 'batch', 'department']);

  // Step 4: Recipient Fields
  const [recipientFields, setRecipientFields] = useState([
    { key: 'recipientName', label: 'Full Recipient Name', required: true, visible: true },
    { key: 'email', label: 'Email Address', required: true, visible: true },
    { key: 'courseName', label: 'Course / Program Name', required: true, visible: true },
    { key: 'department', label: 'Department / Faculty', required: false, visible: true },
    { key: 'batch', label: 'Batch / Cohort', required: false, visible: true },
    { key: 'grade', label: 'Grade / Score', required: false, visible: true },
    { key: 'studentId', label: 'Student / Employee ID', required: false, visible: true }
  ]);

  // Step 5: Signatures
  const [numSignatures, setNumSignatures] = useState<number>(2);
  const [signatures, setSignatures] = useState<SignatureConfig[]>([
    {
      id: 'sig-1',
      name: 'Dr. Arthur Sterling, Ph.D.',
      designation: 'Dean of Academic Affairs',
      department: 'Academic Senate',
      signatureStyle: 'script-1',
      required: true,
      x: 20,
      y: 84
    },
    {
      id: 'sig-2',
      name: 'Prof. Eleanor Vance, M.Sc.',
      designation: 'Vice Chancellor & President',
      department: 'Office of the Provost',
      signatureStyle: 'script-2',
      required: true,
      x: 80,
      y: 84
    }
  ]);

  // Step 6: Stamp & Verification
  const [hasStamp, setHasStamp] = useState<boolean>(true);
  const [stampConfig, setStampConfig] = useState<StampConfig>({
    enabled: true,
    type: 'seal',
    label: 'OFFICIAL UNIVERSITY SEAL',
    opacity: 0.9,
    rotation: -5,
    scale: 1,
    x: 50,
    y: 83
  });

  const [verificationConfig, setVerificationConfig] = useState<VerificationConfig>({
    enabled: true,
    method: 'qr_and_id',
    prefix: 'CERT',
    year: '2026',
    startingNumber: 1001,
    numberLength: 6,
    verificationBaseUrl: window?.location ? `${window.location.origin}/#verify` : 'https://certiflow.app/#verify'
  });

  // Step 7: Design Preset
  const [selectedPreset, setSelectedPreset] = useState<string>('academic');
  const [templateName, setTemplateName] = useState<string>('Institutional Certificate Template');

  const handleUseSavedProfile = () => {
    const saved = StorageService.getInstitution();
    setInstitution(saved);
  };

  const handleSignatureCountChange = (count: number) => {
    setNumSignatures(count);
    const newSigs: SignatureConfig[] = [];
    const positions = count === 1 ? [50] : count === 2 ? [25, 75] : count === 3 ? [20, 50, 80] : [15, 38, 62, 85];

    for (let i = 0; i < count; i++) {
      newSigs.push({
        id: `sig-${i + 1}`,
        name: signatures[i]?.name || (i === 0 ? 'Dr. John Smith' : `Signatory ${i + 1}`),
        designation: signatures[i]?.designation || (i === 0 ? 'Principal / Dean' : 'Director / Registrar'),
        department: signatures[i]?.department || 'Executive Office',
        signatureStyle: (i % 3 === 0 ? 'script-1' : i % 3 === 1 ? 'script-2' : 'script-3') as any,
        required: true,
        x: positions[i] || 50,
        y: 84
      });
    }
    setSignatures(newSigs);
  };

  const handleFinishWizard = () => {
    const preset = STYLE_PRESETS.find(p => p.id === selectedPreset) || STYLE_PRESETS[0];

    const elements: CanvasElement[] = [
      {
        id: 'el-inst-name',
        type: 'institutionName',
        content: '{{institutionName}}',
        x: 50,
        y: 16,
        width: 80,
        height: 6,
        fontFamily: preset.fontTitle,
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 3,
        textAlign: 'center',
        color: '#1e293b',
        zIndex: 10
      },
      {
        id: 'el-sub-title',
        type: 'text',
        content: subtitle,
        x: 50,
        y: 22,
        width: 80,
        height: 5,
        fontFamily: preset.fontBody,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 2,
        textAlign: 'center',
        color: preset.borderColor,
        zIndex: 10
      },
      {
        id: 'el-div',
        type: 'divider',
        content: '',
        x: 50,
        y: 26,
        width: 35,
        height: 1,
        borderColor: preset.borderColor,
        borderWidth: 1,
        zIndex: 10
      },
      {
        id: 'el-cert-heading',
        type: 'heading',
        content: title,
        x: 50,
        y: 33,
        width: 85,
        height: 9,
        fontFamily: preset.fontTitle,
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: 3,
        textAlign: 'center',
        color: '#0f172a',
        zIndex: 10
      },
      {
        id: 'el-intro',
        type: 'text',
        content: introText,
        x: 50,
        y: 41,
        width: 70,
        height: 5,
        fontFamily: preset.fontBody,
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 2,
        textAlign: 'center',
        color: '#64748b',
        zIndex: 10
      },
      {
        id: 'el-recip-name',
        type: 'recipientName',
        content: '{{recipientName}}',
        x: 50,
        y: 50,
        width: 80,
        height: 12,
        fontFamily: 'Playfair Display',
        fontSize: 38,
        fontWeight: '700',
        fontStyle: 'italic',
        textAlign: 'center',
        color: '#1e3a8a',
        zIndex: 10
      },
      {
        id: 'el-body',
        type: 'text',
        content: bodyText,
        x: 50,
        y: 62,
        width: 76,
        height: 12,
        fontFamily: preset.fontBody,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 1.5,
        color: '#334155',
        zIndex: 10
      },
      {
        id: 'el-date',
        type: 'date',
        content: issueDateText,
        x: 50,
        y: 72,
        width: 50,
        height: 6,
        fontFamily: 'Montserrat',
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 1,
        color: '#64748b',
        zIndex: 10
      },
      {
        id: 'el-id-footer',
        type: 'certificateId',
        content: 'Certificate ID: {{certificateId}}',
        x: 18,
        y: 93,
        width: 35,
        height: 5,
        fontFamily: 'Montserrat',
        fontSize: 9,
        fontWeight: '500',
        textAlign: 'left',
        color: '#94a3b8',
        zIndex: 10
      },
      {
        id: 'el-qr-footer',
        type: 'qrCode',
        content: '{{verificationUrl}}',
        x: 91,
        y: 90,
        width: 14,
        height: 14,
        zIndex: 10
      }
    ];

    const template: CertificateTemplate = {
      id: `tpl-${Date.now()}`,
      name: templateName || `${certType} Template`,
      description: `Institutional template created via CertiFlow Setup Wizard for ${institution.name}`,
      certificateType: certType === 'Custom Certificate' && customCertType ? (customCertType as any) : certType,
      pageSize: 'a4-landscape',
      widthMm: 297,
      heightMm: 210,
      orientation: 'landscape',
      backgroundColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg, #fffdf8 0%, #fbf8f0 100%)',
      backgroundPattern: preset.id === 'modern' ? 'dots' : preset.id === 'academic' ? 'guilloche' : 'none',
      border: {
        preset: preset.borderPreset as any,
        color: preset.borderColor,
        secondaryColor: '#1e293b',
        thickness: 5,
        padding: 16,
        cornerRadius: 6,
        cornerDecoration: true
      },
      institution,
      signatures,
      stamp: {
        ...stampConfig,
        enabled: hasStamp
      },
      verification: verificationConfig,
      elements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    onComplete(template);
  };

  const steps = [
    { num: 1, label: 'Institution', icon: Building2 },
    { num: 2, label: 'Certificate Type', icon: Award },
    { num: 3, label: 'Content', icon: FileText },
    { num: 4, label: 'Recipients', icon: Users },
    { num: 5, label: 'Signatures', icon: PenTool },
    { num: 6, label: 'Seal & Verify', icon: Stamp },
    { num: 7, label: 'Design Style', icon: Palette }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Wizard Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          Intelligent Certificate Setup Wizard
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Create Institutional Certificate Template
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure institutional credentials, signatories, security verification, and dynamic fields in 7 guided steps.
        </p>
      </div>

      {/* Step Progress Tracker */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[640px] border-b border-slate-200 pb-4 dark:border-slate-800">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => isCompleted && setCurrentStep(s.num)}
                disabled={!isCompleted && !isCurrent}
                className={`flex items-center gap-2.5 transition-colors ${
                  isCurrent
                    ? 'text-indigo-600 font-bold dark:text-indigo-400'
                    : isCompleted
                    ? 'text-slate-700 hover:text-indigo-600 dark:text-slate-300'
                    : 'text-slate-400 cursor-not-allowed dark:text-slate-600'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-xs font-medium whitespace-nowrap">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        {/* STEP 1: INSTITUTION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Step 1: Institutional Identity & Authority
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the issuing university, college, school, institute, or corporate entity.
                </p>
              </div>
              <button
                type="button"
                onClick={handleUseSavedProfile}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Use Saved Institution Profile
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Institution Full Name *
                </label>
                <input
                  type="text"
                  value={institution.name}
                  onChange={(e) => setInstitution({ ...institution, name: e.target.value })}
                  placeholder="e.g. Stanford Global Research Academy"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Short Name / Acronym
                </label>
                <input
                  type="text"
                  value={institution.shortName}
                  onChange={(e) => setInstitution({ ...institution, shortName: e.target.value })}
                  placeholder="e.g. SGRA"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Organization Type
                </label>
                <select
                  value={institution.orgType}
                  onChange={(e) => setInstitution({ ...institution, orgType: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option>Higher Education / University</option>
                  <option>College / Institute</option>
                  <option>School / Academy</option>
                  <option>Vocational / Training Center</option>
                  <option>Corporate Enterprise</option>
                  <option>NGO / Non-Profit</option>
                  <option>Conference / Event Organizer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Department / Faculty
                </label>
                <input
                  type="text"
                  value={institution.department}
                  onChange={(e) => setInstitution({ ...institution, department: e.target.value })}
                  placeholder="e.g. Faculty of Engineering"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Campus
                </label>
                <input
                  type="text"
                  value={institution.campus}
                  onChange={(e) => setInstitution({ ...institution, campus: e.target.value })}
                  placeholder="e.g. Main Research Campus"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={institution.tagline}
                  onChange={(e) => setInstitution({ ...institution, tagline: e.target.value })}
                  placeholder="e.g. Excellence in Scholarship, Leadership, and Innovation"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Official Website
                </label>
                <input
                  type="url"
                  value={institution.website}
                  onChange={(e) => setInstitution({ ...institution, website: e.target.value })}
                  placeholder="https://institution.edu"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Accreditation / Registration Notice
                </label>
                <input
                  type="text"
                  value={institution.accreditation}
                  onChange={(e) => setInstitution({ ...institution, accreditation: e.target.value })}
                  placeholder="e.g. Accredited by the Global Higher Education Commission • ISO 9001:2015 Certified"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CERTIFICATE TYPE */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 2: Select Certificate Type
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the institutional purpose and formal classification for this certificate.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CERTIFICATE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCertType(type)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                    certType === type
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      certType === type
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-700'
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{type}</span>
                  </div>
                </button>
              ))}
            </div>

            {certType === 'Custom Certificate' && (
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Custom Certificate Title / Designation *
                </label>
                <input
                  type="text"
                  value={customCertType}
                  onChange={(e) => setCustomCertType(e.target.value)}
                  placeholder="e.g. Fellowship in Advanced Genomic Medicine"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 3: CONTENT */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 3: Certificate Text & Dynamic Variables
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize certificate wording. Dynamic variables in curly braces like{' '}
                <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                  {'{{recipientName}}'}
                </code>{' '}
                will be replaced automatically during bulk generation.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Certificate Header Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Department / Subtitle
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Introduction Line
                </label>
                <input
                  type="text"
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Conferment Body Paragraph
                  </label>
                  <span className="text-[11px] text-slate-500">Supports dynamic placeholders</span>
                </div>
                <textarea
                  rows={3}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500">Click to insert:</span>
                  {[
                    '{{recipientName}}',
                    '{{courseName}}',
                    '{{grade}}',
                    '{{score}}',
                    '{{batch}}',
                    '{{department}}',
                    '{{studentId}}',
                    '{{issueDate}}'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBodyText((prev) => `${prev} ${chip}`)}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-indigo-700 hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-300"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Issue Date Line
                </label>
                <input
                  type="text"
                  value={issueDateText}
                  onChange={(e) => setIssueDateText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RECIPIENT FIELDS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 4: Recipient Data & Custom Fields
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define which fields are collected from spreadsheets and placed on certificates.
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              {recipientFields.map((field, idx) => (
                <div key={field.key} className="flex items-center justify-between p-3.5">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{field.label}</span>
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {`{{${field.key}}}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          const updated = [...recipientFields];
                          updated[idx].required = e.target.checked;
                          setRecipientFields(updated);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={field.visible}
                        onChange={(e) => {
                          const updated = [...recipientFields];
                          updated[idx].visible = e.target.checked;
                          setRecipientFields(updated);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Visible on Certificate
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: SIGNATURES */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 5: Signatures & Authorization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Specify official signatories (Principal, Dean, Director, Registrar).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Number of Authorized Signatures
              </label>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSignatureCountChange(count)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      numSignatures === count
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {count} {count === 1 ? 'Signature' : 'Signatures'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {signatures.map((sig, idx) => (
                <div
                  key={sig.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      Signatory {idx + 1}
                    </span>
                    <span className="text-[11px] text-slate-500">Authorized</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Signatory Full Name
                      </label>
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) => {
                          const updated = [...signatures];
                          updated[idx].name = e.target.value;
                          setSignatures(updated);
                        }}
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Official Designation / Title
                      </label>
                      <input
                        type="text"
                        value={sig.designation}
                        onChange={(e) => {
                          const updated = [...signatures];
                          updated[idx].designation = e.target.value;
                          setSignatures(updated);
                        }}
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Signature Calligraphy Style
                      </label>
                      <select
                        value={sig.signatureStyle}
                        onChange={(e) => {
                          const updated = [...signatures];
                          updated[idx].signatureStyle = e.target.value as any;
                          setSignatures(updated);
                        }}
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="script-1">Executive Script (Great Vibes)</option>
                        <option value="script-2">Formal Chancellor (Alex Brush)</option>
                        <option value="script-3">Classic Diplomatic (Pinyon Script)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: STAMP & VERIFICATION */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 6: Official Seal & Cryptographic Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Equip the certificate with official institutional stamps and instant QR verification.
              </p>
            </div>

            {/* Official Stamp Toggle */}
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Official Stamp / Embossed Seal
                  </h4>
                  <p className="text-xs text-slate-500">
                    Display an authenticated institutional wax seal or department stamp emblem.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasStamp}
                  onChange={(e) => setHasStamp(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              {hasStamp && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Seal Type
                    </label>
                    <select
                      value={stampConfig.type}
                      onChange={(e) => setStampConfig({ ...stampConfig, type: e.target.value as any })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="seal">Gold University Seal</option>
                      <option value="college">Crimson Institutional Seal</option>
                      <option value="digital">Cyan Digital Tech Seal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Seal Inscription Text
                    </label>
                    <input
                      type="text"
                      value={stampConfig.label}
                      onChange={(e) => setStampConfig({ ...stampConfig, label: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Verification Settings */}
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Public Verification & QR Code
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Each certificate receives a unique tamper-evident ID and QR code linking to the verification portal.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ID Prefix
                  </label>
                  <input
                    type="text"
                    value={verificationConfig.prefix}
                    onChange={(e) => setVerificationConfig({ ...verificationConfig, prefix: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Year / Cohort
                  </label>
                  <input
                    type="text"
                    value={verificationConfig.year}
                    onChange={(e) => setVerificationConfig({ ...verificationConfig, year: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Starting Number
                  </label>
                  <input
                    type="number"
                    value={verificationConfig.startingNumber}
                    onChange={(e) => setVerificationConfig({ ...verificationConfig, startingNumber: parseInt(e.target.value) || 1001 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Format Preview:{' '}
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {verificationConfig.prefix}-{verificationConfig.year}-
                  {String(verificationConfig.startingNumber).padStart(verificationConfig.numberLength, '0')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: DESIGN PRESET & LAUNCH */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 7: Choose Design Style Preset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select an initial aesthetic layout. You can customize every single element in the Visual Designer.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. 2026 Academic Honors Certificate"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                    selectedPreset === preset.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {preset.category}
                      </span>
                      <div
                        className="h-4 w-4 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: preset.borderColor }}
                      />
                    </div>
                    <h5 className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white">
                      {preset.name}
                    </h5>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {preset.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 dark:border-slate-800">
                    Fonts: {preset.fontTitle} + {preset.fontBody}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Step
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
          </div>

          <div>
            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishWizard}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
              >
                <Sparkles className="h-4 w-4" />
                Launch Visual Designer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
