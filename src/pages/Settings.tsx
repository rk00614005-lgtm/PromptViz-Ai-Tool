import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { isSupabaseConfigured } from '../services/supabase';
import { ChartType, ColorPalette } from '../types';
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  Palette,
  ShieldCheck,
  LogOut,
  Save,
  CheckCircle2,
  Database,
  Moon,
  Sun
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { settings, updateSettings, notify } = useData();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [company, setCompany] = useState(profile?.company || '');
  const [role, setRole] = useState(profile?.role || 'Lead Visual Analytics Engineer');

  const [defaultChartType, setDefaultChartType] = useState<ChartType>(settings.defaultChartType || 'bar');
  const [defaultPalette, setDefaultPalette] = useState<ColorPalette>(settings.defaultPalette || 'teal_emerald');
  const [previewRowLimit, setPreviewRowLimit] = useState(settings.previewRowLimit || 100);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'YYYY-MM-DD');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ fullName, company, role });
    notify('success', 'Profile Updated', 'Your profile details have been saved.');
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      defaultChartType,
      defaultPalette,
      previewRowLimit,
      dateFormat
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">System Preferences & Settings</h2>
            <p className="text-xs text-slate-400">
              Manage personal profile credentials, chart rendering defaults, and PostgreSQL database storage
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="h-4 w-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-100">User Profile & Account</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-slate-400">Email Address (Read-only)</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-slate-300">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-slate-300">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-slate-300">Role Title</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 font-bold text-slate-950 hover:bg-teal-400"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Chart & Workspace Preferences */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-100">Visualization Defaults</h3>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-slate-300">Default Chart Type</label>
              <select
                value={defaultChartType}
                onChange={e => setDefaultChartType(e.target.value as ChartType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                <option value="bar">Bar Chart</option>
                <option value="horizontal_bar">Horizontal Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="donut">Donut Chart</option>
                <option value="scatter">Scatter Plot</option>
                <option value="histogram">Histogram</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-slate-300">Default Color Palette</label>
              <select
                value={defaultPalette}
                onChange={e => setDefaultPalette(e.target.value as ColorPalette)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                <option value="teal_emerald">Teal & Emerald (Recommended)</option>
                <option value="navy_blue">Executive Navy</option>
                <option value="sunset_amber">Sunset Amber</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="monochrome">Monochrome Slate</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-slate-300">Preview Row Limit</label>
              <select
                value={previewRowLimit}
                onChange={e => setPreviewRowLimit(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                <option value={50}>50 rows (High speed)</option>
                <option value={100}>100 rows (Standard)</option>
                <option value={500}>500 rows (Detailed)</option>
                <option value={1000}>1000 rows (Full sample)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-slate-300">Date Format Preference</label>
              <select
                value={dateFormat}
                onChange={e => setDateFormat(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-teal-500 focus:outline-none"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (UK / EU)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 font-bold text-slate-950 hover:bg-teal-400"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>

        {/* Database & Security Architecture */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Storage & Database Architecture</h3>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-2.5">
              <span>Connection Status:</span>
              <span className={`font-semibold ${isSupabaseConfigured ? 'text-emerald-400' : 'text-teal-300'}`}>
                {isSupabaseConfigured ? 'Supabase PostgreSQL (Live)' : 'Encrypted Local Session Isolation'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Row-Level Security (RLS) policies isolate each user's datasets, generated charts, and reports under <code className="text-teal-400 font-mono">auth.uid() = user_id</code>. Database migration files are located in <code className="text-teal-400 font-mono">/supabase/migrations/</code>.
            </p>
          </div>
        </div>

        {/* Account Controls */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <LogOut className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-slate-100">Session Controls</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Signing out will end your current session and clear cached credentials. Your datasets and visualizations remain stored under your account.
          </p>

          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg border border-rose-800/60 bg-rose-950/20 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out of PromptViz AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
