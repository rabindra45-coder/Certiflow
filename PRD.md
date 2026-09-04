# CertiFlow Product Requirements Document (PRD)

## 1. Executive Summary

CertiFlow is a web application designed for universities, corporations, event organizers, and training institutions. It simplifies certificate creation, bulk personalization, automated email distribution, and cryptographic authenticity verification.

---

## 2. Product Goals & Personas

### Key Objectives
- **Zero-Design-Friction**: Enable non-technical users to design professional certificates in under 5 minutes.
- **Scale Automation**: Generate and dispatch 1,000+ personalized certificates in a single automated batch.
- **Fraud Prevention**: Provide 100% verifiable authenticity via cryptographic QR code lookups.

### Target Personas
1. **Academic Administrator**: Issues graduation and course completion certificates for hundreds of students per semester.
2. **Corporate HR & L&D Manager**: Distributes employee training completion and achievement awards.
3. **Event Organizer**: Issues attendance certificates following conferences and hackathons.
4. **Verification Officer / Employer**: Scans certificate QR codes or searches UIDs to verify credential validity.

---

## 3. Functional Requirements

### Module 1: Visual Certificate Designer
- **REQ-1.1**: User MUST be able to drag, drop, resize, and reorder visual elements on a resolution-independent canvas.
- **REQ-1.2**: User MUST be able to customize fonts, colors, line heights, text alignment, and opacities.
- **REQ-1.3**: System MUST support dynamic placeholder variables (`{{recipient_name}}`, `{{course_name}}`, `{{issue_date}}`, `{{certificate_id}}`).
- **REQ-1.4**: System MUST render QR codes dynamically linked to the public verification endpoint.

### Module 2: Bulk Personalization & Import
- **REQ-2.1**: System MUST parse CSV and JSON files uploaded by the user.
- **REQ-2.2**: System MUST provide an interactive interface to map CSV headers to template variable placeholders.
- **REQ-2.3**: System MUST render paginated live previews showing how real data formats inside the chosen certificate template.

### Module 3: PDF Generation & Export
- **REQ-3.1**: User MUST be able to download high-resolution vector PDF files for individual certificates.
- **REQ-3.2**: System MUST generate zip packages containing individual recipient PDFs for bulk issuances.

### Module 4: Automated SMTP Email Dispatch
- **REQ-4.1**: User MUST be able to configure SMTP server settings (Host, Port, Username, Password, Sender Name).
- **REQ-4.2**: System MUST send personalized emails with attached certificate PDFs to each recipient in a batch.
- **REQ-4.3**: System MUST log delivery statuses (Pending, Sent, Failed) with error details for retries.

### Module 5: Public Verification Portal
- **REQ-5.1**: Anyone MUST be able to enter a Certificate UID (`CRT-YYYY-XXXXXX`) or scan a QR code to view authenticity details.
- **REQ-5.2**: Verification response MUST display Recipient Name, Issuing Organization, Issue Date, Course/Award Title, and Verification Status.

### Module 6: Progressive Web App & Offline Mode
- **REQ-6.1**: Application MUST be installable as a standalone application on Desktop, iOS, and Android.
- **REQ-6.2**: Application MUST function offline for local template editing and draft saving.

---

## 4. Non-Functional Requirements

- **Performance**: Canvas render time $< 16\text{ms}$ ($60\text{fps}$). Single PDF generation time $< 500\text{ms}$.
- **Accessibility**: Passes WCAG 2.1 AA contrast standards. Keyboard navigation for modal dialogs and forms.
- **Browser Compatibility**: Fully supported on Chrome, Firefox, Safari, Edge, Mobile Safari, and Chrome for Android.
