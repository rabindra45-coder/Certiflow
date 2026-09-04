export type MainTab = 'maker' | 'automation';
export type SecondaryNav = 'dashboard' | 'maker' | 'automation' | 'templates' | 'certificates' | 'campaigns' | 'verification' | 'settings';

export type CertificateType =
  | 'Certificate of Completion'
  | 'Certificate of Participation'
  | 'Certificate of Achievement'
  | 'Certificate of Excellence'
  | 'Internship Certificate'
  | 'Training Certificate'
  | 'Workshop Certificate'
  | 'Course Certificate'
  | 'Appreciation Certificate'
  | 'Award Certificate'
  | 'Employment/Experience Certificate'
  | 'Volunteer Certificate'
  | 'Custom Certificate';

export type CanvasPageSize = 'a4-landscape' | 'a4-portrait' | 'letter-landscape' | 'letter-portrait' | 'custom';

export type ElementType =
  | 'text'
  | 'heading'
  | 'recipientName'
  | 'institutionName'
  | 'logo'
  | 'image'
  | 'signature'
  | 'stamp'
  | 'qrCode'
  | 'certificateId'
  | 'date'
  | 'line'
  | 'divider'
  | 'rectangle'
  | 'circle'
  | 'badge'
  | 'dynamicField';

export interface SignatureConfig {
  id: string;
  name: string;
  designation: string;
  department?: string;
  signatureImage?: string;
  signatureStyle: 'script-1' | 'script-2' | 'script-3' | 'script-4' | 'image' | 'custom';
  required: boolean;
  x?: number;
  y?: number;
}

export interface InstitutionalSignature {
  id: string;
  name: string;
  designation: string;
  department?: string;
  signatureType: 'draw' | 'upload' | 'font';
  signatureImage?: string; // transparent data URL or image path
  signatureStyle?: 'script-1' | 'script-2' | 'script-3' | 'script-4';
  isDefault?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StampConfig {
  enabled: boolean;
  type: 'college' | 'seal' | 'department' | 'digital';
  label: string;
  imageUrl?: string;
  opacity: number;
  rotation: number;
  scale: number;
  x?: number;
  y?: number;
}

export interface VerificationConfig {
  enabled: boolean;
  method: 'none' | 'qr' | 'id' | 'qr_and_id';
  prefix: string;
  year: string;
  startingNumber: number;
  numberLength: number;
  verificationBaseUrl: string;
}

export interface InstitutionDetails {
  name: string;
  shortName: string;
  orgType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  department: string;
  campus: string;
  tagline: string;
  accreditation: string;
  primaryLogoUrl: string;
  secondaryLogoUrl?: string;
  departmentLogoUrl?: string;
  watermarkUrl?: string;
  watermarkOpacity: number;
  showLogoOnCertificate?: boolean;
  logoPosition?: 'top-center' | 'top-left' | 'top-right' | 'watermark';
  logoWidthPercent?: number;
}

export interface BorderStyle {
  preset: 'classic-gold' | 'double-academic' | 'modern-minimal' | 'ornate-royal' | 'geometric-tech' | 'none';
  color: string;
  secondaryColor?: string;
  thickness: number;
  padding: number;
  cornerRadius: number;
  cornerDecoration: boolean;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  label?: string;
  content: string; // supports {{variableName}}
  x: number; // percentage (0 to 100) or pixels
  y: number; // percentage (0 to 100) or pixels
  width: number;
  height: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  rotation?: number;
  zIndex: number;
  locked?: boolean;
  hidden?: boolean;
  shadow?: boolean;
  dynamicKey?: string;
  url?: string; // for images, logos, stamps
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  certificateType: CertificateType;
  customTypeName?: string;
  pageSize: CanvasPageSize;
  widthMm: number;
  heightMm: number;
  orientation: 'landscape' | 'portrait';
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundImageUrl?: string;
  backgroundPattern?: 'none' | 'dots' | 'guilloche' | 'lines' | 'waves';
  border: BorderStyle;
  institution: InstitutionDetails;
  signatures: SignatureConfig[];
  stamp: StampConfig;
  verification: VerificationConfig;
  elements: CanvasElement[];
  isFavorite?: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RecipientRow {
  id: string;
  recipientName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  studentId?: string;
  employeeId?: string;
  courseName: string;
  department?: string;
  batch?: string;
  grade?: string;
  score?: string;
  position?: string;
  issueDate: string;
  startDate?: string;
  endDate?: string;
  certificateId?: string;
  phoneNumber?: string;
  whatsapp?: string;
  status?: 'pending' | 'valid' | 'invalid' | 'generated' | 'sent';
  validationErrors?: string[];
  [key: string]: any;
}

export interface FieldMappingConfig {
  sourceColumn: string;
  targetField: string;
  isRequired: boolean;
}

export interface GeneratedCertificateRecord {
  id: string;
  certificateId: string;
  templateId: string;
  templateName: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  courseName: string;
  institutionName: string;
  certificateType: string;
  issueDate: string;
  verificationUrl: string;
  pdfDataUrl?: string;
  previewThumbnailUrl?: string;
  generatedAt: string;
  emailStatus: 'not_sent' | 'queued' | 'sending' | 'sent' | 'failed';
  emailSentAt?: string;
  whatsappStatus?: 'not_sent' | 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsappSentAt?: string;
  whatsappPhone?: string;
  metadata: Record<string, any>;
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  replyTo?: string;
  emailBody: string;
  createdAt: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed';
  logs: {
    timestamp: string;
    recipientEmail: string;
    recipientName: string;
    certificateId: string;
    status: 'sent' | 'failed';
    message: string;
  }[];
}

export interface WhatsAppConfig {
  enabled: boolean;
  provider: 'cloud_api' | 'twilio' | 'web_direct';
  phoneNumberId?: string;
  businessAccountId?: string;
  apiAccessToken?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  defaultTemplateMessage: string;
  institutionName?: string;
  status: 'configured' | 'unconfigured' | 'error';
  lastTestedAt?: string;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  messageText: string;
  provider: 'cloud_api' | 'twilio' | 'web_direct';
  createdAt: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  status: 'draft' | 'in_progress' | 'completed';
  logs: {
    timestamp: string;
    recipientPhone: string;
    recipientName: string;
    certificateId: string;
    status: 'sent' | 'delivered' | 'failed';
    message: string;
    messageId?: string;
  }[];
}

export interface WhatsAppTestResult {
  success: boolean;
  message: string;
  details?: {
    provider?: string;
    messageId?: string;
    recipientPhone?: string;
    latencyMs?: number;
    timestamp?: string;
    status?: string;
    [key: string]: any;
  };
}

export interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  ignoreTls?: boolean;
  enabled?: boolean;
}

export interface SmtpTestResult {
  success: boolean;
  message: string;
  details?: {
    code?: string;
    command?: string;
    response?: string;
    latencyMs?: number;
    timestamp?: string;
    messageId?: string;
    accepted?: string[];
    rejected?: string[];
    [key: string]: any;
  };
}

export type ThemePreset =
  | 'executive-indigo'
  | 'emerald-campus'
  | 'royal-violet'
  | 'ocean-sapphire'
  | 'heritage-crimson'
  | 'midnight-obsidian'
  | 'sunset-amber';

export type WorkspaceDensity = 'compact' | 'comfortable' | 'spacious';
export type InterfaceRadius = 'sharp' | 'smooth' | 'pill';
export type InterfaceFont = 'modern-sans' | 'academic-serif' | 'tech-clean';

export interface ThemeConfig {
  preset: ThemePreset;
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor?: string;
  density: WorkspaceDensity;
  radius: InterfaceRadius;
  font: InterfaceFont;
  sidebarCollapsed?: boolean;
  enableAnimations?: boolean;
  enableGlassmorphism?: boolean;
  highContrast?: boolean;
}

