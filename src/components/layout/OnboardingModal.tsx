import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Database, Wand2, FileSpreadsheet, ArrowRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  onStartGenerator: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onStartGenerator }) => {
  const { isOnboardingCompleted, completeOnboarding, profile } = useAuth();

  if (isOnboardingCompleted) return null;

  const steps = [
    {
      icon: <Database className="h-5 w-5 text-teal-400" />,
      title: '1. Connect Your Datasets',
      desc: 'Upload CSV or XLSX spreadsheets, or explore our built-in SaaS & E-commerce datasets with automated quality scoring.'
    },
    {
      icon: <Wand2 className="h-5 w-5 text-purple-400" />,
      title: '2. Prompt Engineering for Viz',
      desc: 'Type natural language requests like "Show monthly MRR growth by region as an area chart" or use the guided Prompt Builder.'
    },
    {
      icon: <Sparkles className="h-5 w-5 text-amber-400" />,
      title: '3. Recharts Rendering & Insights',
      desc: 'Interactive tooltips, automatic aggregation, color palettes, and real mathematical statistics.'
    },
    {
      icon: <FileSpreadsheet className="h-5 w-5 text-sky-400" />,
      title: '4. Executive Reports & Export',
      desc: 'Assemble multi-chart reports, export high-res PNGs and CSV data, and audit prompts for cognitive readability.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-100">
            Welcome to PromptViz AI, {profile?.fullName || 'Analyst'}!
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            The intelligent workspace for turning natural language into high-impact interactive visualizations.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {steps.map((s, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                {s.icon}
                <h4 className="text-xs font-semibold text-slate-200">{s.title}</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-[11px] text-slate-400">Sample data pre-loaded & ready</span>
          <div className="flex items-center gap-2">
            <button
              onClick={completeOnboarding}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Skip Tour
            </button>
            <button
              onClick={() => {
                completeOnboarding();
                onStartGenerator();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-1.5 text-xs font-medium text-slate-950 hover:bg-teal-400"
            >
              <span>Launch Visualization Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
