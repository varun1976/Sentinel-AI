import React from 'react';

export default function RiskBadge({ level = "LOW", size = "md", showDot = true }) {
  const normalizedLevel = String(level).toUpperCase();

  const configs = {
    LOW: {
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/50',
    },
    MEDIUM: {
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/50',
    },
    HIGH: {
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      bg: 'bg-rose-950/40 border-rose-800/50',
    }
  };

  const cfg = configs[normalizedLevel] || configs.LOW;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-2',
    lg: 'px-3 py-1.5 text-xs font-semibold gap-2'
  };

  return (
    <inline className={`inline-flex items-center rounded border font-mono uppercase tracking-wider font-medium ${cfg.bg} ${cfg.text} ${sizeClasses[size] || sizeClasses.md}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>}
      {normalizedLevel} RISK
    </inline>
  );
}
