import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/gemini';
import { PromptAnalysis, PromptVersion } from '../types';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  History,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  Scale
} from 'lucide-react';

interface PromptLabProps {
  onSendToGenerator: (prompt: string) => void;
}

export const PromptEngineeringLab: React.FC<PromptLabProps> = ({ onSendToGenerator }) => {
  const { user } = useAuth();
  const { activeDataset, promptVersions, addPromptVersion, notify } = useData();

  const [inputPrompt, setInputPrompt] = useState('show sales by product');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null);
  const [engineBadge, setEngineBadge] = useState('Deterministic Rule Engine');
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [acceptedPrompt, setAcceptedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!inputPrompt.trim()) return;
    setIsAnalyzing(true);
    setAcceptedPrompt(null);

    try {
      const res = await aiService.analyzePrompt(inputPrompt, activeDataset || undefined);
      setAnalysis(res);
      setEngineBadge(res.provider);
      setIsAiPowered(res.aiPowered);

      // Save to prompt version history
      if (user) {
        const pv: PromptVersion = {
          id: crypto.randomUUID(),
          userId: user.id,
          originalPrompt: inputPrompt,
          improvedPrompt: res.improvedPrompt,
          clarityScore: res.clarityScore,
          specificityScore: res.specificityScore,
          completenessScore: res.completenessScore,
          suggestions: res.missingSuggestions,
          status: 'draft',
          createdAt: new Date().toISOString()
        };
        await addPromptVersion(pv);
      }
      notify('success', 'Analysis Complete', `Quality score: ${res.overallScore}/100 based on transparency criteria.`);
    } catch (err: any) {
      console.error('Prompt analysis error:', err);
      notify('error', 'Analysis Failed', 'Could not complete prompt audit.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    notify('success', 'Copied', 'Prompt copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Prompt Engineering & Evaluation Lab</h2>
            <p className="text-xs text-slate-400">
              Audit prompt ambiguity, evaluate clarity metrics, and iterate on visualization directives
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isAiPowered
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>{engineBadge}</span>
          </span>
        </div>
      </div>

      {/* Editor & Action Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Original Visualization Prompt
          </label>
          <span className="text-[11px] text-slate-400">
            Context Dataset: <strong className="text-slate-200">{activeDataset?.name || 'None'}</strong>
          </span>
        </div>

        <textarea
          rows={3}
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          placeholder="Enter a prompt to inspect (e.g. 'show sales by product' or 'display monthly growth')..."
          className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3.5 text-sm text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Scale className="h-4 w-4 text-teal-400" />
            <span>Evaluation uses transparent, documented heuristic criteria.</span>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputPrompt.trim()}
            className="flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-purple-400 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Auditing Prompt...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Run Prompt Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Scorecards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className={`rounded-xl border p-4 text-center ${getScoreColor(analysis.overallScore)}`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider">Overall Score</div>
              <div className="mt-1 text-3xl font-extrabold">{analysis.overallScore}/100</div>
              <p className="mt-1 text-[10px] opacity-80">Weighted aggregate score</p>
            </div>

            <div className={`rounded-xl border p-4 text-center ${getScoreColor(analysis.clarityScore)}`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider">Clarity Score</div>
              <div className="mt-1 text-3xl font-extrabold">{analysis.clarityScore}/100</div>
              <p className="mt-1 text-[10px] opacity-80">Syntactic precision & directness</p>
            </div>

            <div className={`rounded-xl border p-4 text-center ${getScoreColor(analysis.specificityScore)}`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider">Specificity</div>
              <div className="mt-1 text-3xl font-extrabold">{analysis.specificityScore}/100</div>
              <p className="mt-1 text-[10px] opacity-80">Explicit chart & sorting declared</p>
            </div>

            <div className={`rounded-xl border p-4 text-center ${getScoreColor(analysis.completenessScore)}`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider">Completeness</div>
              <div className="mt-1 text-3xl font-extrabold">{analysis.completenessScore}/100</div>
              <p className="mt-1 text-[10px] opacity-80">Axes and aggregation accounted for</p>
            </div>
          </div>

          {/* Before & After Comparison */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Original */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Original Prompt</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">Baseline</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-300 italic min-h-[90px]">
                "{inputPrompt}"
              </div>

              {/* Warnings */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Ambiguity Warnings ({analysis.ambiguityWarnings.length})
                </h4>
                {analysis.ambiguityWarnings.length === 0 ? (
                  <p className="text-xs text-slate-400">No severe ambiguities detected.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-amber-300/90 list-disc list-inside">
                    {analysis.ambiguityWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Improved */}
            <div className="rounded-xl border border-teal-500/40 bg-slate-900/90 p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-teal-300 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Recommended Improved Prompt
                </span>
                <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                  OPTIMIZED
                </span>
              </div>

              <div className="rounded-lg border border-teal-500/30 bg-slate-950 p-3.5 text-xs text-slate-100 font-medium min-h-[90px] leading-relaxed">
                "{acceptedPrompt || analysis.improvedPrompt}"
              </div>

              {/* Rationale */}
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-xs text-slate-300">
                <span className="font-semibold text-teal-400 block mb-1">Reason for Suggestion:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">{analysis.rationale}</p>
              </div>

              {/* Missing Suggestions */}
              {analysis.missingSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    Missing Information Checklist:
                  </span>
                  <div className="space-y-1 text-xs text-slate-300">
                    {analysis.missingSuggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-teal-400">•</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAcceptedPrompt(analysis.improvedPrompt);
                    notify('success', 'Accepted', 'Applied improved prompt specification.');
                  }}
                  className="rounded-lg bg-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-teal-400"
                >
                  Accept Suggestion
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(analysis.improvedPrompt)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Improved'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSendToGenerator(acceptedPrompt || analysis.improvedPrompt)}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-purple-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-purple-400"
                >
                  <span>Test in Viz Generator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Version History */}
      {promptVersions.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <History className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Prompt Iteration History ({promptVersions.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-800/60">
            {promptVersions.slice(0, 5).map(pv => (
              <div key={pv.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-200">"{pv.originalPrompt}"</span>
                  <p className="text-[11px] text-teal-400 mt-0.5">→ "{pv.improvedPrompt}"</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400">
                    C:{pv.clarityScore} S:{pv.specificityScore}
                  </span>
                  <button
                    onClick={() => onSendToGenerator(pv.improvedPrompt)}
                    className="text-teal-400 hover:underline font-medium text-xs"
                  >
                    Test →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
