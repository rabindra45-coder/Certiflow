import {
  CertificateTemplate,
  GeneratedCertificateRecord,
  EmailCampaign,
  WhatsAppCampaign,
  InstitutionDetails,
  RecipientRow,
  SmtpConfig,
  WhatsAppConfig,
  InstitutionalSignature,
  ThemeConfig
} from '../types';
import { DEFAULT_THEME_CONFIG } from './theme';

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromName: 'Academic Credentials Office',
  fromEmail: 'credentials@institution.edu',
  replyTo: 'support@institution.edu',
  ignoreTls: false,
  enabled: false
};

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  enabled: true,
  provider: 'web_direct',
  defaultTemplateMessage: `🎓 *Official Credential Notification*

Dear *{{recipientName}}*,

We are pleased to inform you that your official credential for *{{courseName}}* has been verified and issued by *{{institutionName}}*.

📋 *Credential Summary:*
• *Candidate:* {{recipientName}}
• *Program:* {{courseName}}
• *Credential ID:* {{certificateId}}
• *Date of Issue:* {{issueDate}}
• *Department:* {{department}}

🔗 *View & Verify Your Cryptographic Record:*
{{certificateUrl}}

🏛️ *Issued by Institutional Authority:*
*{{institutionName}}* ({{institutionShortName}})
{{accreditation}}
Official Registry: {{institutionWebsite}}
Contact: {{institutionPhone}} | {{institutionEmail}}`,
  institutionName: 'Global Institute of Science & Technology',
  status: 'configured'
};

export const DEFAULT_INSTITUTION: InstitutionDetails = {
  name: 'Global Institute of Science & Technology',
  shortName: 'GIST Academy',
  orgType: 'Higher Education / University',
  address: '450 Innovation Parkway, University District',
  city: 'San Francisco',
  state: 'California',
  country: 'United States',
  postalCode: '94107',
  phone: '+1 (415) 890-2100',
  email: 'credentials@gist.edu',
  website: 'https://gist.edu',
  department: 'Faculty of Computer Science & Engineering',
  campus: 'Main Research Campus',
  tagline: 'Excellence in Innovation, Scholarship, and Leadership',
  accreditation: 'Accredited by the Global Board of Higher Education (ABHE-2024)',
  primaryLogoUrl: '/logo.png',
  officialStampUrl: '',
  officialSealUrl: '',
  showLogoOnCertificate: true,
  logoPosition: 'top-center',
  logoWidthPercent: 14,
  watermarkOpacity: 0.08
};

export const INITIAL_SIGNATURES: InstitutionalSignature[] = [
  {
    id: 'sig-inst-1',
    name: 'Dr. Arthur Sterling, Ph.D.',
    designation: 'Dean of Academic Affairs',
    department: 'Academic Senate',
    signatureType: 'font',
    signatureStyle: 'script-1',
    isDefault: true,
    order: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sig-inst-2',
    name: 'Prof. Eleanor Vance, M.Sc.',
    designation: 'Vice Chancellor & President',
    department: 'Office of the Provost',
    signatureType: 'font',
    signatureStyle: 'script-2',
    isDefault: true,
    order: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sig-inst-3',
    name: 'Dr. Marcus Thorne',
    designation: 'Registrar & Controller of Examinations',
    department: 'Credential Evaluation Board',
    signatureType: 'font',
    signatureStyle: 'script-3',
    isDefault: false,
    order: 3,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'tpl-academic-excellence',
    name: 'Academic Excellence & Honors Award',
    description: 'Gold-framed formal diploma layout with classic typography, dual authorized signatories, and authentic gold institutional seal.',
    certificateType: 'Certificate of Excellence',
    pageSize: 'a4-landscape',
    widthMm: 297,
    heightMm: 210,
    orientation: 'landscape',
    backgroundColor: '#ffffff',
    backgroundGradient: 'linear-gradient(135deg, #fffdf8 0%, #fbf8f0 100%)',
    backgroundPattern: 'guilloche',
    border: {
      preset: 'classic-gold',
      color: '#b8860b',
      secondaryColor: '#1e293b',
      thickness: 6,
      padding: 16,
      cornerRadius: 4,
      cornerDecoration: true
    },
    institution: { ...DEFAULT_INSTITUTION },
    signatures: [
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
    ],
    stamp: {
      enabled: true,
      type: 'seal',
      label: 'OFFICIAL UNIVERSITY SEAL',
      opacity: 0.9,
      rotation: -5,
      scale: 1,
      x: 50,
      y: 83
    },
    verification: {
      enabled: true,
      method: 'qr_and_id',
      prefix: 'GIST-ACAD',
      year: '2026',
      startingNumber: 1001,
      numberLength: 6,
      verificationBaseUrl: window?.location ? `${window.location.origin}/#verify` : 'https://certiflow.app/#verify'
    },
    elements: [
      {
        id: 'el-org-name',
        type: 'institutionName',
        content: '{{institutionName}}',
        x: 50,
        y: 16,
        width: 80,
        height: 8,
        fontFamily: 'Cinzel',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 3,
        color: '#1e293b',
        zIndex: 10
      },
      {
        id: 'el-org-tag',
        type: 'text',
        content: 'FACULTY OF ADVANCED COMPUTING & RESEARCH • SAN FRANCISCO',
        x: 50,
        y: 22,
        width: 80,
        height: 5,
        fontFamily: 'Montserrat',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 2,
        color: '#b8860b',
        zIndex: 10
      },
      {
        id: 'el-divider-top',
        type: 'divider',
        content: '',
        x: 50,
        y: 26,
        width: 40,
        height: 1,
        borderColor: '#d4af37',
        borderWidth: 1,
        zIndex: 10
      },
      {
        id: 'el-cert-title',
        type: 'heading',
        content: 'CERTIFICATE OF EXCELLENCE',
        x: 50,
        y: 33,
        width: 85,
        height: 10,
        fontFamily: 'Cinzel',
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 4,
        color: '#0f172a',
        zIndex: 10
      },
      {
        id: 'el-intro-text',
        type: 'text',
        content: 'THIS HONOR IS PROUDLY CONFERRED UPON',
        x: 50,
        y: 41,
        width: 70,
        height: 5,
        fontFamily: 'Montserrat',
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 3,
        color: '#64748b',
        zIndex: 10
      },
      {
        id: 'el-recipient-name',
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
        id: 'el-line-name',
        type: 'line',
        content: '',
        x: 50,
        y: 56,
        width: 60,
        height: 1,
        borderColor: '#cbd5e1',
        borderWidth: 1,
        zIndex: 10
      },
      {
        id: 'el-body-text',
        type: 'text',
        content: 'for exceptional academic merit, pioneering research, and exemplary performance in {{courseName}}, attaining Grade {{grade}} in Batch {{batch}}.',
        x: 50,
        y: 63,
        width: 75,
        height: 12,
        fontFamily: 'Cormorant Garamond',
        fontSize: 18,
        fontWeight: '500',
        textAlign: 'center',
        color: '#334155',
        lineHeight: 1.5,
        zIndex: 10
      },
      {
        id: 'el-issue-date',
        type: 'date',
        content: 'Given on this day {{issueDate}}',
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
        id: 'el-cert-id',
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
        letterSpacing: 1,
        color: '#94a3b8',
        zIndex: 10
      },
      {
        id: 'el-qr',
        type: 'qrCode',
        content: '{{verificationUrl}}',
        x: 91,
        y: 90,
        width: 14,
        height: 14,
        zIndex: 10
      }
    ],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    version: 1,
    isFavorite: true
  },
  {
    id: 'tpl-tech-bootcamp',
    name: 'Advanced Technology & AI Bootcamp',
    description: 'Modern, crisp engineering and computer science certificate with indigo and emerald geometric styling, student ID, and instant verification QR.',
    certificateType: 'Certificate of Completion',
    pageSize: 'a4-landscape',
    widthMm: 297,
    heightMm: 210,
    orientation: 'landscape',
    backgroundColor: '#ffffff',
    backgroundGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    backgroundPattern: 'dots',
    border: {
      preset: 'geometric-tech',
      color: '#4f46e5',
      secondaryColor: '#0ea5e9',
      thickness: 4,
      padding: 14,
      cornerRadius: 8,
      cornerDecoration: true
    },
    institution: {
      ...DEFAULT_INSTITUTION,
      name: 'NextGen AI & Cloud Academy',
      tagline: 'Empowering Next-Generation Software Engineers'
    },
    signatures: [
      {
        id: 'sig-tech-1',
        name: 'David K. Mercer',
        designation: 'Director of Curriculum & Engineering',
        department: 'Tech Core',
        signatureStyle: 'script-3',
        required: true,
        x: 25,
        y: 85
      },
      {
        id: 'sig-tech-2',
        name: 'Dr. Sarah Lin',
        designation: 'Chief AI Architect',
        department: 'AI Labs',
        signatureStyle: 'script-1',
        required: true,
        x: 75,
        y: 85
      }
    ],
    stamp: {
      enabled: true,
      type: 'digital',
      label: 'VERIFIED TECH CREDENTIAL',
      opacity: 0.95,
      rotation: 0,
      scale: 0.95,
      x: 50,
      y: 83
    },
    verification: {
      enabled: true,
      method: 'qr_and_id',
      prefix: 'TECH-CERT',
      year: '2026',
      startingNumber: 2001,
      numberLength: 6,
      verificationBaseUrl: window?.location ? `${window.location.origin}/#verify` : 'https://certiflow.app/#verify'
    },
    elements: [
      {
        id: 'el-tb-logo-txt',
        type: 'institutionName',
        content: 'NEXTGEN AI & CLOUD ACADEMY',
        x: 50,
        y: 15,
        width: 80,
        height: 6,
        fontFamily: 'Montserrat',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 4,
        textAlign: 'center',
        color: '#4f46e5',
        zIndex: 10
      },
      {
        id: 'el-tb-badge',
        type: 'badge',
        content: 'PROFESSIONAL CERTIFICATION PROGRAM',
        x: 50,
        y: 22,
        width: 50,
        height: 5,
        fontFamily: 'Montserrat',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 2,
        textAlign: 'center',
        color: '#0284c7',
        zIndex: 10
      },
      {
        id: 'el-tb-title',
        type: 'heading',
        content: 'CERTIFICATE OF COMPLETION',
        x: 50,
        y: 31,
        width: 85,
        height: 8,
        fontFamily: 'Montserrat',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 2,
        textAlign: 'center',
        color: '#0f172a',
        zIndex: 10
      },
      {
        id: 'el-tb-intro',
        type: 'text',
        content: 'This is to certify that',
        x: 50,
        y: 39,
        width: 60,
        height: 5,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        color: '#64748b',
        zIndex: 10
      },
      {
        id: 'el-tb-name',
        type: 'recipientName',
        content: '{{recipientName}}',
        x: 50,
        y: 48,
        width: 80,
        height: 10,
        fontFamily: 'Playfair Display',
        fontSize: 36,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1e1b4b',
        zIndex: 10
      },
      {
        id: 'el-tb-body',
        type: 'text',
        content: 'has successfully completed the comprehensive professional program in {{courseName}} encompassing 240 hours of intensive engineering, achieving an overall score of {{score}} (Grade {{grade}}).',
        x: 50,
        y: 60,
        width: 76,
        height: 12,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 1.6,
        color: '#334155',
        zIndex: 10
      },
      {
        id: 'el-tb-meta',
        type: 'text',
        content: 'Program Cohort: {{batch}} • Department: {{department}} • Date: {{issueDate}}',
        x: 50,
        y: 71,
        width: 70,
        height: 5,
        fontFamily: 'Montserrat',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 1,
        color: '#64748b',
        zIndex: 10
      },
      {
        id: 'el-tb-id',
        type: 'certificateId',
        content: 'Credential ID: {{certificateId}}',
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
        id: 'el-tb-qr',
        type: 'qrCode',
        content: '{{verificationUrl}}',
        x: 91,
        y: 90,
        width: 14,
        height: 14,
        zIndex: 10
      }
    ],
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-03-01T12:00:00Z',
    version: 1,
    isFavorite: true
  },
  {
    id: 'tpl-corporate-internship',
    name: 'Executive Internship & Experience Credential',
    description: 'Corporate institutional letterhead style suitable for engineering, management, finance, and legal internships.',
    certificateType: 'Internship Certificate',
    pageSize: 'a4-landscape',
    widthMm: 297,
    heightMm: 210,
    orientation: 'landscape',
    backgroundColor: '#ffffff',
    backgroundGradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    backgroundPattern: 'lines',
    border: {
      preset: 'double-academic',
      color: '#0f766e',
      secondaryColor: '#14b8a6',
      thickness: 4,
      padding: 15,
      cornerRadius: 6,
      cornerDecoration: false
    },
    institution: {
      ...DEFAULT_INSTITUTION,
      name: 'Apex Global Enterprises & Research Labs',
      tagline: 'Innovating Today, Empowering Tomorrow'
    },
    signatures: [
      {
        id: 'sig-corp-1',
        name: 'Rachel Hastings, MBA',
        designation: 'Head of People & Global Talent',
        department: 'Human Resources',
        signatureStyle: 'script-2',
        required: true,
        x: 25,
        y: 85
      },
      {
        id: 'sig-corp-2',
        name: 'Marcus Sterling',
        designation: 'Managing Director & Partner',
        department: 'Executive Board',
        signatureStyle: 'script-3',
        required: true,
        x: 75,
        y: 85
      }
    ],
    stamp: {
      enabled: true,
      type: 'college',
      label: 'APEX ENTERPRISE SEAL',
      opacity: 0.9,
      rotation: 4,
      scale: 0.95,
      x: 50,
      y: 83
    },
    verification: {
      enabled: true,
      method: 'qr_and_id',
      prefix: 'APEX-INT',
      year: '2026',
      startingNumber: 3001,
      numberLength: 6,
      verificationBaseUrl: window?.location ? `${window.location.origin}/#verify` : 'https://certiflow.app/#verify'
    },
    elements: [
      {
        id: 'el-corp-inst',
        type: 'institutionName',
        content: 'APEX GLOBAL ENTERPRISES',
        x: 50,
        y: 16,
        width: 80,
        height: 6,
        fontFamily: 'Cinzel',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 4,
        textAlign: 'center',
        color: '#0f766e',
        zIndex: 10
      },
      {
        id: 'el-corp-title',
        type: 'heading',
        content: 'CERTIFICATE OF INTERNSHIP',
        x: 50,
        y: 28,
        width: 85,
        height: 8,
        fontFamily: 'Playfair Display',
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: 2,
        textAlign: 'center',
        color: '#0f172a',
        zIndex: 10
      },
      {
        id: 'el-corp-intro',
        type: 'text',
        content: 'This is to officially certify that',
        x: 50,
        y: 38,
        width: 60,
        height: 5,
        fontFamily: 'Montserrat',
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        color: '#64748b',
        zIndex: 10
      },
      {
        id: 'el-corp-name',
        type: 'recipientName',
        content: '{{recipientName}}',
        x: 50,
        y: 47,
        width: 80,
        height: 10,
        fontFamily: 'Playfair Display',
        fontSize: 36,
        fontWeight: '700',
        fontStyle: 'italic',
        textAlign: 'center',
        color: '#042f2e',
        zIndex: 10
      },
      {
        id: 'el-corp-body',
        type: 'text',
        content: 'has diligently served as a Graduate Research Intern in the {{department}} Department working on {{courseName}}. During this tenure, their contribution, technical acumen, and work ethic were exemplary.',
        x: 50,
        y: 59,
        width: 76,
        height: 12,
        fontFamily: 'Cormorant Garamond',
        fontSize: 18,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 1.5,
        color: '#334155',
        zIndex: 10
      },
      {
        id: 'el-corp-meta',
        type: 'text',
        content: 'Performance Rating: {{grade}} • Verified on: {{issueDate}}',
        x: 50,
        y: 70,
        width: 60,
        height: 5,
        fontFamily: 'Montserrat',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        color: '#475569',
        zIndex: 10
      },
      {
        id: 'el-corp-id',
        type: 'certificateId',
        content: 'Verification ID: {{certificateId}}',
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
        id: 'el-corp-qr',
        type: 'qrCode',
        content: '{{verificationUrl}}',
        x: 91,
        y: 90,
        width: 14,
        height: 14,
        zIndex: 10
      }
    ],
    createdAt: '2026-03-01T14:00:00Z',
    updatedAt: '2026-03-01T14:00:00Z',
    version: 1,
    isFavorite: false
  }
];

export const INITIAL_SAMPLE_RECIPIENTS: RecipientRow[] = [];

export const INITIAL_GENERATED_CERTIFICATES: GeneratedCertificateRecord[] = [];

export const INITIAL_CAMPAIGNS: EmailCampaign[] = [];

export const INITIAL_WHATSAPP_CAMPAIGNS: WhatsAppCampaign[] = [];

// LocalStorage Persistence Keys
const STORAGE_KEYS = {
  TEMPLATES: 'certiflow_templates_v2',
  INSTITUTION: 'certiflow_institution_v2',
  SIGNATURES: 'certiflow_signatures_v2',
  CERTIFICATES: 'certiflow_certificates_v2',
  CAMPAIGNS: 'certiflow_campaigns_v2',
  WHATSAPP_CAMPAIGNS: 'certiflow_whatsapp_campaigns_v1',
  SETTINGS: 'certiflow_settings_v2',
  SMTP: 'certiflow_smtp_v1',
  WHATSAPP: 'certiflow_whatsapp_v1',
  THEME: 'certiflow_theme_config_v1'
};

// In-memory cache for synchronous reads
let memoryCache: Record<string, any> = {};

// Load fallback from localStorage in case backend is down or fetching
try {
  memoryCache[STORAGE_KEYS.TEMPLATES] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || 'null') || INITIAL_TEMPLATES;
  memoryCache[STORAGE_KEYS.INSTITUTION] = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTION) || 'null') || DEFAULT_INSTITUTION;
  memoryCache[STORAGE_KEYS.SIGNATURES] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SIGNATURES) || 'null') || INITIAL_SIGNATURES;
  memoryCache[STORAGE_KEYS.CERTIFICATES] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CERTIFICATES) || 'null') || INITIAL_GENERATED_CERTIFICATES;
  memoryCache[STORAGE_KEYS.CAMPAIGNS] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CAMPAIGNS) || 'null') || INITIAL_CAMPAIGNS;
  memoryCache[STORAGE_KEYS.WHATSAPP_CAMPAIGNS] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WHATSAPP_CAMPAIGNS) || 'null') || INITIAL_WHATSAPP_CAMPAIGNS;
  memoryCache[STORAGE_KEYS.SMTP] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SMTP) || 'null') || DEFAULT_SMTP_CONFIG;
  memoryCache[STORAGE_KEYS.WHATSAPP] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WHATSAPP) || 'null') || DEFAULT_WHATSAPP_CONFIG;
  memoryCache[STORAGE_KEYS.THEME] = JSON.parse(localStorage.getItem(STORAGE_KEYS.THEME) || 'null') || DEFAULT_THEME_CONFIG;
} catch (e) {
  console.warn('Failed to load initial cache from localStorage', e);
}

export const StorageService = {
  isInitialized: false,

  async initializeStore(): Promise<void> {
    try {
      const res = await fetch('/api/store/all');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const { data } = await res.json();
        if (data) {
          if (data[STORAGE_KEYS.TEMPLATES]) memoryCache[STORAGE_KEYS.TEMPLATES] = data[STORAGE_KEYS.TEMPLATES];
          if (data[STORAGE_KEYS.INSTITUTION]) memoryCache[STORAGE_KEYS.INSTITUTION] = data[STORAGE_KEYS.INSTITUTION];
          if (data[STORAGE_KEYS.SIGNATURES]) memoryCache[STORAGE_KEYS.SIGNATURES] = data[STORAGE_KEYS.SIGNATURES];
          if (data[STORAGE_KEYS.CERTIFICATES]) memoryCache[STORAGE_KEYS.CERTIFICATES] = data[STORAGE_KEYS.CERTIFICATES];
          if (data[STORAGE_KEYS.CAMPAIGNS]) memoryCache[STORAGE_KEYS.CAMPAIGNS] = data[STORAGE_KEYS.CAMPAIGNS];
          if (data[STORAGE_KEYS.WHATSAPP_CAMPAIGNS]) memoryCache[STORAGE_KEYS.WHATSAPP_CAMPAIGNS] = data[STORAGE_KEYS.WHATSAPP_CAMPAIGNS];
          if (data[STORAGE_KEYS.SMTP]) memoryCache[STORAGE_KEYS.SMTP] = data[STORAGE_KEYS.SMTP];
          if (data[STORAGE_KEYS.WHATSAPP]) memoryCache[STORAGE_KEYS.WHATSAPP] = data[STORAGE_KEYS.WHATSAPP];
          if (data[STORAGE_KEYS.THEME]) memoryCache[STORAGE_KEYS.THEME] = data[STORAGE_KEYS.THEME];
          
          Object.keys(memoryCache).forEach(key => {
            localStorage.setItem(key, JSON.stringify(memoryCache[key]));
          });
        }
      }
      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to init store from backend', e);
      this.isInitialized = true;
    }
  },

  async persistToBackend(key: string, value: any): Promise<void> {
    memoryCache[key] = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
    } catch (e) {
      console.error('Failed to persist to SQLite backend', e);
    }
  },

  getTemplates(): CertificateTemplate[] {
    return memoryCache[STORAGE_KEYS.TEMPLATES] || INITIAL_TEMPLATES;
  },

  saveTemplates(templates: CertificateTemplate[]): void {
    this.persistToBackend(STORAGE_KEYS.TEMPLATES, templates);
  },

  getTemplateById(id: string): CertificateTemplate | undefined {
    const templates = this.getTemplates();
    return templates.find(t => t.id === id);
  },

  saveTemplate(template: CertificateTemplate): void {
    const templates = [...this.getTemplates()];
    const index = templates.findIndex(t => t.id === template.id);
    if (index >= 0) {
      templates[index] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      templates.unshift({
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    this.saveTemplates(templates);
  },

  deleteTemplate(id: string): void {
    const templates = this.getTemplates().filter(t => t.id !== id);
    this.saveTemplates(templates);
  },

  getInstitution(): InstitutionDetails {
    return memoryCache[STORAGE_KEYS.INSTITUTION] || DEFAULT_INSTITUTION;
  },

  getInstitutionProfile(): InstitutionDetails {
    return this.getInstitution();
  },

  saveInstitution(inst: InstitutionDetails): void {
    this.persistToBackend(STORAGE_KEYS.INSTITUTION, inst);
  },

  saveInstitutionProfile(inst: InstitutionDetails): void {
    this.saveInstitution(inst);
  },

  // Institutional Signatures Management
  getSignatures(): InstitutionalSignature[] {
    if (Array.isArray(memoryCache[STORAGE_KEYS.SIGNATURES])) {
      return memoryCache[STORAGE_KEYS.SIGNATURES];
    }
    return INITIAL_SIGNATURES;
  },

  saveSignatures(sigs: InstitutionalSignature[]): void {
    this.persistToBackend(STORAGE_KEYS.SIGNATURES, sigs);
  },

  addSignature(sig: Omit<InstitutionalSignature, 'id' | 'createdAt'>): InstitutionalSignature {
    const sigs = [...this.getSignatures()];
    const newSig: InstitutionalSignature = {
      ...sig,
      id: `sig-inst-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    sigs.push(newSig);
    this.saveSignatures(sigs);
    return newSig;
  },

  updateSignature(id: string, updates: Partial<InstitutionalSignature>): void {
    const sigs = [...this.getSignatures()];
    const idx = sigs.findIndex(s => s.id === id);
    if (idx >= 0) {
      sigs[idx] = { ...sigs[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveSignatures(sigs);
    }
  },

  deleteSignature(id: string): void {
    const sigs = this.getSignatures().filter(s => s.id !== id);
    this.saveSignatures(sigs);
  },

  // Helper to synchronize institution details and active signatures into existing templates
  applyIdentityAndSignaturesToTemplates(
    institutionUpdates?: Partial<InstitutionDetails>,
    customSignatures?: InstitutionalSignature[]
  ): number {
    const templates = [...this.getTemplates()];
    const currentInst = this.getInstitution();
    const activeInst = { ...currentInst, ...(institutionUpdates || {}) };
    const sigsToUse = customSignatures || this.getSignatures();

    // Map institutional signatures to template SignatureConfig format
    const defaultSigs = sigsToUse.slice(0, 2).map((s, idx) => ({
      id: `sig-${idx + 1}`,
      name: s.name,
      designation: s.designation,
      department: s.department,
      signatureImage: s.signatureImage,
      signatureStyle: (s.signatureStyle || (s.signatureType === 'upload' || s.signatureType === 'draw' ? 'image' : 'script-1')) as any,
      required: true,
      x: idx === 0 ? 25 : 75,
      y: 84
    }));

    let updatedCount = 0;
    const activeStampImage = activeInst.officialStampUrl || activeInst.officialSealUrl;

    const updatedTemplates = templates.map(t => {
      updatedCount++;

      const updatedStamp = {
        ...t.stamp,
        imageUrl: activeStampImage || t.stamp.imageUrl,
        enabled: activeStampImage ? true : t.stamp.enabled
      };

      const updatedElements = (t.elements || []).map(el => {
        if (el.type === 'stamp') {
          return {
            ...el,
            url: activeStampImage || el.url
          };
        }
        return el;
      });

      return {
        ...t,
        institution: {
          ...t.institution,
          ...activeInst
        },
        signatures: defaultSigs.length > 0 ? defaultSigs : t.signatures,
        stamp: updatedStamp,
        elements: updatedElements,
        updatedAt: new Date().toISOString()
      };
    });

    this.saveTemplates(updatedTemplates);
    return updatedCount;
  },

  getGeneratedCertificates(): GeneratedCertificateRecord[] {
    return memoryCache[STORAGE_KEYS.CERTIFICATES] || INITIAL_GENERATED_CERTIFICATES;
  },

  findCertificateById(id: string): GeneratedCertificateRecord | undefined {
    const certs = this.getGeneratedCertificates();
    const query = id.trim().toLowerCase();
    return certs.find(c => c.certificateId.toLowerCase() === query);
  },

  deleteGeneratedCertificate(id: string): void {
    const certs = this.getGeneratedCertificates().filter(c => c.id !== id);
    this.saveGeneratedCertificates(certs);
  },

  saveGeneratedCertificates(certs: GeneratedCertificateRecord[]): void {
    this.persistToBackend(STORAGE_KEYS.CERTIFICATES, certs);
  },

  addGeneratedCertificates(newCerts: GeneratedCertificateRecord[]): void {
    const existing = this.getGeneratedCertificates();
    const combined = [...newCerts, ...existing];
    this.saveGeneratedCertificates(combined);
  },

  getCampaigns(): EmailCampaign[] {
    return memoryCache[STORAGE_KEYS.CAMPAIGNS] || INITIAL_CAMPAIGNS;
  },

  saveCampaign(campaign: EmailCampaign): void {
    const campaigns = [...this.getCampaigns()];
    const index = campaigns.findIndex(c => c.id === campaign.id);
    if (index >= 0) {
      campaigns[index] = campaign;
    } else {
      campaigns.unshift(campaign);
    }
    this.persistToBackend(STORAGE_KEYS.CAMPAIGNS, campaigns);
  },

  getSmtpConfig(): SmtpConfig {
    return memoryCache[STORAGE_KEYS.SMTP] || DEFAULT_SMTP_CONFIG;
  },

  saveSmtpConfig(config: SmtpConfig): void {
    this.persistToBackend(STORAGE_KEYS.SMTP, config);
  },

  getWhatsAppConfig(): WhatsAppConfig {
    return memoryCache[STORAGE_KEYS.WHATSAPP] || DEFAULT_WHATSAPP_CONFIG;
  },

  saveWhatsAppConfig(config: WhatsAppConfig): void {
    this.persistToBackend(STORAGE_KEYS.WHATSAPP, config);
  },

  getWhatsAppCampaigns(): WhatsAppCampaign[] {
    return memoryCache[STORAGE_KEYS.WHATSAPP_CAMPAIGNS] || INITIAL_WHATSAPP_CAMPAIGNS;
  },

  saveWhatsAppCampaign(campaign: WhatsAppCampaign): void {
    const campaigns = [...this.getWhatsAppCampaigns()];
    const index = campaigns.findIndex(c => c.id === campaign.id);
    if (index >= 0) {
      campaigns[index] = campaign;
    } else {
      campaigns.unshift(campaign);
    }
    this.persistToBackend(STORAGE_KEYS.WHATSAPP_CAMPAIGNS, campaigns);
  },

  getThemeConfig(): ThemeConfig {
    return memoryCache[STORAGE_KEYS.THEME] || DEFAULT_THEME_CONFIG;
  },

  saveThemeConfig(config: ThemeConfig): void {
    this.persistToBackend(STORAGE_KEYS.THEME, config);
  }
};
