import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PromptVizChart } from '../components/charts/PromptVizChart';
import { aggregateChartData } from '../services/ruleEngine';
import { exportDataToCsv } from '../services/exportUtils';
import { Report } from '../types';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Save,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Calendar,
  User,
  Sparkles
} from 'lucide-react';

export const ReportGenerator: React.FC = () => {
  const { user, profile } = useAuth();
  const { datasets, activeDataset, visualizations, reports, createReport, deleteReport, notify } = useData();

  const [title, setTitle] = useState('Executive Data Intelligence & Performance Briefing');
  const [authorName, setAuthorName] = useState(profile?.fullName || 'Senior Analytics Lead');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(
    'This report presents an empirical analysis of business revenue streams, category performance distributions, and operational variance.'
  );
  const [introduction, setIntroduction] = useState(
    'Using verified statistical aggregation over active workspace records, this document synthesizes metric trends, outlines distribution concentrations, and documents data observations.'
  );
  const [conclusion, setConclusion] = useState(
    'The observed metrics indicate robust stability across leading categories. Continued tracking of variance and outlier thresholds is recommended for upcoming quarterly cycles.'
  );

  const [selectedVizIds, setSelectedVizIds] = useState<string[]>(() =>
    visualizations.slice(0, 2).map(v => v.id)
  );

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const toggleViz = (id: string) => {
    setSelectedVizIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSaveReport = async () => {
    if (!user) return;
    const rep: Report = {
      id: crypto.randomUUID(),
      userId: user.id,
      datasetId: activeDataset?.id,
      datasetName: activeDataset?.name,
      title,
      authorName,
      summary,
      introduction,
      conclusion,
      visualizationIds: selectedVizIds,
      insightsIncluded: [
        `Dataset: ${activeDataset?.name || 'Workspace Records'}`,
        `Audited Rows: ${activeDataset?.rowCount || 0}`,
        `Data Quality Index: ${activeDataset?.dataQualityScore || 100}%`
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await createReport(rep);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const rawData = activeDataset?.data || activeDataset?.rawPreviewData || [];
    if (rawData.length > 0) {
      exportDataToCsv(rawData, `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_data.csv`);
      notify('success', 'CSV Exported', 'Full report underlying dataset downloaded.');
    }
  };

  const activeVisualizations = visualizations.filter(v => selectedVizIds.includes(v.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Executive Report Generator</h2>
            <p className="text-xs text-slate-400">
              Compile professional data briefings with interactive charts, verified methodology, and export options
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <Eye className="h-4 w-4 text-teal-400" />
            <span>{isPreviewMode ? 'Edit Mode' : 'Print Preview'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Underlying CSV</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleSaveReport}
            className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-teal-400"
          >
            <Save className="h-4 w-4" />
            <span>Save Report</span>
          </button>
        </div>
      </div>

      {/* View Mode: Editor vs Print Layout */}
      {!isPreviewMode ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Metadata & Text Editor (2 cols) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
              Report Sections & Narrative
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-300">Report Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Author Name</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Executive Summary</label>
              <textarea
                rows={2}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Introduction & Context</label>
              <textarea
                rows={3}
                value={introduction}
                onChange={e => setIntroduction(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Key Conclusions & Recommendations</label>
              <textarea
                rows={3}
                value={conclusion}
                onChange={e => setConclusion(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Right 1 Col: Visualizations Inclusion Selector */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                Included Visualizations ({selectedVizIds.length})
              </h3>

              {visualizations.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No visualizations available. Generate charts first in the Studio.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {visualizations.map(v => {
                    const isChecked = selectedVizIds.includes(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => toggleViz(v.id)}
                        className={`cursor-pointer rounded-lg border p-3 transition-all ${
                          isChecked
                            ? 'border-teal-500/60 bg-teal-500/10'
                            : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200">{v.title}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-700 text-teal-500 focus:ring-teal-400"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 truncate">
                          {v.chartType.toUpperCase()} • {v.xAxis} × {v.yAxis}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Existing Saved Reports List */}
            {reports.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">Saved Reports Archive</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {reports.map(r => (
                    <div key={r.id} className="flex items-center justify-between rounded p-1.5 hover:bg-slate-800 text-xs">
                      <span className="text-slate-200 truncate font-medium">{r.title}</span>
                      <button
                        onClick={() => deleteReport(r.id)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Executive Document Print Preview */
        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-8 shadow-2xl text-slate-100 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-6 mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-widest text-teal-400">
                PromptViz AI Executive Briefing
              </span>
              <span>Generated on {reportDate}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight sm:text-3xl">{title}</h1>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-teal-400" />
                <span>Author: {authorName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-teal-400" />
                <span>Dataset: {activeDataset?.name || 'Workspace Records'}</span>
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mb-6 rounded-xl border border-teal-500/20 bg-teal-950/10 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-1">
              Executive Summary
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">{summary}</p>
          </div>

          {/* Introduction */}
          <div className="mb-6 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Context & Objectives</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{introduction}</p>
          </div>

          {/* Visualizations Section */}
          <div className="mb-8 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
              Empirical Visual Evidence ({activeVisualizations.length} Exhibits)
            </h3>

            {activeVisualizations.map(viz => {
              const rawData = activeDataset?.data || activeDataset?.rawPreviewData || [];
              const { data: chartData, keys: chartKeys } = aggregateChartData(rawData, viz.config);

              return (
                <div key={viz.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-semibold text-slate-100">{viz.title}</h4>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {viz.chartType} • {viz.aggregation}
                    </span>
                  </div>
                  <div className="min-h-[300px] flex items-center justify-center pt-2">
                    <PromptVizChart
                      data={chartData}
                      keys={chartKeys}
                      config={viz.config}
                      height={320}
                      id={`report-chart-${viz.id}`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 italic">Directive Prompt: "{viz.prompt}"</p>
                </div>
              );
            })}
          </div>

          {/* Conclusion */}
          <div className="border-t border-slate-800 pt-6 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Findings & Strategic Recommendations
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">{conclusion}</p>
          </div>
        </div>
      )}
    </div>
  );
};
