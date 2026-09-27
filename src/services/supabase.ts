import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Dataset, Visualization, Report, PromptVersion, TestRun, UserSettings, UserProfile, CopilotMessage } from '../types';
import { getSampleDatasets } from './sampleData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local storage key prefix for local persistence fallback
const STORAGE_PREFIX = 'promptviz_local_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Local storage read error:', e);
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('Local storage write error:', e);
  }
}

/**
 * High-Level Database Service handling both Supabase and Local Persistent Fallback
 */
export const dbService = {
  // Profiles
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) return data;
    }
    const profiles = getLocal<Record<string, UserProfile>>('profiles', {});
    return profiles[userId] || null;
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('profiles').upsert(profile);
    }
    const profiles = getLocal<Record<string, UserProfile>>('profiles', {});
    profiles[profile.id] = profile;
    setLocal('profiles', profiles);
  },

  // Datasets
  async getDatasets(userId: string): Promise<Dataset[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          userId: d.user_id,
          name: d.name,
          description: d.description,
          fileName: d.file_name,
          fileSize: d.file_size,
          rowCount: d.row_count,
          columnCount: d.column_count,
          columns: d.columns,
          dataQualityScore: d.data_quality_score,
          rawPreviewData: d.raw_preview_data,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        }));
      }
    }

    // Local fallback
    let list = getLocal<Dataset[]>(`datasets_${userId}`, []);
    if (list.length === 0) {
      // Seed with sample datasets for rich first-time experience
      const samples = getSampleDatasets(userId);
      list = samples;
      setLocal(`datasets_${userId}`, list);
    }
    return list;
  },

  async saveDataset(dataset: Dataset): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('datasets').upsert({
        id: dataset.id,
        user_id: dataset.userId,
        name: dataset.name,
        description: dataset.description,
        file_name: dataset.fileName,
        file_size: dataset.fileSize,
        row_count: dataset.rowCount,
        column_count: dataset.columnCount,
        columns: dataset.columns,
        data_quality_score: dataset.dataQualityScore,
        raw_preview_data: dataset.rawPreviewData,
        created_at: dataset.createdAt,
        updated_at: dataset.updatedAt
      });
    }

    const list = getLocal<Dataset[]>(`datasets_${dataset.userId}`, []);
    const idx = list.findIndex(d => d.id === dataset.id);
    if (idx >= 0) {
      list[idx] = dataset;
    } else {
      list.unshift(dataset);
    }
    setLocal(`datasets_${dataset.userId}`, list);
  },

  async deleteDataset(userId: string, datasetId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('datasets').delete().eq('id', datasetId).eq('user_id', userId);
    }
    const list = getLocal<Dataset[]>(`datasets_${userId}`, []);
    const filtered = list.filter(d => d.id !== datasetId);
    setLocal(`datasets_${userId}`, filtered);
  },

  // Visualizations
  async getVisualizations(userId: string): Promise<Visualization[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('visualizations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(v => ({
          id: v.id,
          userId: v.user_id,
          datasetId: v.dataset_id,
          title: v.title,
          prompt: v.prompt,
          chartType: v.chart_type,
          xAxis: v.x_axis,
          yAxis: v.y_axis,
          aggregation: v.aggregation,
          groupBy: v.group_by,
          palette: v.palette,
          config: v.config,
          insights: v.insights,
          isFavorite: v.is_favorite,
          createdAt: v.created_at,
          updatedAt: v.updated_at
        }));
      }
    }

    return getLocal<Visualization[]>(`visualizations_${userId}`, []);
  },

  async saveVisualization(viz: Visualization): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('visualizations').upsert({
        id: viz.id,
        user_id: viz.userId,
        dataset_id: viz.datasetId,
        title: viz.title,
        prompt: viz.prompt,
        chart_type: viz.chartType,
        x_axis: viz.xAxis,
        y_axis: viz.yAxis,
        aggregation: viz.aggregation,
        group_by: viz.groupBy,
        palette: viz.palette,
        config: viz.config,
        insights: viz.insights,
        is_favorite: viz.isFavorite,
        created_at: viz.createdAt,
        updated_at: viz.updatedAt
      });
    }

    const list = getLocal<Visualization[]>(`visualizations_${viz.userId}`, []);
    const idx = list.findIndex(v => v.id === viz.id);
    if (idx >= 0) {
      list[idx] = viz;
    } else {
      list.unshift(viz);
    }
    setLocal(`visualizations_${viz.userId}`, list);

    // Also append to history log
    await this.addToHistory(viz);
  },

  async deleteVisualization(userId: string, vizId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('visualizations').delete().eq('id', vizId).eq('user_id', userId);
    }
    const list = getLocal<Visualization[]>(`visualizations_${userId}`, []);
    const filtered = list.filter(v => v.id !== vizId);
    setLocal(`visualizations_${userId}`, filtered);
  },

  // History
  async getHistory(userId: string): Promise<Visualization[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('visualization_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(h => ({
          id: h.id,
          userId: h.user_id,
          datasetId: h.dataset_id,
          title: h.chart_title,
          prompt: h.prompt,
          chartType: h.chart_type,
          xAxis: h.config?.xAxis || '',
          yAxis: h.config?.yAxis || '',
          aggregation: h.config?.aggregation || 'sum',
          palette: h.config?.palette || 'teal_emerald',
          config: h.config,
          createdAt: h.created_at,
          updatedAt: h.created_at
        }));
      }
    }
    return getLocal<Visualization[]>(`history_${userId}`, []);
  },

  async addToHistory(viz: Visualization): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('visualization_history').insert({
        id: crypto.randomUUID(),
        user_id: viz.userId,
        dataset_id: viz.datasetId,
        prompt: viz.prompt,
        chart_type: viz.chartType,
        chart_title: viz.title,
        config: viz.config,
        created_at: new Date().toISOString()
      });
    }

    const history = getLocal<Visualization[]>(`history_${viz.userId}`, []);
    history.unshift(viz);
    if (history.length > 100) history.pop();
    setLocal(`history_${viz.userId}`, history);
  },

  async deleteHistoryItem(userId: string, id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('visualization_history').delete().eq('id', id).eq('user_id', userId);
    }
    const history = getLocal<Visualization[]>(`history_${userId}`, []);
    const filtered = history.filter(h => h.id !== id);
    setLocal(`history_${userId}`, filtered);
  },

  // Reports
  async getReports(userId: string): Promise<Report[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(r => ({
          id: r.id,
          userId: r.user_id,
          datasetId: r.dataset_id,
          title: r.title,
          authorName: r.author_name,
          summary: r.summary,
          introduction: r.introduction,
          conclusion: r.conclusion,
          visualizationIds: r.visualization_ids || [],
          insightsIncluded: r.insights_included || [],
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    }
    return getLocal<Report[]>(`reports_${userId}`, []);
  },

  async saveReport(report: Report): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('reports').upsert({
        id: report.id,
        user_id: report.userId,
        dataset_id: report.datasetId,
        title: report.title,
        author_name: report.authorName,
        summary: report.summary,
        introduction: report.introduction,
        conclusion: report.conclusion,
        visualization_ids: report.visualizationIds,
        insights_included: report.insightsIncluded,
        created_at: report.createdAt,
        updated_at: report.updatedAt
      });
    }

    const list = getLocal<Report[]>(`reports_${report.userId}`, []);
    const idx = list.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      list[idx] = report;
    } else {
      list.unshift(report);
    }
    setLocal(`reports_${report.userId}`, list);
  },

  async deleteReport(userId: string, reportId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('reports').delete().eq('id', reportId).eq('user_id', userId);
    }
    const list = getLocal<Report[]>(`reports_${userId}`, []);
    const filtered = list.filter(r => r.id !== reportId);
    setLocal(`reports_${userId}`, filtered);
  },

  // Prompt Versions
  async getPromptVersions(userId: string): Promise<PromptVersion[]> {
    return getLocal<PromptVersion[]>(`prompt_versions_${userId}`, []);
  },

  async savePromptVersion(pv: PromptVersion): Promise<void> {
    const list = getLocal<PromptVersion[]>(`prompt_versions_${pv.userId}`, []);
    list.unshift(pv);
    setLocal(`prompt_versions_${pv.userId}`, list);
  },

  // Test Runs
  async getTestRuns(userId: string): Promise<TestRun[]> {
    return getLocal<TestRun[]>(`test_runs_${userId}`, []);
  },

  async saveTestRun(tr: TestRun): Promise<void> {
    const list = getLocal<TestRun[]>(`test_runs_${tr.userId}`, []);
    list.unshift(tr);
    setLocal(`test_runs_${tr.userId}`, list);
  },

  // Settings
  async getSettings(userId: string): Promise<UserSettings> {
    const fallback: UserSettings = {
      userId,
      theme: 'dark',
      defaultChartType: 'bar',
      defaultPalette: 'teal_emerald',
      previewRowLimit: 100,
      dateFormat: 'YYYY-MM-DD'
    };
    return getLocal<UserSettings>(`settings_${userId}`, fallback);
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    setLocal(`settings_${settings.userId}`, settings);
  },

  // Copilot messages
  async getCopilotMessages(userId: string, datasetId: string): Promise<CopilotMessage[]> {
    return getLocal<CopilotMessage[]>(`copilot_${userId}_${datasetId}`, []);
  },

  async saveCopilotMessage(userId: string, datasetId: string, msg: CopilotMessage): Promise<void> {
    const list = getLocal<CopilotMessage[]>(`copilot_${userId}_${datasetId}`, []);
    list.push(msg);
    setLocal(`copilot_${userId}_${datasetId}`, list);
  },

  async clearCopilotMessages(userId: string, datasetId: string): Promise<void> {
    setLocal(`copilot_${userId}_${datasetId}`, []);
  }
};
