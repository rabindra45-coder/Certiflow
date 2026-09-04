import React from 'react';
import {
  Award,
  Sparkles,
  Send,
  LayoutDashboard,
  FolderOpen,
  FileCheck,
  MailCheck,
  ShieldCheck,
  Settings,
  Sun,
  Moon,
  Building2,
  Menu,
  X,
  Palette
} from 'lucide-react';
import { MainTab, SecondaryNav } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface HeaderProps {
  currentTab?: MainTab;
  activeTab?: MainTab;
  onSelectTab?: (tab: MainTab) => void;
  currentNav?: SecondaryNav;
  currentSection?: SecondaryNav;
  onSelectNav?: (nav: SecondaryNav) => void;
  onNavigateSection?: (nav: SecondaryNav) => void;
  institutionName?: string;
  isDarkMode?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab: propCurrentTab,
  activeTab,
  onSelectTab,
  currentNav: propCurrentNav,
  currentSection,
  onSelectNav,
  onNavigateSection,
  institutionName = 'Institutional Board',
  isDarkMode: propIsDarkMode,
  darkMode,
  onToggleDarkMode
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const currentTab = propCurrentTab || activeTab || 'maker';
  const currentNav = propCurrentNav || currentSection || 'dashboard';
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : Boolean(darkMode);

  const handleSelectNav = (nav: SecondaryNav) => {
    if (typeof onSelectNav === 'function') {
      onSelectNav(nav);
    }
    if (typeof onNavigateSection === 'function') {
      onNavigateSection(nav);
    }
  };

  const handleSelectTab = (tab: MainTab) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      {/* Top Utility Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleSelectNav('dashboard')}
            className="flex items-center gap-3 text-left transition-transform hover:scale-[1.01]"
            id="brand-logo-btn"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 dark:border-slate-800 dark:bg-slate-900">
              <img src="/logo.png" alt="Certiflow Logo" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Certi<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-700 uppercase dark:bg-indigo-950/60 dark:text-indigo-300">
                  INSTITUTIONAL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Advanced Certificate Creation & Automation
              </p>
            </div>
          </button>

          {/* Active Institution Badge */}
          <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="max-w-[200px] truncate font-medium">{institutionName}</span>
          </div>
        </div>

        {/* Primary Action Tabs (Prominent Centered/Right) */}
        <div className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
          <button
            onClick={() => {
              handleSelectTab('maker');
              handleSelectNav('maker');
            }}
            id="tab-btn-maker"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              currentTab === 'maker' && (currentNav === 'maker' || currentNav === 'templates')
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>TAB 1 — Certificate Maker</span>
          </button>

          <button
            onClick={() => {
              handleSelectTab('automation');
              handleSelectNav('automation');
            }}
            id="tab-btn-automation"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              currentTab === 'automation' && currentNav === 'automation'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Send className="h-4 w-4" />
            <span>TAB 2 — Certificate Automation</span>
          </button>
        </div>

        {/* Quick Utilities: Theme, Dark Mode, PWA Install, Mobile Menu */}
        <div className="flex items-center gap-2">
          <PWAInstallButton variant="header" />

          <button
            onClick={() => handleSelectNav('settings')}
            id="header-theme-settings-btn"
            title="Executive Theme & Appearance Settings"
            className="hidden sm:flex items-center gap-1.5 h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <Palette className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden lg:inline">Theme Studio</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            id="theme-toggle-btn"
            title="Toggle theme (Light / Dark)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Secondary Navigation Row */}
      <div className="hidden md:block border-t border-slate-100 bg-slate-50/50 px-4 py-1.5 dark:border-slate-800/60 dark:bg-slate-900/50 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => handleSelectNav('dashboard')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentNav === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </button>

            <button
              onClick={() => {
                handleSelectTab('maker');
                handleSelectNav('templates');
              }}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentNav === 'templates'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Saved Templates
            </button>

            <button
              onClick={() => handleSelectNav('certificates')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentNav === 'certificates'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              Generated Certificates
            </button>

            <button
              onClick={() => handleSelectNav('campaigns')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentNav === 'campaigns'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MailCheck className="h-3.5 w-3.5" />
              Campaigns
            </button>

            <button
              onClick={() => handleSelectNav('verification')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentNav === 'verification'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Public Verification Portal
            </button>

            <button
              onClick={() => handleSelectNav('settings')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentNav === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white p-4 md:hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-2 gap-2 pb-3">
            <button
              onClick={() => {
                handleSelectTab('maker');
                handleSelectNav('maker');
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-50 p-2.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            >
              <Sparkles className="h-4 w-4" />
              Certificate Maker
            </button>
            <button
              onClick={() => {
                handleSelectTab('automation');
                handleSelectNav('automation');
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 p-2.5 text-sm font-semibold text-white"
            >
              <Send className="h-4 w-4" />
              Automation
            </button>
          </div>
          <div className="flex flex-col gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'templates', label: 'Saved Templates', icon: FolderOpen },
              { id: 'certificates', label: 'Generated Certificates', icon: FileCheck },
              { id: 'campaigns', label: 'Campaigns', icon: MailCheck },
              { id: 'verification', label: 'Public Verification', icon: ShieldCheck },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleSelectNav(item.id as SecondaryNav);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
                  currentNav === item.id
                    ? 'bg-slate-100 font-semibold text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
