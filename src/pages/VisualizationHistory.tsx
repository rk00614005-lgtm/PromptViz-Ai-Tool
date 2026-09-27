import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Visualization, ChartType } from '../types';
import {
  History,
  Search,
  Trash2,
  ExternalLink,
  Filter,
  ArrowUpDown,
  Calendar,
  Database,
  BarChart3,
  Code
} from 'lucide-react';

interface HistoryProps {
  onReopenViz: (viz: Visualization) => void;
}

export const VisualizationHistory: React.FC<HistoryProps> = ({ onReopenViz }) => {
  const { history, deleteHistoryItem, datasets } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewJsonViz, setViewJsonViz] = useState<Visualization | null>(null);

  const filteredHistory = history
    .filter(h => {
      const matchSearch =
        h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.prompt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = selectedType === 'all' || h.chartType === selectedType;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  const chartTypes: { type: string; label: string }[] = [
    { type: 'all', label: 'All Types' },
    { type: 'bar', label: 'Bar' },
    { type: 'horizontal_bar', label: 'H-Bar' },
    { type: 'line', label: 'Line' },
    { type: 'area', label: 'Area' },
    { type: 'pie', label: 'Pie' },
    { type: 'donut', label: 'Donut' },
    { type: 'scatter', label: 'Scatter' },
    { type: 'histogram', label: 'Histogram' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Visualization History & Audit Trail</h2>
            <p className="text-xs text-slate-400">
              Persistent repository of all prompt generations, chart configurations, and dataset references
            </p>
          </div>
        </div>

        <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 font-mono">
          {history.length} Saved Generations
        </span>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search prompt or title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Type:</span>
          </span>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            {chartTypes.map(ct => (
              <option key={ct.type} value={ct.type}>
                {ct.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* History Grid */}
      {filteredHistory.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
          <BarChart3 className="h-10 w-10 text-slate-400" />
          <h4 className="mt-2 text-sm font-semibold text-slate-200">No visualization history found</h4>
          <p className="mt-1 text-xs text-slate-400">Generations saved in the Studio will automatically record here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHistory.map(item => {
            const datasetName =
              datasets.find(d => d.id === item.datasetId)?.name || 'Standard Dataset';

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/90 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-300 uppercase">
                      {item.chartType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="mt-2 text-xs font-semibold text-slate-100 line-clamp-1">{item.title}</h3>
                  <p className="mt-1 text-[11px] italic text-slate-300/80 line-clamp-2">"{item.prompt}"</p>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="truncate">Dataset: {datasetName}</span>
                    <span className="font-mono">{item.xAxis} × {item.yAxis}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setViewJsonViz(item)}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px]"
                    >
                      <Code className="h-3 w-3 text-teal-400" />
                      <span>Config JSON</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                        title="Delete from history"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onReopenViz(item)}
                        className="flex items-center gap-1 rounded bg-teal-500/20 px-2.5 py-1 text-xs font-semibold text-teal-300 hover:bg-teal-500/30"
                      >
                        <span>Reopen</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {deleteConfirmId === item.id && (
                    <div className="rounded-lg border border-rose-800 bg-rose-950/60 p-2 text-rose-300 flex items-center justify-between">
                      <span className="text-[10px]">Delete entry?</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            deleteHistoryItem(item.id);
                            setDeleteConfirmId(null);
                          }}
                          className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-500"
                        >
                          Confirm
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
              </div>
            );
          })}
        </div>
      )}

      {/* JSON Modal */}
      {viewJsonViz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-100">Saved Chart Configuration</h3>
              <button
                onClick={() => setViewJsonViz(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Close
              </button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-teal-300">
              {JSON.stringify(viewJsonViz.config, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
