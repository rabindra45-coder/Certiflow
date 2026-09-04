import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  Sparkles,
  RotateCcw,
  LayoutGrid,
  Type,
  Maximize2,
  ShieldCheck,
  Award,
  Send,
  Sliders,
  CheckCircle2,
  FileCheck2,
  TrendingUp
} from 'lucide-react';
import { ThemeConfig, ThemePreset, WorkspaceDensity, InterfaceRadius, InterfaceFont } from '../../types';
import {
  THEME_PRESETS,
  BRAND_COLOR_SWATCHES,
  DEFAULT_THEME_CONFIG,
  applyThemeToDom
} from '../../lib/theme';
import { StorageService } from '../../lib/storage';

interface ThemeManagementCardProps {
  onNotify?: (msg: string, type: 'success' | 'info' | 'error') => void;
  onThemeChanged?: (theme: ThemeConfig) => void;
}

export const ThemeManagementCard: React.FC<ThemeManagementCardProps> = ({
  onNotify,
  onThemeChanged
}) => {
  const [config, setConfig] = useState<ThemeConfig>(() => StorageService.getThemeConfig());
  const [isSaved, setIsSaved] = useState(false);

  // Sync with storage on mount
  useEffect(() => {
    const saved = StorageService.getThemeConfig();
    setConfig(saved);
  }, []);

  const handleApplyConfig = (newConfig: ThemeConfig, notifyText?: string) => {
    setConfig(newConfig);
    StorageService.saveThemeConfig(newConfig);
    applyThemeToDom(newConfig);

    if (onThemeChanged) {
      onThemeChanged(newConfig);
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);

    if (notifyText && onNotify) {
      onNotify(notifyText, 'success');
    }
  };

  const handleSelectPreset = (presetId: ThemePreset) => {
    const presetDef = THEME_PRESETS.find((p) => p.id === presetId);
    if (!presetDef) return;

    const updated: ThemeConfig = {
      ...config,
      preset: presetId,
      primaryColor: presetDef.primaryColor,
      secondaryColor: presetDef.secondaryColor,
      mode: presetId === 'midnight-obsidian' ? 'dark' : config.mode
    };

    handleApplyConfig(updated, `Applied "${presetDef.name}" theme preset`);
  };

  const handleResetDefault = () => {
    handleApplyConfig(DEFAULT_THEME_CONFIG, 'Reset theme to Executive Indigo default');
  };

  const currentPresetDef = THEME_PRESETS.find((p) => p.id === config.preset) || THEME_PRESETS[0];

  return (
    <div className="space-y-6">
      {/* Executive Card Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 shadow-inner">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Executive Theme &amp; Workspace Appearance
                </h3>
                {isSaved && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 animate-fade-in">
                    <CheckCircle2 className="h-3 w-3" /> Saved Live
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tailor the visual environment, color themes, display density, and branding palette for your managerial workflow.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            Reset Defaults
          </button>
        </div>

        {/* Section 1: Display Mode (Light / Dark / Auto) */}
        <div className="pt-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
            Display Appearance Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'light',
                name: 'Light Mode',
                desc: 'Crisp high-contrast daylight clarity',
                icon: Sun,
                iconColor: 'text-amber-500'
              },
              {
                id: 'dark',
                name: 'Executive Dark Mode',
                desc: 'Deep slate focus for reduced eye strain',
                icon: Moon,
                iconColor: 'text-indigo-400'
              },
              {
                id: 'system',
                name: 'System Synchronized',
                desc: 'Auto-adapts to your OS preferences',
                icon: Laptop,
                iconColor: 'text-slate-500'
              }
            ].map((modeOption) => {
              const isSelected = config.mode === modeOption.id;
              const IconComp = modeOption.icon;
              return (
                <button
                  key={modeOption.id}
                  type="button"
                  onClick={() =>
                    handleApplyConfig(
                      { ...config, mode: modeOption.id as any },
                      `Switched to ${modeOption.name}`
                    )
                  }
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 shadow-2xs dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <IconComp className={`h-4 w-4 ${isSelected ? 'text-white' : modeOption.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {modeOption.name}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {modeOption.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Preset Theme Gallery */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Institutional Theme Presets
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select an officially curated theme engineered for distinct institutional atmospheres.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {THEME_PRESETS.length} Curated Suites
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {THEME_PRESETS.map((preset) => {
            const isSelected = config.preset === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/30 dark:border-indigo-500 dark:bg-indigo-950/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-850 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{preset.icon}</span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {preset.name}
                        </h5>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {preset.tagline}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shrink-0 shadow-xs">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400">
                        {preset.category}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    {/* Swatches */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-4 w-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: preset.primaryColor }}
                        title={`Primary: ${preset.primaryColor}`}
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: preset.secondaryColor }}
                        title={`Secondary: ${preset.secondaryColor}`}
                      />
                    </div>

                    <span className="text-[10px] font-medium text-slate-400 truncate max-w-[140px]">
                      {preset.bestFor}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Brand Tint Customizer & Palette Swatches */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <Sliders className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Primary Brand &amp; Accent Tint Engine
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Fine-tune the exact hex tones used for buttons, interactive active rings, metric glows, and certificate accents.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Color Picker */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Primary Brand Color</span>
              <span className="font-mono text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                {config.primaryColor}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.primaryColor || '#4f46e5'}
                onChange={(e) =>
                  handleApplyConfig({ ...config, primaryColor: e.target.value })
                }
                className="h-9 w-12 rounded-lg cursor-pointer border border-slate-300 shrink-0"
              />
              <input
                type="text"
                value={config.primaryColor || '#4f46e5'}
                onChange={(e) =>
                  handleApplyConfig({ ...config, primaryColor: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="#4f46e5"
              />
            </div>

            {/* Quick Palette Swatches */}
            <div className="pt-2">
              <span className="text-[10.5px] text-slate-500 block mb-1.5">Executive Palette Swatches:</span>
              <div className="flex flex-wrap gap-1.5">
                {BRAND_COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() =>
                      handleApplyConfig(
                        { ...config, primaryColor: swatch.hex },
                        `Applied ${swatch.name} tint`
                      )
                    }
                    className="group relative flex items-center justify-center h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.name}
                  >
                    {config.primaryColor.toLowerCase() === swatch.hex.toLowerCase() && (
                      <Check className="h-3 w-3 text-white drop-shadow-xs" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Color Picker */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Secondary Accent Color</span>
              <span className="font-mono text-[11px] font-normal text-sky-600 dark:text-sky-400">
                {config.secondaryColor || '#0ea5e9'}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.secondaryColor || '#0ea5e9'}
                onChange={(e) =>
                  handleApplyConfig({ ...config, secondaryColor: e.target.value })
                }
                className="h-9 w-12 rounded-lg cursor-pointer border border-slate-300 shrink-0"
              />
              <input
                type="text"
                value={config.secondaryColor || '#0ea5e9'}
                onChange={(e) =>
                  handleApplyConfig({ ...config, secondaryColor: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="#0ea5e9"
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 leading-relaxed">
              Used for gradient highlights, secondary action links, certificate ribbons, and progress indicator tracks.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Workspace Layout, Density, Corner Radius & Typography */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Workspace Density */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Data Density
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Control the spacing and vertical padding across data tables and lists.
          </p>

          <div className="space-y-1.5">
            {[
              { id: 'compact', name: 'Compact Manager', desc: 'Maximum information visibility' },
              { id: 'comfortable', name: 'Comfortable Studio', desc: 'Balanced default layout' },
              { id: 'spacious', name: 'Spacious Presentation', desc: 'Expansive breathing room' }
            ].map((den) => {
              const isSel = config.density === den.id;
              return (
                <button
                  key={den.id}
                  type="button"
                  onClick={() =>
                    handleApplyConfig(
                      { ...config, density: den.id as WorkspaceDensity },
                      `Density set to ${den.name}`
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-lg border p-2 text-left text-xs transition-all ${
                    isSel
                      ? 'border-indigo-600 bg-indigo-50/70 font-bold text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <span>{den.name}</span>
                    <span className="block text-[10px] font-normal text-slate-400">{den.desc}</span>
                  </div>
                  {isSel && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interface Corner Radius */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Corner Radius
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Shape of UI cards, action buttons, modals, and container frames.
          </p>

          <div className="space-y-1.5">
            {[
              { id: 'sharp', name: 'Sharp Modern (6px)', desc: 'Clean fintech precision' },
              { id: 'smooth', name: 'Smooth Executive (12px)', desc: 'Balanced modern elegance' },
              { id: 'pill', name: 'Rounded Fluid (20px)', desc: 'Soft friendly curves' }
            ].map((rad) => {
              const isSel = config.radius === rad.id;
              return (
                <button
                  key={rad.id}
                  type="button"
                  onClick={() =>
                    handleApplyConfig(
                      { ...config, radius: rad.id as InterfaceRadius },
                      `Corner radius set to ${rad.name}`
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-lg border p-2 text-left text-xs transition-all ${
                    isSel
                      ? 'border-indigo-600 bg-indigo-50/70 font-bold text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <span>{rad.name}</span>
                    <span className="block text-[10px] font-normal text-slate-400">{rad.desc}</span>
                  </div>
                  {isSel && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Typography Suite */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Typography Style
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Primary font personality applied to dashboard metrics and headers.
          </p>

          <div className="space-y-1.5">
            {[
              { id: 'modern-sans', name: 'Modern Sans', desc: 'Plus Jakarta / Inter' },
              { id: 'academic-serif', name: 'Academic Serif', desc: 'Playfair / Cinzel' },
              { id: 'tech-clean', name: 'Tech Clean', desc: 'Montserrat / Space' }
            ].map((fnt) => {
              const isSel = config.font === fnt.id;
              return (
                <button
                  key={fnt.id}
                  type="button"
                  onClick={() =>
                    handleApplyConfig(
                      { ...config, font: fnt.id as InterfaceFont },
                      `Typography set to ${fnt.name}`
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-lg border p-2 text-left text-xs transition-all ${
                    isSel
                      ? 'border-indigo-600 bg-indigo-50/70 font-bold text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <span>{fnt.name}</span>
                    <span className="block text-[10px] font-normal text-slate-400">{fnt.desc}</span>
                  </div>
                  {isSel && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 5: Live Interactive Executive Preview Station */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Live Workspace &amp; Credential Preview
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time preview of how your dashboard cards, metric tiles, status pills, and certificates render in the active theme.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {currentPresetDef.name}
          </span>
        </div>

        {/* Mock UI Showcase */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/60 space-y-5">
          {/* Row 1: Mock Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Issued
                </span>
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-white text-xs"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">1,420</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3" /> +14.2% this session
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Verification Rate
                </span>
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-white text-xs"
                  style={{ backgroundColor: config.secondaryColor || '#0ea5e9' }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">99.8%</p>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3" /> Cryptographically Verified
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Dispatches
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs">
                  <Send className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">28 Channels</p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Direct Web &amp; SMTP Live
              </span>
            </div>
          </div>

          {/* Row 2: Mock Interactive Action Buttons & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
                style={{
                  backgroundColor: config.primaryColor,
                  boxShadow: `0 4px 12px ${config.primaryColor}33`
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Primary Manager Action</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <span>Secondary Action</span>
              </button>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ● Live &amp; Tamper-Proof
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold border"
                style={{
                  backgroundColor: `${config.primaryColor}15`,
                  color: config.primaryColor,
                  borderColor: `${config.primaryColor}30`
                }}
              >
                ★ Institutional Grade
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
