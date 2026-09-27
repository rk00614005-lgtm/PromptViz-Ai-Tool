import React from 'react';
import { ChartConfig, ChartType, AggregationType, ColorPalette, ColumnMeta } from '../../types';
import { BarChart3, LineChart, PieChart, ScatterChart, Sliders, Palette } from 'lucide-react';

interface ChartControlsProps {
  config: ChartConfig;
  columns: ColumnMeta[];
  onChange: (updated: ChartConfig) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({ config, columns, onChange }) => {
  const chartTypes: { type: ChartType; label: string; icon: React.ReactNode }[] = [
    { type: 'bar', label: 'Bar', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { type: 'horizontal_bar', label: 'H-Bar', icon: <BarChart3 className="h-3.5 w-3.5 rotate-90" /> },
    { type: 'line', label: 'Line', icon: <LineChart className="h-3.5 w-3.5" /> },
    { type: 'area', label: 'Area', icon: <LineChart className="h-3.5 w-3.5" /> },
    { type: 'pie', label: 'Pie', icon: <PieChart className="h-3.5 w-3.5" /> },
    { type: 'donut', label: 'Donut', icon: <PieChart className="h-3.5 w-3.5" /> },
    { type: 'scatter', label: 'Scatter', icon: <ScatterChart className="h-3.5 w-3.5" /> },
    { type: 'histogram', label: 'Histogram', icon: <BarChart3 className="h-3.5 w-3.5" /> }
  ];

  const aggregations: { type: AggregationType; label: string }[] = [
    { type: 'sum', label: 'Sum (Total)' },
    { type: 'avg', label: 'Average (Mean)' },
    { type: 'count', label: 'Count (Frequency)' },
    { type: 'min', label: 'Minimum' },
    { type: 'max', label: 'Maximum' }
  ];

  const palettes: { key: ColorPalette; label: string; preview: string[] }[] = [
    { key: 'teal_emerald', label: 'Emerald & Teal', preview: ['#14b8a6', '#10b981', '#06b6d4'] },
    { key: 'navy_blue', label: 'Executive Navy', preview: ['#3b82f6', '#0284c7', '#1d4ed8'] },
    { key: 'sunset_amber', label: 'Sunset Amber', preview: ['#f97316', '#f59e0b', '#ef4444'] },
    { key: 'cyberpunk', label: 'Neon Cyber', preview: ['#a855f7', '#06b6d4', '#ec4899'] },
    { key: 'monochrome', label: 'Monochrome Slate', preview: ['#94a3b8', '#64748b', '#cbd5e1'] }
  ];

  const numCols = columns.filter(c => c.type === 'numeric');
  const catAndDateCols = columns.filter(c => c.type !== 'numeric');

  return (
    <div className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 text-xs text-slate-300">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 font-medium text-slate-200">
        <Sliders className="h-4 w-4 text-teal-400" />
        <span>Chart Configuration Panel</span>
      </div>

      {/* Chart Type Selector */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Chart Type
        </label>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4">
          {chartTypes.map(ct => (
            <button
              key={ct.type}
              type="button"
              onClick={() => onChange({ ...config, chartType: ct.type })}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 font-medium transition-all ${
                config.chartType === ct.type
                  ? 'border-teal-500 bg-teal-500/15 text-teal-300 shadow-sm'
                  : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {ct.icon}
              <span className="truncate">{ct.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-400 uppercase">Chart Title</label>
          <input
            type="text"
            value={config.title}
            onChange={e => onChange({ ...config, title: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-400 uppercase">Aggregation</label>
          <select
            value={config.aggregation}
            onChange={e => onChange({ ...config, aggregation: e.target.value as AggregationType })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            {aggregations.map(a => (
              <option key={a.type} value={a.type}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Axis Selection */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-400 uppercase">
            X-Axis (Dimension)
          </label>
          <select
            value={config.xAxis}
            onChange={e => onChange({ ...config, xAxis: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            {columns.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-400 uppercase">
            Y-Axis (Metric)
          </label>
          <select
            value={config.yAxis}
            onChange={e => onChange({ ...config, yAxis: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            {numCols.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} (numeric)
              </option>
            ))}
            {catAndDateCols.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} (count only)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-400 uppercase">
            Group By (Optional)
          </label>
          <select
            value={config.groupBy || ''}
            onChange={e => onChange({ ...config, groupBy: e.target.value || undefined })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            <option value="">None (Single Series)</option>
            {columns.filter(c => c.name !== config.xAxis).map(c => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Palette & Sorting */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
            <Palette className="h-3 w-3 text-teal-400" />
            Color Palette
          </label>
          <div className="flex flex-wrap gap-1.5">
            {palettes.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => onChange({ ...config, palette: p.key })}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-all ${
                  config.palette === p.key
                    ? 'border-teal-400 bg-teal-500/20 text-teal-200'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex -space-x-1">
                  {p.preview.map((hex, i) => (
                    <span key={i} className="h-2.5 w-2.5 rounded-full ring-1 ring-slate-900" style={{ backgroundColor: hex }} />
                  ))}
                </div>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-400 uppercase">Sorting</label>
          <div className="flex gap-2">
            <select
              value={config.sortBy || 'none'}
              onChange={e => onChange({ ...config, sortBy: e.target.value as any })}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="none">No Sorting</option>
              <option value="y">Sort by Value (Y)</option>
              <option value="x">Sort by Label (X)</option>
            </select>
            <select
              value={config.sortDirection || 'desc'}
              onChange={e => onChange({ ...config, sortDirection: e.target.value as any })}
              className="w-24 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="desc">Desc (↓)</option>
              <option value="asc">Asc (↑)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
