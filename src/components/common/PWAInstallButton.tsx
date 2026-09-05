import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (isInstalled) {
    if (variant === 'floating') return null;
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">App Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    const success = await install();
    if (success) {
      setInstalledSuccess(true);
    }
  };

  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          title="Download CertiFlow app to home screen"
          className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2 py-1.5 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 transition-all dark:border-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 dark:hover:bg-indigo-900 shrink-0"
        >
          <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden xs:inline">Install App</span>
          <span className="xs:hidden">App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">1</span>
                  <span>Tap the <strong>Share</strong> button in your Safari browser toolbar.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">2</span>
                  <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">3</span>
                  <span>Tap <strong>Add</strong> to launch CertiFlow directly as a standalone app!</span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Floating / Banner variant for mobile bottom bar
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 flex items-center justify-between gap-3 rounded-2xl bg-slate-900/95 text-white p-3 shadow-2xl backdrop-blur-md border border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-inner">
          <Download className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Download CertiFlow App</h4>
          <p className="text-[10px] text-slate-400">Install for offline creation & fast mobile access</p>
        </div>
      </div>
      <button
        onClick={handleInstallClick}
        className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 whitespace-nowrap"
      >
        Install
      </button>
    </div>
  );
};
