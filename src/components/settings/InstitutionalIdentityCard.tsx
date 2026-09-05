import React, { useState } from 'react';
import {
  Building2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  Award,
  Layers,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sliders,
  Trash2,
  Stamp
} from 'lucide-react';
import { InstitutionDetails } from '../../types';
import { StorageService } from '../../lib/storage';

interface InstitutionalIdentityCardProps {
  onNotify?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const InstitutionalIdentityCard: React.FC<InstitutionalIdentityCardProps> = ({ onNotify }) => {
  const [profile, setProfile] = useState<InstitutionDetails>(() =>
    StorageService.getInstitutionProfile()
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = <K extends keyof InstitutionDetails>(
    field: K,
    value: InstitutionDetails[K]
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'primaryLogoUrl' | 'secondaryLogoUrl' | 'watermarkUrl' | 'officialStampUrl' | 'officialSealUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify?.('Please select a valid image file (PNG, SVG, JPEG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      handleFieldChange(targetField, dataUrl);
      onNotify?.('Institutional image asset uploaded and ready for certificates!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (syncToTemplates = false) => {
    setIsSaving(true);
    StorageService.saveInstitutionProfile(profile);

    // Synchronize WhatsApp sender configuration with updated institutional identity
    try {
      const currentWa = StorageService.getWhatsAppConfig();
      if (currentWa) {
        StorageService.saveWhatsAppConfig({
          ...currentWa,
          institutionName: profile.name
        });
      }
    } catch (e) {
      console.error('Failed to sync WhatsApp institution name', e);
    }

    if (syncToTemplates) {
      const count = StorageService.applyIdentityAndSignaturesToTemplates(profile);
      onNotify?.(
        `Institutional identity, logo, and WhatsApp broadcast sender synced across ${count} certificate templates!`,
        'success'
      );
    } else {
      onNotify?.('Institutional identity and sender profile saved successfully.', 'success');
    }

    setTimeout(() => setIsSaving(false), 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              <Building2 className="h-3.5 w-3.5" />
              Institutional Identity & Branding
            </span>
            <span className="text-xs text-slate-400">• Certificate Seal & Logo</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Institutional Identity & Logo Setup
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Configure your organization’s official emblem, accreditation logo, and identity metadata. The primary logo set here will be displayed on all issued certificates, verification pages, and email notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Save & Sync to Templates
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700 transition-all"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* SECTION 1: Institutional Logo & Visual Insignia Management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Certificate Logo & Official Insignia
              </h3>
              <p className="text-xs text-slate-500">
                The institutional logo that will be shown at the top of your certificates and verification portals.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> High-Resolution Ready
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Logo Uploader / URL Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Certificate Logo (Upload or URL)
              </label>

              {/* Upload Dropzone */}
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <label className="flex-1 cursor-pointer flex items-center gap-3 w-full sm:w-auto">
                  <div className="rounded-lg bg-indigo-600 p-2.5 text-white shadow-xs">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      Upload Logo Image File
                    </span>
                    <p className="text-[11px] text-slate-400">PNG, SVG, JPG or WebP (Transparent recommended)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={(e) => handleLogoUpload(e, 'primaryLogoUrl')}
                    className="hidden"
                  />
                </label>

                {profile.primaryLogoUrl && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('primaryLogoUrl', '')}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>

            {/* Direct Image URL fallback & Quick presets */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Or enter Logo Image Path / URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. /logo.png or https://example.com/crest.png"
                  value={profile.primaryLogoUrl || ''}
                  onChange={(e) => handleFieldChange('primaryLogoUrl', e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleFieldChange('primaryLogoUrl', '/logo.png')}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  title="Use official app logo"
                >
                  Use CertiFlow Logo
                </button>
              </div>
            </div>

            {/* Certificate Display Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Header Placement on Certificates
                </label>
                <select
                  value={profile.logoPosition || 'top-center'}
                  onChange={(e) => handleFieldChange('logoPosition', e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="top-center">Top Center (Above Title)</option>
                  <option value="top-left">Top Left Corner</option>
                  <option value="top-right">Top Right Corner</option>
                  <option value="watermark">Background Center Watermark</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Logo Width Scale ({profile.logoWidthPercent || 14}%)
                </label>
                <input
                  type="range"
                  min={6}
                  max={30}
                  value={profile.logoWidthPercent || 14}
                  onChange={(e) => handleFieldChange('logoWidthPercent', parseInt(e.target.value) || 14)}
                  className="w-full accent-indigo-600 mt-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="showLogoOnCertificate"
                checked={profile.showLogoOnCertificate !== false}
                onChange={(e) => handleFieldChange('showLogoOnCertificate', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="showLogoOnCertificate" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Display institutional logo automatically on generated certificates
              </label>
            </div>
          </div>

          {/* Dual-Backdrop Live Visual Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Live Certificate Logo Preview
            </label>

            {/* Light Parchment Preview Card */}
            <div className="rounded-xl border border-amber-100 bg-[#fdfbf7] p-4 flex flex-col items-center justify-center text-center shadow-inner h-32 relative overflow-hidden">
              <span className="absolute top-2 left-2.5 text-[9px] font-bold uppercase tracking-wider text-amber-800/60 bg-amber-100/60 px-1.5 py-0.5 rounded">
                Certificate Parchment Canvas
              </span>
              {profile.primaryLogoUrl ? (
                <img
                  src={profile.primaryLogoUrl}
                  alt="Institutional Logo Light Preview"
                  className="max-h-20 max-w-[85%] object-contain drop-shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-slate-400 text-xs flex flex-col items-center">
                  <ImageIcon className="h-6 w-6 mb-1 opacity-40" />
                  <span>No logo set (Upload above)</span>
                </div>
              )}
            </div>

            {/* Dark Mode Preview Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col items-center justify-center text-center shadow-inner h-28 relative overflow-hidden">
              <span className="absolute top-2 left-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                Dark Mode / Portal Transparency
              </span>
              {profile.primaryLogoUrl ? (
                <img
                  src={profile.primaryLogoUrl}
                  alt="Institutional Logo Dark Preview"
                  className="max-h-16 max-w-[85%] object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-slate-600 text-xs flex flex-col items-center">
                  <ImageIcon className="h-5 w-5 mb-1 opacity-30" />
                  <span>No logo set</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary / Partner Seal & Watermark Opacity Section */}
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Secondary Seal */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Secondary / Accreditation Seal (Optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Image URL or upload"
                value={profile.secondaryLogoUrl || ''}
                onChange={(e) => handleFieldChange('secondaryLogoUrl', e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                Browse
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => handleLogoUpload(e, 'secondaryLogoUrl')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Watermark Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Emblem Watermark Opacity
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round(profile.watermarkOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.25}
              step={0.01}
              value={profile.watermarkOpacity}
              onChange={(e) => handleFieldChange('watermarkOpacity', parseFloat(e.target.value) || 0.08)}
              className="w-full accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">
              Subtle background opacity for the institutional watermark emblem on certificates.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Official Institutional Stamp & Embossed Seal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Stamp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Institutional Stamp & Embossed Seal
              </h3>
              <p className="text-xs text-slate-500">
                Upload your official institutional wax seal, registrar stamp emblem, or department ink seal. Saving will automatically replace the stamp/seal on all certificate templates.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Official Authentication
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Official Stamp Upload Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Official Institutional Stamp (Ink/Digital)
                </label>
                <p className="text-[11px] text-slate-500">
                  Registrar office stamp, department crest, or digital verification stamp.
                </p>
              </div>
              {profile.officialStampUrl && (
                <button
                  type="button"
                  onClick={() => handleFieldChange('officialStampUrl', '')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800 hover:border-amber-500 transition-colors">
                <Upload className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {profile.officialStampUrl ? 'Replace Stamp Image' : 'Upload Stamp File'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => handleLogoUpload(e, 'officialStampUrl')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Stamp URL Input */}
            <input
              type="text"
              placeholder="Or enter Image URL (e.g. /stamp.png)"
              value={profile.officialStampUrl || ''}
              onChange={(e) => handleFieldChange('officialStampUrl', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
            />

            {/* Live Stamp Canvas Preview */}
            <div className="rounded-lg border border-amber-200/60 bg-[#fffdf8] p-3 flex items-center justify-center min-h-[100px] relative">
              <span className="absolute top-1.5 left-2 text-[9px] font-bold uppercase text-amber-800/60">
                Parchment Preview
              </span>
              {profile.officialStampUrl ? (
                <img
                  src={profile.officialStampUrl}
                  alt="Official Institutional Stamp"
                  className="max-h-20 max-w-[80%] object-contain drop-shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs text-slate-400 italic">No custom stamp uploaded</span>
              )}
            </div>
          </div>

          {/* Official Seal Upload Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Official Institutional Seal (Wax/Embossed)
                </label>
                <p className="text-[11px] text-slate-500">
                  University emblem seal, gold wax medal seal, or accreditation crest.
                </p>
              </div>
              {profile.officialSealUrl && (
                <button
                  type="button"
                  onClick={() => handleFieldChange('officialSealUrl', '')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800 hover:border-amber-500 transition-colors">
                <Upload className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {profile.officialSealUrl ? 'Replace Seal Image' : 'Upload Seal File'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => handleLogoUpload(e, 'officialSealUrl')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Seal URL Input */}
            <input
              type="text"
              placeholder="Or enter Image URL (e.g. /seal.png)"
              value={profile.officialSealUrl || ''}
              onChange={(e) => handleFieldChange('officialSealUrl', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
            />

            {/* Live Seal Canvas Preview */}
            <div className="rounded-lg border border-amber-200/60 bg-[#fffdf8] p-3 flex items-center justify-center min-h-[100px] relative">
              <span className="absolute top-1.5 left-2 text-[9px] font-bold uppercase text-amber-800/60">
                Parchment Preview
              </span>
              {profile.officialSealUrl ? (
                <img
                  src={profile.officialSealUrl}
                  alt="Official Institutional Seal"
                  className="max-h-20 max-w-[80%] object-contain drop-shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs text-slate-400 italic">No custom seal uploaded</span>
              )}
            </div>
          </div>
        </div>

        {/* Sync Prompt Bar */}
        <div className="rounded-xl bg-amber-50/80 p-3.5 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-900 dark:text-amber-200">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Click <strong>Save & Sync to Templates</strong> to automatically apply your official stamp and seal across all certificate templates.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync All Templates
          </button>
        </div>
      </div>

      {/* SECTION 3: Official Institutional Profile Metadata */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center gap-2">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Institutional Profile & Legal Registration
            </h3>
            <p className="text-xs text-slate-500">
              Institutional names, official accreditation status, and verification contact coordinates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Official Institution Name *
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="e.g. Global Institute of Science & Technology"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
            />
          </div>

          {/* Short Acronym */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Short Name / Acronym
            </label>
            <input
              type="text"
              value={profile.shortName}
              onChange={(e) => handleFieldChange('shortName', e.target.value)}
              placeholder="e.g. GIST Academy"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Org Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Organization Category
            </label>
            <select
              value={profile.orgType}
              onChange={(e) => handleFieldChange('orgType', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="Higher Education / University">Higher Education / University</option>
              <option value="Polytechnic / College">Polytechnic / College</option>
              <option value="Vocational / Training Academy">Vocational / Training Academy</option>
              <option value="Corporate Enterprise Certification">Corporate Enterprise Certification</option>
              <option value="Professional Association / NGO">Professional Association / NGO</option>
              <option value="K-12 School / Board">K-12 School / Board</option>
            </select>
          </div>

          {/* Department / Faculty */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Department / Faculty Division
            </label>
            <input
              type="text"
              value={profile.department}
              onChange={(e) => handleFieldChange('department', e.target.value)}
              placeholder="e.g. Faculty of Computer Science"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Campus */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Campus / Center
            </label>
            <input
              type="text"
              value={profile.campus}
              onChange={(e) => handleFieldChange('campus', e.target.value)}
              placeholder="e.g. Main Research Campus"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Tagline / Motto */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Official Motto / Tagline
            </label>
            <input
              type="text"
              value={profile.tagline}
              onChange={(e) => handleFieldChange('tagline', e.target.value)}
              placeholder="e.g. Excellence in Innovation, Scholarship, and Leadership"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Accreditation Notice */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Official Accreditation & Regulatory Notice
            </label>
            <input
              type="text"
              value={profile.accreditation}
              onChange={(e) => handleFieldChange('accreditation', e.target.value)}
              placeholder="e.g. Accredited by the Global Board of Higher Education (ABHE-2024)"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Verification Website */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Globe className="h-3 w-3 text-slate-400" /> Official Website
            </label>
            <input
              type="url"
              value={profile.website}
              onChange={(e) => handleFieldChange('website', e.target.value)}
              placeholder="https://gist.edu"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Verification Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Mail className="h-3 w-3 text-slate-400" /> Verification Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="credentials@gist.edu"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Hotline Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Phone className="h-3 w-3 text-slate-400" /> Registrar Phone
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              placeholder="+1 (415) 890-2100"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Physical Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" /> Street Address
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="450 Innovation Parkway, University District"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* City, State, Country */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              City & State
            </label>
            <input
              type="text"
              value={`${profile.city}, ${profile.state}`}
              onChange={(e) => {
                const parts = e.target.value.split(',');
                handleFieldChange('city', parts[0]?.trim() || '');
                if (parts[1]) handleFieldChange('state', parts[1]?.trim());
              }}
              placeholder="San Francisco, California"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Footer Save Row */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
            Save & Sync to Templates
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
