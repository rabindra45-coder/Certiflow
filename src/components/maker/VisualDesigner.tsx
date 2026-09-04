import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Save,
  Download,
  Printer,
  Type,
  Heading as HeadingIcon,
  User,
  Building,
  Image as ImageIcon,
  PenTool,
  Stamp,
  QrCode,
  Calendar,
  Minus,
  Sparkles,
  Trash2,
  Copy,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Sliders,
  Check,
  RotateCcw,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  Palette,
  Frame
} from 'lucide-react';
import { CertificateTemplate, CanvasElement, RecipientRow } from '../../types';
import { CertificateCanvas } from './CertificateCanvas';
import {
  exportCertificateAsPdf,
  exportCertificateAsPng,
  generateQrCodeDataUrl
} from '../../lib/certificateGenerator';
import { INITIAL_SAMPLE_RECIPIENTS, StorageService } from '../../lib/storage';

interface VisualDesignerProps {
  initialTemplate: CertificateTemplate;
  onSaveTemplate: (template: CertificateTemplate) => void;
  onOpenWizard: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const VisualDesigner: React.FC<VisualDesignerProps> = ({
  initialTemplate,
  onSaveTemplate,
  onOpenWizard,
  onShowToast
}) => {
  const [template, setTemplate] = useState<CertificateTemplate>(initialTemplate);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(0.85);
  const [sampleRecipientIndex, setSampleRecipientIndex] = useState<number>(0);
  const [history, setHistory] = useState<CertificateTemplate[]>([initialTemplate]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sidebarTab, setSidebarTab] = useState<'elements' | 'layers'>('elements');
  const [mobilePanel, setMobilePanel] = useState<'canvas' | 'elements' | 'properties'>('canvas');
  const [availableTemplates, setAvailableTemplates] = useState<CertificateTemplate[]>(() =>
    StorageService.getTemplates()
  );

  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Auto-fit scale on mobile and window resize
  const handleAutoFitScale = useCallback(() => {
    const isLandscape = template.orientation === 'landscape';
    const baseW = isLandscape ? 1000 : 707;
    if (window.innerWidth < 640) {
      const availableW = Math.max(260, window.innerWidth - 24);
      const fitScale = availableW / baseW;
      setScale(Number(Math.min(0.50, Math.max(0.25, fitScale)).toFixed(2)));
    } else if (window.innerWidth < 1024) {
      const availableW = Math.max(380, window.innerWidth - 48);
      const fitScale = availableW / baseW;
      setScale(Number(Math.min(0.70, Math.max(0.40, fitScale)).toFixed(2)));
    } else {
      setScale(0.85);
    }
  }, [template.orientation]);

  useEffect(() => {
    handleAutoFitScale();
    window.addEventListener('resize', handleAutoFitScale);
    return () => window.removeEventListener('resize', handleAutoFitScale);
  }, [handleAutoFitScale]);

  // Sync template if initialTemplate changes externally
  useEffect(() => {
    if (initialTemplate && initialTemplate.id !== template.id) {
      setTemplate(initialTemplate);
      setHistory([initialTemplate]);
      setHistoryIndex(0);
      setSelectedElementId(null);
      setSaveStatus('saved');
    }
  }, [initialTemplate.id]);

  // Keep available templates fresh
  useEffect(() => {
    const list = StorageService.getTemplates();
    setAvailableTemplates(list);
  }, [template.id, saveStatus]);

  // Sync sample recipient data
  const activeRecipient = INITIAL_SAMPLE_RECIPIENTS[sampleRecipientIndex] || INITIAL_SAMPLE_RECIPIENTS[0];

  // Generate QR code data URL for preview
  useEffect(() => {
    let isMounted = true;
    const certId = `${template.verification.prefix}-${template.verification.year}-001001`;
    const verifyUrl = `${template.verification.verificationBaseUrl}?id=${certId}`;
    generateQrCodeDataUrl(verifyUrl).then((url) => {
      if (isMounted) setQrCodeUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [template.verification]);

  // Push history state
  const pushHistory = (newTemplate: CertificateTemplate) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newTemplate);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setTemplate(newTemplate);
    setSaveStatus('unsaved');
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTemplate(history[newIndex]);
      setSaveStatus('unsaved');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTemplate(history[newIndex]);
      setSaveStatus('unsaved');
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    StorageService.saveTemplate(template);
    onSaveTemplate(template);
    setTimeout(() => {
      setSaveStatus('saved');
      onShowToast('Template Saved', `"${template.name}" was successfully saved to your template library.`, 'success');
    }, 350);
  };

  const handleSelectTemplate = (templateId: string) => {
    const found = availableTemplates.find((t) => t.id === templateId);
    if (found) {
      setTemplate(found);
      setHistory([found]);
      setHistoryIndex(0);
      setSelectedElementId(null);
      setSaveStatus('saved');
      onSaveTemplate(found);
    }
  };

  const selectedElement = template.elements.find((el) => el.id === selectedElementId);

  // Update selected element property
  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    const updatedElements = template.elements.map((el) => {
      if (el.id === selectedElementId) {
        return { ...el, ...updates };
      }
      return el;
    });
    pushHistory({ ...template, elements: updatedElements });
  };

  // Direct element position update from drag or nudge
  const handleUpdateElementPosition = (id: string, x: number, y: number, isDraggingEnd = true) => {
    const updatedElements = template.elements.map((el) => {
      if (el.id === id) {
        return { ...el, x, y };
      }
      return el;
    });

    const updatedTemplate = { ...template, elements: updatedElements };
    if (isDraggingEnd) {
      pushHistory(updatedTemplate);
    } else {
      setTemplate(updatedTemplate);
      setSaveStatus('unsaved');
    }
  };

  // Layer ordering
  const handleBringToFront = (id: string) => {
    const maxZ = Math.max(...template.elements.map((e) => e.zIndex || 10), 10);
    updateSelectedElement({ zIndex: maxZ + 1 });
  };

  const handleSendToBack = (id: string) => {
    const minZ = Math.min(...template.elements.map((e) => e.zIndex || 10), 10);
    updateSelectedElement({ zIndex: Math.max(1, minZ - 1) });
  };

  // Alignment helpers
  const handleAlign = (alignment: 'center-x' | 'center-y' | 'left' | 'right' | 'top' | 'bottom') => {
    if (!selectedElement) return;
    switch (alignment) {
      case 'center-x':
        updateSelectedElement({ x: 50 });
        break;
      case 'center-y':
        updateSelectedElement({ y: 50 });
        break;
      case 'left':
        updateSelectedElement({ x: 25 });
        break;
      case 'right':
        updateSelectedElement({ x: 75 });
        break;
      case 'top':
        updateSelectedElement({ y: 20 });
        break;
      case 'bottom':
        updateSelectedElement({ y: 80 });
        break;
    }
  };

  // Add new element to canvas
  const handleAddElement = (type: CanvasElement['type'], defaultLabel: string, defaultContent: string) => {
    const newId = `el-${Date.now()}`;
    const newEl: CanvasElement = {
      id: newId,
      type,
      label: defaultLabel,
      content: defaultContent,
      x: 50,
      y: 50,
      width: type === 'line' ? 50 : 70,
      height: 6,
      fontFamily: 'Montserrat',
      fontSize: type === 'heading' ? 26 : 14,
      fontWeight: type === 'heading' ? '700' : '500',
      textAlign: 'center',
      color: '#0f172a',
      zIndex: template.elements.length + 1
    };

    const updatedElements = [...template.elements, newEl];
    pushHistory({ ...template, elements: updatedElements });
    setSelectedElementId(newId);
    onShowToast('Element Added', `Added ${defaultLabel} to certificate canvas.`, 'info');
  };

  const handleDeleteElement = (id: string) => {
    const updatedElements = template.elements.filter((el) => el.id !== id);
    pushHistory({ ...template, elements: updatedElements });
    setSelectedElementId(null);
  };

  const handleDuplicateElement = (id: string) => {
    const el = template.elements.find((e) => e.id === id);
    if (!el) return;
    const duplicate: CanvasElement = {
      ...el,
      id: `el-${Date.now()}`,
      x: Math.min(el.x + 4, 90),
      y: Math.min(el.y + 4, 90)
    };
    pushHistory({ ...template, elements: [...template.elements, duplicate] });
    setSelectedElementId(duplicate.id);
  };

  // Export actions
  const handleExportPdf = async () => {
    if (!canvasRef.current) return;
    try {
      onShowToast('Generating PDF', 'Rendering high-resolution vector PDF...', 'info');
      await exportCertificateAsPdf(canvasRef.current, `${template.name.toLowerCase().replace(/\s+/g, '_')}_preview.pdf`);
      onShowToast('PDF Ready', 'Certificate downloaded successfully.', 'success');
    } catch (e) {
      onShowToast('Export Failed', 'Could not export PDF canvas.', 'error');
    }
  };

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    try {
      onShowToast('Exporting PNG', 'Generating crisp certificate image...', 'info');
      await exportCertificateAsPng(canvasRef.current, `${template.name.toLowerCase().replace(/\s+/g, '_')}_preview.png`);
      onShowToast('PNG Ready', 'Certificate image downloaded successfully.', 'success');
    } catch (e) {
      onShowToast('Export Failed', 'Could not export PNG canvas.', 'error');
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col bg-slate-100 dark:bg-slate-950">
      {/* Top Designer Sub-Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          {/* Template Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 hidden md:inline">Template:</span>
            <select
              value={template.id}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {availableTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <button
              onClick={onOpenWizard}
              title="Create new template from setup wizard"
              className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
            >
              <Plus className="h-3 w-3" />
              New
            </button>

            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400 hidden lg:inline">
              {template.pageSize} • A4 Landscape (297mm × 210mm)
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Save Status Indicator */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
            {saveStatus === 'saving' && <span className="text-amber-500">Saving...</span>}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
            {saveStatus === 'unsaved' && <span className="text-slate-400">Unsaved changes</span>}
          </div>
        </div>

        {/* Right Action Controls: Sample Recipient switcher, Zoom, Save, Export */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sample Recipient Switcher */}
          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs dark:border-slate-800 dark:bg-slate-800">
            <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-slate-500">Preview with:</span>
            <select
              value={sampleRecipientIndex}
              onChange={(e) => setSampleRecipientIndex(parseInt(e.target.value))}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none dark:text-slate-200"
            >
              {INITIAL_SAMPLE_RECIPIENTS.map((rec, idx) => (
                <option key={rec.id} value={idx}>
                  {rec.recipientName} ({rec.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setScale((s) => Math.max(0.4, s - 0.1))}
              className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="px-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
              className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={handleAutoFitScale}
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
              title="Fit certificate to screen width"
            >
              Fit
            </button>
          </div>

          {/* Print / Download Buttons */}
          <button
            onClick={handleExportPng}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Printer className="h-3.5 w-3.5" />
            PDF
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher Bar (< lg) */}
      <div className="flex items-center justify-around border-b border-slate-200 bg-slate-100 p-1 lg:hidden dark:border-slate-800 dark:bg-slate-800/80">
        <button
          onClick={() => setMobilePanel('canvas')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            mobilePanel === 'canvas'
              ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Frame className="h-3.5 w-3.5" />
          <span>Canvas View</span>
        </button>

        <button
          onClick={() => setMobilePanel('elements')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            mobilePanel === 'elements'
              ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Elements ({template.elements.length})</span>
        </button>

        <button
          onClick={() => setMobilePanel('properties')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            mobilePanel === 'properties'
              ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Properties {selectedElement ? '•' : ''}</span>
        </button>
      </div>

      {/* Main 3-Column Layout: Left Elements Toolbar | Center Canvas | Right Inspector */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT TOOLBAR: Elements & Canvas Layers */}
        <div
          className={`w-full lg:w-64 shrink-0 border-r border-slate-200 bg-white p-3 overflow-y-auto dark:border-slate-800 dark:bg-slate-900 flex-col ${
            mobilePanel === 'elements' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Tab Switcher: Add Elements vs Canvas Layers */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 mb-3 dark:bg-slate-800">
            <button
              onClick={() => setSidebarTab('elements')}
              className={`flex-1 py-1 text-center text-xs font-semibold rounded-md transition-all ${
                sidebarTab === 'elements'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Add Elements
            </button>
            <button
              onClick={() => setSidebarTab('layers')}
              className={`flex-1 py-1 text-center text-xs font-semibold rounded-md transition-all ${
                sidebarTab === 'layers'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Layers ({template.elements.length})
            </button>
          </div>

          {sidebarTab === 'elements' ? (
            <div>
              <div className="mb-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Canvas Elements
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleAddElement('heading', 'Header Title', 'CERTIFICATE OF ACHIEVEMENT')}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <HeadingIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Heading
                  </button>

                  <button
                    onClick={() => handleAddElement('recipientName', 'Recipient Name', '{{recipientName}}')}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Recipient
                  </button>

                  <button
                    onClick={() => handleAddElement('institutionName', 'Institution', '{{institutionName}}')}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Institution
                  </button>

                  <button
                    onClick={() =>
                      handleAddElement(
                        'text',
                        'Body Paragraph',
                        'for completing {{courseName}} with distinction, achieving Grade {{grade}} in Batch {{batch}}.'
                      )
                    }
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <Type className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    Paragraph
                  </button>

                  <button
                    onClick={() => handleAddElement('divider', 'Divider Line', '')}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <Minus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Divider
                  </button>

                  <button
                    onClick={() => handleAddElement('badge', 'Honors Badge', 'HONOR ROLL')}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Badge
                  </button>

                  <button
                    onClick={() => handleAddElement('date', 'Issue Date', 'Awarded on {{issueDate}}')}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <Calendar className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    Date
                  </button>

                  <button
                    onClick={() => handleAddElement('certificateId', 'Certificate ID', 'Certificate ID: {{certificateId}}')}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <QrCode className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Cert ID
                  </button>

                  <button
                    onClick={() => handleAddElement('logo', 'Institutional Logo', '')}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <ImageIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    Logo
                  </button>
                </div>
              </div>

              {/* Visual Dynamic Field Picker */}
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Dynamic Variable Picker
                </h4>
                <p className="text-[10px] text-slate-500 mb-2">
                  Click to insert variable into selected element:
                </p>
                <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                  {[
                    { key: '{{recipientName}}', label: 'Full Recipient Name' },
                    { key: '{{courseName}}', label: 'Course / Event Name' },
                    { key: '{{grade}}', label: 'Grade / Distinction' },
                    { key: '{{score}}', label: 'Score / Percentage' },
                    { key: '{{department}}', label: 'Department' },
                    { key: '{{batch}}', label: 'Batch / Cohort' },
                    { key: '{{studentId}}', label: 'Student ID' },
                    { key: '{{certificateId}}', label: 'Unique Certificate ID' },
                    { key: '{{issueDate}}', label: 'Issue Date' }
                  ].map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => {
                        if (selectedElement) {
                          updateSelectedElement({
                            content: `${selectedElement.content} ${v.key}`
                          });
                        } else {
                          handleAddElement('text', v.label, v.key);
                        }
                      }}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-left text-xs hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800/60 dark:hover:bg-indigo-950/60"
                    >
                      <span className="font-mono text-[10.5px] text-indigo-600 dark:text-indigo-400 font-semibold">{v.key}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[85px]">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* CANVAS LAYERS LIST */
            <div className="flex-1 overflow-y-auto space-y-1.5">
              <p className="text-[11px] text-slate-500 mb-2">
                Click to select, reorder or toggle visibility:
              </p>
              {template.elements.map((el, idx) => {
                const isSelected = selectedElementId === el.id;
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`flex items-center justify-between gap-1.5 rounded-lg border p-2 text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900 shadow-xs dark:bg-indigo-950/60 dark:text-indigo-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSelectedElement({ hidden: !el.hidden });
                        }}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={el.hidden ? 'Show element' : 'Hide element'}
                      >
                        {el.hidden ? <EyeOff className="h-3.5 w-3.5 text-slate-400" /> : <Eye className="h-3.5 w-3.5 text-indigo-600" />}
                      </button>
                      <div className="truncate">
                        <span className="font-semibold block truncate text-[11.5px]">{el.label || el.type}</span>
                        <span className="font-mono text-[9px] text-slate-400 block truncate">
                          X:{Math.round(el.x)}% Y:{Math.round(el.y)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateElement(el.id);
                        }}
                        title="Duplicate"
                        className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteElement(el.id);
                        }}
                        title="Delete"
                        className="rounded p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Border & Style Settings */}
          <div className="border-t border-slate-100 pt-4 mt-4 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center justify-between">
              <span>Border & Framing</span>
              <span className="text-[10px] font-mono font-normal text-indigo-600 dark:text-indigo-400 capitalize">
                {template.border.preset.replace('-', ' ')}
              </span>
            </h4>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Frame Style Preset
                </label>
                <select
                  value={template.border.preset}
                  onChange={(e) =>
                    pushHistory({
                      ...template,
                      border: { ...template.border, preset: e.target.value as any }
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="classic-gold">🏛️ Classic Gold Flourish</option>
                  <option value="double-academic">🎓 Double Academic Frame</option>
                  <option value="geometric-tech">⚡ Geometric Tech Frame</option>
                  <option value="modern-minimal">✨ Modern Minimal Keyline</option>
                  <option value="ornate-royal">👑 Ornate Royal Rosette</option>
                  <option value="none">🚫 No Border (Full Bleed)</option>
                </select>
              </div>

              {template.border.preset !== 'none' && (
                <>
                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Primary Border</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={template.border.color || '#b8860b'}
                          onChange={(e) =>
                            pushHistory({
                              ...template,
                              border: { ...template.border, color: e.target.value }
                            })
                          }
                          className="h-7 w-7 rounded cursor-pointer border border-slate-300 shrink-0"
                        />
                        <input
                          type="text"
                          value={template.border.color || '#b8860b'}
                          onChange={(e) =>
                            pushHistory({
                              ...template,
                              border: { ...template.border, color: e.target.value }
                            })
                          }
                          className="w-full rounded border border-slate-200 px-1.5 py-1 text-[11px] font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Accent Line</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={template.border.secondaryColor || '#1e293b'}
                          onChange={(e) =>
                            pushHistory({
                              ...template,
                              border: { ...template.border, secondaryColor: e.target.value }
                            })
                          }
                          className="h-7 w-7 rounded cursor-pointer border border-slate-300 shrink-0"
                        />
                        <input
                          type="text"
                          value={template.border.secondaryColor || '#1e293b'}
                          onChange={(e) =>
                            pushHistory({
                              ...template,
                              border: { ...template.border, secondaryColor: e.target.value }
                            })
                          }
                          className="w-full rounded border border-slate-200 px-1.5 py-1 text-[11px] font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Thickness & Inset Margin Sliders */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                      <span>Stroke Thickness</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {template.border.thickness ?? 4}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={14}
                      step={1}
                      value={template.border.thickness ?? 4}
                      onChange={(e) =>
                        pushHistory({
                          ...template,
                          border: { ...template.border, thickness: parseInt(e.target.value) }
                        })
                      }
                      className="w-full accent-indigo-600"
                    />

                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1">
                      <span>Inset Margin / Padding</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {template.border.padding ?? 16}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={40}
                      step={2}
                      value={template.border.padding ?? 16}
                      onChange={(e) =>
                        pushHistory({
                          ...template,
                          border: { ...template.border, padding: parseInt(e.target.value) }
                        })
                      }
                      className="w-full accent-indigo-600"
                    />

                    {/* Corner Ornaments Checkbox */}
                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={template.border.cornerDecoration !== false}
                        onChange={(e) =>
                          pushHistory({
                            ...template,
                            border: { ...template.border, cornerDecoration: e.target.checked }
                          })
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Show Corner Accents &amp; Filigree
                      </span>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CENTER: Canvas Workspace */}
        <div
          onClick={() => setSelectedElementId(null)}
          className={`flex-1 overflow-auto p-2 sm:p-6 flex-col items-center justify-center relative bg-slate-200/60 dark:bg-slate-950/80 ${
            mobilePanel === 'canvas' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Real Physical Dimensions & Interactive hint */}
          <div className="w-full max-w-2xl mb-2 flex items-center justify-between pointer-events-none z-10 px-2">
            <div className="rounded bg-white/90 px-2.5 py-1 text-[11px] font-mono text-slate-600 shadow-xs backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-400">
              A4 Canvas • {template.orientation === 'landscape' ? '297mm × 210mm (Landscape)' : '210mm × 297mm (Portrait)'}
            </div>
            <div className="hidden sm:block rounded-full bg-slate-900/80 px-3 py-1 text-[10.5px] font-medium text-slate-200 shadow-xs backdrop-blur-sm dark:bg-slate-800/90 dark:text-slate-300">
              ✨ Click &amp; drag elements • Double-click text to edit inline • Drag corners to resize
            </div>
          </div>

          {/* Scaled Bounds Wrapper - matches exact rendered pixel dimensions */}
          <div
            className="relative shadow-2xl transition-all duration-150 ease-out my-auto rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800 bg-white"
            style={{
              width: `${(template.orientation === 'landscape' ? 1000 : 707) * scale}px`,
              height: `${(template.orientation === 'landscape' ? 707 : 1000) * scale}px`
            }}
          >
            <CertificateCanvas
              template={template}
              recipientContext={{
                ...activeRecipient,
                qrDataUrl: qrCodeUrl
              }}
              scale={scale}
              selectedElementId={selectedElementId}
              onSelectElement={(id) => setSelectedElementId(id)}
              onUpdateElementPosition={handleUpdateElementPosition}
              onUpdateElement={(id, updates) => {
                const updatedElements = template.elements.map((el) => {
                  if (el.id === id) return { ...el, ...updates };
                  return el;
                });
                pushHistory({ ...template, elements: updatedElements });
              }}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              interactive={true}
              forwardRef={canvasRef}
            />
          </div>

          {/* Mobile Quick Floating Controls */}
          <div className="mt-3 flex items-center gap-2 rounded-full bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-white shadow-lg lg:hidden z-20 text-xs">
            <button
              onClick={handleAutoFitScale}
              className="flex items-center gap-1 font-semibold text-indigo-300 hover:text-indigo-200 px-1.5"
            >
              <Frame className="h-3.5 w-3.5" />
              <span>Fit Screen ({Math.round(scale * 100)}%)</span>
            </button>
            <div className="h-3 w-px bg-slate-700" />
            <button
              onClick={() => setMobilePanel('elements')}
              className="flex items-center gap-1 font-semibold hover:text-indigo-200 px-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
            <div className="h-3 w-px bg-slate-700" />
            <button
              onClick={() => setMobilePanel('properties')}
              className="flex items-center gap-1 font-semibold hover:text-indigo-200 px-1.5"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Props</span>
            </button>
          </div>

          {/* Mobile Selected Element Quick-Editor Drawer */}
          {selectedElement && mobilePanel === 'canvas' && (
            <div
              className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-900/95 text-white backdrop-blur-xl border-t border-slate-800 p-3 shadow-2xl animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                    {selectedElement.label || selectedElement.type}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    X:{Math.round(selectedElement.x)}% Y:{Math.round(selectedElement.y)}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateElement(selectedElement.id)}
                    title="Duplicate"
                    className="rounded p-1 text-slate-300 hover:bg-slate-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    title="Delete"
                    className="rounded p-1 text-rose-400 hover:bg-rose-950/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedElementId(null)}
                    title="Deselect"
                    className="rounded p-1 text-slate-400 hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quick Text Input for editable elements */}
              {selectedElement.type !== 'line' && selectedElement.type !== 'divider' && selectedElement.type !== 'logo' && (
                <div className="mb-2.5">
                  <input
                    type="text"
                    value={selectedElement.content}
                    onChange={(e) => updateSelectedElement({ content: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
                    placeholder="Enter element text..."
                  />
                </div>
              )}

              {/* Quick Controls Grid: Font Size, Alignment, Color Dots, Nudges */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Left Controls: Font Size */}
                <div className="flex items-center justify-between rounded-lg bg-slate-800/80 p-1.5 border border-slate-700/60">
                  <span className="text-[10px] font-mono text-slate-400">Size</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ fontSize: Math.max(8, (selectedElement.fontSize || 14) - 2) })}
                      className="h-6 w-6 rounded bg-slate-700 font-bold text-white hover:bg-slate-600 flex items-center justify-center text-xs"
                    >
                      A-
                    </button>
                    <span className="font-mono text-[11px] font-bold w-6 text-center text-indigo-300">
                      {selectedElement.fontSize || 14}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ fontSize: Math.min(80, (selectedElement.fontSize || 14) + 2) })}
                      className="h-6 w-6 rounded bg-slate-700 font-bold text-white hover:bg-slate-600 flex items-center justify-center text-xs"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Text Align */}
                <div className="flex items-center justify-between rounded-lg bg-slate-800/80 p-1.5 border border-slate-700/60">
                  <span className="text-[10px] font-mono text-slate-400">Align</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ textAlign: 'left' })}
                      className={`h-6 w-6 rounded flex items-center justify-center ${selectedElement.textAlign === 'left' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ textAlign: 'center' })}
                      className={`h-6 w-6 rounded flex items-center justify-center ${selectedElement.textAlign === 'center' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    >
                      <AlignCenter className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ textAlign: 'right' })}
                      className={`h-6 w-6 rounded flex items-center justify-center ${selectedElement.textAlign === 'right' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    >
                      <AlignRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Nudge & Color Swatches Row */}
              <div className="mt-2 flex items-center justify-between gap-2">
                {/* Color Swatches */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {['#0f172a', '#4f46e5', '#b8860b', '#991b1b', '#047857', '#1e3a8a', '#ffffff'].map((colorHex) => (
                    <button
                      key={colorHex}
                      type="button"
                      onClick={() => updateSelectedElement({ color: colorHex })}
                      className={`h-6 w-6 rounded-full border border-slate-600 shrink-0 ${selectedElement.color === colorHex ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900' : ''}`}
                      style={{ backgroundColor: colorHex }}
                    />
                  ))}
                </div>

                {/* Arrow Nudge Pad */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateElementPosition(selectedElement.id, Math.max(2, selectedElement.x - 1), selectedElement.y, true)}
                    className="h-7 w-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-200 active:bg-indigo-600"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementPosition(selectedElement.id, selectedElement.x, Math.max(2, selectedElement.y - 1), true)}
                    className="h-7 w-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-200 active:bg-indigo-600"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementPosition(selectedElement.id, selectedElement.x, Math.min(98, selectedElement.y + 1), true)}
                    className="h-7 w-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-200 active:bg-indigo-600"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementPosition(selectedElement.id, Math.min(98, selectedElement.x + 1), selectedElement.y, true)}
                    className="h-7 w-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-200 active:bg-indigo-600"
                  >
                    →
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobilePanel('properties')}
                    className="ml-1 rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-indigo-500 whitespace-nowrap"
                  >
                    Props →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Properties Inspector */}
        <div
          className={`w-full lg:w-72 shrink-0 border-l border-slate-200 bg-white p-4 overflow-y-auto dark:border-slate-800 dark:bg-slate-900 ${
            mobilePanel === 'properties' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-indigo-600" />
              Properties Inspector
            </h4>
            {selectedElement && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDuplicateElement(selectedElement.id)}
                  title="Duplicate element"
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  title="Delete element"
                  className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {selectedElement ? (
            <div className="space-y-4 text-xs">
              {/* Logo / Image Element Controls */}
              {selectedElement.type === 'logo' || selectedElement.type === 'image' ? (
                <div className="space-y-3">
                  <h5 className="font-semibold text-slate-800 dark:text-slate-200">
                    Institutional Logo & Image Source
                  </h5>

                  <div>
                    <label className="text-[10px] text-slate-500">Image URL / Path</label>
                    <input
                      type="text"
                      value={selectedElement.url || template.institution.primaryLogoUrl || '/logo.png'}
                      onChange={(e) => updateSelectedElement({ url: e.target.value })}
                      className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      placeholder="e.g. /logo.png or https://..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Upload File
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              updateSelectedElement({ url: evt.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedElement({
                          url: template.institution.primaryLogoUrl || '/logo.png'
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Use Inst. Logo
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Opacity</label>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                      onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 mt-1"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Content / Text */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Element Text / Formula
                    </label>
                    <textarea
                      rows={2}
                      value={selectedElement.content}
                      onChange={(e) => updateSelectedElement({ content: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Typography Controls */}
                  <div className="border-t border-slate-100 pt-3 dark:border-slate-800 space-y-2.5">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Typography</h5>

                    <div>
                      <label className="text-[10px] text-slate-500">Font Family</label>
                      <select
                        value={selectedElement.fontFamily || 'Montserrat'}
                        onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="Cinzel">Cinzel (Regal Institutional)</option>
                        <option value="Playfair Display">Playfair Display (Serif Elegance)</option>
                        <option value="Cormorant Garamond">Cormorant Garamond (Academic)</option>
                        <option value="Montserrat">Montserrat (Clean Sans-Serif)</option>
                        <option value="Great Vibes">Great Vibes (Script Calligraphy)</option>
                        <option value="Alex Brush">Alex Brush (Chancellor Script)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500">Font Size (px)</label>
                        <input
                          type="number"
                          value={selectedElement.fontSize || 14}
                          onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) || 14 })}
                          className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">Weight</label>
                        <select
                          value={selectedElement.fontWeight || '400'}
                          onChange={(e) => updateSelectedElement({ fontWeight: e.target.value })}
                          className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="400">Regular 400</option>
                          <option value="500">Medium 500</option>
                          <option value="600">Semibold 600</option>
                          <option value="700">Bold 700</option>
                          <option value="800">Black 800</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500">Alignment</label>
                        <select
                          value={selectedElement.textAlign || 'center'}
                          onChange={(e) => updateSelectedElement({ textAlign: e.target.value as any })}
                          className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">Letter Spacing</label>
                        <input
                          type="number"
                          value={selectedElement.letterSpacing || 0}
                          onChange={(e) => updateSelectedElement({ letterSpacing: parseInt(e.target.value) || 0 })}
                          className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500">Text Color</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <input
                          type="color"
                          value={selectedElement.color || '#0f172a'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="h-7 w-8 rounded cursor-pointer border"
                        />
                        <input
                          type="text"
                          value={selectedElement.color || '#0f172a'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Position & Layout */}
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 space-y-2.5">
                <h5 className="font-semibold text-slate-800 dark:text-slate-200">Position (% of Canvas)</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">X Position (%)</label>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateSelectedElement({ x: parseFloat(e.target.value) || 0 })}
                      className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Y Position (%)</label>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateSelectedElement({ y: parseFloat(e.target.value) || 0 })}
                      className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500">Width (% container)</label>
                  <input
                    type="number"
                    value={selectedElement.width || 70}
                    onChange={(e) => updateSelectedElement({ width: parseFloat(e.target.value) || 50 })}
                    className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Quick Align Presets */}
                <div className="pt-2">
                  <label className="text-[10px] text-slate-500 block mb-1.5 font-medium">Quick Align</label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleAlign('left')}
                      className="rounded border border-slate-200 bg-slate-50 py-1 text-[10px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300"
                    >
                      Left (25%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('center-x')}
                      className="rounded border border-slate-200 bg-slate-50 py-1 text-[10px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300"
                    >
                      Center X (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('right')}
                      className="rounded border border-slate-200 bg-slate-50 py-1 text-[10px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300"
                    >
                      Right (75%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('top')}
                      className="rounded border border-slate-200 bg-slate-50 py-1 text-[10px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300"
                    >
                      Top (20%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('center-y')}
                      className="rounded border border-slate-200 bg-slate-50 py-1 text-[10px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300"
                    >
                      Center Y (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAlign('bottom')}
                      className="rounded border border-slate-200 bg-slate-50 py-1 text-[10px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300"
                    >
                      Bottom (80%)
                    </button>
                  </div>
                </div>

                {/* Layer Hierarchy Ordering */}
                <div className="pt-2">
                  <label className="text-[10px] text-slate-500 block mb-1 font-medium">Layer Stacking Order</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBringToFront(selectedElement.id)}
                      className="flex items-center justify-center gap-1 rounded border border-slate-200 bg-white py-1 px-2 text-[10.5px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <ArrowUp className="h-3 w-3 text-indigo-500" />
                      Bring to Front
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendToBack(selectedElement.id)}
                      className="flex items-center justify-center gap-1 rounded border border-slate-200 bg-white py-1 px-2 text-[10.5px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <ArrowDown className="h-3 w-3 text-slate-400" />
                      Send to Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-950 dark:bg-indigo-950/30">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Certificate Canvas &amp; Framing
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Adjust global canvas frame, border preset, background tones, and guilloche security patterns.
                </p>
              </div>

              {/* Quick Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Border Style Preset
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: 'classic-gold', name: 'Classic Gold Flourish', icon: '🏛️' },
                    { id: 'double-academic', name: 'Double Academic Frame', icon: '🎓' },
                    { id: 'geometric-tech', name: 'Geometric Tech Frame', icon: '⚡' },
                    { id: 'modern-minimal', name: 'Modern Minimal Keyline', icon: '✨' },
                    { id: 'ornate-royal', name: 'Ornate Royal Rosette', icon: '👑' },
                    { id: 'none', name: 'No Border (Full Bleed)', icon: '🚫' }
                  ].map((preset) => {
                    const isSel = template.border.preset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          pushHistory({
                            ...template,
                            border: { ...template.border, preset: preset.id as any }
                          })
                        }
                        className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium text-left transition-all ${
                          isSel
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-200 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{preset.icon}</span>
                          <span>{preset.name}</span>
                        </span>
                        {isSel && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Background Color & Pattern */}
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Canvas Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        pushHistory({
                          ...template,
                          backgroundColor: e.target.value
                        })
                      }
                      className="h-7 w-8 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={template.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        pushHistory({
                          ...template,
                          backgroundColor: e.target.value
                        })
                      }
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Security Background Pattern
                  </label>
                  <select
                    value={template.backgroundPattern || 'none'}
                    onChange={(e) =>
                      pushHistory({
                        ...template,
                        backgroundPattern: e.target.value as any
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="none">None (Clean Background)</option>
                    <option value="guilloche">Guilloche Security Lattice</option>
                    <option value="dots">Subtle Micro-Dots</option>
                    <option value="lines">Fine Security Waves</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
