import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PromptVizChart } from '../components/charts/PromptVizChart';
import {
  Database,
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle2,
  PieChart as PieIcon,
  Bot
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { datasets, visualizations, reports, history, activeDataset, setActiveDataset } = useData();

  // Calculate real metrics
  const totalDatasets = datasets.length;
  const totalVisualizations = visualizations.length;
  const totalReports = reports.length;
  const totalHistory = history.length;

  // Chart type distribution
  const chartTypeCounts = visualizations.reduce((acc, v) => {
    acc[v.chartType] = (acc[v.chartType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartDistributionData = Object.entries(chartTypeCounts).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    count
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-400">
                Data Visualization Workspace
              </span>
              <span className="text-xs text-slate-400">Prompt Engineering Engine Active</span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
              Welcome back, {user?.email?.split('@')[0]}
            </h2>
            <p className="mt-1 text-xs text-slate-400 max-w-xl">
              Convert natural language into analytical visualizations, validate schema compatibility, and compose executive reports with mathematically verified data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('generator')}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition-all hover:bg-teal-400"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate New Chart</span>
            </button>
            <button
              onClick={() => onNavigate('datasets')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-700"
            >
              <Database className="h-4 w-4 text-cyan-400" />
              <span>Manage Datasets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Datasets</span>
            <Database className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">{totalDatasets}</div>
          <p className="mt-1 text-[11px] text-slate-400">
            {activeDataset ? `Active: ${activeDataset.name}` : 'No dataset selected'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Saved Visualizations</span>
            <Sparkles className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">{totalVisualizations}</div>
          <p className="mt-1 text-[11px] text-slate-400">
            {totalVisualizations > 0 ? 'Stored in PostgreSQL' : 'Start with Generator'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Executive Reports</span>
            <FileSpreadsheet className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">{totalReports}</div>
          <p className="mt-1 text-[11px] text-slate-400">
            Multi-chart executive summaries
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Prompt Generations</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">{totalHistory}</div>
          <p className="mt-1 text-[11px] text-slate-400">
            Full audit log recorded
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Datasets & Visualizations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Visualizations or Getting Started */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => onNavigate('builder')}
              className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-left transition-all hover:border-slate-700 hover:bg-slate-800/40"
            >
              <div className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <h4 className="mt-2 text-xs font-semibold text-slate-200">Guided Prompt Builder</h4>
              <p className="mt-0.5 text-[11px] text-slate-400">Compose structured prompts using goal-driven templates.</p>
            </button>

            <button
              onClick={() => onNavigate('copilot')}
              className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-left transition-all hover:border-slate-700 hover:bg-slate-800/40"
            >
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Bot className="h-4 w-4" />
              </div>
              <h4 className="mt-2 text-xs font-semibold text-slate-200">AI Viz Copilot</h4>
              <p className="mt-0.5 text-[11px] text-slate-400">Ask questions and compute statistics from your dataset.</p>
            </button>

            <button
              onClick={() => onNavigate('insights')}
              className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-left transition-all hover:border-slate-700 hover:bg-slate-800/40"
            >
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h4 className="mt-2 text-xs font-semibold text-slate-200">Data Insights</h4>
              <p className="mt-0.5 text-[11px] text-slate-400">Review IQR outlier flags, correlations, and distributions.</p>
            </button>
          </div>

          {/* Recent Visualizations Showcase */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-100">Recent Visualizations</h3>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="flex items-center gap-1 text-xs text-teal-400 hover:underline"
              >
                <span>View Full History</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {visualizations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <PieIcon className="h-10 w-10 text-slate-400" />
                <h4 className="mt-2 text-sm font-medium text-slate-300">No visualizations created yet</h4>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  Jump to the Visualization Generator and enter a natural language request to create your first interactive chart.
                </p>
                <button
                  onClick={() => onNavigate('generator')}
                  className="mt-4 rounded-lg bg-teal-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal-400"
                >
                  Create First Visualization
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visualizations.slice(0, 4).map(viz => (
                  <div
                    key={viz.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-800/30 p-3.5 transition-all hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 uppercase">
                          {viz.chartType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(viz.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="mt-2 text-xs font-semibold text-slate-200 line-clamp-1">{viz.title}</h4>
                      <p className="mt-1 text-[11px] italic text-slate-400 line-clamp-2">"{viz.prompt}"</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
                      <span>{viz.xAxis} × {viz.yAxis}</span>
                      <button
                        onClick={() => onNavigate('generator')}
                        className="text-teal-400 hover:text-teal-300 font-medium"
                      >
                        Reopen →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Datasets List & Activity */}
        <div className="space-y-6">
          {/* Datasets in Workspace */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">Datasets</h3>
              </div>
              <button
                onClick={() => onNavigate('datasets')}
                className="text-xs text-teal-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {datasets.map(d => {
                const isSelected = activeDataset?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setActiveDataset(d)}
                    className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                      isSelected
                        ? 'border-teal-500/60 bg-teal-500/10'
                        : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate">{d.name}</span>
                      {isSelected && (
                        <span className="rounded bg-teal-500/20 px-1 py-0.5 text-[9px] font-bold text-teal-300">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{d.rowCount} rows</span>
                      <span>•</span>
                      <span>{d.columnCount} cols</span>
                      <span>•</span>
                      <span className="text-teal-400 font-medium">Q: {d.dataQualityScore}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Type Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
              Chart Types Created
            </h3>
            {chartDistributionData.length === 0 ? (
              <p className="mt-3 text-xs text-slate-400 text-center py-4">No chart breakdown data yet</p>
            ) : (
              <div className="mt-3 space-y-2">
                {chartDistributionData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-teal-300">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
