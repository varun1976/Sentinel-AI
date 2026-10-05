import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import PredictionPage from './pages/PredictionPage';
import WhatIfPage from './pages/WhatIfPage';
import ExplainabilityPage from './pages/ExplainabilityPage';
import BatchPage from './pages/BatchPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import AboutPage from './pages/AboutPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const titles = {
    overview: { title: 'Predictive Maintenance Dashboard', subtitle: 'Real-time machine health intelligence and fleet risk overview' },
    prediction: { title: 'Machine Failure Risk Prediction', subtitle: 'Single-instance predictive analysis and local SHAP explanation' },
    'what-if': { title: 'What-If Counterfactual Simulator', subtitle: 'Interactive scenario analysis and risk parameter modification' },
    explainability: { title: 'SHAP Model Explainability', subtitle: 'Global feature importance rankings and beeswarm distribution' },
    batch: { title: 'Batch CSV Telemetry Diagnostics', subtitle: 'Multi-machine CSV upload and batch risk reporting' },
    performance: { title: 'Model Benchmark & Evaluation', subtitle: 'Empirical model metrics comparison (Logistic Regression vs. XGBoost)' },
    about: { title: 'About MaintainXAI', subtitle: 'Project documentation, architecture, and XAI methodology' },
  };

  const currentMeta = titles[activeTab] || titles.overview;

  return (
    <div className="flex min-h-screen bg-dark-800 text-slate-100 font-sans selection:bg-brand-cyan/20 selection:text-brand-cyan">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 'overview' && <DashboardPage onNavigateToPredict={() => setActiveTab('prediction')} />}
          {activeTab === 'prediction' && <PredictionPage />}
          {activeTab === 'what-if' && <WhatIfPage />}
          {activeTab === 'explainability' && <ExplainabilityPage />}
          {activeTab === 'batch' && <BatchPage />}
          {activeTab === 'performance' && <ModelPerformancePage />}
          {activeTab === 'about' && <AboutPage />}
        </main>
      </div>
    </div>
  );
}
