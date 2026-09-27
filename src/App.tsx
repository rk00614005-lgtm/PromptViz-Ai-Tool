import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationToast } from './components/layout/NotificationToast';
import { OnboardingModal } from './components/layout/OnboardingModal';

// Pages
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { VisualizationGenerator } from './pages/VisualizationGenerator';
import { PromptBuilder } from './pages/PromptBuilder';
import { PromptEngineeringLab } from './pages/PromptEngineeringLab';
import { DatasetManager } from './pages/DatasetManager';
import { AICopilot } from './pages/AICopilot';
import { DataInsights } from './pages/DataInsights';
import { ReportGenerator } from './pages/ReportGenerator';
import { TestingEvaluation } from './pages/TestingEvaluation';
import { VisualizationHistory } from './pages/VisualizationHistory';
import { PromptGuide } from './pages/PromptGuide';
import { Settings } from './pages/Settings';
import { Visualization } from './types';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [initialGeneratorPrompt, setInitialGeneratorPrompt] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="text-xs text-slate-400">Initializing PromptViz Workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Cross-module navigation helpers
  const handleSendPromptToGenerator = (promptText: string) => {
    setInitialGeneratorPrompt(promptText);
    setCurrentTab('generator');
  };

  const handleReopenViz = (viz: Visualization) => {
    setInitialGeneratorPrompt(viz.prompt);
    setCurrentTab('generator');
  };

  const renderActiveModule = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab: NavItemKey) => setCurrentTab(tab)} />;
      case 'generator':
        return <VisualizationGenerator />;
      case 'builder':
        return <PromptBuilder onSendToGenerator={handleSendPromptToGenerator} />;
      case 'lab':
        return <PromptEngineeringLab onSendToGenerator={handleSendPromptToGenerator} />;
      case 'datasets':
        return <DatasetManager onNavigateToGenerator={() => setCurrentTab('generator')} />;
      case 'copilot':
        return <AICopilot onOpenInGenerator={handleSendPromptToGenerator} />;
      case 'insights':
        return <DataInsights />;
      case 'reports':
        return <ReportGenerator />;
      case 'testing':
        return <TestingEvaluation />;
      case 'history':
        return <VisualizationHistory onReopenViz={handleReopenViz} />;
      case 'guide':
        return <PromptGuide onUseTemplate={handleSendPromptToGenerator} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={(tab: NavItemKey) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main View Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Global Header */}
        <Header currentTab={currentTab} onSelectTab={tab => setCurrentTab(tab)} />

        {/* Scrollable Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{renderActiveModule()}</div>
        </main>
      </div>

      {/* Global Notifications Toast */}
      <NotificationToast />

      {/* First-time Onboarding Modal */}
      <OnboardingModal onStartGenerator={() => setCurrentTab('generator')} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <MainApp />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
