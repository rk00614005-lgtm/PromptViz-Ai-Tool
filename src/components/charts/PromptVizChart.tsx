import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ChartConfig, ColorPalette } from '../../types';

interface PromptVizChartProps {
  data: any[];
  keys: string[];
  config: ChartConfig;
  height?: number;
  id?: string;
}

const PALETTES: Record<ColorPalette, string[]> = {
  teal_emerald: ['#14b8a6', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1'],
  navy_blue: ['#3b82f6', '#0284c7', '#2563eb', '#1d4ed8', '#1e40af', '#60a5fa', '#93c5fd', '#38bdf8'],
  sunset_amber: ['#f97316', '#f59e0b', '#ef4444', '#e11d48', '#fb923c', '#fcd34d', '#f43f5e', '#ea580c'],
  cyberpunk: ['#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f43f5e', '#8b5cf6', '#d946ef', '#3b82f6'],
  monochrome: ['#94a3b8', '#64748b', '#cbd5e1', '#475569', '#e2e8f0', '#334155', '#1e293b', '#f1f5f9']
};

export const PromptVizChart: React.FC<PromptVizChartProps> = ({
  data,
  keys,
  config,
  height = 380,
  id = 'promptviz-chart-container'
}) => {
  const paletteColors = PALETTES[config.palette] || PALETTES.teal_emerald;

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
        <div className="text-slate-400 text-sm">No data available to render chart. Check your dataset and filter settings.</div>
      </div>
    );
  }

  const { chartType, xAxis, yAxis, showGrid = true, showLegend = true, isStacked = false } = config;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-slate-300 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400">{entry.name}:</span>
              <span className="font-mono font-medium text-slate-100">
                {typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />}
            <XAxis dataKey={xAxis} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />}
            {keys.map((k, idx) => (
              <Bar
                key={k}
                dataKey={k}
                fill={paletteColors[idx % paletteColors.length]}
                radius={[4, 4, 0, 0]}
                stackId={isStacked ? 'a' : undefined}
              />
            ))}
          </BarChart>
        );

      case 'horizontal_bar':
        return (
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />}
            <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis type="category" dataKey={xAxis} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />}
            {keys.map((k, idx) => (
              <Bar
                key={k}
                dataKey={k}
                fill={paletteColors[idx % paletteColors.length]}
                radius={[0, 4, 4, 0]}
                stackId={isStacked ? 'a' : undefined}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />}
            <XAxis dataKey={xAxis} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />}
            {keys.map((k, idx) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={paletteColors[idx % paletteColors.length]}
                strokeWidth={2.5}
                dot={{ r: 3, fill: paletteColors[idx % paletteColors.length] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
            <defs>
              {keys.map((k, idx) => {
                const color = paletteColors[idx % paletteColors.length];
                return (
                  <linearGradient key={`grad-${k}`} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                  </linearGradient>
                );
              })}
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />}
            <XAxis dataKey={xAxis} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />}
            {keys.map((k, idx) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                stroke={paletteColors[idx % paletteColors.length]}
                fillOpacity={1}
                fill={`url(#grad-${k})`}
                strokeWidth={2}
                stackId={isStacked ? '1' : undefined}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
      case 'donut':
        return (
          <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
            <Pie
              data={data}
              dataKey={yAxis}
              nameKey={xAxis}
              cx="50%"
              cy="50%"
              outerRadius={chartType === 'donut' ? 120 : 130}
              innerRadius={chartType === 'donut' ? 65 : 0}
              paddingAngle={chartType === 'donut' ? 3 : 1}
              label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={paletteColors[index % paletteColors.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />}
            <XAxis dataKey={xAxis} name={xAxis} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis dataKey={yAxis} name={yAxis} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />}
            <Scatter name={config.title} data={data} fill={paletteColors[0]} />
          </ScatterChart>
        );

      case 'histogram':
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />}
            <XAxis dataKey="binRange" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />}
            <Bar dataKey="count" fill={paletteColors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div id={id} className="relative w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
