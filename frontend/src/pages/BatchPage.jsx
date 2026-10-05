import React, { useState } from 'react';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Search,
  FileText
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { uploadBatchCsv, exportBatchCsv } from '../services/api';

export default function BatchPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await uploadBatchCsv(file);
      setResult(data);
    } catch (err) {
      console.error("Batch upload error:", err);
      setError(err?.response?.data?.detail || "Failed to process batch CSV file.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!file) return;
    try {
      const blob = await exportBatchCsv(file);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `maintainxai_batch_predictions.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const downloadSampleCsv = () => {
    const sample = `UDI,Product ID,Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min]
1,M14860,M,298.1,308.6,1551,42.8,10
2,L47181,L,298.2,308.7,1408,68.3,160
3,H29424,H,298.4,308.9,1282,74.9,210
4,M14865,M,300.1,310.2,1667,28.6,40
5,L47186,L,302.2,312.4,1300,62.0,195`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_machine_telemetry.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredRecords = result?.records?.filter((r) =>
    r.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.top_risk_factor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.risk_level.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-sky-400 uppercase mb-1">
            Batch Telemetry Analysis
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            CSV Fleet Processing
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Upload machine operational CSV datasets for automated multi-machine failure risk classification and SHAP risk factor extraction.
          </p>
        </div>

        <button
          onClick={downloadSampleCsv}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium rounded transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {/* Clean Drop Zone */}
      <div className="space-y-4">
        <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-lg p-8 text-center transition-colors">
          <FileSpreadsheet className="w-8 h-8 text-sky-400 mx-auto mb-2 opacity-80" />
          <div className="text-sm font-medium text-slate-200">Drop Telemetry CSV File Here</div>
          <div className="text-xs text-slate-500 mt-0.5">Accepts standard industrial machine parameter columns</div>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload-input"
          />

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <label
              htmlFor="csv-upload-input"
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded border border-slate-800 cursor-pointer transition-colors"
            >
              Select CSV File
            </label>

            {file && (
              <span className="text-xs font-mono text-sky-400 bg-slate-900 px-3 py-1 rounded border border-slate-800">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Run Batch Analysis'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {loading ? (
        <LoadingSpinner text="Running XGBoost model inference & extracting top SHAP contributors..." />
      ) : result ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Metrics Strip */}
          <div className="flex flex-wrap items-center divide-x divide-slate-800/80 border-y border-slate-800/80 py-4">
            <div className="pr-8 space-y-0.5">
              <span className="text-2xl font-bold font-mono text-slate-100 block">
                {result.total_records.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
                Records Analyzed
              </span>
            </div>
            <div className="px-8 space-y-0.5">
              <span className="text-2xl font-bold font-mono text-rose-400 block">
                {result.high_risk_count.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
                High Risk
              </span>
            </div>
            <div className="px-8 space-y-0.5">
              <span className="text-2xl font-bold font-mono text-amber-400 block">
                {result.medium_risk_count.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
                Medium Risk
              </span>
            </div>
            <div className="pl-8 space-y-0.5">
              <span className="text-2xl font-bold font-mono text-emerald-400 block">
                {result.low_risk_count.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
                Low Risk
              </span>
            </div>
          </div>

          {/* Table Controls */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by machine ID or risk factor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Results (CSV)</span>
              </button>
            </div>

            {/* Crisp Table */}
            <div className="overflow-x-auto border-t border-slate-800/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-3 pr-4 font-normal">Machine ID</th>
                    <th className="py-3 px-4 font-normal">Type</th>
                    <th className="py-3 px-4 font-normal">Risk Level</th>
                    <th className="py-3 px-4 font-normal">Probability</th>
                    <th className="py-3 pl-4 font-normal">Top Risk Contributor (SHAP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredRecords.slice(0, 50).map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 pr-4 text-slate-200 font-medium">{r.machine_id}</td>
                      <td className="py-3 px-4 text-slate-400">Variant {r.type}</td>
                      <td className="py-3 px-4">
                        <RiskBadge level={r.risk_level} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-100">
                        {(r.failure_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 pl-4 font-sans text-slate-300">
                        <span className="text-sky-400 font-mono text-[11px]">
                          {r.top_risk_factor} (+{r.top_risk_shap})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRecords.length > 50 && (
                <div className="text-center py-3 text-[11px] font-mono text-slate-500 border-t border-slate-800/60">
                  Displaying 50 of {filteredRecords.length} records. Download CSV export for complete dataset results.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
