import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, dbService } from '../services/supabase';
import { UserProfile } from '../types';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, fullName?: string, company?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isOnboardingCompleted: boolean;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'promptviz_auth_session';
const ONBOARDING_KEY = 'promptviz_onboarding_completed';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(true);

  // Initialize session
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            const p = await dbService.getProfile(session.user.id);
            setProfile(p);
          }
          supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              setUser({ id: session.user.id, email: session.user.email || '' });
              const p = await dbService.getProfile(session.user.id);
              setProfile(p);
            } else {
              setUser(null);
              setProfile(null);
            }
          });
        } else {
          // Local persistent session
          const saved = localStorage.getItem(LOCAL_SESSION_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setUser(parsed.user);
            setProfile(parsed.profile);
          } else {
            // Default demo account so user can immediately evaluate the app without friction!
            const defaultUser: AuthUser = { id: 'usr-analyst-default', email: 'analyst@promptviz.ai' };
            const defaultProfile: UserProfile = {
              id: 'usr-analyst-default',
              email: 'analyst@promptviz.ai',
              fullName: 'Elena Rostova',
              company: 'Vanguard Data Labs',
              role: 'Lead Visual Analytics Engineer'
            };
            setUser(defaultUser);
            setProfile(defaultProfile);
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user: defaultUser, profile: defaultProfile }));
          }
        }

        const onb = localStorage.getItem(ONBOARDING_KEY);
        setIsOnboardingCompleted(onb === 'true');
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    if (!email || !pass) return { error: 'Please enter both email and password.' };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error: error.message };
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' });
        const p = await dbService.getProfile(data.user.id);
        setProfile(p);
      }
      return {};
    }

    // Local authentication
    const fakeId = 'usr_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16);
    const existingProfile = await dbService.getProfile(fakeId);
    const authUser = { id: fakeId, email };
    const authProf = existingProfile || {
      id: fakeId,
      email,
      fullName: email.split('@')[0].replace(/[._]/g, ' '),
      company: 'Enterprise Analytics',
      role: 'Senior Data Analyst'
    };

    setUser(authUser);
    setProfile(authProf);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user: authUser, profile: authProf }));
    return {};
  };

  const signUp = async (email: string, pass: string, fullName?: string, company?: string): Promise<{ error?: string }> => {
    if (!email || !pass) return { error: 'Please enter both email and password.' };
    if (pass.length < 6) return { error: 'Password must be at least 6 characters.' };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { full_name: fullName, company }
        }
      });
      if (error) return { error: error.message };
      if (data.user) {
        const newProf: UserProfile = {
          id: data.user.id,
          email,
          fullName: fullName || email.split('@')[0],
          company: company || 'Data Analytics Team',
          role: 'Data Analyst'
        };
        await dbService.saveProfile(newProf);
        setUser({ id: data.user.id, email: data.user.email || '' });
        setProfile(newProf);
      }
      return {};
    }

    const newId = 'usr_' + Date.now();
    const newUser = { id: newId, email };
    const newProf: UserProfile = {
      id: newId,
      email,
      fullName: fullName || email.split('@')[0],
      company: company || 'Analytics Corp',
      role: 'Data Analyst'
    };

    await dbService.saveProfile(newProf);
    setUser(newUser);
    setProfile(newProf);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user: newUser, profile: newProf }));
    setIsOnboardingCompleted(false);
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_SESSION_KEY);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!email) return { success: false, message: 'Please provide an email address.' };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Password recovery email sent successfully.' };
    }
    return { success: true, message: 'Password reset link sent (simulated for secure local session).' };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const updated: UserProfile = { ...profile, ...updates };
    setProfile(updated);
    await dbService.saveProfile(updated);
    if (!isSupabaseConfigured) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user, profile: updated }));
    }
  };

  const completeOnboarding = () => {
    setIsOnboardingCompleted(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        isOnboardingCompleted,
        completeOnboarding
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
