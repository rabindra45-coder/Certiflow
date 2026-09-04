import QRCode from 'qrcode';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { CertificateTemplate, RecipientRow, GeneratedCertificateRecord } from '../types';

export function interpolateText(text: string, data: Record<string, any>): string {
  if (!text) return '';
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (data[key] !== undefined && data[key] !== null) {
      return String(data[key]);
    }
    return match;
  });
}

export function generateCertificateId(
  template: CertificateTemplate,
  indexOffset: number
): string {
  const prefix = template.verification?.prefix || 'CERT';
  const year = template.verification?.year || new Date().getFullYear().toString();
  const startNum = (template.verification?.startingNumber || 1001) + indexOffset;
  const length = template.verification?.numberLength || 6;
  const padded = String(startNum).padStart(length, '0');
  return `${prefix}-${year}-${padded}`;
}

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}

export async function renderElementToCanvas(element: HTMLElement, scale: number = 2): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false
  });
}

export async function exportCertificateAsPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderElementToCanvas(element, 2.5);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

export async function exportCertificateAsPdf(
  element: HTMLElement,
  filename: string,
  orientation: 'landscape' | 'portrait' = 'landscape',
  format: 'a4' | 'letter' = 'a4'
): Promise<void> {
  const canvas = await renderElementToCanvas(element, 2.5);
  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export async function exportSinglePdfBlob(
  element: HTMLElement,
  orientation: 'landscape' | 'portrait' = 'landscape',
  format: 'a4' | 'letter' = 'a4'
): Promise<Blob> {
  const canvas = await renderElementToCanvas(element, 2.0);
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

  return pdf.output('blob');
}

export async function createBulkCertificatesZip(
  items: { filename: string; blob: Blob }[],
  zipFilename: string = 'certiflow_certificates.zip'
): Promise<void> {
  const zip = new JSZip();
  items.forEach(item => {
    zip.file(item.filename, item.blob);
  });

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Allow browser time to initiate file download before cleanup
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
}

export function buildRecipientDataContext(
  template: CertificateTemplate,
  recipient: RecipientRow,
  certId: string,
  verificationUrl: string
): Record<string, any> {
  return {
    recipientName: recipient.recipientName || `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim(),
    firstName: recipient.firstName || recipient.recipientName?.split(' ')[0] || '',
    lastName: recipient.lastName || recipient.recipientName?.split(' ').slice(1).join(' ') || '',
    email: recipient.email || '',
    studentId: recipient.studentId || '',
    employeeId: recipient.employeeId || '',
    courseName: recipient.courseName || '',
    department: recipient.department || template.institution.department || 'Faculty Department',
    batch: recipient.batch || 'Cohort 2026',
    grade: recipient.grade || 'A+ (Honors)',
    score: recipient.score || '95%',
    position: recipient.position || 'Rank 1',
    issueDate: recipient.issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    startDate: recipient.startDate || 'January 2026',
    endDate: recipient.endDate || 'March 2026',
    institutionName: template.institution.name,
    institutionShortName: template.institution.shortName,
    certificateType: template.certificateType,
    certificateId: certId,
    verificationUrl: verificationUrl
  };
}
