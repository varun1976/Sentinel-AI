import React, { useState } from 'react';
import {
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  AlertTriangle,
  Zap
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import Tooltip from '../components/Tooltip';
import LoadingSpinner from '../components/LoadingSpinner';
import DetailedExplanationModal from '../components/DetailedExplanationModal';
import { predictMachine, explainPrediction } from '../services/api';

export default function PredictionPage() {
  const [formData, setFormData] = useState({
    type: 'M',
    air_temperature: 298.1,
    process_temperature: 308.6,
    rotational_speed: 1551.0,
    torque: 42.8,
    tool_wear: 15.0,
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'type' ? val : parseFloat(val) || 0,
    }));
  };

  const applyPreset = (preset) => {
    if (preset === 'normal') {
      setFormData({
        type: 'L',
        air_temperature: 298.1,
        process_temperature: 308.6,
        rotational_speed: 1551.0,
        torque: 42.8,
        tool_wear: 10.0,
      });
    } else if (preset === 'high_torque') {
      setFormData({
        type: 'M',
        air_temperature: 300.2,
        process_temperature: 310.4,
        rotational_speed: 1320.0,
        torque: 68.5,
        tool_wear: 150.0,
      });
    } else if (preset === 'severe_wear') {
      setFormData({
        type: 'H',
        air_temperature: 302.5,
        process_temperature: 312.8,
        rotational_speed: 1210.0,
        torque: 64.0,
        tool_wear: 220.0,
      });
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const [predRes, expRes] = await Promise.all([
        predictMachine(formData),
        explainPrediction(formData),
      ]);
      setPrediction(predRes);
      setExplanation(expRes);
    } catch (err) {
      console.error("Prediction analysis error:", err);
      setError(err?.response?.data?.detail || "Failed to execute prediction analysis. Ensure FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Machine Risk Assessment</h1>
          <p className="text-xs text-slate-400">
            Evaluate operational failure risk and compute local SHAP feature contributions.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Presets:</span>
          <button
            onClick={() => applyPreset('normal')}
            className="px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-950/30 rounded border border-emerald-800/40 transition-colors font-mono"
          >
            Normal
          </button>
          <button
            onClick={() => applyPreset('high_torque')}
            className="px-2.5 py-1 text-xs text-amber-400 hover:bg-amber-950/30 rounded border border-amber-800/40 transition-colors font-mono"
          >
            High Torque
          </button>
          <button
            onClick={() => applyPreset('severe_wear')}
            className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-950/30 rounded border border-rose-800/40 transition-colors font-mono"
          >
            Severe Tool Wear
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form Controls Left */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Operating Parameters
            </h3>
            <button
              onClick={() => applyPreset('normal')}
              className="text-xs text-slate-500 hover:text-sky-400 flex items-center gap-1 transition-colors"
              title="Reset parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-5">
            {/* Machine Type */}
            <div>
              <div className="flex items-center justify-between mb-2 text-xs font-medium text-slate-300">
                <span>Machine Type Variant</span>
                <Tooltip text="Quality variant: L (Low/50%), M (Medium/30%), H (High/20%)." />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['L', 'M', 'H'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleInputChange('type', t)}
                    className={`py-2 text-xs font-bold font-mono rounded border transition-colors ${
                      formData.type === t
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/50'
                        : 'bg-transparent text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Type {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-1">
              {/* Air Temp */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-medium text-slate-300">Air Temperature [K]</span>
                  <span className="font-mono text-sky-400 font-semibold">{formData.air_temperature} K</span>
                </div>
                <input
                  type="range"
                  min="295"
                  max="305"
                  step="0.1"
                  value={formData.air_temperature}
                  onChange={(e) => handleInputChange('air_temperature', e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* Process Temp */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-medium text-slate-300">Process Temperature [K]</span>
                  <span className="font-mono text-sky-400 font-semibold">{formData.process_temperature} K</span>
                </div>
                <input
                  type="range"
                  min="305"
                  max="315"
                  step="0.1"
                  value={formData.process_temperature}
                  onChange={(e) => handleInputChange('process_temperature', e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* Speed */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-medium text-slate-300">Rotational Speed [rpm]</span>
                  <span className="font-mono text-sky-400 font-semibold">{formData.rotational_speed} rpm</span>
                </div>
                <input
                  type="range"
                  min="1100"
                  max="2900"
                  step="5"
                  value={formData.rotational_speed}
                  onChange={(e) => handleInputChange('rotational_speed', e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* Torque */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-medium text-slate-300">Torque [Nm]</span>
                  <span className="font-mono text-sky-400 font-semibold">{formData.torque} Nm</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="90"
                  step="0.5"
                  value={formData.torque}
                  onChange={(e) => handleInputChange('torque', e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* Tool Wear */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-medium text-slate-300">Tool Wear [min]</span>
                  <span className="font-mono text-sky-400 font-semibold">{formData.tool_wear} min</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="260"
                  step="1"
                  value={formData.tool_wear}
                  onChange={(e) => handleInputChange('tool_wear', e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-xs transition-colors flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Analyzing...' : 'Analyze Machine'}</span>
            </button>
          </form>
        </div>

        {/* Prediction Results Right */}
        <div className="lg:col-span-6 space-y-6">
          {loading ? (
            <LoadingSpinner
              text="Computing model evaluation & SHAP feature contributions..."
            />
          ) : prediction ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Clean Probability Result Focal Point */}
              <div className="border-b border-slate-800/80 pb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    Predicted Failure Probability
                  </span>
                  <RiskBadge level={prediction.risk_level} size="md" />
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold font-mono text-slate-100 tracking-tight">
                    {(prediction.failure_probability * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Subtle Risk Progress Bar */}
                <div className="w-full bg-slate-800/80 h-1.5 rounded overflow-hidden">
                  <div
                    className={`h-full ${
                      prediction.risk_level === 'HIGH' ? 'bg-rose-500' :
                      prediction.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${prediction.failure_probability * 100}%` }}
                  ></div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {prediction.risk_description}
                </p>
              </div>

              {/* Local SHAP Explanation Table */}
              {explanation && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                        Primary Contributing Factors
                      </h4>
                      <p className="text-[11px] text-slate-500">Local SHAP feature attributions</p>
                    </div>

                    <button
                      onClick={() => setModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-mono transition-colors"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Waterfall View</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800/80 border-y border-slate-800/80">
                    {explanation.features.slice(0, 5).map((item, idx) => {
                      const isIncreasing = item.impact === 'increases_risk';
                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {isIncreasing ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="font-medium text-slate-300">{item.name}</span>
                          </div>

                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-slate-500 text-[11px]">val: {item.value}</span>
                            <span className={`font-semibold ${isIncreasing ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isIncreasing ? `+${item.shap_value}` : item.shap_value}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="py-20 text-center space-y-2 border border-dashed border-slate-800/80 rounded">
              <span className="text-xs font-semibold text-slate-400 font-mono">No Active Prediction</span>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Select operating parameters on the left and click <strong>Analyze Machine</strong> to compute risk probabilities.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <DetailedExplanationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        prediction={prediction}
        explanation={explanation}
        inputData={formData}
      />
    </div>
  );
}
