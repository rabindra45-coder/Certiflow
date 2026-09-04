import React from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import { CertificateTemplate, RecipientRow } from '../types';
import { CertificateCanvas } from '../components/maker/CertificateCanvas';
import {
  generateCertificateId,
  generateQrCodeDataUrl,
  renderElementToCanvas,
  buildRecipientDataContext,
  createBulkCertificatesZip
} from './certificateGenerator';

export interface RenderedCertificateResult {
  filename: string;
  blob: Blob;
  base64: string;
  certId: string;
}

/**
 * Self-contained renderer that mounts CertificateCanvas in an offscreen container,
 * waits for DOM paint and webfonts, captures via html2canvas, and generates a jsPDF blob.
 */
export async function renderRecipientToPdfBlob(
  template: CertificateTemplate,
  recipient: RecipientRow,
  index: number
): Promise<RenderedCertificateResult> {
  const certId = recipient.certificateId || generateCertificateId(template, index);
  const verifyUrl = `${template.verification.verificationBaseUrl}?id=${certId}`;
  const qrDataUrl = await generateQrCodeDataUrl(verifyUrl);

  const contextData = {
    ...buildRecipientDataContext(template, recipient, certId, verifyUrl),
    qrDataUrl
  };

  const isLandscape = template.orientation === 'landscape';
  const widthPx = isLandscape ? 1000 : 707;
  const heightPx = isLandscape ? 707 : 1000;

  // Create isolated offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = `${widthPx}px`;
  container.style.height = `${heightPx}px`;
  container.style.overflow = 'hidden';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-9999';
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  const root = createRoot(container);

  await new Promise<void>((resolve) => {
    root.render(
      React.createElement(CertificateCanvas, {
        template,
        recipientContext: contextData,
        scale: 1
      })
    );
    // Allow paint & fonts
    setTimeout(resolve, 100);
  });

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignored
    }
  }

  const canvasNode = (container.querySelector('.certificate-render-root') || container.firstElementChild || container) as HTMLElement;
  const canvas = await renderElementToCanvas(canvasNode, 2.0);
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation: template.orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

  const blob = pdf.output('blob');
  const rawDataUri = pdf.output('datauristring');
  const rawBase64 = rawDataUri.includes(';base64,') ? rawDataUri.split(';base64,')[1] : rawDataUri;
  const base64 = `data:application/pdf;base64,${rawBase64}`;

  // Clean up React root and DOM
  try {
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  } catch (err) {
    console.warn('Offscreen cleanup warning', err);
  }

  const safeName = (recipient.recipientName || 'Recipient').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${template.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${safeName}_${certId}.pdf`;

  return { filename, blob, base64, certId };
}

/**
 * Sequentially generates PDFs for all given recipients and downloads them as a single ZIP archive.
 */
export async function generateAndDownloadCertificatesZip(
  template: CertificateTemplate,
  recipients: RecipientRow[],
  onProgress?: (current: number, total: number, name: string) => void
): Promise<number> {
  if (!recipients || recipients.length === 0) {
    throw new Error('No recipients provided for certificate generation.');
  }

  const zipItems: { filename: string; blob: Blob }[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const rec = recipients[i];
    if (onProgress) {
      onProgress(i + 1, recipients.length, rec.recipientName);
    }

    const { filename, blob } = await renderRecipientToPdfBlob(template, rec, i);
    zipItems.push({ filename, blob });
  }

  const zipFilename = `${template.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_all_certificates.zip`;
  await createBulkCertificatesZip(zipItems, zipFilename);
  return zipItems.length;
}
