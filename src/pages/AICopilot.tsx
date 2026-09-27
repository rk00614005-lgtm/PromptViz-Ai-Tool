import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/gemini';
import { dbService } from '../services/supabase';
import { CopilotMessage } from '../types';
import {
  Bot,
  Send,
  Sparkles,
  Calculator,
  ArrowRight,
  Trash2,
  Cpu,
  RefreshCw,
  HelpCircle,
  Database
} from 'lucide-react';

interface CopilotProps {
  onOpenInGenerator: (prompt: string) => void;
}

export const AICopilot: React.FC<CopilotProps> = ({ onOpenInGenerator }) => {
  const { user } = useAuth();
  const { activeDataset, notify } = useData();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [engineBadge, setEngineBadge] = useState('Deterministic Engine');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load message history for active dataset
  useEffect(() => {
    async function loadHistory() {
      if (user && activeDataset) {
        const msgs = await dbService.getCopilotMessages(user.id, activeDataset.id);
        if (msgs.length > 0) {
          setMessages(msgs);
        } else {
          // Welcome greeting
          const welcome: CopilotMessage = {
            id: 'msg-welcome',
            conversationId: activeDataset.id,
            role: 'assistant',
            content: `Hello! I am connected directly to **${activeDataset.name}** (${activeDataset.rowCount} rows). Ask me to compute statistics, identify peaks or outliers, evaluate averages, or recommend charts. All calculations are executed over actual records!`,
            timestamp: new Date().toISOString()
          };
          setMessages([welcome]);
        }
      }
    }
    loadHistory();
  }, [user, activeDataset]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || !activeDataset || !user) return;

    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      conversationId: activeDataset.id,
      role: 'user',
      content: q.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);

    try {
      const response = await aiService.askCopilot(q, activeDataset, messages);
      setEngineBadge(response.provider);

      const assistantMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        conversationId: activeDataset.id,
        role: 'assistant',
        content: response.answer,
        calculationDetails: response.calculationDetails,
        suggestedChart: response.suggestedChart,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
      await dbService.saveCopilotMessage(user.id, activeDataset.id, userMsg);
      await dbService.saveCopilotMessage(user.id, activeDataset.id, assistantMsg);
    } catch (err: any) {
      console.error('Copilot error:', err);
      notify('error', 'Copilot Error', 'Could not compute calculation from dataset.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (user && activeDataset) {
      await dbService.clearCopilotMessages(user.id, activeDataset.id);
      setMessages([]);
      notify('info', 'Chat Cleared', 'Conversation history reset.');
    }
  };

  const quickQuestions = activeDataset?.fileName?.includes('ecommerce')
    ? [
        'Which category has the highest total Revenue?',
        'What is the average rating across all products?',
        'Are there any missing values in this dataset?',
        'What chart would you recommend to show Profit vs Revenue?'
      ]
    : [
        'Which region has the highest total MRR?',
        'What is the average Churn Rate in this dataset?',
        'Show me the monthly trajectory or trend.',
        'Which product tier has the most customers?'
      ];

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">AI Visualization Copilot</h2>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-teal-400 font-medium">
                {engineBadge}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded in <strong className="text-slate-200">{activeDataset?.name}</strong> • Deterministic Math First
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
          title="Clear session messages"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isUser
                    ? 'bg-teal-500 text-slate-950'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isUser ? 'You' : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none space-y-3'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Calculation audit box if available */}
                {msg.calculationDetails && (
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 text-[11px] text-slate-300 space-y-1.5 font-sans">
                    <div className="flex items-center gap-1.5 font-semibold text-teal-400">
                      <Calculator className="h-3.5 w-3.5" />
                      <span>Mathematical Verification Audit:</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Calculation: </span>
                      <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-teal-300">
                        {msg.calculationDetails.formula}
                      </code>
                    </div>
                    <p className="text-slate-400">{msg.calculationDetails.explanation}</p>
                    <div className="text-[10px] text-slate-400">
                      Columns verified: {msg.calculationDetails.columnsUsed.join(', ')}
                    </div>
                  </div>
                )}

                {/* Suggested Chart Card */}
                {msg.suggestedChart && (
                  <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3 text-xs text-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold text-teal-300 block">{msg.suggestedChart.title}</span>
                      <span className="text-[11px] text-slate-400">
                        {msg.suggestedChart.chartType?.toUpperCase()} ({msg.suggestedChart.xAxis} × {msg.suggestedChart.yAxis})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (msg.suggestedChart) {
                          onOpenInGenerator(
                            `Create a ${msg.suggestedChart.chartType || 'bar'} chart showing ${msg.suggestedChart.yAxis || ''} by ${msg.suggestedChart.xAxis || ''}`
                          );
                        }
                      }}
                      className="flex items-center gap-1 rounded-lg bg-teal-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-teal-400 shrink-0"
                    >
                      <span>Open in Generator</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 max-w-xl">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-700 bg-slate-800/80 px-4 py-3 text-xs text-slate-300">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-400" />
              <span>Querying dataset & verifying calculation...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="border-t border-slate-800 bg-slate-900/40 px-6 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 text-[11px] shrink-0">Try asking:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="shrink-0 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-600 hover:bg-slate-700"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Bar */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder={`Ask a question about ${activeDataset?.name || 'the active dataset'}...`}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isSending}
            className="flex items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-slate-950 font-bold hover:bg-teal-400 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
