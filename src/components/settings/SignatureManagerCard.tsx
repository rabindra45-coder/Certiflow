import React, { useState } from 'react';
import {
  PenTool,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Upload,
  Sparkles,
  Type,
  FileSignature,
  Star,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Sliders,
  Layers
} from 'lucide-react';
import { InstitutionalSignature } from '../../types';
import { StorageService } from '../../lib/storage';
import { SignaturePad } from './SignaturePad';

interface SignatureManagerCardProps {
  onNotify?: (msg: string, type: 'success' | 'info' | 'error') => void;
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

export const SignatureManagerCard: React.FC<SignatureManagerCardProps> = ({ onNotify }) => {
  const [signatures, setSignatures] = useState<InstitutionalSignature[]>(() =>
    StorageService.getSignatures()
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [signatureToDelete, setSignatureToDelete] = useState<InstitutionalSignature | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formDesignation, setFormDesignation] = useState<string>('');
  const [formDepartment, setFormDepartment] = useState<string>('');
  const [formType, setFormType] = useState<'draw' | 'upload' | 'font'>('font');
  const [formStyle, setFormStyle] = useState<'script-1' | 'script-2' | 'script-3' | 'script-4'>('script-1');
  const [formImage, setFormImage] = useState<string>('');
  const [formIsDefault, setFormIsDefault] = useState<boolean>(false);

  const reloadSignatures = () => {
    setSignatures(StorageService.getSignatures());
  };

  const openNewSignatureModal = () => {
    setEditingId(null);
    setFormName('');
    setFormDesignation('');
    setFormDepartment('');
    setFormType('font');
    setFormStyle('script-1');
    setFormImage('');
    setFormIsDefault(signatures.length === 0);
    setIsEditing(true);
  };

  const openEditSignatureModal = (sig: InstitutionalSignature) => {
    setEditingId(sig.id);
    setFormName(sig.name);
    setFormDesignation(sig.designation);
    setFormDepartment(sig.department || '');
    setFormType(sig.signatureType || 'font');
    setFormStyle(sig.signatureStyle || 'script-1');
    setFormImage(sig.signatureImage || '');
    setFormIsDefault(Boolean(sig.isDefault));
    setIsEditing(true);
  };

  const handleSaveSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDesignation.trim()) {
      onNotify?.('Please provide both signatory name and official designation.', 'error');
      return;
    }

    if (editingId) {
      StorageService.updateSignature(editingId, {
        name: formName.trim(),
        designation: formDesignation.trim(),
        department: formDepartment.trim() || undefined,
        signatureType: formType,
        signatureStyle: formStyle,
        signatureImage: formImage || undefined,
        isDefault: formIsDefault
      });
      onNotify?.('Signatory profile updated successfully.', 'success');
    } else {
      StorageService.addSignature({
        name: formName.trim(),
        designation: formDesignation.trim(),
        department: formDepartment.trim() || undefined,
        signatureType: formType,
        signatureStyle: formStyle,
        signatureImage: formImage || undefined,
        isDefault: formIsDefault,
        order: signatures.length + 1
      });
      onNotify?.('New authorized signatory added to institutional vault.', 'success');
    }

    reloadSignatures();
    setIsEditing(false);
  };

  const handleDeletePrompt = (sig: InstitutionalSignature) => {
    setSignatureToDelete(sig);
  };

  const handleConfirmDelete = () => {
    if (!signatureToDelete) return;
    const name = signatureToDelete.name;
    StorageService.deleteSignature(signatureToDelete.id);
    reloadSignatures();
    setSignatureToDelete(null);
    onNotify?.(`Removed "${name}" from institutional signatures.`, 'info');
  };

  const handleToggleDefault = (sig: InstitutionalSignature) => {
    StorageService.updateSignature(sig.id, { isDefault: !sig.isDefault });
    reloadSignatures();
    onNotify?.(
      sig.isDefault ? `Unset default status for ${sig.name}` : `Marked ${sig.name} as primary default signatory`,
      'success'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify?.('Please upload a valid image file (PNG, JPEG, WebP, SVG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      setFormImage(dataUrl);
      onNotify?.('Signature image loaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyToTemplates = () => {
    const count = StorageService.applyIdentityAndSignaturesToTemplates();
    onNotify?.(`Synchronized authorized signatures across ${count} certificate templates!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              <FileSignature className="h-3.5 w-3.5" />
              Institutional Signatory Vault
            </span>
            <span className="text-xs text-slate-400">• {signatures.length} Authorized</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Institutional Signature Management
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Manage official signatures for Deans, Chancellors, Directors, and Registrars. Signatures can be drawn on our digital canvas pad, uploaded as high-res images, or styled with calligraphic fonts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleApplyToTemplates}
            title="Sync these signatures to all certificate templates"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Sync to Templates
          </button>
          <button
            type="button"
            onClick={openNewSignatureModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add New Signatory
          </button>
        </div>
      </div>

      {/* List of Signatures */}
      {signatures.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <PenTool className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Authorized Signatures Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Add your institutional leadership signatures so they are automatically available when designing certificates and generating credentials.
          </p>
          <button
            type="button"
            onClick={openNewSignatureModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create First Signatory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {signatures.map((sig, idx) => (
            <div
              key={sig.id}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition-all dark:bg-slate-900 relative flex flex-col justify-between ${
                sig.isDefault
                  ? 'border-indigo-300 ring-2 ring-indigo-500/10 dark:border-indigo-800'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Card Top / Badges */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {sig.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                      <Star className="h-3 w-3 fill-indigo-600 text-indigo-600" />
                      Primary Signatory
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400 capitalize">
                    {sig.signatureType} Mode
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditSignatureModal(sig)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="Edit Signatory Details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePrompt(sig)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    title="Delete Signatory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Signature Visual Preview Box */}
              <div className="rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50/70 to-slate-100/40 p-4 h-28 flex items-center justify-center relative overflow-hidden dark:border-slate-800/80 dark:from-slate-800/40 dark:to-slate-900/40 mb-4">
                {sig.signatureType === 'draw' || sig.signatureType === 'upload' ? (
                  sig.signatureImage ? (
                    <img
                      src={sig.signatureImage}
                      alt={sig.name}
                      className="max-h-20 max-w-full object-contain filter dark:invert-0 drop-shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center text-xs text-slate-400">
                      <PenTool className="h-6 w-6 mx-auto mb-1 opacity-40" />
                      No image uploaded
                    </div>
                  )
                ) : (
                  <div
                    className="text-center text-slate-800 dark:text-slate-100 truncate px-2"
                    style={{
                      fontFamily:
                        CALLIGRAPHY_PRESETS.find((p) => p.id === sig.signatureStyle)?.fontFamily ||
                        "'Great Vibes', cursive",
                      fontSize: '28px',
                      lineHeight: '1.2'
                    }}
                  >
                    {sig.name}
                  </div>
                )}
              </div>

              {/* Signatory Metadata */}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {sig.name}
                </h4>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                  {sig.designation}
                </p>
                {sig.department && (
                  <p className="text-[11px] text-slate-400 truncate">
                    {sig.department}
                  </p>
                )}
              </div>

              {/* Toggle Default Footer */}
              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleToggleDefault(sig)}
                  className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                    sig.isDefault
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Star className={`h-3 w-3 ${sig.isDefault ? 'fill-indigo-600' : ''}`} />
                  {sig.isDefault ? 'Default Signatory' : 'Set as Default'}
                </button>
                <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Drawer for Add or Edit */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <FileSignature className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingId ? 'Edit Signatory Profile' : 'Add Authorized Signatory'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure institutional official credentials and signature rendering style.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSignature} className="space-y-5">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Signatory Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Sterling, Ph.D."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Title / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dean of Academic Affairs"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Office (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Academic Senate / Office of the Provost"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Signature Generation Method Tabs */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Signature Format Method
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('font')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      formType === 'font'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Type className="h-4 w-4" />
                    Calligraphy Font
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('draw')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      formType === 'draw'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <PenTool className="h-4 w-4" />
                    Draw on Pad
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('upload')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      formType === 'upload'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </button>
                </div>

                {/* Sub-panel 1: Calligraphy Presets */}
                {formType === 'font' && (
                  <div className="space-y-2.5 pt-2">
                    <p className="text-[11px] text-slate-500">
                      Choose an authentic calligraphic signature typeface for {formName || 'this signatory'}:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {CALLIGRAPHY_PRESETS.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => setFormStyle(preset.id as any)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all ${
                            formStyle === preset.id
                              ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            <span>{preset.name}</span>
                            {formStyle === preset.id && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                          </div>
                          <div
                            className="text-base sm:text-lg text-slate-800 dark:text-slate-100 truncate py-1"
                            style={{
                              fontFamily: preset.fontFamily,
                              fontStyle: preset.fontStyle || 'normal'
                            }}
                          >
                            {formName || 'Arthur Sterling'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-panel 2: Canvas Pad Drawing */}
                {formType === 'draw' && (
                  <div className="pt-2">
                    <SignaturePad
                      initialImage={formImage}
                      onSave={(dataUrl) => {
                        setFormImage(dataUrl);
                        onNotify?.('Signature captured from drawing pad!', 'success');
                      }}
                    />
                    {formImage && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Signature drawing captured & ready to save
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="text-xs font-bold text-rose-600 hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-panel 3: Image Upload */}
                {formType === 'upload' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/40">
                      {formImage ? (
                        <div className="space-y-3">
                          <img
                            src={formImage}
                            alt="Uploaded Signature"
                            className="max-h-24 max-w-full mx-auto object-contain drop-shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex items-center justify-center gap-3">
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
                        <label className="cursor-pointer space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-slate-400" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Click to upload high-resolution signature PNG / SVG
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Transparent background PNG or SVG recommended for cleanest certificate print
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
                  </div>
                )}
              </div>

              {/* Default Toggle */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="formDefault"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="formDefault" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Mark as primary institutional default signatory on newly designed certificates
                </label>
              </div>

              {/* Dialog Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700"
                >
                  <Check className="h-4 w-4" />
                  {editingId ? 'Save Changes' : 'Add Signatory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {signatureToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Remove Authorized Signatory?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">{signatureToDelete.name}</strong> ({signatureToDelete.designation}) from the institutional signatures vault?
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSignatureToDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-rose-600/30 hover:bg-rose-700"
              >
                <Trash2 className="h-4 w-4" />
                Yes, Delete Signatory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
