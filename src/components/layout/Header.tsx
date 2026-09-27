import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { isSupabaseConfigured } from '../../services/supabase';
import { Sun, Moon, Database, LogOut, User as UserIcon, ShieldCheck, DatabaseZap, Plus } from 'lucide-react';
import { DatasetUploadModal } from '../dataset/DatasetUploadModal';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { user, profile, signOut } = useAuth();
  const { datasets, activeDataset, setActiveDataset } = useData();
  const { theme, toggleTheme } = useTheme();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Executive Analytics Dashboard';
      case 'generator': return 'Natural-Language Visualization Generator';
      case 'builder': return 'Structured Prompt Builder & Templates';
      case 'lab': return 'Prompt Engineering & Heuristic Lab';
      case 'datasets': return 'Dataset Manager & Schema Auditor';
      case 'copilot': return 'AI Visualization Copilot (Data Q&A)';
      case 'insights': return 'Automated Statistical Data Insights';
      case 'reports': return 'Executive Report Generator';
      case 'testing': return 'Prompt & Chart Testing Evaluation';
      case 'history': return 'Visualization History & Version Archive';
      case 'guide': return 'Prompt Engineering Curriculum & Best Practices';
      case 'settings': return 'System Preferences & Profile Settings';
      default: return 'PromptViz AI';
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md">
        {/* Left: Breadcrumbs & Page Title */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>PromptViz AI</span>
            <span>/</span>
            <span className="capitalize text-slate-300">{currentTab}</span>
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-slate-100 sm:text-base">
            {getPageTitle(currentTab)}
          </h1>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Dataset Switcher Dropdown */}
          <div className="relative hidden items-center gap-2 sm:flex">
            <DatabaseZap className="h-4 w-4 text-teal-400" />
            <select
              value={activeDataset?.id || ''}
              onChange={e => {
                if (e.target.value === '__upload__') {
                  setIsUploadModalOpen(true);
                } else {
                  const found = datasets.find(d => d.id === e.target.value);
                  if (found) setActiveDataset(found);
                }
              }}
              className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              {datasets.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.rowCount} rows)
                </option>
              ))}
              <option value="__upload__">+ Upload New Dataset...</option>
            </select>
          </div>

          {/* Quick Upload Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="hidden items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-1.5 text-xs font-medium text-teal-300 hover:bg-teal-500/20 sm:flex"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import Data</span>
          </button>

          {/* Supabase Status Badge */}
          <div
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium lg:flex ${
              isSupabaseConfigured
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-800/80 text-slate-300'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local User Isolation'}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-slate-800 bg-slate-800/50 p-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-400" />}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/60 p-1.5 text-xs font-medium text-slate-200 hover:border-slate-700"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500 font-bold text-slate-950">
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden max-w-[100px] truncate md:block">
                {profile?.fullName || user?.email?.split('@')[0]}
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-50">
                <div className="border-b border-slate-800 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-200">{profile?.fullName || 'User'}</p>
                  <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
                  <p className="mt-0.5 text-[10px] text-teal-400 font-medium">{profile?.role || 'Data Analyst'}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSelectTab('settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Upload Modal */}
      <DatasetUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
    </>
  );
};
