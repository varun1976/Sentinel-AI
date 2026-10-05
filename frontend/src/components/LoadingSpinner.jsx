import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = "Loading data...", steps = [] }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-300 font-mono tracking-wide">{text}</span>
        {steps.length > 0 && (
          <div className="text-[11px] text-slate-500 space-y-0.5 mt-2">
            {steps.map((step, idx) => (
              <div key={idx}>{step}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
