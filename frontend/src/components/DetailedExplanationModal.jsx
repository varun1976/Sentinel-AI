import React from 'react';
import { X, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function DetailedExplanationModal({ isOpen, onClose, prediction, explanation, inputData }) {
  if (!isOpen || !prediction || !explanation) return null;

  const baseValPct = (explanation.base_value * 100).toFixed(1);
  const predValPct = (explanation.prediction_value * 100).toFixed(1);
  const diffPct = (explanation.prediction_value * 100 - explanation.base_value * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-[#0F141E] border border-slate-800 rounded-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0C1017]">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-mono uppercase tracking-wider">
              SHAP Local Waterfall & Feature Contribution Analysis
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Additive feature attribution breakdown for single machine evaluation</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-3 gap-6 py-3 px-4 bg-[#141A26] border border-slate-800/80 rounded">
            <div>
              <span className="text-[11px] text-slate-400 block font-mono">Dataset Baseline</span>
              <span className="text-base font-bold font-mono text-slate-300">{baseValPct}%</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-mono">Calculated Risk</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold font-mono text-sky-400">{predValPct}%</span>
                <RiskBadge level={prediction.risk_level} size="sm" />
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-mono">Cumulative SHAP Shift</span>
              <span className={`text-base font-bold font-mono ${diffPct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {diffPct >= 0 ? `+${diffPct}` : diffPct}% pts
              </span>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="text-xs text-slate-300 leading-relaxed border-l-2 border-sky-400 pl-3 py-1">
            <strong className="text-sky-400 block mb-0.5">SHAP Additive Calculation:</strong>
            SHAP values calculate how each operational parameter pushes the probability starting from the dataset baseline expectation ({baseValPct}%) up towards failure risk (<span className="text-rose-400">Positive SHAP</span>) or down towards safety (<span className="text-emerald-400">Negative SHAP</span>).
          </div>

          {/* Features Table */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Individual Feature Contributions
            </div>

            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded overflow-hidden">
              {explanation.features.map((item, idx) => {
                const isIncreasing = item.impact === 'increases_risk';
                return (
                  <div key={idx} className="p-3 bg-[#121824]/50 hover:bg-[#161D2B] transition-colors flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {isIncreasing ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-medium text-slate-200">{item.name}</span>
                      <span className="text-[11px] font-mono text-slate-400 ml-2">val: {item.value}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[11px] text-slate-500 font-mono">{item.impact_pct}% contribution</span>
                      <span className={`font-mono text-xs font-semibold ${isIncreasing ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isIncreasing ? `+${item.shap_value}` : item.shap_value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0C1017] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
