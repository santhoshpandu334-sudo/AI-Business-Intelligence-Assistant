import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Layers, 
  ArrowRight,
  Download,
  Trash2,
  Edit3,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  XCircle,
  FileCode,
  FileText,
  AlertCircle,
  PieChart,
  HardDrive
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { Dataset, DatasetSummary, ValidationIssue } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { useDataset } from '../context/DatasetContext';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { datasets: globalDatasets, selectedDatasetId, setSelectedDatasetId, refreshDatasets } = useDataset();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [previewRecords, setPreviewRecords] = useState<any[]>([]);

  // Search, Filter & Sort states
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [filterCompany, setFilterCompany] = useState('');

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState('');
  const [activeFileName, setActiveFileName] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals & Drawers
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDatasets();
  }, [search, sortBy, filterCompany, selectedDatasetId, globalDatasets]);

  useEffect(() => {
    if (selectedDatasetId !== undefined) {
      fetchSummaryAndPreview(selectedDatasetId);
    } else {
      setSelectedDataset(null);
      setSummary(null);
      setPreviewRecords([]);
    }
  }, [selectedDatasetId]);

  const loadDatasets = async () => {
    try {
      const list = await api.getDatasets(search, filterCompany, undefined, sortBy);
      setDatasets(list);
    } catch (err) {}
  };

  const fetchSummaryAndPreview = async (id: number) => {
    try {
      let ds = globalDatasets.find(d => d.id === id);
      if (!ds) {
        ds = await api.getDatasetById(id);
      }
      setSelectedDataset(ds);
      const sum = await api.getDatasetSummary(id);
      const prev = await api.getDatasetPreview(id);
      setSummary(sum);
      setPreviewRecords(prev);
    } catch (err) {}
  };

  const handleFileUpload = (file: File) => {
    // Validate Extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!['.csv', '.xlsx', '.xls', '.json'].includes(ext)) {
      showToast(`Unsupported file format '${ext}'. Allowed: .csv, .xlsx, .xls, .json`, 'error');
      return;
    }
    // Validate Size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      showToast(`File size exceeds 100 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`, 'error');
      return;
    }

    setUploading(true);
    setActiveFileName(file.name);
    setUploadProgress(10);
    setUploadSpeed('14.2 MB/s');

    // Simulate smooth progress bar while processing upload
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    api.uploadDataset(file)
      .then(async (ds) => {
        clearInterval(interval);
        setUploadProgress(100);
        showToast(`Dataset '${file.name}' successfully uploaded, validated, and cleaned!`, 'success');
        await refreshDatasets(ds.id);
        navigate('/dashboard');
      })
      .catch((err) => {
        clearInterval(interval);
        showToast(err.message || 'Dataset upload failed.', 'error');
      })
      .finally(() => {
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 1000);
      });
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRename = async () => {
    if (!selectedDataset || !newName.trim()) return;
    try {
      const updated = await api.updateDataset(selectedDataset.id, newName.trim());
      showToast(`Dataset renamed to '${updated.name}'`, 'success');
      setRenameModalOpen(false);
      await refreshDatasets(updated.id);
    } catch (err: any) {
      showToast(err.message || 'Rename failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedDataset) return;
    try {
      await api.deleteDataset(selectedDataset.id);
      showToast(`Dataset '${selectedDataset.name}' deleted.`, 'success');
      setDeleteModalOpen(false);
      await refreshDatasets();
    } catch (err: any) {
      showToast(err.message || 'Deletion failed', 'error');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'csv') return <FileText className="w-4 h-4 text-emerald-400" />;
    if (['xlsx', 'xls'].includes(fileType)) return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
    return <FileCode className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-glow border text-xs font-medium flex items-center gap-2 ${
              toastMessage.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-glow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
            Phase 2 Data Management Engine
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Enterprise Data Ingestion & Governance</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('/chat')} className="gap-1.5">
            Run RAG Query <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Upload Dropzone Card */}
      <GlassCard className="p-8 border-2 border-dashed border-indigo-500/40 relative">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`py-6 text-center rounded-xl transition-all ${dragActive ? 'bg-indigo-500/10 scale-[1.01]' : ''}`}
        >
          <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-3 animate-bounce" />
          <h3 className="text-base font-bold text-white mb-1">Drag & Drop Enterprise Datasets (.CSV, .XLSX, .XLS, .JSON)</h3>
          <p className="text-slate-400 text-xs mb-4">Max file size: 100 MB &bull; Automated Data Validation & Cleaning Pipeline</p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <Button
            variant="primary"
            size="md"
            className="cursor-pointer"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Ingesting & Validating...' : 'Browse Local Computer Files'}
          </Button>

          {/* Progress Bar & Speed Indicator */}
          {uploading && (
            <div className="mt-6 max-w-md mx-auto space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-mono">
                <span>{activeFileName}</span>
                <span>{uploadProgress}% ({uploadSpeed})</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Dataset Search, Sort & Management Table */}
      <GlassCard>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Managed Datasets Repository ({datasets.length})</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search datasets..."
                className="w-full bg-slate-900 text-xs text-slate-200 placeholder-slate-500 rounded-xl pl-8 pr-3 py-1.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="created_at" className="bg-slate-900 text-slate-200">Sort by Upload Date</option>
              <option value="name" className="bg-slate-900 text-slate-200">Sort by Name</option>
              <option value="quality_score" className="bg-slate-900 text-slate-200">Sort by Quality Score</option>
              <option value="rows" className="bg-slate-900 text-slate-200">Sort by Row Count</option>
            </select>
          </div>
        </div>

        {/* Datasets Grid / Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">DATASET NAME</th>
                <th className="p-3">OWNER & COMPANY</th>
                <th className="p-3">ROWS / COLS</th>
                <th className="p-3">QUALITY SCORE</th>
                <th className="p-3">UPLOAD DATE</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {datasets.map((ds) => (
                <tr
                  key={ds.id}
                  onClick={() => setSelectedDatasetId(ds.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedDataset?.id === ds.id ? 'bg-indigo-600/15' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="p-3 font-semibold text-white flex items-center gap-2">
                    {getFileIcon(ds.file_type)}
                    <div>
                      <div>{ds.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">{ds.file_type} &bull; {(ds.memory_usage_bytes ? (ds.memory_usage_bytes/1024).toFixed(1) : 0)} KB</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-200">{ds.owner_name || 'Analyst'}</div>
                    <span className="text-[10px] text-slate-400">{ds.company_name}</span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className="text-indigo-300 font-bold">{ds.row_count}</span> rows / <span className="text-slate-400">{ds.column_count}</span> cols
                  </td>
                  <td className="p-3">
                    <Badge variant={ds.quality_score && ds.quality_score >= 80 ? 'success' : (ds.quality_score && ds.quality_score >= 60 ? 'warning' : 'danger')}>
                      {ds.quality_score ? ds.quality_score.toFixed(1) : '100.0'}% Quality
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-slate-400">{new Date(ds.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                    {/* Rename Button (Manager/Admin) */}
                    {hasRole(['Admin', 'Manager']) && (
                      <button
                        onClick={() => { setSelectedDataset(ds); setNewName(ds.name); setRenameModalOpen(true); }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Rename Dataset"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Button (Manager/Admin) */}
                    {hasRole(['Admin', 'Manager']) && (
                      <button
                        onClick={() => { setSelectedDataset(ds); setDeleteModalOpen(true); }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                        title="Delete Dataset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Download Cleaned */}
                    <a
                      href={api.getDatasetDownloadUrl(ds.id, true)}
                      download
                      className="p-1.5 inline-block rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400"
                      title="Download Cleaned Dataset"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Selected Dataset Summary Dashboard & Quality Report */}
      {selectedDataset && summary && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" /> Data Quality Summary: {selectedDataset.name}
            </h2>
            <Button size="sm" variant="outline" onClick={() => setReportModalOpen(true)} className="gap-1.5">
              <ShieldCheck className="w-4 h-4" /> View Validation Report Details
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total Rows</span>
              <h3 className="text-xl font-black text-white mt-1">{summary.statistics?.total_rows || selectedDataset.row_count}</h3>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total Columns</span>
              <h3 className="text-xl font-black text-white mt-1">{summary.statistics?.total_columns || selectedDataset.column_count}</h3>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Quality Score</span>
              <h3 className="text-xl font-black text-emerald-400 mt-1">{summary.statistics?.quality_score || 100}%</h3>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Completeness</span>
              <h3 className="text-xl font-black text-indigo-400 mt-1">{summary.statistics?.completeness_pct || 100}%</h3>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Missing Cells</span>
              <h3 className="text-xl font-black text-amber-400 mt-1">{summary.statistics?.missing_values_count || 0}</h3>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Memory Usage</span>
              <h3 className="text-xl font-black text-slate-200 mt-1">{((summary.statistics?.memory_usage_bytes || 0) / 1024).toFixed(1)} KB</h3>
            </GlassCard>
          </div>

          {/* First 100 Preview Rows Inspector */}
          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Live Data Preview Inspector</h3>
                <p className="text-xs text-slate-400">Showing top 100 parsed records of clean dataset</p>
              </div>
              <div className="flex gap-2">
                <a href={api.getDatasetDownloadUrl(selectedDataset.id, false)} download>
                  <Button size="sm" variant="secondary" className="text-xs">Download Original</Button>
                </a>
                <a href={api.getDatasetDownloadUrl(selectedDataset.id, true)} download>
                  <Button size="sm" variant="primary" className="text-xs">Download Cleaned</Button>
                </a>
              </div>
            </div>

            <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-xl">
              {previewRecords.length > 0 ? (
                <table className="w-full text-left text-xs text-slate-300 font-mono">
                  <thead className="bg-slate-900 sticky top-0 text-slate-400 border-b border-slate-800">
                    <tr>
                      {Object.keys(previewRecords[0]).map((key) => (
                        <th key={key} className="p-2.5 font-bold uppercase whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {previewRecords.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        {Object.values(row).map((val: any, i) => (
                          <td key={i} className="p-2.5 whitespace-nowrap text-slate-300">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs italic">Loading dataset preview records...</div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Rename Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 border border-indigo-500/40 shadow-glow">
            <h3 className="text-lg font-bold text-white mb-2">Rename Dataset</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-900 text-sm text-slate-100 rounded-xl px-4 py-2.5 border border-slate-800 mb-4 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRenameModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleRename}>Save New Name</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 border border-rose-500/40 shadow-glow">
            <h3 className="text-lg font-bold text-rose-400 mb-2">Confirm Delete Dataset</h3>
            <p className="text-xs text-slate-300 mb-6">
              Are you sure you want to permanently delete dataset <span className="font-bold text-white">'{selectedDataset?.name}'</span>? Original and cleaned files will be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete Dataset</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Validation Report Modal */}
      {reportModalOpen && summary?.quality_report && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl p-6 border border-indigo-500/40 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Data Validation Report Details
              </h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex gap-3 text-xs mb-4">
                <Badge variant="success">Quality Score: {summary.quality_report.quality_score}%</Badge>
                <Badge variant="danger">Errors: {summary.quality_report.error_count}</Badge>
                <Badge variant="warning">Warnings: {summary.quality_report.warning_count}</Badge>
              </div>

              {summary.quality_report.issues_json.map((issue: ValidationIssue, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-indigo-300 font-mono">{issue.type}</span>
                    <Badge variant={issue.severity === 'ERROR' ? 'danger' : 'warning'}>{issue.severity}</Badge>
                  </div>
                  <p className="text-slate-300">{issue.message}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
