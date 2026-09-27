import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ChartType, AggregationType } from '../types';
import {
  Wand2,
  Copy,
  ArrowRight,
  BookmarkPlus,
  Check,
  Sparkles,
  Sliders,
  Filter,
  BarChart3,
  TrendingUp,
  PieChart,
  Shuffle,
  ShieldAlert
} from 'lucide-react';

interface PromptBuilderProps {
  onSendToGenerator: (prompt: string) => void;
}

export const PromptBuilder: React.FC<PromptBuilderProps> = ({ onSendToGenerator }) => {
  const { activeDataset, datasets, setActiveDataset, notify } = useData();

  const [goal, setGoal] = useState('Compare metric performance across categories');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [groupBy, setGroupBy] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sortOrder, setSortOrder] = useState('descending by value');
  const [customTitle, setCustomTitle] = useState('');
  const [stylePreference, setStylePreference] = useState('with high-contrast accessible palette and value labels');
  const [copied, setCopied] = useState(false);

  // Initialize axes when active dataset changes
  useEffect(() => {
    if (activeDataset && activeDataset.columns.length > 0) {
      const numCol = activeDataset.columns.find(c => c.type === 'numeric') || activeDataset.columns[0];
      const catCol = activeDataset.columns.find(c => c.type !== 'numeric') || activeDataset.columns[0];
      setXAxis(catCol.name);
      setYAxis(numCol.name);
      setCustomTitle(`${aggregation.toUpperCase()} ${numCol.name.replace(/_/g, ' ')} by ${catCol.name.replace(/_/g, ' ')}`);
    }
  }, [activeDataset]);

  // Construct structured prompt dynamically
  const generatedPrompt = React.useMemo(() => {
    const aggWord = aggregation === 'avg' ? 'average' : aggregation === 'sum' ? 'total' : aggregation;
    let text = `Create a ${chartType.replace('_', ' ')} chart showing the ${aggWord} ${yAxis || '[Y-axis]'} by ${xAxis || '[X-axis]'}`;

    if (groupBy) {
      text += `, grouped by ${groupBy}`;
    }
    if (filterText.trim()) {
      text += `, filtering for ${filterText}`;
    }
    if (sortOrder) {
      text += `, sorted ${sortOrder}`;
    }
    if (customTitle.trim()) {
      text += `, titled "${customTitle}"`;
    }
    if (stylePreference.trim()) {
      text += `, styled ${stylePreference}`;
    }
    text += '.';
    return text;
  }, [chartType, aggregation, yAxis, xAxis, groupBy, filterText, sortOrder, customTitle, stylePreference]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    notify('success', 'Copied to Clipboard', 'Prompt ready to paste or share.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyTemplate = (tpl: any) => {
    setGoal(tpl.goal);
    setChartType(tpl.chartType);
    setAggregation(tpl.aggregation);
    setSortOrder(tpl.sortOrder);
    if (tpl.style) setStylePreference(tpl.style);
    notify('info', 'Template Applied', `Configured parameters for "${tpl.name}".`);
  };

  const templates = [
    {
      name: 'Category Comparison',
      icon: <BarChart3 className="h-4 w-4 text-teal-400" />,
      goal: 'Compare performance volume across business segments',
      chartType: 'bar' as ChartType,
      aggregation: 'sum' as AggregationType,
      sortOrder: 'descending by value',
      style: 'with clean gridlines and bold axis markers'
    },
    {
      name: 'Trend Over Time',
      icon: <TrendingUp className="h-4 w-4 text-cyan-400" />,
      goal: 'Analyze monthly trajectory and growth velocity',
      chartType: 'line' as ChartType,
      aggregation: 'sum' as AggregationType,
      sortOrder: 'chronologically ascending',
      style: 'with smooth curve interpolation and hover tooltips'
    },
    {
      name: 'Proportional Share',
      icon: <PieChart className="h-4 w-4 text-purple-400" />,
      goal: 'Display percentage breakdown of parts-to-whole',
      chartType: 'donut' as ChartType,
      aggregation: 'sum' as AggregationType,
      sortOrder: 'descending by slice size',
      style: 'with percentage callouts and central KPI metric'
    },
    {
      name: 'Top N Ranking',
      icon: <Sliders className="h-4 w-4 text-amber-400" />,
      goal: 'Identify top performing entities',
      chartType: 'horizontal_bar' as ChartType,
      aggregation: 'sum' as AggregationType,
      sortOrder: 'descending for top 10',
      style: 'with formatted currency indicators'
    },
    {
      name: 'Data Quality & Distribution',
      icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
      goal: 'Assess data distribution spread and frequency bins',
      chartType: 'histogram' as ChartType,
      aggregation: 'count' as AggregationType,
      sortOrder: 'bin range ascending',
      style: 'with 8 distinct frequency buckets'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Guided Prompt Builder</h2>
            <p className="text-xs text-slate-400">
              Formulate unambiguous, high-clarity visualization prompts using structured field parameters
            </p>
          </div>
        </div>
      </div>

      {/* Templates Row */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Reusable Analytical Templates
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {templates.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-left transition-all hover:border-slate-700 hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2">
                {tpl.icon}
                <span className="text-xs font-semibold text-slate-200">{tpl.name}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{tpl.goal}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Builder Form Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Form (2 cols) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
            Prompt Parameters
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Goal */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Analytical Goal</label>
              <input
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Dataset */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Dataset Context</label>
              <select
                value={activeDataset?.id || ''}
                onChange={e => {
                  const d = datasets.find(x => x.id === e.target.value);
                  if (d) setActiveDataset(d);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                {datasets.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

            {/* Chart Type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Chart Type</label>
              <select
                value={chartType}
                onChange={e => setChartType(e.target.value as ChartType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                <option value="bar">Bar Chart</option>
                <option value="horizontal_bar">Horizontal Bar Chart</option>
                <option value="line">Line Trend Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="donut">Donut Chart</option>
                <option value="scatter">Scatter Plot</option>
                <option value="histogram">Histogram</option>
              </select>
            </div>

            {/* Aggregation */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Aggregation Method</label>
              <select
                value={aggregation}
                onChange={e => setAggregation(e.target.value as AggregationType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                <option value="sum">Sum (Total)</option>
                <option value="avg">Average (Mean)</option>
                <option value="count">Count (Rows)</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>

            {/* X Axis */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">X-Axis (Dimension)</label>
              <select
                value={xAxis}
                onChange={e => setXAxis(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                {activeDataset?.columns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Y Axis */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Y-Axis (Metric)</label>
              <select
                value={yAxis}
                onChange={e => setYAxis(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                {activeDataset?.columns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Group By */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Group By (Optional)</label>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                <option value="">None</option>
                {activeDataset?.columns.filter(c => c.name !== xAxis).map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Sort Instruction</label>
              <input
                type="text"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                placeholder="e.g. descending by value, top 10"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filters & Style */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Filtering Conditions</label>
              <input
                type="text"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="e.g. status = 'active', exclude outliers"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Style & Accessibility Preferences</label>
              <input
                type="text"
                value={stylePreference}
                onChange={e => setStylePreference(e.target.value)}
                placeholder="e.g. teal palette with grid and labels"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Output Card (1 col) */}
        <div className="space-y-4">
          <div className="rounded-xl border border-teal-500/40 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Synthesized Prompt
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-sans text-xs text-slate-100 leading-relaxed min-h-[140px]">
              "{generatedPrompt}"
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => onSendToGenerator(generatedPrompt)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-teal-400"
              >
                <span>Send to Viz Generator</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <BookmarkPlus className="h-3.5 w-3.5 text-purple-400" />
                <span>Save Prompt to Clipboard</span>
              </button>
            </div>
          </div>

          {/* Prompt Best Practice Tip */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
            <h4 className="font-semibold text-slate-200 mb-1">Prompt Tip: Explicit Aggregation</h4>
            <p className="text-[11px] leading-relaxed">
              Always specify how continuous numbers should be reduced (sum vs average). Without explicit aggregation, charts can suffer from overlapping rows or ambiguous totals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
