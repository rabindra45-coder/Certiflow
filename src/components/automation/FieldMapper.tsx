import React from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Wand2 } from 'lucide-react';
import { FieldMappingConfig } from '../../types';
import { SYSTEM_FIELDS } from '../../lib/csvHelper';

interface FieldMapperProps {
  sourceColumns: string[];
  mappings: FieldMappingConfig[];
  onChangeMapping: (targetField: string, newSourceCol: string) => void;
  onAutoMap: () => void;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  sourceColumns,
  mappings,
  onChangeMapping,
  onAutoMap
}) => {
  return (
    <div className="space-y-4">
      {/* Mapper Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Connect Spreadsheet Columns to Dynamic Certificate Variables
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Map imported spreadsheet columns to target placeholders. Fields marked required are essential for rendering.
          </p>
        </div>
        <button
          type="button"
          onClick={onAutoMap}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Auto-Detect Mappings
        </button>
      </div>

      {/* Visual Mapping Cards */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SYSTEM_FIELDS.map((field) => {
          const currentConfig = mappings.find((m) => m.targetField === field.key);
          const mappedCol = currentConfig?.sourceColumn || '';
          const isMapped = Boolean(mappedCol);

          return (
            <div
              key={field.key}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                isMapped
                  ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                  : field.required
                  ? 'border-rose-200 bg-rose-50/20 dark:border-rose-900/60 dark:bg-rose-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              {/* Target Variable */}
              <div className="flex-1 min-w-[120px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {field.label}
                  </span>
                  {field.required && (
                    <span className="text-[10px] font-semibold text-rose-500">*Req</span>
                  )}
                </div>
                <code className="text-[10px] text-indigo-600 font-mono dark:text-indigo-400">
                  {`{{${field.key}}}`}
                </code>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />

              {/* Source Column Dropdown */}
              <div className="flex-1 min-w-[140px]">
                <select
                  value={mappedCol}
                  onChange={(e) => onChangeMapping(field.key, e.target.value)}
                  className={`w-full rounded-lg border py-1.5 px-2.5 text-xs focus:outline-none ${
                    isMapped
                      ? 'border-emerald-400 bg-white font-medium text-emerald-900 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300'
                      : field.required
                      ? 'border-rose-300 bg-white font-medium text-rose-700 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-300'
                      : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <option value="">— Select Column —</option>
                  {sourceColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0">
                {isMapped ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : field.required ? (
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-dashed border-slate-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
