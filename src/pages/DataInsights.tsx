import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { computeDatasetInsights } from '../services/ruleEngine';
import {
  LineChart,
  Hash,
  Tag,
  AlertTriangle,
  TrendingUp,
  Activity,
  GitCommit,
  CheckCircle2,
  Database
} from 'lucide-react';

export const DataInsights: React.FC = () => {
  const { activeDataset } = useData();

  const insights = useMemo(() => {
    if (!activeDataset) return null;
    const rawData = activeDataset.data || activeDataset.rawPreviewData || [];
    return computeDatasetInsights(rawData, activeDataset.columns);
  }, [activeDataset]);

  if (!activeDataset || !insights) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
        <Database className="h-10 w-10 text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-200">No active dataset selected</h3>
        <p className="mt-1 text-xs text-slate-400">Please choose or upload a dataset to compute statistical insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Automated Statistical Data Insights</h2>
            <p className="text-xs text-slate-400">
              Descriptive statistics, IQR outliers, Pearson correlations, and categorical breakdowns for <strong className="text-slate-200">{activeDataset.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
            {insights.totalRows} Records Audited
          </span>
        </div>
      </div>

      {/* Key Takeaways Callout */}
      <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-5 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Key Analytical Takeaways & Data Quality Signals
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
          {insights.keyTakeaways.map((takeaway, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
              <span className="text-teal-400 font-bold">•</span>
              <span>{takeaway}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Numeric Descriptive Statistics */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Hash className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Numeric Fields — Five-Number Summary & Moments
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(insights.numericStats).map(stat => (
            <div key={stat.column} className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <span className="font-mono text-xs font-bold text-slate-200">{stat.column}</span>
                <span className="text-[10px] text-slate-400">n = {stat.count}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Mean (Average)</span>
                  <span className="font-mono font-semibold text-slate-100">{stat.mean.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Median</span>
                  <span className="font-mono font-semibold text-slate-100">{stat.median.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Min / Max</span>
                  <span className="font-mono text-slate-300">
                    {stat.min.toLocaleString()} — {stat.max.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Std Deviation</span>
                  <span className="font-mono text-slate-300">±{stat.stdDev.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Q1 / Q3 (IQR)</span>
                  <span className="font-mono text-slate-300">
                    {stat.q1} / {stat.q3} ({stat.iqr})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">IQR Outliers</span>
                  <span className={`font-mono font-semibold ${stat.outliersCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {stat.outliersCount} flag(s)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pearson Correlation Matrix & Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Correlations */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Activity className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Pearson Correlation Matrix (Linear Relationships)
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Note: Pearson r measures linear correlation (-1 to +1). Correlation never establishes causation.
          </p>

          <div className="space-y-2 pt-1">
            {insights.correlationMatrix.length === 0 ? (
              <p className="text-xs text-slate-400">Insufficient numeric columns for bivariate correlation.</p>
            ) : (
              insights.correlationMatrix.slice(0, 6).map((c, i) => {
                const absR = Math.abs(c.correlation);
                const strength = absR > 0.7 ? 'Strong' : absR > 0.4 ? 'Moderate' : 'Weak';
                const color = absR > 0.7 ? 'text-teal-400' : absR > 0.4 ? 'text-cyan-400' : 'text-slate-400';

                return (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-2.5 text-xs">
                    <span className="text-slate-300 font-mono">
                      {c.col1} ↔ {c.col2}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{strength}</span>
                      <span className={`font-mono font-bold ${color}`}>r = {c.correlation}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Date Trends */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Temporal Trajectories & Growth Trends
            </h3>
          </div>

          <div className="space-y-2 pt-1">
            {insights.trends.length === 0 ? (
              <p className="text-xs text-slate-400">No chronological date column detected for timeline analysis.</p>
            ) : (
              insights.trends.map((t, i) => (
                <div key={i} className="rounded-lg border border-slate-800 bg-slate-800/30 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{t.column} over {t.dateColumn}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        t.direction === 'up'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : t.direction === 'down'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {t.direction === 'up' ? 'GROWTH (↑)' : t.direction === 'down' ? 'DECLINE (↓)' : 'STABLE (→)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Net movement: {t.changePercent > 0 ? `+${t.changePercent}%` : `${t.changePercent}%`} across time horizon.
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Categorical Distribution Summaries */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Tag className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Categorical Fields — Class Distribution & Frequencies
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(insights.categoricalStats).map(cat => (
            <div key={cat.column} className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                <span className="font-mono text-xs font-bold text-slate-200">{cat.column}</span>
                <span className="text-[10px] text-slate-400">{cat.unique} unique values</span>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                {cat.topValues.map(tv => (
                  <div key={tv.value} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 truncate max-w-[140px]">{tv.value}</span>
                      <span className="text-slate-400 font-mono">
                        {tv.count} ({tv.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${tv.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
