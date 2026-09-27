import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DatasetTable } from '../components/dataset/DatasetTable';
import { DatasetUploadModal } from '../components/dataset/DatasetUploadModal';
import { Dataset } from '../types';
import {
  Database,
  UploadCloud,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Check,
  ShieldCheck,
  Calendar,
  Hash,
  Tag,
  FileText
} from 'lucide-react';

interface DatasetManagerProps {
  onNavigateToGenerator: () => void;
}

export const DatasetManager: React.FC<DatasetManagerProps> = ({ onNavigateToGenerator }) => {
  const { datasets, activeDataset, setActiveDataset, updateDataset, deleteDataset, notify } = useData();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDatasetId, setEditingDatasetId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredDatasets = datasets.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartRename = (d: Dataset) => {
    setEditingDatasetId(d.id);
    setEditName(d.name);
  };

  const handleSaveRename = async (d: Dataset) => {
    if (!editName.trim()) return;
    await updateDataset({ ...d, name: editName.trim(), updatedAt: new Date().toISOString() });
    setEditingDatasetId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteDataset(id);
    setDeleteConfirmId(null);
  };

  const currentPreviewData = activeDataset?.data || activeDataset?.rawPreviewData || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Dataset Manager & Schema Auditor</h2>
            <p className="text-xs text-slate-400">
              Manage uploaded CSV / XLSX files, verify data quality metrics, and inspect column schemas
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload CSV / XLSX</span>
        </button>
      </div>

      {/* Main Split: Dataset Selector List + Active Dataset Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 1 Col: List & Search */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredDatasets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No datasets matching your query.
                </div>
              ) : (
                filteredDatasets.map(d => {
                  const isSelected = activeDataset?.id === d.id;
                  const isEditing = editingDatasetId === d.id;

                  return (
                    <div
                      key={d.id}
                      onClick={() => setActiveDataset(d)}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-teal-500/70 bg-teal-500/10 shadow-sm'
                          : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full rounded border border-teal-500 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                            />
                            <button
                              onClick={() => handleSaveRename(d)}
                              className="rounded p-1 text-teal-400 hover:bg-slate-800"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 truncate">
                            <h4 className="text-xs font-semibold text-slate-200 truncate">{d.name}</h4>
                            <p className="truncate text-[11px] text-slate-400">{d.fileName}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleStartRename(d)}
                            className="rounded p-1 text-slate-400 hover:text-slate-200"
                            title="Rename dataset"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(d.id)}
                            className="rounded p-1 text-slate-400 hover:text-rose-400"
                            title="Delete dataset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {d.rowCount} rows • {d.columnCount} cols
                        </span>
                        <span className="font-semibold text-teal-400">Score: {d.dataQualityScore}%</span>
                      </div>

                      {deleteConfirmId === d.id && (
                        <div
                          className="mt-2 rounded-lg border border-rose-800 bg-rose-950/40 p-2 text-[11px] text-rose-300"
                          onClick={e => e.stopPropagation()}
                        >
                          <p>Confirm deletion of this dataset?</p>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(d.id)}
                              className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-500"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Selected Dataset Metadata, Quality, & Table Preview */}
        <div className="space-y-6 lg:col-span-2">
          {activeDataset ? (
            <>
              {/* Dataset Summary Banner */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{activeDataset.name}</h3>
                    <p className="text-xs text-slate-400">{activeDataset.description || 'No description provided'}</p>
                  </div>

                  <button
                    onClick={onNavigateToGenerator}
                    className="rounded-lg bg-teal-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal-400"
                  >
                    Use in Viz Generator →
                  </button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Total Rows</span>
                    <div className="mt-1 text-lg font-bold text-slate-100">{activeDataset.rowCount.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Columns</span>
                    <div className="mt-1 text-lg font-bold text-slate-100">{activeDataset.columnCount}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Quality Score</span>
                    <div className="mt-1 text-lg font-bold text-teal-400">{activeDataset.dataQualityScore}/100</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">File Size</span>
                    <div className="mt-1 text-lg font-bold text-slate-100">
                      {(activeDataset.fileSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                {/* Column Types Breakdown Badges */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Detected Schema & Column Types
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeDataset.columns.map(col => (
                      <div
                        key={col.name}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs"
                      >
                        {col.type === 'numeric' && <Hash className="h-3 w-3 text-cyan-400" />}
                        {col.type === 'date' && <Calendar className="h-3 w-3 text-amber-400" />}
                        {col.type === 'categorical' && <Tag className="h-3 w-3 text-teal-400" />}
                        {col.type === 'text' && <FileText className="h-3 w-3 text-slate-400" />}
                        <span className="font-medium text-slate-200">{col.name}</span>
                        <span className="text-[10px] text-slate-400">({col.type})</span>
                        {col.missingCount > 0 && (
                          <span className="rounded bg-rose-500/20 px-1 text-[9px] text-rose-300">
                            {col.missingCount} null
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Interactive Table Preview ({currentPreviewData.length} preview rows)
                  </h4>
                </div>
                <DatasetTable data={currentPreviewData} columns={activeDataset.columns} />
              </div>
            </>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
              <Database className="h-10 w-10 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-200">No active dataset selected</h3>
              <p className="mt-1 text-xs text-slate-400">Choose a dataset on the left or upload a new file.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <DatasetUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};
