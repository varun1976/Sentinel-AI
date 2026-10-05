import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Header({ title, subtitle, onRefresh, isRefreshing }) {
  return (
    <header className="bg-[#0C1017]/80 backdrop-blur border-b border-slate-800/80 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
        <div className="hidden sm:flex items-center gap-3">
          <span>Dataset: <strong className="text-slate-200 font-normal">AI4I 2020</strong></span>
          <span className="text-slate-700">•</span>
          <span>Engine: <strong className="text-sky-400 font-normal">XGBoost + SHAP</strong></span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors disabled:opacity-50"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
}
