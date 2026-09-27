import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { runEvaluationTests, parsePromptDeterministically } from '../services/ruleEngine';
import { TestRun, TestRuleFinding } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  History,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';

export const TestingEvaluation: React.FC = () => {
  const { user } = useAuth();
  const { activeDataset, testRuns, addTestRun, notify } = useData();

  const [testPrompt, setTestPrompt] = useState('Compare total MRR by Region as a bar chart');
  const [isRunning, setIsRunning] = useState(false);
  const [currentFindings, setCurrentFindings] = useState<TestRuleFinding[] | null>(null);

  const sampleTestCases = [
    {
      name: 'Valid Category Comparison',
      prompt: 'Compare total MRR across Region as a bar chart',
      desc: 'Standard clean benchmark prompt with explicit axis, metric, and chart type.'
    },
    {
      name: 'Missing Nonexistent Column',
      prompt: 'Show total Bitcoins by Martian_Colony as a line chart',
      desc: 'Tests column schema auditor for nonexistent columns.'
    },
    {
      name: 'Invalid Aggregation on Non-Numeric',
      prompt: 'Show average Region across Product_Tier',
      desc: 'Tests mathematical validation: calculating arithmetic mean of categorical strings.'
    },
    {
      name: 'High-Cardinality Pie Alert',
      prompt: 'Display percentage breakdown of Customer_ID as a pie chart',
      desc: 'Tests cognitive load check: pie charts with excessive unique slices.'
    },
    {
      name: 'Ultra-Vague Prompt',
      prompt: 'chart data',
      desc: 'Tests minimum information & prompt completeness threshold.'
    }
  ];

  const handleRunTest = async (promptToTest?: string, testName?: string) => {
    const p = promptToTest || testPrompt;
    if (!p.trim()) return;

    setIsRunning(true);

    try {
      // Parse prompt first to get target config
      const parsed = parsePromptDeterministically(p, activeDataset || undefined);
      const findings = runEvaluationTests(p, parsed as any, activeDataset || undefined);
      setCurrentFindings(findings);

      const hasFail = findings.some(f => f.status === 'fail');
      const hasWarn = findings.some(f => f.status === 'warning');
      const overallStatus = hasFail ? 'fail' : hasWarn ? 'warning' : 'pass';

      if (user) {
        const runRecord: TestRun = {
          id: crypto.randomUUID(),
          userId: user.id,
          testName: testName || 'Custom Prompt Verification',
          status: overallStatus,
          prompt: p,
          findings,
          datasetName: activeDataset?.name,
          createdAt: new Date().toISOString()
        };
        await addTestRun(runRecord);
      }

      notify(
        overallStatus === 'pass' ? 'success' : overallStatus === 'warning' ? 'warning' : 'error',
        'Test Suite Executed',
        `Evaluated 5 rules: ${findings.filter(f => f.status === 'pass').length} passed, ${findings.filter(f => f.status === 'warning').length} warnings, ${findings.filter(f => f.status === 'fail').length} failed.`
      );
    } catch (err: any) {
      console.error('Testing run error:', err);
      notify('error', 'Execution Error', 'Test suite encountered an error.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Testing & Evaluation Suite</h2>
            <p className="text-xs text-slate-400">
              Deterministic validation of prompts, schema compatibility, cognitive limits, and aggregations
            </p>
          </div>
        </div>

        <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
          Target Dataset: <strong className="text-slate-100">{activeDataset?.name || 'None'}</strong>
        </span>
      </div>

      {/* Preset Test Scenarios */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
          Preset Test Scenarios (Click to Execute)
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sampleTestCases.map((tc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setTestPrompt(tc.prompt);
                handleRunTest(tc.prompt, tc.name);
              }}
              className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 text-left transition-all hover:border-slate-700 hover:bg-slate-800/80"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-slate-200">{tc.name}</span>
                <Play className="h-3 w-3 text-teal-400 fill-current opacity-70" />
              </div>
              <p className="mt-1 text-[11px] text-teal-400 font-mono truncate w-full">"{tc.prompt}"</p>
              <p className="mt-1 text-[10px] text-slate-400 leading-normal">{tc.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Test Runner Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Custom Prompt Under Test
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testPrompt}
            onChange={e => setTestPrompt(e.target.value)}
            placeholder="Type prompt to evaluate..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none font-mono"
          />

          <button
            type="button"
            onClick={() => handleRunTest()}
            disabled={isRunning || !testPrompt.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run Test Suite</span>
          </button>
        </div>
      </div>

      {/* Test Findings Results Table */}
      {currentFindings && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">
              Audit Findings ({currentFindings.length} Rules Checked)
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {currentFindings.filter(f => f.status === 'pass').length} Passed
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {currentFindings.filter(f => f.status === 'warning').length} Warnings
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <XCircle className="h-3.5 w-3.5" />
                {currentFindings.filter(f => f.status === 'fail').length} Failed
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {currentFindings.map((finding, idx) => {
              const statusBg =
                finding.status === 'pass'
                  ? 'border-emerald-800/40 bg-emerald-950/20'
                  : finding.status === 'warning'
                  ? 'border-amber-800/40 bg-amber-950/20'
                  : 'border-rose-800/40 bg-rose-950/20';

              const statusIcon =
                finding.status === 'pass' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : finding.status === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                );

              return (
                <div key={idx} className={`rounded-xl border p-4 text-xs space-y-1 ${statusBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-200">
                      {statusIcon}
                      <span>{finding.rule}</span>
                      <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                        {finding.category}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold uppercase ${
                        finding.status === 'pass'
                          ? 'text-emerald-400'
                          : finding.status === 'warning'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {finding.status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs pl-6">{finding.message}</p>

                  {finding.fixSuggestion && (
                    <div className="mt-2 pl-6 text-[11px] text-teal-400 font-medium flex items-center gap-1.5">
                      <Info className="h-3 w-3" />
                      <span>Suggested Fix: {finding.fixSuggestion}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Test Runs */}
      {testRuns.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <History className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Verified Test Execution Log ({testRuns.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
            {testRuns.map(tr => (
              <div key={tr.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{tr.testName}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        tr.status === 'pass'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : tr.status === 'warning'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {tr.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">"{tr.prompt}"</p>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(tr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
