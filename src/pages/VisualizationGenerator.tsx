import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PromptVizChart } from '../components/charts/PromptVizChart';
import { ChartControls } from '../components/charts/ChartControls';
import { aiService } from '../services/gemini';
import { aggregateChartData, recommendChartType } from '../services/ruleEngine';
import { exportChartToPng, exportDataToCsv } from '../services/exportUtils';
import { ChartConfig, Visualization } from '../types';
import {
  Sparkles,
  Play,
  Save,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Lightbulb,
  Cpu,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Code2
} from 'lucide-react';

export const VisualizationGenerator: React.FC = () => {
  const { user } = useAuth();
  const { activeDataset, datasets, setActiveDataset, createVisualization, notify, settings } = useData();

  const [prompt, setPrompt] = useState('Create a bar chart comparing total MRR across regions');
  const [isGenerating, setIsGenerating] = useState(false);
  const [providerBadge, setProviderBadge] = useState<string>('Rule Engine / Gemini');
  const [isAiPowered, setIsAiPowered] = useState<boolean>(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  // Active chart configuration
  const [config, setConfig] = useState<ChartConfig>({
    chartType: 'bar',
    title: 'Total MRR by Region',
    xAxis: 'Region',
    yAxis: 'MRR',
    aggregation: 'sum',
    palette: settings.defaultPalette || 'teal_emerald',
    sortBy: 'y',
    sortDirection: 'desc',
    showGrid: true,
    showLegend: true
  });

  // Example prompts based on active dataset
  const examplePrompts = activeDataset?.fileName?.includes('ecommerce')
    ? [
        'Create a bar chart comparing total Revenue by Category',
        'Show Profit vs Revenue as a scatter plot to analyze margin correlation',
        'Display percentage distribution of Units sold by Region as a donut chart',
        'Show average Discount Percent across Sub Categories ordered descending'
      ]
    : [
        'Create a bar chart comparing total MRR across Region',
        'Show the monthly MRR trend over time as an area chart',
        'Display the percentage distribution of Customers by Product Tier as a donut chart',
        'Compare average Churn Rate across Product Tier as a horizontal bar chart',
        'Create a scatter chart comparing MRR vs CSAT'
      ];

  // Update defaults when active dataset changes
  useEffect(() => {
    if (activeDataset && activeDataset.columns.length > 0) {
      const numCol = activeDataset.columns.find(c => c.type === 'numeric') || activeDataset.columns[0];
      const catCol = activeDataset.columns.find(c => c.type === 'categorical' || c.type === 'date') || activeDataset.columns[0];

      setConfig(prev => ({
        ...prev,
        xAxis: catCol.name,
        yAxis: numCol.name,
        title: `Total ${numCol.name.replace(/_/g, ' ')} by ${catCol.name.replace(/_/g, ' ')}`
      }));
    }
  }, [activeDataset]);

  const handleGenerate = async (targetPrompt?: string) => {
    const inputPrompt = targetPrompt || prompt;
    if (!inputPrompt.trim()) return;

    setIsGenerating(true);
    setWarnings([]);

    try {
      const result = await aiService.parsePrompt(inputPrompt, activeDataset || undefined);
      setProviderBadge(result.provider);
      setIsAiPowered(result.aiPowered);

      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      }

      // Check recommendation
      if (activeDataset) {
        const xMeta = activeDataset.columns.find(c => c.name === result.xAxis);
        const yMeta = activeDataset.columns.find(c => c.name === result.yAxis);
        if (xMeta && yMeta) {
          const rec = recommendChartType(xMeta.type, yMeta.type, xMeta.uniqueCount);
          setRecommendation(`Recommended: ${rec.recommended.toUpperCase()} — ${rec.reasons[0]}`);
        }
      }

      setConfig(prev => ({
        ...prev,
        chartType: result.chartType,
        xAxis: result.xAxis,
        yAxis: result.yAxis,
        aggregation: result.aggregation,
        groupBy: result.groupBy,
        title: result.title,
        palette: result.palette || prev.palette
      }));

      notify('success', 'Chart Generated', `Parsed parameters: ${result.xAxis} × ${result.yAxis} (${result.aggregation})`);
    } catch (err: any) {
      console.error('Error generating visualization:', err);
      notify('error', 'Parsing Failed', 'Could not parse prompt instructions.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Compute aggregated data for chart
  const rawData = activeDataset?.data || activeDataset?.rawPreviewData || [];
  const { data: chartData, keys: chartKeys } = aggregateChartData(rawData, config);

  const handleSaveVisualization = async () => {
    if (!user) return;
    const viz: Visualization = {
      id: crypto.randomUUID(),
      userId: user.id,
      datasetId: activeDataset?.id,
      title: config.title,
      prompt,
      chartType: config.chartType,
      xAxis: config.xAxis,
      yAxis: config.yAxis,
      aggregation: config.aggregation,
      groupBy: config.groupBy,
      palette: config.palette,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await createVisualization(viz);
  };

  const handleExportPng = async () => {
    const success = await exportChartToPng('viz-generator-canvas', config.title || 'promptviz-chart');
    if (success) {
      notify('success', 'Export Complete', 'High-resolution PNG downloaded.');
    } else {
      notify('error', 'Export Failed', 'Unable to capture SVG canvas.');
    }
  };

  const handleExportCsv = () => {
    if (chartData.length === 0) return;
    exportDataToCsv(chartData, `${config.title || 'chart-data'}.csv`);
    notify('success', 'CSV Exported', 'Tabular chart dataset downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Top Workspace Header & Dataset Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 sm:text-base">Visualization Studio</h2>
            <p className="text-xs text-slate-400">Natural-language prompt to Recharts compiler</p>
          </div>
        </div>

        {/* Dataset Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Target Dataset:</span>
          <select
            value={activeDataset?.id || ''}
            onChange={e => {
              const d = datasets.find(x => x.id === e.target.value);
              if (d) setActiveDataset(d);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            {datasets.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.rowCount} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt Editor Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Natural-Language Visualization Prompt
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isAiPowered
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              }`}
            >
              <Cpu className="h-3 w-3" />
              <span>{providerBadge}</span>
            </span>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Compare total revenue by region as a horizontal bar chart sorted descending..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3.5 text-sm text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none resize-none leading-relaxed"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            {/* Example Prompt Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Lightbulb className="h-3 w-3 text-amber-400" />
                <span>Examples:</span>
              </span>
              {examplePrompts.slice(0, 3).map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(ex);
                    handleGenerate(ex);
                  }}
                  className="rounded-md border border-slate-800 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
                >
                  "{ex.slice(0, 32)}..."
                </button>
              ))}
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-teal-400 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Compiling Prompt...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Generate Chart</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warnings or Recommendations */}
        {warnings.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-800/50 bg-amber-950/20 p-2.5 text-xs text-amber-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          </div>
        )}

        {recommendation && (
          <div className="mt-2 text-[11px] text-teal-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{recommendation}</span>
          </div>
        )}
      </div>

      {/* Workspace Split: Chart Display + Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart View Area (2 cols) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">{config.title}</h3>
              <p className="text-xs text-slate-400">
                {config.aggregation.toUpperCase()} of <strong className="text-slate-300">{config.yAxis}</strong> by{' '}
                <strong className="text-slate-300">{config.xAxis}</strong>
                {config.groupBy ? ` (grouped by ${config.groupBy})` : ''}
              </p>
            </div>

            {/* Save & Export Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                title="Export aggregated data as CSV"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportPng}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                title="Download high-res PNG image"
              >
                <Download className="h-3.5 w-3.5 text-teal-400" />
                <span>PNG</span>
              </button>

              <button
                type="button"
                onClick={handleSaveVisualization}
                className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal-400"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Viz</span>
              </button>
            </div>
          </div>

          {/* Interactive Recharts Canvas */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 pt-6 min-h-[400px] flex items-center justify-center">
            <PromptVizChart
              id="viz-generator-canvas"
              data={chartData}
              keys={chartKeys}
              config={config}
              height={400}
            />
          </div>

          {/* Collapsible Raw Config JSON details */}
          <div className="border-t border-slate-800 pt-3">
            <button
              onClick={() => setShowConfigDetails(!showConfigDetails)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <Code2 className="h-3.5 w-3.5 text-teal-400" />
              <span>{showConfigDetails ? 'Hide JSON Specification' : 'View Generated JSON Specification'}</span>
            </button>
            {showConfigDetails && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-teal-300">
                {JSON.stringify(config, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Right 1 Col: Fine-Tuning Controls */}
        <div className="space-y-4">
          <ChartControls
            config={config}
            columns={activeDataset?.columns || []}
            onChange={updated => setConfig(updated)}
          />

          {/* Active Dataset Schema Quick Reference */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
            <h4 className="font-semibold text-slate-200 mb-2">Available Columns in {activeDataset?.name}</h4>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {activeDataset?.columns.map(c => (
                <div
                  key={c.name}
                  onClick={() => {
                    if (c.type === 'numeric') setConfig(prev => ({ ...prev, yAxis: c.name }));
                    else setConfig(prev => ({ ...prev, xAxis: c.name }));
                  }}
                  className="flex cursor-pointer items-center justify-between rounded p-1.5 hover:bg-slate-800 transition-colors"
                >
                  <span className="font-mono text-slate-300">{c.name}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {c.type}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400 italic">Click a column to assign to X or Y axis.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
