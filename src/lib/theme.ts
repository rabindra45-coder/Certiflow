import { ThemeConfig, ThemePreset } from '../types';

export interface ThemePresetDefinition {
  id: ThemePreset;
  name: string;
  tagline: string;
  description: string;
  category: 'Executive' | 'Academic' | 'Luxury' | 'Modern' | 'High-Contrast';
  primaryColor: string;
  secondaryColor: string;
  accentBgLight: string;
  accentBgDark: string;
  previewRing: string;
  icon: string;
  bestFor: string;
}

export const THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: 'executive-indigo',
    name: 'Executive Indigo & Slate',
    tagline: 'Standard Institutional & Enterprise Grade',
    description: 'Crisp indigo and slate blue designed for formal institutional records, clear readability, and administrative efficiency.',
    category: 'Executive',
    primaryColor: '#4f46e5',
    secondaryColor: '#0ea5e9',
    accentBgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accentBgDark: 'dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    previewRing: 'ring-indigo-500',
    icon: '💼',
    bestFor: 'Official University & Corporate Accreditations'
  },
  {
    id: 'emerald-campus',
    name: 'Emerald Ivy & Honors',
    tagline: 'Collegiate & Academic Distinction',
    description: 'Rich forest emerald with warm amber gold highlights reminiscent of Ivy League convocation and honors ceremonies.',
    category: 'Academic',
    primaryColor: '#059669',
    secondaryColor: '#d97706',
    accentBgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentBgDark: 'dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    previewRing: 'ring-emerald-500',
    icon: '🌲',
    bestFor: 'Academic Diplomas, Honor Societies & Research Fellowships'
  },
  {
    id: 'royal-violet',
    name: 'Royal Amethyst & Gold',
    tagline: 'Luxury Masterclass & Executive Leadership',
    description: 'Regal violet paired with luminous radiant gold accents, conveying premium mastery, leadership awards, and prestigious completion.',
    category: 'Luxury',
    primaryColor: '#7c3aed',
    secondaryColor: '#f59e0b',
    accentBgLight: 'bg-purple-50 text-purple-700 border-purple-200',
    accentBgDark: 'dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    previewRing: 'ring-purple-500',
    icon: '👑',
    bestFor: 'Executive Leadership, Masterclasses & Distinguished Awards'
  },
  {
    id: 'ocean-sapphire',
    name: 'Ocean Sapphire & Cyber Azure',
    tagline: 'Cloud Computing & Tech Certification',
    description: 'Electric azure and vibrant cyan palette engineered for technology institutes, coding bootcamps, and DevOps certifications.',
    category: 'Modern',
    primaryColor: '#0284c7',
    secondaryColor: '#06b6d4',
    accentBgLight: 'bg-sky-50 text-sky-700 border-sky-200',
    accentBgDark: 'dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    previewRing: 'ring-sky-500',
    icon: '⚡',
    bestFor: 'Tech Bootcamps, Cloud Certifications & Engineering'
  },
  {
    id: 'heritage-crimson',
    name: 'Heritage Crimson & Bronze',
    tagline: 'Distinguished Law & Historic Academy',
    description: 'Deep Harvard crimson with polished bronze accents for traditional law faculties, historical societies, and medical councils.',
    category: 'Academic',
    primaryColor: '#dc2626',
    secondaryColor: '#ca8a04',
    accentBgLight: 'bg-rose-50 text-rose-700 border-rose-200',
    accentBgDark: 'dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    previewRing: 'ring-rose-500',
    icon: '🍷',
    bestFor: 'Medical Councils, Bar Associations & Heritage Universities'
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian (OLED)',
    tagline: 'Deep Dark Focus & Precision Ops',
    description: 'Ultra-deep obsidian background with neon emerald and violet status indicators, optimized for low-light managerial auditing.',
    category: 'High-Contrast',
    primaryColor: '#6366f1',
    secondaryColor: '#10b981',
    accentBgLight: 'bg-slate-100 text-slate-800 border-slate-300',
    accentBgDark: 'dark:bg-slate-850 dark:text-slate-100 dark:border-slate-700',
    previewRing: 'ring-indigo-400',
    icon: '🌑',
    bestFor: 'Late Night High-Volume Credential Auditing & Issuance'
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber & Coral',
    tagline: 'Creative Arts & Innovation Studio',
    description: 'Energetic burnt amber and warm rose tones designed for design academies, workshop certificates, and culinary institutes.',
    category: 'Modern',
    primaryColor: '#ea580c',
    secondaryColor: '#f43f5e',
    accentBgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    accentBgDark: 'dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    previewRing: 'ring-amber-500',
    icon: '🌅',
    bestFor: 'Design Workshops, Creative Accreditations & Seminars'
  }
];

export const BRAND_COLOR_SWATCHES = [
  { name: 'Executive Indigo', hex: '#4f46e5' },
  { name: 'Oxford Navy', hex: '#1e3a8a' },
  { name: 'Cambridge Emerald', hex: '#059669' },
  { name: 'Monarch Violet', hex: '#7c3aed' },
  { name: 'Cyber Azure', hex: '#0284c7' },
  { name: 'Stanford Crimson', hex: '#dc2626' },
  { name: 'Burnt Bronze', hex: '#d97706' },
  { name: 'Teal Precision', hex: '#0d9488' },
  { name: 'Rose Quartz', hex: '#e11d48' },
  { name: 'Deep Slate', hex: '#334155' }
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  preset: 'executive-indigo',
  mode: 'light',
  primaryColor: '#4f46e5',
  secondaryColor: '#0ea5e9',
  density: 'comfortable',
  radius: 'smooth',
  font: 'modern-sans',
  enableAnimations: true,
  enableGlassmorphism: true,
  highContrast: false
};

/**
 * Applies the given ThemeConfig to the Document DOM, including CSS variables,
 * dark mode class, data attributes for density and font.
 */
export function applyThemeToDom(config: ThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Resolve effective dark mode
  let isDark = false;
  if (config.mode === 'dark') {
    isDark = true;
  } else if (config.mode === 'system') {
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = false;
  }

  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    try {
      localStorage.setItem('certiflow_theme', 'dark');
    } catch {}
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    try {
      localStorage.setItem('certiflow_theme', 'light');
    } catch {}
  }

  // 2. Set theme data attributes
  root.setAttribute('data-theme-preset', config.preset);
  root.setAttribute('data-density', config.density);
  root.setAttribute('data-radius', config.radius);
  root.setAttribute('data-font', config.font);

  // 3. Set CSS custom properties for dynamic color styling
  root.style.setProperty('--brand-primary', config.primaryColor || '#4f46e5');
  root.style.setProperty('--brand-secondary', config.secondaryColor || '#0ea5e9');

  // Hex to RGB for tailwind opacity support (e.g. rgba(var(--brand-primary-rgb), 0.1))
  const rgb = hexToRgb(config.primaryColor || '#4f46e5');
  if (rgb) {
    root.style.setProperty('--brand-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }

  // Set interface radius CSS variable
  let radiusValue = '0.75rem'; // smooth (12px)
  if (config.radius === 'sharp') radiusValue = '0.375rem'; // sharp (6px)
  if (config.radius === 'pill') radiusValue = '1.25rem'; // pill (20px)
  root.style.setProperty('--interface-radius', radiusValue);

  // High contrast mode helper
  if (config.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}
