import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Sliders,
  Brain,
  UploadCloud,
  BarChart3,
  Info
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'prediction', label: 'Prediction', icon: Cpu },
    { id: 'what-if', label: 'What-If Analysis', icon: Sliders },
    { id: 'explainability', label: 'Explainability', icon: Brain },
    { id: 'batch', label: 'Batch Analysis', icon: UploadCloud },
    { id: 'performance', label: 'Model Performance', icon: BarChart3 },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <aside className="w-60 bg-[#0C1017] border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto z-40 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-mono font-bold text-xs">
              XAI
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono">
                MAINTAIN<span className="text-sky-400">XAI</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight">XAI MAINTENANCE INTELLIGENCE</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors relative rounded-sm ${
                  isActive
                    ? 'text-sky-400 bg-sky-500/5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {/* Thin left accent indicator for active item */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-sky-400 rounded-r"></span>
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status Panel */}
      <div className="p-4 border-t border-slate-800/60 text-xs">
        <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
          <span>XGBoost</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Ready
          </span>
        </div>
      </div>
    </aside>
  );
}
