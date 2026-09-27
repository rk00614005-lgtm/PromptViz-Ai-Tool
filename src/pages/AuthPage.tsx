import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, Building, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('analyst@promptviz.ai');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Elena Rostova');
  const [company, setCompany] = useState('Vanguard Data Labs');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) setErrorMsg(res.error);
      } else if (mode === 'signup') {
        const res = await signUp(email, password, fullName, company);
        if (res.error) setErrorMsg(res.error);
      } else {
        const res = await resetPassword(email);
        setInfoMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 font-bold text-slate-950 shadow-lg shadow-teal-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
            PromptViz AI
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Prompt Engineering for Data Visualization
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 rounded-lg py-1.5 transition-all ${
              mode === 'signin' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 rounded-lg py-1.5 transition-all ${
              mode === 'signup' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          {mode === 'signup' && (
            <>
              <div>
                <label className="mb-1 block text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Elena Rostova"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-slate-300">Company / Organization</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Vanguard Data Labs"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="analyst@promptviz.ai"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[11px] text-teal-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-rose-800 bg-rose-950/40 p-2.5 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="rounded-lg border border-teal-800 bg-teal-950/40 p-2.5 text-xs text-teal-300">
              {infoMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 font-bold text-slate-950 shadow-md transition-all hover:bg-teal-400 disabled:opacity-50"
          >
            <span>
              {mode === 'signin'
                ? 'Sign In to Workspace'
                : mode === 'signup'
                ? 'Create Verified Account'
                : 'Send Recovery Email'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Instant Demo Shortcut */}
        <div className="mt-6 border-t border-slate-800 pt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Evaluating PromptViz AI? One-click demo sign-in is enabled.
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail('analyst@promptviz.ai');
              setPassword('password123');
              signIn('analyst@promptviz.ai', 'password123');
            }}
            className="mt-2 text-xs font-semibold text-teal-400 hover:text-teal-300 underline"
          >
            Auto-fill Analyst Credentials & Launch →
          </button>
        </div>

        {/* Security Assurance */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
          <span>PostgreSQL Row-Level Security Enabled</span>
        </div>
      </div>
    </div>
  );
};
