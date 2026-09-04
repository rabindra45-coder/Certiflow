import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/Toast';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { DashboardView } from './components/dashboard/DashboardView';
import { CertificateMakerView } from './components/maker/CertificateMakerView';
import { AutomationView } from './components/automation/AutomationView';
import { VerificationPortal } from './components/verification/VerificationPortal';
import { CertificateLibraryView } from './components/library/CertificateLibraryView';
import { CampaignsView } from './components/campaigns/CampaignsView';
import { SettingsView } from './components/settings/SettingsView';
import { CertificateTemplate, MainTab, SecondaryNav, ToastNotification, ThemeConfig } from './types';
import { StorageService } from './lib/storage';
import { applyThemeToDom, DEFAULT_THEME_CONFIG } from './lib/theme';
import { ShieldCheck, Sun, Moon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('maker');
  const [currentSection, setCurrentSection] = useState<SecondaryNav>('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  // Theme configuration state
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    return StorageService.getThemeConfig();
  });

  // Check if initial URL represents a standalone verification lookup
  const [isVerificationLocked, setIsVerificationLocked] = useState<boolean>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryId = searchParams.get('id');
    const hash = window.location.hash;
    return Boolean(queryId || (hash.includes('verify') && hash.includes('id=')));
  });

  const [selectedVerifyCertId, setSelectedVerifyCertId] = useState<string>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryId = searchParams.get('id');
    if (queryId) return queryId.trim();

    const hash = window.location.hash;
    if (hash.includes('id=')) {
      const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(hashQuery);
      const hashId = params.get('id');
      if (hashId) return hashId.trim();
    }
    return 'TECH-2025-001001';
  });

  useEffect(() => {
    StorageService.initializeStore().then(() => {
      const loadedTheme = StorageService.getThemeConfig();
      setThemeConfig(loadedTheme);
      applyThemeToDom(loadedTheme);
      setIsInitializing(false);
    });
  }, []);

  // Sync theme with DOM whenever themeConfig changes
  useEffect(() => {
    applyThemeToDom(themeConfig);
  }, [themeConfig]);

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const isEffectiveDark =
    themeConfig.mode === 'dark' ||
    (themeConfig.mode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleDarkMode = () => {
    const isCurrentlyDark =
      document.documentElement.classList.contains('dark') ||
      themeConfig.mode === 'dark' ||
      (themeConfig.mode === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    const newMode: 'light' | 'dark' = isCurrentlyDark ? 'light' : 'dark';
    const updated: ThemeConfig = { ...themeConfig, mode: newMode };
    setThemeConfig(updated);
    StorageService.saveThemeConfig(updated);
    applyThemeToDom(updated);
  };

  // Handle URL routing for verification (supports both ?id=... and #verify?id=...)
  useEffect(() => {
    const handleUrlRouting = () => {
      // 1. Check query parameters first (?id=...)
      const searchParams = new URLSearchParams(window.location.search);
      const queryId = searchParams.get('id');
      if (queryId) {
        setSelectedVerifyCertId(queryId.trim());
        setCurrentSection('verification');
        setIsVerificationLocked(true);
        return;
      }

      // 2. Check hash routing (#verify?id=... or #verify/id)
      const hash = window.location.hash;
      if (hash.includes('verify')) {
        const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(hashQuery);
        const hashId = params.get('id');
        if (hashId) {
          setSelectedVerifyCertId(hashId.trim());
          setIsVerificationLocked(true);
        } else {
          setIsVerificationLocked(false);
        }
        setCurrentSection('verification');
        return;
      }

      // Standard view: not locked to verification ID
      setIsVerificationLocked(false);
    };

    handleUrlRouting();
    window.addEventListener('hashchange', handleUrlRouting);
    window.addEventListener('popstate', handleUrlRouting);
    return () => {
      window.removeEventListener('hashchange', handleUrlRouting);
      window.removeEventListener('popstate', handleUrlRouting);
    };
  }, []);

  const addToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectTab = (tab: MainTab) => {
    setActiveTab(tab);
    setCurrentSection(tab);
  };

  const handleNavigateSection = (section: SecondaryNav) => {
    if (section === 'maker' || section === 'templates') {
      setActiveTab('maker');
    } else if (section === 'automation') {
      setActiveTab('automation');
    }
    setCurrentSection(section);
  };

  // Navigating to a specific verification ID locks into the standalone verification portal
  const handleSelectVerifyCertId = (id: string) => {
    setSelectedVerifyCertId(id);
    setIsVerificationLocked(true);
    setCurrentSection('verification');
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url.toString());
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // RESTRICTED VERIFICATION MODE:
  // When the user visits a verification ID, strictly lock down the interface.
  // Do NOT render the global header or navigation tabs. The user is prevented
  // from accessing the Certificate Maker, Automation, Campaigns, Settings, or any other system services.
  if (isVerificationLocked) {
    const institution = StorageService.getInstitutionProfile();
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        {/* Isolated Public Verification Registry Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                <img
                  src={institution.primaryLogoUrl || '/logo.png'}
                  alt="Institution Seal"
                  className="h-full w-full rounded-lg object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                  {institution.name}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                    <ShieldCheck className="h-3 w-3" /> Official Registry
                  </span>
                </span>
                <p className="text-[11px] text-slate-400">Institutional Credential Verification Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
                title={isEffectiveDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isEffectiveDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Verification View ONLY */}
        <main className="flex-1 overflow-y-auto">
          <VerificationPortal
            initialCertId={selectedVerifyCertId}
            isStandalone={true}
            onShowToast={addToast}
          />
        </main>

        {/* Official Registry Public Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          Official Institutional Verification Registry • All credentials cryptographically certified and tamper-evident.
        </footer>

        <ToastContainer toasts={toasts} onDismiss={removeToast} onCloseToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <OfflineIndicator />
      {/* Global Application Header */}
      <Header
        currentTab={activeTab}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentNav={currentSection}
        currentSection={currentSection}
        onSelectNav={handleNavigateSection}
        onNavigateSection={handleNavigateSection}
        institutionName={StorageService.getInstitutionProfile().name}
        isDarkMode={isEffectiveDark}
        darkMode={isEffectiveDark}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Active View Container */}
      <main className="flex flex-1 overflow-hidden">
        {currentSection === 'dashboard' && (
          <DashboardView
            onNavigateTab={handleSelectTab}
            onNavigateSection={handleNavigateSection}
            onSelectVerifyCertId={handleSelectVerifyCertId}
          />
        )}

        {(currentSection === 'maker' || currentSection === 'templates') && (
          <CertificateMakerView
            onSaveTemplate={(tpl) => {
              StorageService.saveTemplate(tpl);
            }}
            onShowToast={addToast}
          />
        )}

        {currentSection === 'automation' && (
          <AutomationView
            onShowToast={addToast}
            onNavigateToCertificates={() => handleNavigateSection('certificates')}
          />
        )}

        {currentSection === 'verification' && (
          <div className="flex-1 overflow-y-auto">
            <VerificationPortal
              initialCertId={selectedVerifyCertId}
              onShowToast={addToast}
            />
          </div>
        )}

        {currentSection === 'certificates' && (
          <CertificateLibraryView
            onVerifyCert={handleSelectVerifyCertId}
            onShowToast={addToast}
          />
        )}

        {currentSection === 'campaigns' && (
          <CampaignsView onShowToast={addToast} />
        )}

        {currentSection === 'settings' && (
          <SettingsView
            onShowToast={addToast}
            onThemeChanged={(newTheme) => {
              setThemeConfig(newTheme);
            }}
          />
        )}
      </main>

      {/* Interactive Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} onCloseToast={removeToast} />
    </div>
  );
}

