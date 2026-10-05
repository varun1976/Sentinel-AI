import React, { useEffect, useState } from 'react';
import { Brain, Info, BarChart2, Layers, Image as ImageIcon, Sparkles, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { getFeatureImportance, getShapSummary, getShapBeeswarmImageUrl } from '../services/api';

export default function ExplainabilityPage() {
  const [loading, setLoading] = useState(true);
  const [importanceData, setImportanceData] = useState([]);
  const [beeswarmData, setBeeswarmData] = useState([]);
  const [featuresOrder, setFeaturesOrder] = useState([]);
  const [baseValue, setBaseValue] = useState(0);
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' or 'official'

  useEffect(() => {
    async function fetchData() {
      try {
        const [impRes, shapRes] = await Promise.all([
          getFeatureImportance(),
          getShapSummary()
        ]);
        setImportanceData(impRes.features || []);
        setBeeswarmData(shapRes.beeswarm || []);
        setFeaturesOrder(shapRes.features_order || []);
        setBaseValue(shapRes.base_value || 0);
      } catch (err) {
        console.error("Explainability fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading SHAP Global Explainability visualizations..." />;
  }

  const imageUrl = getShapBeeswarmImageUrl();

  // Prepare custom scatter data grouped by rank with vertical jitter for accurate swarm rendering
  // Rank 0 is top feature, rank 5 is bottom feature.
  const scatterData = beeswarmData.map((pt) => {
    // Recharts Y-axis: 0 at bottom, max rank at top. So inverted_rank = (featuresOrder.length - 1 - pt.rank)
    const yRank = featuresOrder.length > 0 ? (featuresOrder.length - 1 - pt.rank) : 0;
    return {
      ...pt,
      y_pos: yRank + (pt.jitter_y || 0)
    };
  });

  // Calculate Y tick mapping for Recharts
  const yTicks = featuresOrder.map((_, idx) => idx);
  const formatYTick = (tickVal) => {
    const origIndex = featuresOrder.length - 1 - tickVal;
    return featuresOrder[origIndex] || `Feature ${tickVal}`;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-sky-400 uppercase mb-1">
            Global Explainability
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            SHAP Feature Attributions
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Dataset-wide feature importance rankings and feature impact dynamics derived from test set evaluation samples.
          </p>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
          <button
            onClick={() => setViewMode('interactive')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors ${
              viewMode === 'interactive'
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Swarm</span>
          </button>
          <button
            onClick={() => setViewMode('official')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors ${
              viewMode === 'official'
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Python Plot</span>
          </button>
        </div>
      </div>

      {/* Guide / Interpretation Note */}
      <div className="border-l-2 border-sky-400/80 bg-slate-900/30 pl-4 py-3 space-y-1">
        <h4 className="text-xs font-semibold text-sky-400 tracking-wide uppercase">
          SHAP Beeswarm Interpretation
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
          <div>
            <span className="text-slate-400 block font-mono text-[11px]">Vertical Ranking</span>
            Top-to-bottom order reflects overall mean absolute SHAP feature magnitude.
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[11px]">Horizontal Position</span>
            Negative SHAP values (<span className="text-emerald-400 font-medium">← 0</span>) lower failure risk; Positive values (<span className="text-rose-400 font-medium">1 →</span>) increase risk.
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[11px]">Color Spectrum</span>
            <span className="text-sky-400">Cool Blue</span> = Low raw value • <span className="text-rose-400">Hot Red</span> = High raw value.
          </div>
        </div>
      </div>

      {/* Section 1: Global Feature Importance Bar Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
          <h2 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            Global Feature Importance (Mean |SHAP|)
          </h2>
          <span className="text-[11px] font-mono text-slate-400">XGBoost Model</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={importanceData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
            >
              <XAxis type="number" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="feature" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#1E293B', borderRadius: '6px', color: '#F8FAFC' }}
                formatter={(val) => [`${val} mean |SHAP|`, 'Importance']}
              />
              <Bar dataKey="importance" fill="#38BDF8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 2: SHAP Beeswarm Distribution */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/40 pb-3">
          <h2 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            SHAP Beeswarm Distribution
          </h2>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-sky-400">Low</span>
            <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-sky-500 via-purple-500 to-rose-500"></div>
            <span className="text-rose-400">High Feature Value</span>
          </div>
        </div>

        {viewMode === 'interactive' ? (
          <div className="h-[460px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, left: 160, bottom: 35 }}>
                <XAxis
                  type="number"
                  dataKey="shap_val"
                  name="SHAP Value"
                  stroke="#64748B"
                  tick={{ fontSize: 11 }}
                  label={{
                    value: '← Pushes Toward Healthy (0)  |  Pushes Toward Failure Risk (1) →',
                    position: 'bottom',
                    offset: 16,
                    fill: '#94A3B8',
                    fontSize: 11
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y_pos"
                  name="Feature"
                  ticks={yTicks}
                  tickFormatter={formatYTick}
                  domain={[-0.5, featuresOrder.length - 0.5]}
                  stroke="#94A3B8"
                  tick={{ fontSize: 11 }}
                />
                <ZAxis type="number" range={[25, 25]} />
                <RechartsTooltip
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded text-xs space-y-1 font-mono shadow-xl">
                        <div className="font-semibold text-slate-100">{d.feature}</div>
                        <div className="text-slate-400">Raw Value: <span className="text-sky-400 font-bold">{d.raw_val}</span></div>
                        <div className="text-slate-400">SHAP Impact: <span className={d.shap_val > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{d.shap_val > 0 ? `+${d.shap_val}` : d.shap_val}</span></div>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Python Plot */
          <div className="space-y-2 text-center pt-2">
            <div className="inline-block border border-slate-800 bg-slate-950 p-2 rounded-lg">
              <img
                src={imageUrl}
                alt="Official SHAP Summary Plot"
                className="max-h-[480px] w-auto object-contain mx-auto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '';
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Generated via Python `shap.summary_plot` on test set evaluation instances.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
