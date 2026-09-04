import React, { useState } from 'react';
import { Sparkles, Plus, Palette, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { CertificateTemplate } from '../../types';
import { SetupWizard } from './SetupWizard';
import { VisualDesigner } from './VisualDesigner';
import { INITIAL_TEMPLATES, StorageService } from '../../lib/storage';

interface CertificateMakerViewProps {
  onSaveTemplate: (template: CertificateTemplate) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CertificateMakerView: React.FC<CertificateMakerViewProps> = ({
  onSaveTemplate,
  onShowToast
}) => {
  const [activeMode, setActiveMode] = useState<'designer' | 'wizard'>('designer');
  const [currentTemplate, setCurrentTemplate] = useState<CertificateTemplate>(() => {
    const templates = StorageService.getTemplates();
    return templates[0] || INITIAL_TEMPLATES[0];
  });

  const handleWizardComplete = (newTemplate: CertificateTemplate) => {
    StorageService.saveTemplate(newTemplate);
    setCurrentTemplate(newTemplate);
    setActiveMode('designer');
    onSaveTemplate(newTemplate);
    onShowToast(
      'Template Initialized',
      `"${newTemplate.name}" was crafted via Setup Wizard and loaded into Visual Designer.`,
      'success'
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-2.5 gap-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
              TAB 1
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Institutional Certificate Maker
            </h3>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveMode('designer')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeMode === 'designer'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Canvas Designer</span>
            </button>

            <button
              onClick={() => setActiveMode('wizard')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeMode === 'wizard'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Setup Wizard</span>
            </button>
          </div>
        </div>

        {/* Create New Certificate Button */}
        {activeMode === 'designer' && (
          <button
            onClick={() => setActiveMode('wizard')}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
          >
            <Plus className="h-3.5 w-3.5" />
            New from Wizard
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeMode === 'wizard' ? (
          <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
            <SetupWizard
              onComplete={handleWizardComplete}
              onCancel={() => setActiveMode('designer')}
            />
          </div>
        ) : (
          <VisualDesigner
            initialTemplate={currentTemplate}
            onSaveTemplate={(tpl) => {
              setCurrentTemplate(tpl);
              onSaveTemplate(tpl);
            }}
            onOpenWizard={() => setActiveMode('wizard')}
            onShowToast={onShowToast}
          />
        )}
      </div>
    </div>
  );
};
