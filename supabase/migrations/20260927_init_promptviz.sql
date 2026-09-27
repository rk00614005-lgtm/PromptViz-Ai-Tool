-- ====================================================================
-- PromptViz AI — PostgreSQL / Supabase Schema & Row Level Security (RLS)
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'Data Analyst',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Datasets Metadata Table
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  row_count INTEGER NOT NULL,
  column_count INTEGER NOT NULL,
  columns JSONB NOT NULL, -- [{ name, type, missingCount, uniqueCount, sampleValues }]
  data_quality_score INTEGER DEFAULT 100,
  storage_path TEXT,
  raw_preview_data JSONB, -- limited rows for instant preview
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Visualizations Table
CREATE TABLE IF NOT EXISTS public.visualizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  chart_type TEXT NOT NULL, -- bar, horizontal_bar, line, area, pie, donut, scatter, histogram
  x_axis TEXT NOT NULL,
  y_axis TEXT NOT NULL,
  aggregation TEXT DEFAULT 'sum', -- sum, avg, count, min, max, none
  group_by TEXT,
  palette TEXT DEFAULT 'teal_emerald',
  config JSONB NOT NULL,
  insights TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Prompt Versions & Evolution Table
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_prompt TEXT NOT NULL,
  improved_prompt TEXT NOT NULL,
  clarity_score INTEGER NOT NULL,
  specificity_score INTEGER NOT NULL,
  completeness_score INTEGER NOT NULL,
  suggestions JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Executive Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  summary TEXT,
  introduction TEXT,
  conclusion TEXT,
  visualization_ids JSONB DEFAULT '[]'::jsonb,
  insights_included JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Visualization History Log
CREATE TABLE IF NOT EXISTS public.visualization_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  chart_type TEXT NOT NULL,
  chart_title TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Copilot Conversations & Messages Table
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Data Q&A Session',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  calculation_details JSONB,
  suggested_chart JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Test Runs Evaluation Table
CREATE TABLE IF NOT EXISTS public.test_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pass' | 'warning' | 'fail'
  prompt TEXT NOT NULL,
  findings JSONB NOT NULL,
  dataset_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  default_chart_type TEXT DEFAULT 'bar',
  default_palette TEXT DEFAULT 'teal_emerald',
  preview_row_limit INTEGER DEFAULT 100,
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- Enable Row Level Security (RLS) on all tables
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Datasets Policies
CREATE POLICY "Users can view own datasets" ON public.datasets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own datasets" ON public.datasets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own datasets" ON public.datasets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own datasets" ON public.datasets FOR DELETE USING (auth.uid() = user_id);

-- Visualizations Policies
CREATE POLICY "Users can view own visualizations" ON public.visualizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own visualizations" ON public.visualizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own visualizations" ON public.visualizations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own visualizations" ON public.visualizations FOR DELETE USING (auth.uid() = user_id);

-- Prompt Versions Policies
CREATE POLICY "Users can manage own prompt versions" ON public.prompt_versions FOR ALL USING (auth.uid() = user_id);

-- Reports Policies
CREATE POLICY "Users can manage own reports" ON public.reports FOR ALL USING (auth.uid() = user_id);

-- History Policies
CREATE POLICY "Users can manage own history" ON public.visualization_history FOR ALL USING (auth.uid() = user_id);

-- Copilot Policies
CREATE POLICY "Users can manage own copilot convs" ON public.copilot_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own copilot msgs" ON public.copilot_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.copilot_conversations WHERE id = copilot_messages.conversation_id AND user_id = auth.uid())
);

-- Test Runs Policies
CREATE POLICY "Users can manage own test runs" ON public.test_runs FOR ALL USING (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
