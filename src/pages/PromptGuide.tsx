import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ArrowRight,
  Lightbulb,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  ShieldAlert
} from 'lucide-react';

interface GuideProps {
  onUseTemplate: (prompt: string) => void;
}

export const PromptGuide: React.FC<GuideProps> = ({ onUseTemplate }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const goodWeakComparisons = [
    {
      topic: 'Aggregation Clarity',
      weak: 'Show revenue by country',
      weakFlaw: 'Ambiguous aggregation. Should it sum all orders or calculate the average order value per country?',
      good: 'Create a horizontal bar chart displaying total sum of Revenue for each Country, sorted descending by Revenue.',
      goodWhy: 'Explicitly declares the mathematical reduction (sum), visual format (horizontal bar), and sort order.'
    },
    {
      topic: 'Temporal Trajectories',
      weak: 'Graph sales',
      weakFlaw: 'Omits time granularity and series groupings.',
      good: 'Show monthly total Sales trend over Order_Date as a line chart with chronological ascending order.',
      goodWhy: 'Specifies the time axis (Order_Date), monthly cadence, metric (Sales), and chronological sort.'
    },
    {
      topic: 'Proportional Cardinality',
      weak: 'Pie chart of customers',
      weakFlaw: 'Pie charts with dozens of customer IDs produce 100+ unreadable thin slices.',
      good: 'Display the percentage share of Customers across the top 5 Product_Tiers as a donut chart with percentage labels.',
      goodWhy: 'Caps categories to top 5 and requests readable percentage annotations.'
    },
    {
      topic: 'Correlation & Bivariate Comparison',
      weak: 'Compare salary and experience',
      weakFlaw: 'Does not clarify whether to compute averages or examine raw distribution.',
      good: 'Create a scatter plot comparing Experience_Years on the X-axis versus Monthly_Salary on the Y-axis to evaluate correlation.',
      goodWhy: 'Assigns exact independent and dependent continuous numeric variables.'
    }
  ];

  const chartMatrix = [
    {
      type: 'Bar Chart',
      icon: <BarChart3 className="h-4 w-4 text-teal-400" />,
      bestFor: 'Comparing discrete categorical entities against continuous numerical totals.',
      avoidWhen: 'Continuous chronological trends with many data points (> 20 dates).'
    },
    {
      type: 'Horizontal Bar',
      icon: <BarChart3 className="h-4 w-4 text-cyan-400 rotate-90" />,
      bestFor: 'Ranking top-N items or categories with long descriptive labels.',
      avoidWhen: 'Time series with sequential chronological continuity.'
    },
    {
      type: 'Line & Area Chart',
      icon: <LineChart className="h-4 w-4 text-purple-400" />,
      bestFor: 'Tracking continuous trajectories, monthly MRR growth, and seasonal trends.',
      avoidWhen: 'Unordered nominal categories (e.g., country names).'
    },
    {
      type: 'Donut & Pie Chart',
      icon: <PieChart className="h-4 w-4 text-amber-400" />,
      bestFor: 'Displaying part-to-whole proportions with ≤ 6 distinct slices.',
      avoidWhen: 'Comparing values with subtle differences or cardinality > 8.'
    },
    {
      type: 'Scatter Plot',
      icon: <ScatterChart className="h-4 w-4 text-emerald-400" />,
      bestFor: 'Observing correlation, clustering, and outliers between two continuous numeric fields.',
      avoidWhen: 'One of the variables is non-numeric or purely discrete nominal strings.'
    }
  ];

  const copyableTemplates = [
    {
      title: 'Enterprise Category Performance Benchmark',
      prompt: 'Create a bar chart comparing total MRR across Region, sorted descending by MRR with teal palette.'
    },
    {
      title: 'Monthly Recurring Revenue Trajectory',
      prompt: 'Show the monthly MRR trajectory over Month as an area chart with gradient fill.'
    },
    {
      title: 'Customer Segmentation Donut',
      prompt: 'Display the percentage distribution of Customers by Product_Tier as a donut chart with data labels.'
    },
    {
      title: 'Bivariate Correlation Analysis',
      prompt: 'Create a scatter plot comparing Revenue on the X-axis versus Profit on the Y-axis.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Prompt Engineering for Data Visualization — Knowledge Base
            </h2>
            <p className="text-xs text-slate-400">
              Principles, cognitive design guidelines, and verified syntax for natural-language chart prompting
            </p>
          </div>
        </div>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-teal-400" />
            1. Explicit Mathematical Reduction
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Never assume the parser knows whether to sum, average, or count. Declaring "total" or "average" prevents row-level stacking bugs.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            2. Cardinality Discipline
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Human working memory struggles with pie slices exceeding 6 items. Match visual channels (bar length, line slopes) to dimensional cardinality.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-purple-400" />
            3. Grounded Schema Alignment
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Reference existing dataset column headers verbatim or with minimal variations so deterministic engines map them with 100% precision.
          </p>
        </div>
      </div>

      {/* Good vs Weak Prompt Annotations */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-2">
          Anatomy of a High-Performing Prompt: Good vs Weak Examples
        </h3>

        <div className="space-y-4">
          {goodWeakComparisons.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-800/30 p-4 space-y-3">
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-teal-400 uppercase">
                {item.topic}
              </span>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Weak */}
                <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Weak / Ambiguous Prompt:</span>
                  </div>
                  <p className="font-mono text-xs text-slate-300 italic">"{item.weak}"</p>
                  <p className="text-[11px] text-rose-300/80 leading-relaxed">{item.weakFlaw}</p>
                </div>

                {/* Good */}
                <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Optimized Production Prompt:</span>
                  </div>
                  <p className="font-mono text-xs text-emerald-200">"{item.good}"</p>
                  <p className="text-[11px] text-emerald-300/80 leading-relaxed">{item.goodWhy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Selection Matrix */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-2">
          Chart Type Selection Matrix
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chartMatrix.map((cm, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                {cm.icon}
                <span className="text-xs font-bold text-slate-200">{cm.type}</span>
              </div>
              <div className="text-[11px] space-y-1">
                <p className="text-slate-300">
                  <strong className="text-emerald-400">Best for:</strong> {cm.bestFor}
                </p>
                <p className="text-slate-400">
                  <strong className="text-rose-400">Avoid when:</strong> {cm.avoidWhen}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Click-to-Use Prompt Templates */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-2">
          Verified Copyable Templates
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {copyableTemplates.map((t, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2"
            >
              <div>
                <span className="text-xs font-semibold text-slate-200">{t.title}</span>
                <p className="mt-1 font-mono text-xs text-teal-300 italic">"{t.prompt}"</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => handleCopy(t.prompt, idx)}
                  className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  {copiedIdx === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => onUseTemplate(t.prompt)}
                  className="flex items-center gap-1 rounded bg-teal-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-teal-400"
                >
                  <span>Use in Builder</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
