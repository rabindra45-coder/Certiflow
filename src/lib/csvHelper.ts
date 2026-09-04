import * as XLSX from 'xlsx';
import { RecipientRow, FieldMappingConfig } from '../types';

export const SYSTEM_FIELDS = [
  { key: 'recipientName', label: 'Recipient Name', required: true, aliases: ['name', 'full name', 'student name', 'candidate name', 'participant name', 'recipient', 'awardee'] },
  { key: 'firstName', label: 'First Name', required: false, aliases: ['first name', 'given name', 'fname'] },
  { key: 'lastName', label: 'Last Name', required: false, aliases: ['last name', 'surname', 'family name', 'lname'] },
  { key: 'email', label: 'Email Address', required: true, aliases: ['email', 'email address', 'mail', 'student email', 'recipient email'] },
  { key: 'phone', label: 'Phone / WhatsApp Number', required: false, aliases: ['phone', 'whatsapp', 'mobile', 'cell', 'phone number', 'whatsapp number', 'contact', 'telephone'] },
  { key: 'courseName', label: 'Course / Program Name', required: true, aliases: ['course', 'program', 'course name', 'event', 'workshop', 'topic', 'training name'] },
  { key: 'department', label: 'Department', required: false, aliases: ['dept', 'department', 'faculty', 'branch', 'division'] },
  { key: 'batch', label: 'Batch / Cohort', required: false, aliases: ['batch', 'cohort', 'class', 'year', 'session'] },
  { key: 'grade', label: 'Grade / Distinction', required: false, aliases: ['grade', 'distinction', 'class of honor', 'division'] },
  { key: 'score', label: 'Score / Percentage', required: false, aliases: ['score', 'marks', 'percentage', 'gpa', 'cgpa'] },
  { key: 'position', label: 'Position / Rank', required: false, aliases: ['rank', 'position', 'standing'] },
  { key: 'studentId', label: 'Student / Employee ID', required: false, aliases: ['id', 'student id', 'roll no', 'reg no', 'employee id', 'reg number'] },
  { key: 'issueDate', label: 'Issue Date', required: false, aliases: ['date', 'issue date', 'completion date', 'awarded date'] }
];

export async function parseSpreadsheetFile(file: File): Promise<{ columns: string[]; rows: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (!rawJson || rawJson.length === 0) {
          resolve({ columns: [], rows: [] });
          return;
        }

        const columns = Object.keys(rawJson[0]);
        resolve({ columns, rows: rawJson });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function autoDetectFieldMappings(sourceColumns: string[]): FieldMappingConfig[] {
  return SYSTEM_FIELDS.map(systemField => {
    let matchedColumn = '';

    // Exact match
    const exactMatch = sourceColumns.find(col => col.toLowerCase().trim() === systemField.label.toLowerCase().trim() || col.toLowerCase().trim() === systemField.key.toLowerCase().trim());
    if (exactMatch) {
      matchedColumn = exactMatch;
    } else {
      // Alias match
      const aliasMatch = sourceColumns.find(col => {
        const cleanCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
        return systemField.aliases.some(alias => cleanCol === alias.replace(/[^a-z0-9]/g, '') || cleanCol.includes(alias.replace(/[^a-z0-9]/g, '')));
      });
      if (aliasMatch) {
        matchedColumn = aliasMatch;
      }
    }

    return {
      sourceColumn: matchedColumn,
      targetField: systemField.key,
      isRequired: systemField.required
    };
  });
}

export function applyMappingsToRows(
  rawRows: any[],
  mappings: FieldMappingConfig[]
): RecipientRow[] {
  const mappingMap = new Map<string, string>();
  mappings.forEach(m => {
    if (m.sourceColumn) {
      mappingMap.set(m.targetField, m.sourceColumn);
    }
  });

  return rawRows.map((raw, index) => {
    const rowId = `rec-${Date.now()}-${index + 1}`;
    const mapped: RecipientRow = {
      id: rowId,
      recipientName: '',
      email: '',
      courseName: '',
      issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      ...raw
    };

    mappings.forEach(m => {
      if (m.sourceColumn && raw[m.sourceColumn] !== undefined) {
        mapped[m.targetField] = String(raw[m.sourceColumn]).trim();
      }
    });

    // Fallback if recipientName is empty but firstName / lastName exist
    if (!mapped.recipientName && (mapped.firstName || mapped.lastName)) {
      mapped.recipientName = `${mapped.firstName || ''} ${mapped.lastName || ''}`.trim();
    }

    return mapped;
  });
}

export function validateRecipients(rows: RecipientRow[]): {
  validRows: RecipientRow[];
  invalidRows: RecipientRow[];
  errorsSummary: { missingName: number; invalidEmail: number; missingCourse: number; duplicates: number };
} {
  const validRows: RecipientRow[] = [];
  const invalidRows: RecipientRow[] = [];
  const seenEmails = new Set<string>();

  let missingName = 0;
  let invalidEmail = 0;
  let missingCourse = 0;
  let duplicates = 0;

  rows.forEach(row => {
    const errors: string[] = [];
    const cleanEmail = (row.email || '').trim().toLowerCase();

    if (!row.recipientName || row.recipientName.trim().length === 0) {
      errors.push('Missing recipient name');
      missingName++;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      errors.push('Missing email address');
      invalidEmail++;
    } else if (!emailRegex.test(cleanEmail)) {
      errors.push('Invalid email format');
      invalidEmail++;
    }

    if (!row.courseName || row.courseName.trim().length === 0) {
      errors.push('Missing course/program name');
      missingCourse++;
    }

    if (cleanEmail && seenEmails.has(cleanEmail)) {
      errors.push('Duplicate recipient email');
      duplicates++;
    } else if (cleanEmail) {
      seenEmails.add(cleanEmail);
    }

    if (errors.length > 0) {
      invalidRows.push({ ...row, status: 'invalid', validationErrors: errors });
    } else {
      validRows.push({ ...row, status: 'valid', validationErrors: [] });
    }
  });

  return {
    validRows,
    invalidRows,
    errorsSummary: { missingName, invalidEmail, missingCourse, duplicates }
  };
}

export function generateSampleCsvContent(): string {
  const headers = [
    'Student Name',
    'Email Address',
    'WhatsApp Number',
    'Course Name',
    'Department',
    'Batch',
    'Grade',
    'Score',
    'Student ID',
    'Issue Date'
  ];

  const sampleData = [
    ['Elena Rostova', 'elena.rostova@university.edu', '+1 (555) 234-8901', 'Advanced Neural Networks & AI', 'Computer Science', 'Class of 2026', 'A+ (Summa Cum Laude)', '98.5%', 'STU-10492', 'March 15, 2026'],
    ['Devon Vance', 'devon.vance@university.edu', '+1 (555) 345-9012', 'Advanced Neural Networks & AI', 'Computer Science', 'Class of 2026', 'A (High Honors)', '94.0%', 'STU-10493', 'March 15, 2026'],
    ['Priya Patel', 'priya.patel@university.edu', '+1 (555) 456-0123', 'Cloud Native DevOps Architecture', 'Information Systems', 'Class of 2026', 'A+ (Honors)', '97.8%', 'STU-10494', 'March 15, 2026'],
    ['Mateo Gomez', 'mateo.gomez@university.edu', '+1 (555) 567-1234', 'Distributed Systems & Microservices', 'Software Engineering', 'Class of 2026', 'A', '91.2%', 'STU-10495', 'March 15, 2026'],
    ['Aisha Diallo', 'aisha.diallo@university.edu', '+1 (555) 678-2345', 'Cybersecurity Threat Modeling', 'Cyber Defense', 'Class of 2026', 'A+ (Distinction)', '99.1%', 'STU-10496', 'March 15, 2026']
  ];

  const csvRows = [headers.join(',')];
  sampleData.forEach(row => {
    csvRows.push(row.map(field => `"${field.replace(/"/g, '""')}"`).join(','));
  });

  return csvRows.join('\n');
}

export function downloadSampleCsv(): void {
  const content = generateSampleCsvContent();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'certiflow_sample_recipients.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
