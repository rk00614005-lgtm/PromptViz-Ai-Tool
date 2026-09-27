import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { dbService } from '../services/supabase';
import { Dataset, Visualization, Report, PromptVersion, TestRun, UserSettings } from '../types';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface DataContextType {
  datasets: Dataset[];
  activeDataset: Dataset | null;
  setActiveDataset: (ds: Dataset | null) => void;
  visualizations: Visualization[];
  reports: Report[];
  history: Visualization[];
  promptVersions: PromptVersion[];
  testRuns: TestRun[];
  settings: UserSettings;
  isLoading: boolean;
  notifications: ToastNotification[];
  dismissNotification: (id: string) => void;
  notify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  // CRUD actions
  createDataset: (dataset: Dataset) => Promise<void>;
  updateDataset: (dataset: Dataset) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  createVisualization: (viz: Visualization) => Promise<void>;
  deleteVisualization: (id: string) => Promise<void>;
  createReport: (report: Report) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  addPromptVersion: (pv: PromptVersion) => Promise<void>;
  addTestRun: (tr: TestRun) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [history, setHistory] = useState<Visualization[]>([]);
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<UserSettings>({
    userId: user?.id || 'default',
    theme: 'dark',
    defaultChartType: 'bar',
    defaultPalette: 'teal_emerald',
    previewRowLimit: 100,
    dateFormat: 'YYYY-MM-DD'
  });

  const notify = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4500);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const loadUserData = useCallback(async () => {
    if (!user) {
      setDatasets([]);
      setActiveDataset(null);
      setVisualizations([]);
      setReports([]);
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [dList, vList, rList, hList, pvList, trList, sObj] = await Promise.all([
        dbService.getDatasets(user.id),
        dbService.getVisualizations(user.id),
        dbService.getReports(user.id),
        dbService.getHistory(user.id),
        dbService.getPromptVersions(user.id),
        dbService.getTestRuns(user.id),
        dbService.getSettings(user.id)
      ]);

      setDatasets(dList);
      if (dList.length > 0 && !activeDataset) {
        setActiveDataset(dList[0]);
      }
      setVisualizations(vList);
      setReports(rList);
      setHistory(hList);
      setPromptVersions(pvList);
      setTestRuns(trList);
      if (sObj) setSettings(sObj);
    } catch (err) {
      console.error('Error loading user data:', err);
      notify('error', 'Sync Failed', 'Failed to retrieve your workspace data.');
    } finally {
      setIsLoading(false);
    }
  }, [user, notify, activeDataset]);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const createDataset = async (dataset: Dataset) => {
    await dbService.saveDataset(dataset);
    setDatasets(prev => [dataset, ...prev]);
    setActiveDataset(dataset);
    notify('success', 'Dataset Uploaded', `Successfully indexed ${dataset.name} (${dataset.rowCount} rows).`);
  };

  const updateDataset = async (dataset: Dataset) => {
    await dbService.saveDataset(dataset);
    setDatasets(prev => prev.map(d => (d.id === dataset.id ? dataset : d)));
    if (activeDataset?.id === dataset.id) setActiveDataset(dataset);
    notify('success', 'Dataset Updated', `Updated metadata for ${dataset.name}.`);
  };

  const deleteDataset = async (id: string) => {
    if (!user) return;
    await dbService.deleteDataset(user.id, id);
    setDatasets(prev => prev.filter(d => d.id !== id));
    if (activeDataset?.id === id) {
      const remaining = datasets.filter(d => d.id !== id);
      setActiveDataset(remaining.length > 0 ? remaining[0] : null);
    }
    notify('info', 'Dataset Removed', 'The dataset has been deleted.');
  };

  const createVisualization = async (viz: Visualization) => {
    await dbService.saveVisualization(viz);
    setVisualizations(prev => [viz, ...prev.filter(v => v.id !== viz.id)]);
    setHistory(prev => [viz, ...prev]);
    notify('success', 'Visualization Saved', `"${viz.title}" added to your workspace.`);
  };

  const deleteVisualization = async (id: string) => {
    if (!user) return;
    await dbService.deleteVisualization(user.id, id);
    setVisualizations(prev => prev.filter(v => v.id !== id));
    notify('info', 'Visualization Deleted', 'The visualization was removed.');
  };

  const createReport = async (report: Report) => {
    await dbService.saveReport(report);
    setReports(prev => [report, ...prev.filter(r => r.id !== report.id)]);
    notify('success', 'Report Saved', `Executive report "${report.title}" created.`);
  };

  const deleteReport = async (id: string) => {
    if (!user) return;
    await dbService.deleteReport(user.id, id);
    setReports(prev => prev.filter(r => r.id !== id));
    notify('info', 'Report Deleted', 'Report removed from repository.');
  };

  const addPromptVersion = async (pv: PromptVersion) => {
    await dbService.savePromptVersion(pv);
    setPromptVersions(prev => [pv, ...prev]);
  };

  const addTestRun = async (tr: TestRun) => {
    await dbService.saveTestRun(tr);
    setTestRuns(prev => [tr, ...prev]);
  };

  const deleteHistoryItem = async (id: string) => {
    if (!user) return;
    await dbService.deleteHistoryItem(user.id, id);
    setHistory(prev => prev.filter(h => h.id !== id));
    notify('info', 'History Cleared', 'Visualization history item deleted.');
  };

  const updateSettings = async (partial: Partial<UserSettings>) => {
    if (!user) return;
    const updated = { ...settings, ...partial, userId: user.id };
    await dbService.saveSettings(updated);
    setSettings(updated);
    notify('success', 'Settings Saved', 'User preferences updated.');
  };

  return (
    <DataContext.Provider
      value={{
        datasets,
        activeDataset,
        setActiveDataset,
        visualizations,
        reports,
        history,
        promptVersions,
        testRuns,
        settings,
        isLoading,
        notifications,
        dismissNotification,
        notify,
        createDataset,
        updateDataset,
        deleteDataset,
        createVisualization,
        deleteVisualization,
        createReport,
        deleteReport,
        addPromptVersion,
        addTestRun,
        deleteHistoryItem,
        updateSettings,
        refreshAll: loadUserData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
