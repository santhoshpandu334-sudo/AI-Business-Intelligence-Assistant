import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  RefreshCw,
  TrendingDown,
  CheckCircle,
  Database,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp as TrendingUpIcon,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { Dataset, InsightsDashboardData } from '../types';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';

export const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { datasets, selectedDatasetId, setSelectedDatasetId, loading: datasetsLoading } = useDataset();
  const [dashboardData, setDashboardData] = useState<InsightsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetsLoading && datasets.length === 0) {
      setLoading(false);
    }
  }, [datasets, datasetsLoading]);

  useEffect(() => {
    if (selectedDatasetId !== undefined) {
      loadInsights(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadInsights = async (datasetId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getInsightsDashboard(datasetId);
      setDashboardData(data);
    } catch (err: any) {
      setError("Error running executive insight synthesis. Please verify dataset format.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'high':
      case 'danger':
      case 'warning':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'medium':
      case 'info':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const emptyDashboardData: InsightsDashboardData = {
    executive_summary: {
      summary: "Please upload a dataset to begin executive insight synthesis. Business Health Score and strategic recommendations will be computed dynamically.",
      total_revenue: 0,
      total_profit: 0,
      active_customers: 0,
      overall_health_score: 0,
      orders: 0,
      company_status: "Neutral"
    },
    business_insights: [],
    risks: [],
    recommendations: []
  };
  const activeDashboardData = dashboardData || emptyDashboardData;

  return (
    <div className="space-y-6">
      {/* Target Dataset & Page Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-glow flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              AI Decision Support System
            </span>
            <span className="text-xs text-slate-400 font-mono">Executive Summary Synthesis</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Executive Insights Engine</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">Dataset Source:</span>
            <select
              value={selectedDatasetId || ''}
              onChange={(e) => setSelectedDatasetId(Number(e.target.value))}
              className="bg-slate-950 text-xs text-white focus:outline-none font-bold cursor-pointer"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-950 text-white">{d.name}</option>
              ))}
            </select>
          </div>

          {selectedDatasetId && (
            <Button size="sm" variant="secondary" onClick={() => loadInsights(selectedDatasetId)} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recalculate Insights
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800" />
            <div className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800" />
          </div>
        </div>
      ) : (datasets.length === 0 || dashboardData) ? (
        <div className="space-y-6">
          {/* Executive Summary Quote Section */}
          <GlassCard className="p-6 border-indigo-500/20 bg-indigo-950/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-1">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-base font-bold text-white">Synthesized Executive Summary</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Large Language Model Synthesis</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "{activeDashboardData.executive_summary.summary}"
                </p>
                <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Total Revenue:</span>
                    <strong className="text-white">
                      {datasets.length === 0 ? "—" : `$${activeDashboardData.executive_summary.total_revenue.toLocaleString()}`}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Operating Net Profit:</span>
                    <strong className="text-emerald-400">
                      {datasets.length === 0 ? "—" : `$${activeDashboardData.executive_summary.total_profit.toLocaleString()}`}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Active Customers:</span>
                    <strong className="text-indigo-400">
                      {datasets.length === 0 ? "—" : activeDashboardData.executive_summary.active_customers.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Company Health Score:</span>
                    <strong className="text-amber-400">
                      {datasets.length === 0 ? "—" : `${activeDashboardData.executive_summary.overall_health_score}/100`}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Business Insights & Category Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Diagnostic Cards */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" /> AI Business Diagnostics
              </h3>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {datasets.length === 0 ? (
                  <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500 italic">
                    No diagnostics generated. Upload a dataset to begin analysis.
                  </div>
                ) : activeDashboardData.business_insights.map((ins, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Badge className={`px-2 py-0.5 rounded-lg border text-[10px] ${getSeverityColor(ins.severity)}`}>
                          {ins.category}
                        </Badge>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-white">{ins.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{ins.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment & Recommendations Panel */}
            <div className="space-y-6">
              {/* Risk Intelligence Table */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" /> Risk Intelligence Explanations
                </h3>

                 <div className="space-y-3">
                  {datasets.length === 0 ? (
                    <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500 italic">
                      No active risk calculations.
                    </div>
                  ) : activeDashboardData.risks.map((risk, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">{risk.risk_type}</span>
                        <Badge variant={risk.severity === 'High' ? 'danger' : 'warning'}>
                          {risk.severity} Severity
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        <strong className="text-white">Business Impact:</strong> {risk.business_impact}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900 pt-1.5">
                        <span>Probability: {risk.probability}</span>
                        <span className="text-indigo-400 font-semibold">{risk.recommendation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI recommendations directives panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-glow">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" /> Actionable Recommendations & Expected Benefit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datasets.length === 0 ? (
                <div className="col-span-full p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500 italic">
                  No actionable recommendations.
                </div>
              ) : activeDashboardData.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{rec.title}</span>
                      <Badge variant={rec.priority === 'Critical' ? 'danger' : rec.priority === 'High' ? 'warning' : 'info'}>
                        {rec.priority} Priority
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{rec.estimated_impact}</p>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-900 font-mono">
                    <span className="text-emerald-400 font-bold">Benefit: {rec.expected_benefit}</span>
                    <span className="text-indigo-400 font-bold">Confidence: {rec.confidence_score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default InsightsPage;
