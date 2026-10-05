import React, { useState, useEffect } from 'react';
import { Sliders, ArrowRight, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { runWhatIf } from '../services/api';

export default function WhatIfPage() {
  const [original] = useState({
    type: 'M',
    air_temperature: 300.0,
    process_temperature: 310.0,
    rotational_speed: 1350.0,
    torque: 65.0,
    tool_wear: 180.0,
  });

  const [scenario, setScenario] = useState({
    type: 'M',
    air_temperature: 298.5,
    process_temperature: 308.8,
    rotational_speed: 1550.0,
    torque: 42.0,
    tool_wear: 90.0,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fetchWhatIf = async () => {
    setLoading(true);
    try {
      const res = await runWhatIf(original, scenario);
      setResult(res);
    } catch (err) {
      console.error("What-If error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhatIf();
  }, []);

  const handleScenarioChange = (field, val) => {
    setScenario((prev) => ({
      ...prev,
      [field]: field === 'type' ? val : parseFloat(val) || 0,
    }));
  };

  const chartData = result ? [
    { name: 'Current State', prob: +(result.original.failure_probability * 100).toFixed(1), fill: '#EF4444' },
    { name: 'What-If Scenario', prob: +(result.scenario.failure_probability * 100).toFixed(1), fill: '#10B981' }
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">What-If Counterfactual Analysis</h1>
          <p className="text-xs text-slate-400">
            Simulate how modifications in operating parameters impact predicted machine failure risk.
          </p>
        </div>

        <button
          onClick={fetchWhatIf}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded transition-colors disabled:opacity-50 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Recalculate Scenario</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Scenario Controls Left */}
        <div className="lg:col-span-6 space-y-5">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Scenario Parameter Adjustments
            </h3>
          </div>

          <div className="space-y-4">
            {/* Type */}
            <div>
              <span className="text-xs font-medium text-slate-300 block mb-2">Machine Type Variant</span>
              <div className="grid grid-cols-3 gap-2">
                {['L', 'M', 'H'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleScenarioChange('type', t)}
                    className={`py-1.5 text-xs font-bold font-mono rounded border transition-colors ${
                      scenario.type === t
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/50'
                        : 'bg-transparent text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Type {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Torque */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-300">Torque [Nm]</span>
                <span className="font-mono text-slate-400">
                  {original.torque} Nm → <strong className="text-sky-400">{scenario.torque} Nm</strong>
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="85"
                step="1"
                value={scenario.torque}
                onChange={(e) => handleScenarioChange('torque', e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Tool Wear */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-300">Tool Wear [min]</span>
                <span className="font-mono text-slate-400">
                  {original.tool_wear} min → <strong className="text-sky-400">{scenario.tool_wear} min</strong>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={scenario.tool_wear}
                onChange={(e) => handleScenarioChange('tool_wear', e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Rotational Speed */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-300">Rotational Speed [rpm]</span>
                <span className="font-mono text-slate-400">
                  {original.rotational_speed} rpm → <strong className="text-sky-400">{scenario.rotational_speed} rpm</strong>
                </span>
              </div>
              <input
                type="range"
                min="1100"
                max="2800"
                step="20"
                value={scenario.rotational_speed}
                onChange={(e) => handleScenarioChange('rotational_speed', e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Process Temp */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-300">Process Temperature [K]</span>
                <span className="font-mono text-slate-400">
                  {original.process_temperature} K → <strong className="text-sky-400">{scenario.process_temperature} K</strong>
                </span>
              </div>
              <input
                type="range"
                min="305"
                max="315"
                step="0.2"
                value={scenario.process_temperature}
                onChange={(e) => handleScenarioChange('process_temperature', e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Air Temp */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-300">Air Temperature [K]</span>
                <span className="font-mono text-slate-400">
                  {original.air_temperature} K → <strong className="text-sky-400">{scenario.air_temperature} K</strong>
                </span>
              </div>
              <input
                type="range"
                min="295"
                max="305"
                step="0.2"
                value={scenario.air_temperature}
                onChange={(e) => handleScenarioChange('air_temperature', e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Results Right */}
        <div className="lg:col-span-6 space-y-6">
          {loading ? (
            <LoadingSpinner text="Computing scenario probability delta..." />
          ) : result ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Clean Metric Readout Strip */}
              <div className="grid grid-cols-3 divide-x divide-slate-800/80 border-y border-slate-800/80 py-4 font-mono text-center">
                <div className="px-2 space-y-0.5">
                  <span className="text-[11px] text-slate-500 uppercase block">Current Risk</span>
                  <span className="text-2xl font-bold text-rose-400 block">
                    {(result.original.failure_probability * 100).toFixed(1)}%
                  </span>
                  <RiskBadge level={result.original.risk_level} size="sm" />
                </div>

                <div className="px-2 space-y-0.5">
                  <span className="text-[11px] text-slate-500 uppercase block">Risk Delta</span>
                  <div className={`text-xl font-bold flex items-center justify-center gap-1 ${result.risk_difference_pct <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.risk_difference_pct <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {result.risk_difference_pct > 0 ? `+${result.risk_difference_pct}` : result.risk_difference_pct}%
                  </div>
                  <span className="text-[10px] text-slate-500 block">percentage points</span>
                </div>

                <div className="px-2 space-y-0.5">
                  <span className="text-[11px] text-slate-500 uppercase block">Scenario Risk</span>
                  <span className="text-2xl font-bold text-emerald-400 block">
                    {(result.scenario.failure_probability * 100).toFixed(1)}%
                  </span>
                  <RiskBadge level={result.scenario.risk_level} size="sm" />
                </div>
              </div>

              {/* Comparison Chart */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">Probability Shift Comparison</h4>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <XAxis type="number" domain={[0, 100]} unit="%" stroke="#64748B" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" stroke="#CBD5E1" width={110} tick={{ fontSize: 11 }} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#121824', borderColor: '#263147', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                        formatter={(val) => [`${val}%`, 'Failure Probability']}
                      />
                      <Bar dataKey="prob" radius={[0, 3, 3, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Changed Parameters Summary Table */}
              {result.changed_features && result.changed_features.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">Modified Parameters</h4>
                  <div className="divide-y divide-slate-800/80 border-y border-slate-800/80">
                    {result.changed_features.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{item.display_name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-500">{item.original_value}</span>
                          <ArrowRight className="w-3 h-3 text-sky-400" />
                          <span className="text-sky-400 font-semibold">{item.scenario_value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
