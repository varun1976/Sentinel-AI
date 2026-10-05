import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDatasetSummary, getRiskDistribution } from '../services/api';

export default function DashboardPage({ onNavigateToPredict }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [riskData, setRiskData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sumRes, riskRes] = await Promise.all([
          getDatasetSummary(),
          getRiskDistribution()
        ]);
        setSummary(sumRes);
        setRiskData(riskRes.distribution || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading fleet metrics..." />;
  }

  const operatingConditions = [
    { name: 'Air Temperature', range: '298.1 – 304.5 K', mean: '300.0 K avg', unit: 'K' },
    { name: 'Process Temperature', range: '305.7 – 313.8 K', mean: '310.0 K avg', unit: 'K' },
    { name: 'Rotational Speed', range: '1,168 – 2,886 rpm', mean: '1,538.7 rpm avg', unit: 'rpm' },
    { name: 'Torque', range: '3.8 – 76.6 Nm', mean: '39.98 Nm avg', unit: 'Nm' },
    { name: 'Tool Wear', range: '0 – 253 min', mean: '107.9 min avg', unit: 'min' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Clean Typographic Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Predictive Maintenance</h1>
          <p className="text-xs text-slate-400">
            Machine health intelligence and risk distribution across the monitored fleet.
          </p>
        </div>

        <button
          onClick={onNavigateToPredict}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold rounded transition-colors"
        >
          <span>Analyze Machine</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Strip with Subtle Vertical Dividers */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 py-4 border-y border-slate-800/80">
        <div className="py-2 px-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Machines Analyzed</span>
          <span className="text-3xl font-extrabold font-mono text-slate-100">
            {summary?.total_machines?.toLocaleString() || '10,000'}
          </span>
          <span className="text-[11px] text-slate-500 block">AI4I 2020 Dataset</span>
        </div>

        <div className="py-2 px-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">High Failure Risk</span>
          <span className="text-3xl font-extrabold font-mono text-rose-400">
            {summary?.high_risk_count?.toLocaleString() || '339'}
          </span>
          <span className="text-[11px] text-slate-500 block">&gt;70% probability</span>
        </div>

        <div className="py-2 px-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Medium Risk</span>
          <span className="text-3xl font-extrabold font-mono text-amber-400">
            {summary?.medium_risk_count?.toLocaleString() || '521'}
          </span>
          <span className="text-[11px] text-slate-500 block">30% – 70% probability</span>
        </div>

        <div className="py-2 px-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Low Risk</span>
          <span className="text-3xl font-extrabold font-mono text-emerald-400">
            {summary?.low_risk_count?.toLocaleString() || '9,140'}
          </span>
          <span className="text-[11px] text-slate-500 block">&lt;30% probability</span>
        </div>
      </div>

      {/* Analytics Sections Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-2">
        {/* Risk Distribution Chart Section */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Fleet Risk Distribution
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Calibrated risk classification output</p>
          </div>

          <div className="h-56 py-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#090D14" strokeWidth={2} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#121824', borderColor: '#263147', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                  formatter={(val) => [`${val} Machines`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Clean Editorial Legend */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 text-center font-mono">
            <div>
              <span className="text-[11px] text-slate-500 block">LOW (&lt;30%)</span>
              <span className="text-sm font-semibold text-emerald-400">91.4%</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">MEDIUM (30-70%)</span>
              <span className="text-sm font-semibold text-amber-400">5.2%</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">HIGH (&gt;70%)</span>
              <span className="text-sm font-semibold text-rose-400">3.4%</span>
            </div>
          </div>
        </div>

        {/* Operating Conditions Table Section */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Fleet Operating Parameters
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Operational parameter distribution ranges across 10,000 dataset records</p>
          </div>

          <div className="divide-y divide-slate-800/80 border-y border-slate-800/80">
            <div className="py-2 grid grid-cols-12 text-[11px] font-mono text-slate-500 font-medium">
              <span className="col-span-5">Parameter</span>
              <span className="col-span-4">Operational Range</span>
              <span className="col-span-3 text-right">Dataset Average</span>
            </div>

            {operatingConditions.map((item, idx) => (
              <div key={idx} className="py-3 grid grid-cols-12 text-xs items-center hover:bg-slate-800/30 transition-colors px-1">
                <span className="col-span-5 font-medium text-slate-200">{item.name}</span>
                <span className="col-span-4 font-mono text-slate-300">{item.range}</span>
                <span className="col-span-3 font-mono text-slate-400 text-right">{item.mean}</span>
              </div>
            ))}
          </div>

          {/* Machine Variants Note */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Product Type Variants:</span>
            <div className="flex items-center gap-3">
              <span>L: <strong className="text-slate-200">60%</strong></span>
              <span>M: <strong className="text-slate-200">30%</strong></span>
              <span>H: <strong className="text-slate-200">10%</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
