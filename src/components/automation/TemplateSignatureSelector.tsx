import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  Plus,
  Check,
  Trash2,
  CheckCircle2,
  PenTool,
  Upload,
  Type,
  Sparkles,
  Sliders,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { SignatureConfig, InstitutionalSignature } from '../../types';
import { StorageService } from '../../lib/storage';
import { SignaturePad } from '../settings/SignaturePad';

interface TemplateSignatureSelectorProps {
  selectedSignatures: SignatureConfig[];
  onUpdateSignatures: (signatures: SignatureConfig[]) => void;
  onNotify?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  compact?: boolean;
}

const CALLIGRAPHY_PRESETS = [
  {
    id: 'script-1',
    name: 'Executive Calligraphy',
    fontFamily: "'Great Vibes', cursive",
    sampleText: 'Artistic & Prestigious'
  },
  {
    id: 'script-2',
    name: 'Chancellor Formal Script',
    fontFamily: "'Alex Brush', cursive",
    sampleText: 'Academic & Regal'
  },
  {
    id: 'script-3',
    name: 'Diplomatic Heritage',
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic',
    sampleText: 'Classic Distinguished'
  },
  {
    id: 'script-4',
    name: 'Presidential Monogram Script',
    fontFamily: "'Playfair Display', serif",
    fontStyle: 'italic',
    sampleText: 'Modern Executive'
  }
];

export const TemplateSignatureSelector: React.FC<TemplateSignatureSelectorProps> = ({
  selectedSignatures,
  onUpdateSignatures,
  onNotify,
  compact = false
}) => {
  const [availableSignatures, setAvailableSignatures] = useState<InstitutionalSignature[]>(() =>
    StorageService.getSignatures()
  );

  // Modal for adding new signature directly into Signature Management
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formDesignation, setFormDesignation] = useState<string>('');
  const [formDepartment, setFormDepartment] = useState<string>('');
  const [formType, setFormType] = useState<'draw' | 'upload' | 'font'>('font');
  const [formStyle, setFormStyle] = useState<'script-1' | 'script-2' | 'script-3' | 'script-4'>('script-1');
  const [formImage, setFormImage] = useState<string>('');
  const [formIsDefault, setFormIsDefault] = useState<boolean>(false);

  const reloadAvailableSignatures = () => {
    const list = StorageService.getSignatures();
    setAvailableSignatures(list);
    return list;
  };

  // Convert InstitutionalSignature to SignatureConfig
  const toSignatureConfig = (instSig: InstitutionalSignature, index: number): SignatureConfig => {
    return {
      id: `sig-${index + 1}-${instSig.id}`,
      name: instSig.name,
      designation: instSig.designation,
      department: instSig.department,
      signatureImage: instSig.signatureImage,
      signatureStyle:
        instSig.signatureStyle ||
        (instSig.signatureType === 'upload' || instSig.signatureType === 'draw' ? 'image' : 'script-1'),
      required: true
    };
  };

  // Check if an InstitutionalSignature is currently selected
  const isSignatureSelected = (instSig: InstitutionalSignature): boolean => {
    return selectedSignatures.some(
      (s) =>
        s.name.toLowerCase() === instSig.name.toLowerCase() &&
        s.designation.toLowerCase() === instSig.designation.toLowerCase()
    );
  };

  const getSelectedSlot = (instSig: InstitutionalSignature): number | null => {
    const idx = selectedSignatures.findIndex(
      (s) =>
        s.name.toLowerCase() === instSig.name.toLowerCase() &&
        s.designation.toLowerCase() === instSig.designation.toLowerCase()
    );
    return idx >= 0 ? idx + 1 : null;
  };

  // Toggle selection of a signature
  const handleToggleSignature = (instSig: InstitutionalSignature) => {
    if (isSignatureSelected(instSig)) {
      // Remove it
      const updated = selectedSignatures.filter(
        (s) =>
          !(
            s.name.toLowerCase() === instSig.name.toLowerCase() &&
            s.designation.toLowerCase() === instSig.designation.toLowerCase()
          )
      );
      onUpdateSignatures(updated);
      onNotify?.(
        'Signatory Removed',
        `Removed "${instSig.name}" from this certificate automation batch.`,
        'info'
      );
    } else {
      // Add it (cap at 3 signatories maximum for standard certificate layouts)
      if (selectedSignatures.length >= 3) {
        onNotify?.(
          'Maximum Signatories Reached',
          'Certificate layouts support up to 3 signatories (Left, Center, Right). Please unselect one before adding another.',
          'error'
        );
        return;
      }
      const newConfig = toSignatureConfig(instSig, selectedSignatures.length);
      const updated = [...selectedSignatures, newConfig];
      onUpdateSignatures(updated);
      onNotify?.(
        'Signatory Added',
        `Added "${instSig.name}" (${instSig.designation}) to certificate template.`,
        'success'
      );
    }
  };

  // Assign to specific slot (1, 2, or 3)
  const handleAssignToSlot = (instSig: InstitutionalSignature, slotIndex: number) => {
    const current = [...selectedSignatures];
    const newConfig = toSignatureConfig(instSig, slotIndex);
    
    // If the signature is already in the list, remove it first
    const filtered = current.filter(
      (s) =>
        !(
          s.name.toLowerCase() === instSig.name.toLowerCase() &&
          s.designation.toLowerCase() === instSig.designation.toLowerCase()
        )
    );

    // Insert or replace at slotIndex
    if (slotIndex < filtered.length) {
      filtered[slotIndex] = newConfig;
    } else {
      filtered.push(newConfig);
    }

    onUpdateSignatures(filtered);
    onNotify?.(
      'Signatory Assigned',
      `Assigned "${instSig.name}" as Signatory ${slotIndex + 1}.`,
      'success'
    );
  };

  const handleOpenAddModal = () => {
    setFormName('');
    setFormDesignation('');
    setFormDepartment('');
    setFormType('font');
    setFormStyle('script-1');
    setFormImage('');
    setFormIsDefault(availableSignatures.length === 0);
    setIsAddingNew(true);
  };

  const handleSaveNewSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDesignation.trim()) {
      onNotify?.(
        'Missing Information',
        'Please provide both the official signatory name and institutional designation.',
        'error'
      );
      return;
    }

    // Save directly into Signature Management Vault
    const newSig = StorageService.addSignature({
      name: formName.trim(),
      designation: formDesignation.trim(),
      department: formDepartment.trim() || undefined,
      signatureType: formType,
      signatureStyle: formStyle,
      signatureImage: formImage || undefined,
      isDefault: formIsDefault,
      order: availableSignatures.length + 1
    });

    const updatedList = reloadAvailableSignatures();

    // Automatically select this newly created signature for the template
    if (selectedSignatures.length < 3) {
      const newConfig = toSignatureConfig(newSig, selectedSignatures.length);
      onUpdateSignatures([...selectedSignatures, newConfig]);
    }

    setIsAddingNew(false);
    onNotify?.(
      'Signature Vault Updated',
      `Added "${newSig.name}" to Signature Management and assigned to template.`,
      'success'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify?.('Invalid File', 'Please upload a valid image file (PNG, SVG, WebP, JPEG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setFormImage(dataUrl);
      onNotify?.('Image Uploaded', 'Signature image loaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Authorized Signatories for Automation
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                <ShieldCheck className="h-3 w-3" />
                From Signature Management Vault Only
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Select or assign authorized signatories from your institutional vault to be stamped on all generated certificates.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          Add New Signatory to Vault
        </button>
      </div>

      {/* Assigned Slots Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Assigned Signatures Layout ({selectedSignatures.length} / 3)
          </span>
          {selectedSignatures.length === 0 ? (
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              ⚠️ Please select at least 1 signatory below
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Ready for issuance
            </span>
          )}
        </div>

        {selectedSignatures.length === 0 ? (
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-4 text-center dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
              No signatories currently assigned to this template
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
              Click on any authorized signatory card below to attach their signature to the certificate.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedSignatures.map((sig, idx) => {
              const cleanName = sig.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '');
              const slotLabels = ['Signatory 1 (Left)', 'Signatory 2 (Right)', 'Signatory 3 (Center)'];
              return (
                <div
                  key={sig.id || idx}
                  className="relative rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 dark:border-indigo-800 dark:bg-indigo-950/30 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      {slotLabels[idx] || `Signatory ${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = selectedSignatures.filter((_, i) => i !== idx);
                        onUpdateSignatures(updated);
                        onNotify?.('Removed Signatory', `Removed from slot ${idx + 1}.`, 'info');
                      }}
                      className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      title="Remove from certificate"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Visual Signature Mini */}
                  <div className="my-2 h-12 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center overflow-hidden px-2">
                    {sig.signatureImage ? (
                      <img
                        src={sig.signatureImage}
                        alt={sig.name}
                        className="max-h-10 max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : sig.signatureStyle === 'script-1' ? (
                      <span className="font-greatvibes text-xl text-slate-800 dark:text-slate-200 truncate">
                        {cleanName}
                      </span>
                    ) : sig.signatureStyle === 'script-2' ? (
                      <span className="font-alexbrush text-xl text-slate-800 dark:text-slate-200 truncate">
                        {cleanName}
                      </span>
                    ) : sig.signatureStyle === 'script-4' ? (
                      <span className="text-sm italic font-serif text-slate-800 dark:text-slate-200 font-bold truncate">
                        {cleanName}
                      </span>
                    ) : (
                      <span className="font-pinyon text-2xl text-slate-800 dark:text-slate-200 truncate">
                        {cleanName}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {sig.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {sig.designation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of Signatures from Signature Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
            Signatures Available in Signature Management ({availableSignatures.length})
          </h5>
          <span className="text-[11px] text-slate-400">
            Click to select or toggle for this template
          </span>
        </div>

        {availableSignatures.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-3">
              <FileSignature className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No Signatures in Vault
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You have not created any authorized signatures in Signature Management yet. Add your institution's first signatory now.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Signatory in Vault
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableSignatures.map((sig) => {
              const selected = isSignatureSelected(sig);
              const slot = getSelectedSlot(sig);
              const cleanName = sig.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '');

              return (
                <div
                  key={sig.id}
                  onClick={() => handleToggleSignature(sig)}
                  className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${
                    selected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 shadow-md dark:border-indigo-500 dark:bg-indigo-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  {/* Top Bar of Card */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {sig.isDefault && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          Default
                        </span>
                      )}
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400 capitalize">
                        {sig.signatureType}
                      </span>
                    </div>

                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                        selected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white group-hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      {selected ? (
                        <Check className="h-3 w-3 stroke-[3]" />
                      ) : (
                        <Plus className="h-3 w-3 text-slate-400 group-hover:text-indigo-600" />
                      )}
                    </div>
                  </div>

                  {/* Visual Signature Box */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 h-16 flex items-center justify-center relative overflow-hidden dark:border-slate-800 dark:bg-slate-800/40 mb-3">
                    {sig.signatureType === 'draw' || sig.signatureType === 'upload' ? (
                      sig.signatureImage ? (
                        <img
                          src={sig.signatureImage}
                          alt={sig.name}
                          className="max-h-12 max-w-full object-contain drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400">No Image</span>
                      )
                    ) : (
                      <span
                        className="text-slate-900 dark:text-slate-100 truncate px-2"
                        style={{
                          fontFamily:
                            CALLIGRAPHY_PRESETS.find((p) => p.id === sig.signatureStyle)?.fontFamily ||
                            "'Great Vibes', cursive",
                          fontSize: '22px'
                        }}
                      >
                        {cleanName}
                      </span>
                    )}
                  </div>

                  {/* Signatory Info */}
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {sig.name}
                    </h6>
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                      {sig.designation}
                    </p>
                    {sig.department && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {sig.department}
                      </p>
                    )}
                  </div>

                  {/* Footer Indicator */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    {selected ? (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Selected (Signatory {slot})
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium">
                        + Add to template
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-Place Add New Signature Modal (Direct to Signature Management) */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <FileSignature className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Add Authorized Signatory to Vault
                  </h3>
                  <p className="text-xs text-slate-500">
                    Creates an authorized signatory in Signature Management and assigns it to this template.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSignature} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Signatory Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Dr. Jonathan Sterling, Ph.D."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Designation / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Vice Chancellor & Provost"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Institutional Unit (Optional)
                </label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder="e.g. Academic Senate & Research Affairs"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Signature Method Picker */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Signature Generation Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('font')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      formType === 'font'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Type className="h-4 w-4" />
                    Calligraphy Font
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('draw')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      formType === 'draw'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <PenTool className="h-4 w-4" />
                    Digital Canvas Pad
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('upload')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      formType === 'upload'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </button>
                </div>
              </div>

              {/* Dynamic Mode UI */}
              {formType === 'font' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {CALLIGRAPHY_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => setFormStyle(preset.id as any)}
                        className={`cursor-pointer rounded-xl border p-3 transition-all ${
                          formStyle === preset.id
                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/40'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <span>{preset.name}</span>
                          {formStyle === preset.id && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                        </div>
                        <div
                          className="mt-2 text-center text-slate-900 dark:text-slate-100 truncate"
                          style={{
                            fontFamily: preset.fontFamily,
                            fontSize: '24px'
                          }}
                        >
                          {formName.trim() ? formName.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '') : 'Authorized Signatory'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formType === 'draw' && (
                <div className="space-y-2">
                  <SignaturePad
                    onSave={(dataUrl) => {
                      setFormImage(dataUrl);
                      onNotify?.('Drawing Captured', 'Signature drawing captured from pad.', 'success');
                    }}
                    initialImage={formImage}
                    width={560}
                    height={180}
                  />
                </div>
              )}

              {formType === 'upload' && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center dark:border-slate-700 dark:bg-slate-800/40">
                  {formImage ? (
                    <div className="space-y-3">
                      <img
                        src={formImage}
                        alt="Uploaded Signature"
                        className="max-h-24 max-w-full mx-auto object-contain drop-shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex items-center justify-center gap-2">
                        <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:underline">
                          Replace Image
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="text-xs font-bold text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer space-y-2 block">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Click to upload signature PNG or SVG
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Transparent background PNG or SVG recommended
                      </p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Default Signatory Checkbox */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="modalIsDefault"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="modalIsDefault" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Save as default primary signatory in Signature Management
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  <Check className="h-4 w-4" />
                  Save & Assign Signatory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
