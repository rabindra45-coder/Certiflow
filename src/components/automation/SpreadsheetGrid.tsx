import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { RecipientRow } from '../../types';

interface SpreadsheetGridProps {
  rows: RecipientRow[];
  onUpdateRow: (id: string, updatedData: Partial<RecipientRow>) => void;
  onDeleteRow: (id: string) => void;
  selectedRowIds: Set<string>;
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  onDownloadSampleCsv: () => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  rows,
  onUpdateRow,
  onDeleteRow,
  selectedRowIds,
  onToggleSelectRow,
  onToggleSelectAll,
  onDownloadSampleCsv
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [sortField, setSortField] = useState<keyof RecipientRow>('recipientName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<RecipientRow>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Filter & Sort
  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        if (statusFilter === 'valid' && row.status === 'invalid') return false;
        if (statusFilter === 'invalid' && row.status !== 'invalid') return false;

        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          row.recipientName?.toLowerCase().includes(q) ||
          row.email?.toLowerCase().includes(q) ||
          row.courseName?.toLowerCase().includes(q) ||
          row.department?.toLowerCase().includes(q) ||
          row.studentId?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const valA = String(a[sortField] || '').toLowerCase();
        const valB = String(b[sortField] || '').toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [rows, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStartEdit = (row: RecipientRow) => {
    setEditingRowId(row.id);
    setEditingData({ ...row });
  };

  const handleSaveEdit = (id: string) => {
    onUpdateRow(id, editingData);
    setEditingRowId(null);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  const toggleSort = (field: keyof RecipientRow) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, student ID, or course..."
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs dark:border-slate-800 dark:bg-slate-800">
            <Filter className="h-3.5 w-3.5 text-slate-500 ml-1" />
            {(['all', 'valid', 'invalid'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setStatusFilter(filter);
                  setCurrentPage(1);
                }}
                className={`rounded px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                  statusFilter === filter
                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            onClick={onDownloadSampleCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Sample CSV
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRowIds.size === rows.length}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleSort('recipientName')}>
                <div className="flex items-center gap-1">
                  <span>Recipient Full Name</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleSort('email')}>
                <div className="flex items-center gap-1">
                  <span>Email Address</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleSort('courseName')}>
                <div className="flex items-center gap-1">
                  <span>Course / Program</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleSort('department')}>
                <div className="flex items-center gap-1">
                  <span>Department</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleSort('grade')}>
                <div className="flex items-center gap-1">
                  <span>Grade / Score</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3 w-28 text-center">Validation</th>
              <th className="p-3 w-20 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row) => {
                const isSelected = selectedRowIds.has(row.id);
                const isEditing = editingRowId === row.id;
                const isInvalid = row.status === 'invalid';

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    } ${isInvalid ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''}`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(row.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Recipient Name */}
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData.recipientName || ''}
                          onChange={(e) => setEditingData({ ...editingData, recipientName: e.target.value })}
                          className="w-full rounded border border-slate-300 p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span>{row.recipientName || <span className="text-rose-500 italic">Empty Name</span>}</span>
                          {row.studentId && (
                            <span className="text-[10px] text-slate-400 font-mono">{row.studentId}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Email */}
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editingData.email || ''}
                          onChange={(e) => setEditingData({ ...editingData, email: e.target.value })}
                          className="w-full rounded border border-slate-300 p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      ) : (
                        <span>{row.email || <span className="text-rose-500 italic">Missing Email</span>}</span>
                      )}
                    </td>

                    {/* Course Name */}
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData.courseName || ''}
                          onChange={(e) => setEditingData({ ...editingData, courseName: e.target.value })}
                          className="w-full rounded border border-slate-300 p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      ) : (
                        row.courseName
                      )}
                    </td>

                    {/* Department */}
                    <td className="p-3 text-slate-500 dark:text-slate-400">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData.department || ''}
                          onChange={(e) => setEditingData({ ...editingData, department: e.target.value })}
                          className="w-full rounded border border-slate-300 p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      ) : (
                        row.department || '-'
                      )}
                    </td>

                    {/* Grade / Score */}
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData.grade || ''}
                          onChange={(e) => setEditingData({ ...editingData, grade: e.target.value })}
                          className="w-full rounded border border-slate-300 p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      ) : (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {row.grade || row.score || 'Pass'}
                        </span>
                      )}
                    </td>

                    {/* Validation Status */}
                    <td className="p-3 text-center">
                      {isInvalid ? (
                        <div
                          className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          title={row.validationErrors?.join(', ')}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>Fix Error</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Valid</span>
                        </div>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSaveEdit(row.id)}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStartEdit(row)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                            title="Edit row data"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRow(row.id)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                            title="Delete row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <FileSpreadsheet className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No recipient records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800">
          <div>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredRows.length}</span>{' '}
            recipients ({selectedRowIds.size} selected)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded px-2 py-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800"
            >
              Previous
            </button>
            <span className="text-[11px]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded px-2 py-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
