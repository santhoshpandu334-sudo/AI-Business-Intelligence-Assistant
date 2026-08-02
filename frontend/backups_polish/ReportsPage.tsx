import React, { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet, FileCode, Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { Report } from '../types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [title, setTitle] = useState('Q4 Executive Performance & Forecast Digest');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'docx'>('pdf');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const list = await api.getReports();
      setReports(list);
    } catch (err) {}
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.generateReport(title, format);
      await loadReports();
    } catch (err) {
      alert('Report generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (reportId: number, reportTitle: string, reportFormat: string) => {
    window.open(`/api/v1/reports/${reportId}/download`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-glow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Multi-Format Report Builder</h1>
          <p className="text-slate-400 text-xs mt-1">Compile charts, KPIs, forecasts, and AI insights into PDF, Excel (.xlsx), or Word (.docx) documents.</p>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Reports Generated</span>
            <h3 className="text-xl font-black text-white">{reports.length === 0 ? "—" : reports.length}</h3>
          </div>
          <FileText className="w-5 h-5 text-indigo-400" />
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Recent Reports</span>
            <h3 className="text-sm font-bold text-white truncate max-w-[240px]">
              {reports.length === 0 ? "None" : reports[0].title}
            </h3>
          </div>
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </GlassCard>
      </div>

      {/* Generator Form */}
      <GlassCard>
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Report Document Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Executive Financial Digest"
              className="w-full bg-slate-900 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Export Format</label>
            <select
              value={format}
              onChange={(e: any) => setFormat(e.target.value)}
              className="w-full bg-slate-900 text-sm text-slate-100 rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="pdf">PDF Executive Document</option>
              <option value="excel">Excel Multi-Tab (.xlsx)</option>
              <option value="docx">Word Briefing (.docx)</option>
            </select>
          </div>

          <Button type="submit" disabled={generating} className="gap-2 w-full">
            <Plus className="w-4 h-4" /> {generating ? 'Compiling Document...' : 'Compile & Export'}
          </Button>
        </form>
      </GlassCard>

      {/* Reports Library Table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Compiled Reports Library ({reports.length})
          </h3>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">REPORT TITLE</th>
                <th className="p-3">FORMAT</th>
                <th className="p-3">CREATED DATE</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                    Reports will appear after your first uploaded dataset.
                  </td>
                </tr>
              ) : reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-white flex items-center gap-2">
                    {r.format === 'pdf' ? <FileText className="w-4 h-4 text-rose-400" /> : (r.format === 'excel' ? <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> : <FileCode className="w-4 h-4 text-blue-400" />)}
                    {r.title}
                  </td>
                  <td className="p-3">
                    <Badge variant={r.format === 'pdf' ? 'danger' : (r.format === 'excel' ? 'success' : 'info')}>
                      {r.format.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="secondary" onClick={() => handleDownload(r.id, r.title, r.format)} className="gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Download File
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
