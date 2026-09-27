import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Wand2,
  FlaskConical,
  Database,
  Bot,
  LineChart,
  FileSpreadsheet,
  CheckCircle2,
  History,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  DatabaseZap
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export type NavItemKey =
  | 'dashboard'
  | 'generator'
  | 'builder'
  | 'lab'
  | 'datasets'
  | 'copilot'
  | 'insights'
  | 'reports'
  | 'testing'
  | 'history'
  | 'guide'
  | 'settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse
}) => {
  const { activeDataset } = useData();

  const navItems: { key: NavItemKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'generator', label: 'Viz Generator', icon: <Sparkles className="h-4 w-4 text-teal-400" /> },
    { key: 'builder', label: 'Prompt Builder', icon: <Wand2 className="h-4 w-4" /> },
    { key: 'lab', label: 'Prompt Lab', icon: <FlaskConical className="h-4 w-4 text-purple-400" /> },
    { key: 'datasets', label: 'Dataset Manager', icon: <Database className="h-4 w-4 text-cyan-400" /> },
    { key: 'copilot', label: 'AI Viz Copilot', icon: <Bot className="h-4 w-4 text-emerald-400" /> },
    { key: 'insights', label: 'Data Insights', icon: <LineChart className="h-4 w-4" /> },
    { key: 'reports', label: 'Report Generator', icon: <FileSpreadsheet className="h-4 w-4" /> },
    { key: 'testing', label: 'Testing & Eval', icon: <CheckCircle2 className="h-4 w-4 text-amber-400" /> },
    { key: 'history', label: 'Viz History', icon: <History className="h-4 w-4" /> },
    { key: 'guide', label: 'Prompt Guide', icon: <BookOpen className="h-4 w-4 text-sky-400" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-slate-900/95 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 font-bold text-slate-950 shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="truncate">
              <span className="text-sm font-bold tracking-tight text-slate-100">PromptViz</span>
              <span className="ml-1 rounded bg-teal-500/20 px-1 py-0.5 text-[10px] font-semibold text-teal-300">
                AI
              </span>
              <p className="truncate text-[10px] text-slate-400">Prompt Engineering Viz</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-slate-950 shadow-md">
            <Sparkles className="h-4 w-4" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 md:block ${
            isCollapsed ? 'mx-auto mt-2' : ''
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Active Dataset Pill (when not collapsed) */}
      {!isCollapsed && activeDataset && (
        <div className="mx-3 mt-3 rounded-lg border border-slate-800 bg-slate-800/40 p-2 text-xs">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            <DatabaseZap className="h-3 w-3 text-teal-400" />
            <span>Active Dataset</span>
          </div>
          <div className="mt-1 truncate font-medium text-slate-200" title={activeDataset.name}>
            {activeDataset.name}
          </div>
          <div className="text-[11px] text-slate-400">
            {activeDataset.rowCount} rows • {activeDataset.columnCount} cols
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navItems.map(item => {
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              title={isCollapsed ? item.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300 font-semibold shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <span className={`shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="ml-auto rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Engine Badge */}
      {!isCollapsed && (
        <div className="border-t border-slate-800 p-3 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>AI Provider:</span>
            <span className="font-medium text-teal-400">Gemini 3.8 / Rules</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span>Storage:</span>
            <span className="font-medium text-slate-300">Isolated PostgreSQL</span>
          </div>
        </div>
      )}
    </aside>
  );
};
