import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Activity,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  Database,
  RefreshCw,
  Sliders,
  AlertCircle,
  HelpCircle,
  Play,
  CheckCircle,
  UserCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from 'recharts';

import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import {
  Dataset,
  HealthScore,
  WhatIfScenario,
  RootCauseAnalysis,
  GoalPlannerResponse,
  BusinessRecommendation,
  BusinessAlert,
  ExecutiveAdvisorResponse,
  WhatIfRequest,
  WhatIfResponse,
  DecisionHistoryItem
} from '../types';

export const DecisionIntelligencePage: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Business Intelligence State
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [recommendations, setRecommendations] = useState<BusinessRecommendation[]>([]);
  const [alerts, setAlerts] = useState<BusinessAlert[]>([]);
  const [rootCause, setRootCause] = useState<RootCauseAnalysis | null>(null);
  const [selectedRootCauseMetric, setSelectedRootCauseMetric] = useState<string>('Revenue');

  // Interactive Tools State
  const [activeTab, setActiveTab] = useState<string>('health');
  const [advisorQuery, setAdvisorQuery] = useState<string>('');
  const [advisorResponse, setAdvisorResponse] = useState<ExecutiveAdvisorResponse | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState<boolean>(false);

  const [scenarioType, setScenarioType] = useState<string>('price_increase');
  const [adjustmentPct, setAdjustmentPct] = useState<number>(10);
  const [targetMetric, setTargetMetric] = useState<string>('revenue');
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState<boolean>(false);

  const [goalDate, setGoalDate] = useState<string>('2026-12-31');
  const [targetRevenue, setTargetRevenue] = useState<string>('');
  const [targetProfit, setTargetProfit] = useState<string>('');
  const [targetOrders, setTargetOrders] = useState<string>('');
  const [targetCustomers, setTargetCustomers] = useState<string>('');
  const [targetMargin, setTargetMargin] = useState<string>('');
  const [goalResult, setGoalResult] = useState<GoalPlannerResponse | null>(null);
  const [goalLoading, setGoalLoading] = useState<boolean>(false);

  const [historyItems, setHistoryItems] = useState<DecisionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId !== undefined) {
      loadDecisionMetrics(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const list = await api.getDatasets();
      setDatasets(list);
      if (list.length > 0) {
        setSelectedDatasetId(list[0].id);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load datasets.');
      setLoading(false);
    }
  };

  const loadDecisionHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.getDecisionHistory();
      if (res && 'success' in res && (res as any).success && (res as any).data === null) {
        setHistoryItems([]);
      } else {
        setHistoryItems(res as DecisionHistoryItem[]);
      }
    } catch (err: any) {
      console.error("Failed to load decision history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadDecisionMetrics = async (datasetId: number) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch stats concurrently
      const [scoreRes, recsRes, alertsRes, rootCauseRes] = await Promise.all([
        api.getDecisionHealthScore(datasetId).catch(() => null),
        api.getDecisionRecommendations(datasetId).catch(() => []),
        api.getDecisionAlerts(datasetId).catch(() => []),
        api.getRootCauseAnalysis(datasetId, selectedRootCauseMetric).catch(() => null)
      ]);

      // Check if they are standardized "no data" responses
      if (scoreRes && 'success' in scoreRes && (scoreRes as any).success && (scoreRes as any).data === null) {
        setHealthScore(null);
        setError('No datasets uploaded. Upload a dataset to begin Decision Intelligence analysis. Business Health Score will be available after data upload.');
      } else {
        setHealthScore(scoreRes as HealthScore);
      }

      if (recsRes && 'success' in recsRes && (recsRes as any).success && (recsRes as any).data === null) {
        setRecommendations([]);
      } else {
        setRecommendations(recsRes as BusinessRecommendation[]);
      }

      if (alertsRes && 'success' in alertsRes && (alertsRes as any).success && (alertsRes as any).data === null) {
        setAlerts([]);
      } else {
        setAlerts(alertsRes as BusinessAlert[]);
      }

      if (rootCauseRes && 'success' in rootCauseRes && (rootCauseRes as any).success && (rootCauseRes as any).data === null) {
        setRootCause(null);
      } else {
        setRootCause(rootCauseRes as RootCauseAnalysis);
      }

      await loadDecisionHistory();
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading decision metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = () => {
    if (selectedDatasetId) {
      loadDecisionMetrics(selectedDatasetId);
    }
  };

  const handleAdvisorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorQuery.trim()) return;

    setAdvisorLoading(true);
    try {
      const res = await api.runExecutiveAdvisor({ query: advisorQuery });
      if (res && 'success' in res && (res as any).success && (res as any).data === null) {
        setAdvisorResponse(null);
        setError('No datasets uploaded. Upload a dataset to begin Decision Intelligence analysis.');
      } else {
        setAdvisorResponse(res as ExecutiveAdvisorResponse);
        await loadDecisionHistory();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get advisor response.');
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleWhatIfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDatasetId === undefined) return;
    setWhatIfLoading(true);
    try {
      const res = await api.runWhatIfAnalysis({
        scenario_type: scenarioType,
        adjustment_pct: adjustmentPct,
        target_metric: targetMetric,
        dataset_id: selectedDatasetId
      });
      if (res && 'success' in res && (res as any).success && (res as any).data === null) {
        setWhatIfResult(null);
        setError('No datasets uploaded. Upload a dataset to begin Decision Intelligence analysis.');
      } else {
        setWhatIfResult(res as WhatIfResponse);
        await loadDecisionHistory();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run What-If simulation.');
    } finally {
      setWhatIfLoading(false);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalLoading(true);
    try {
      const res = await api.planGoal({
        target_date: goalDate,
        target_revenue: targetRevenue ? Number(targetRevenue) : undefined,
        target_profit: targetProfit ? Number(targetProfit) : undefined,
        target_orders: targetOrders ? Number(targetOrders) : undefined,
        target_customers: targetCustomers ? Number(targetCustomers) : undefined,
        target_margin: targetMargin ? Number(targetMargin) : undefined
      });
      if (res && 'success' in res && (res as any).success && (res as any).data === null) {
        setGoalResult(null);
        setError('No datasets uploaded. Upload a dataset to begin Decision Intelligence analysis.');
      } else {
        setGoalResult(res as GoalPlannerResponse);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run goal simulation.');
    } finally {
      setGoalLoading(false);
    }
  };

  const triggerRootCauseRefresh = async (metric: string) => {
    setSelectedRootCauseMetric(metric);
    if (selectedDatasetId) {
      try {
        const rootCauseRes = await api.getRootCauseAnalysis(selectedDatasetId, metric);
        if (rootCauseRes && 'success' in rootCauseRes && (rootCauseRes as any).success && (rootCauseRes as any).data === null) {
          setRootCause(null);
        } else {
          setRootCause(rootCauseRes as RootCauseAnalysis);
        }
      } catch (err: any) {
        console.error(err);
      }
    }
  };



  return (
    <div className="space-y-6">
      {/* Top Controller Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-glow flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              AI Governance & Strategy
            </span>
            <span className="text-xs text-slate-400 font-mono">Prescriptive Analysis Suite</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Decision Intelligence Engine</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">Dataset:</span>
            <select
              value={selectedDatasetId || ''}
              onChange={(e) => setSelectedDatasetId(Number(e.target.value))}
              className="bg-transparent focus:outline-none font-bold text-white cursor-pointer"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <Button size="sm" variant="secondary" onClick={handleRecalculate} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recalculate Metrics
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 rounded-2xl bg-slate-900/60 border border-slate-800" />
            <div className="h-96 lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex flex-wrap border-b border-slate-800 gap-1 bg-slate-950/40 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('health')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'health'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Health & Alerts
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              What-If Simulator
            </button>
            <button
              onClick={() => setActiveTab('goal')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'goal'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Goal Planner
            </button>
            <button
              onClick={() => setActiveTab('rootcause')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'rootcause'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Root Cause Analysis
            </button>
            <button
              onClick={() => setActiveTab('advisor')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'advisor'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Executive AI Advisor
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Decision History
            </button>
          </div>

          {/* Tab 1: Health & Alerts */}
          {activeTab === 'health' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Business Health Score */}
              <GlassCard className="p-6 border-slate-800/80 bg-slate-900/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Business Health Score</h3>
                      <span className="text-[10px] text-slate-400">Holistic Performance Index</span>
                    </div>
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>

                  {healthScore ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-full flex items-center justify-center border-4 border-indigo-500/20 bg-indigo-500/5">
                          <span className="text-xl font-black text-white">{healthScore.score}</span>
                          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow"></div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Trend Status</p>
                          <Badge variant={healthScore.status === 'Good' ? 'success' : healthScore.status === 'Warning' ? 'warning' : 'danger'}>
                            {healthScore.status} ({healthScore.trend})
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-slate-800/60 pt-4">
                        {Object.entries(healthScore.breakdown).map(([name, score]) => (
                          <div key={name} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-300">
                              <span>{name}</span>
                              <strong className="text-indigo-400">{score}</strong>
                            </div>
                            <div className="bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${score}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No score calculated.</p>
                  )}
                </div>
              </GlassCard>

              {/* Card 2: Smart Alerts */}
              <GlassCard className="p-6 border-slate-800/80 bg-slate-900/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Smart Alerts</h3>
                      <span className="text-[10px] text-slate-400">Anomalous Activity Monitor</span>
                    </div>
                    <AlertCircle className="w-5 h-5 text-indigo-400" />
                  </div>

                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {alerts.length > 0 ? (
                      alerts.map((al) => (
                        <div key={al.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{al.title}</h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              al.severity === 'Critical' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                              al.severity === 'High' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                              al.severity === 'Medium' ? 'text-indigo-300 bg-indigo-500/10 border border-indigo-500/20' :
                              'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            }`}>
                              {al.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{al.message}</p>
                          {al.current_value !== undefined && al.threshold_value !== undefined && (
                            <div className="flex gap-4 text-[10px] border-t border-slate-800/40 pt-1.5 font-mono text-slate-500">
                              <span>Val: {al.current_value.toLocaleString()}</span>
                              <span>Baseline: {al.threshold_value.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500 italic">
                        No active strategic alerts.
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Card 3: Business Recommendations */}
              <GlassCard className="p-6 border-slate-800/80 bg-slate-900/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Recommendations</h3>
                      <span className="text-[10px] text-slate-400">Strategy Optimization Advice</span>
                    </div>
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>

                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {recommendations.length > 0 ? (
                      recommendations.map((rec, index) => (
                        <div key={index} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{rec.title}</h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-indigo-300 bg-indigo-500/10">
                              {rec.difficulty}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{rec.description}</p>
                          <div className="flex justify-between items-center text-[10px] border-t border-slate-800/40 pt-1.5 text-slate-500 font-semibold">
                            <span>Category: {rec.category}</span>
                            <span className="text-indigo-400 font-bold">Impact: {rec.impact_score}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500 italic">
                        No recommendations generated.
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Tab 2: What-If Simulator */}
          {activeTab === 'simulator' && (
            <div className="max-w-4xl mx-auto">
              <GlassCard className="p-6 border-slate-800/80 bg-slate-900/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">What-If Simulation Engine</h3>
                      <span className="text-[10px] text-slate-400">Simulate bottom-line strategic variance</span>
                    </div>
                    <Sliders className="w-5 h-5 text-indigo-400" />
                  </div>

                  {datasets.length === 0 && (
                    <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Please upload a dataset to begin What-If simulation analysis.
                    </div>
                  )}

                  <form onSubmit={handleWhatIfSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Scenario Type</label>
                        <select
                          value={scenarioType}
                          onChange={(e) => setScenarioType(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="price_increase">Increase Product Price (%)</option>
                          <option value="price_decrease">Decrease Product Price (%)</option>
                          <option value="sales_volume_increase">Increase Sales Volume (%)</option>
                          <option value="sales_volume_decrease">Decrease Sales Volume (%)</option>
                          <option value="marketing_increase">Marketing Budget Increase (%)</option>
                          <option value="marketing_decrease">Marketing Budget Reduction (%)</option>
                          <option value="operational_cost_increase">Operational Cost Increase (%)</option>
                          <option value="operational_cost_decrease">Operational Cost Reduction (%)</option>
                          <option value="customer_growth">Customer Growth (%)</option>
                          <option value="customer_loss">Customer Loss (%)</option>
                          <option value="profit_margin_change">Profit Margin Change (%)</option>
                          <option value="discount_campaign">Discount Campaign (%)</option>
                          <option value="inventory_adjustment">Inventory Adjustment (%)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Target Metric</label>
                        <select
                          value={targetMetric}
                          onChange={(e) => setTargetMetric(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="revenue">Revenue</option>
                          <option value="profit">Profit</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Adjustment (%)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="-50"
                          max="100"
                          value={adjustmentPct}
                          onChange={(e) => setAdjustmentPct(Number(e.target.value))}
                          className="flex-grow h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <input
                          type="number"
                          min="-50"
                          max="100"
                          value={adjustmentPct}
                          onChange={(e) => setAdjustmentPct(Math.max(-50, Math.min(100, Number(e.target.value))))}
                          className="w-16 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <Button type="submit" size="sm" variant="primary" disabled={whatIfLoading || datasets.length === 0} className="w-full">
                       {whatIfLoading ? "Running Simulation..." : "Run Simulation"}
                     </Button>
                  </form>

                  {whatIfResult && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-slate-800/60 pt-4">
                        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">Revenue</span>
                          <div className="mt-1">
                            <div className="text-[10px] text-slate-500">Current: ${whatIfResult.original_revenue.toLocaleString()}</div>
                            <div className="text-xs font-bold text-white mt-0.5">Proj: ${whatIfResult.predicted_revenue.toLocaleString()}</div>
                          </div>
                          <span className={`text-[10px] font-bold mt-1.5 ${whatIfResult.revenue_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {whatIfResult.revenue_change_pct >= 0 ? '+' : ''}{whatIfResult.revenue_change_pct}%
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">Profit</span>
                          <div className="mt-1">
                            <div className="text-[10px] text-slate-500">Current: ${whatIfResult.original_profit.toLocaleString()}</div>
                            <div className="text-xs font-bold text-white mt-0.5">Proj: ${whatIfResult.predicted_profit.toLocaleString()}</div>
                          </div>
                          <span className={`text-[10px] font-bold mt-1.5 ${whatIfResult.profit_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {whatIfResult.profit_change_pct >= 0 ? '+' : ''}{whatIfResult.profit_change_pct}%
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">Profit Margin</span>
                          <div className="mt-1">
                            <div className="text-[10px] text-slate-500">Current: {whatIfResult.original_margin}%</div>
                            <div className="text-xs font-bold text-white mt-0.5">Proj: {whatIfResult.predicted_margin}%</div>
                          </div>
                          <span className={`text-[10px] font-bold mt-1.5 ${whatIfResult.margin_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {whatIfResult.margin_change_pct >= 0 ? '+' : ''}{whatIfResult.margin_change_pct}%
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">Customers</span>
                          <div className="mt-1">
                            <div className="text-[10px] text-slate-500">Current: {whatIfResult.original_customers}</div>
                            <div className="text-xs font-bold text-white mt-0.5">Proj: {whatIfResult.predicted_customers}</div>
                          </div>
                          <span className={`text-[10px] font-bold mt-1.5 ${whatIfResult.customers_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {whatIfResult.customers_change_pct >= 0 ? '+' : ''}{whatIfResult.customers_change_pct}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">Risk Level</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            whatIfResult.risk_level === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            whatIfResult.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {whatIfResult.risk_level}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">Confidence</span>
                          <span className="text-xs font-black text-indigo-400">{whatIfResult.confidence_score}%</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                        <p className="text-[9px] uppercase tracking-wider text-indigo-400 font-black mb-1">AI Synthesis Explanation</p>
                        <p className="text-xs text-slate-300 leading-relaxed italic">"{whatIfResult.business_explanation}"</p>
                      </div>

                      {/* Chart visualizations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="h-44 bg-slate-950/40 rounded-xl p-3 border border-slate-800/60">
                          <p className="text-[10px] font-bold text-slate-400 mb-2 text-center uppercase tracking-wider">Revenue Forecast</p>
                          <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={[
                              { name: 'Current', value: whatIfResult.original_revenue, fill: '#6366f1' },
                              { name: 'Proj', value: whatIfResult.predicted_revenue, fill: '#10b981' }
                            ]} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} labelStyle={{ color: '#fff' }} />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={30}>
                                <Cell fill="#6366f1" />
                                <Cell fill="#10b981" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="h-44 bg-slate-950/40 rounded-xl p-3 border border-slate-800/60">
                          <p className="text-[10px] font-bold text-slate-400 mb-2 text-center uppercase tracking-wider">Net Profit Forecast</p>
                          <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={[
                              { name: 'Current', value: whatIfResult.original_profit, fill: '#a855f7' },
                              { name: 'Proj', value: whatIfResult.predicted_profit, fill: '#10b981' }
                            ]} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} labelStyle={{ color: '#fff' }} />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={30}>
                                <Cell fill="#a855f7" />
                                <Cell fill="#10b981" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}

          {/* Tab 3: Goal Planner */}
          {activeTab === 'goal' && (
            <div className="max-w-4xl mx-auto">
              <GlassCard className="p-6 border-slate-800/80 bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">AI Multi-Goal Planner</h3>
                    <span className="text-[10px] text-slate-400">Establish and align business milestones simultaneously</span>
                  </div>
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>

                {datasets.length === 0 && (
                  <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Please upload a dataset to begin Goal milestones planning.
                  </div>
                )}

                <form onSubmit={handleGoalSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Revenue ($)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1500000"
                        value={targetRevenue}
                        onChange={(e) => setTargetRevenue(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Profit ($)</label>
                      <input
                        type="number"
                        placeholder="e.g. 450000"
                        value={targetProfit}
                        onChange={(e) => setTargetProfit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Orders</label>
                      <input
                        type="number"
                        placeholder="e.g. 12000"
                        value={targetOrders}
                        onChange={(e) => setTargetOrders(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Customers</label>
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={targetCustomers}
                        onChange={(e) => setTargetCustomers(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Profit Margin (%)</label>
                      <input
                        type="number"
                        placeholder="e.g. 35"
                        value={targetMargin}
                        onChange={(e) => setTargetMargin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Deadline</label>
                      <input
                        type="date"
                        value={goalDate}
                        onChange={(e) => setGoalDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <Button type="submit" size="sm" variant="primary" disabled={goalLoading || datasets.length === 0} className="w-full">
                    {goalLoading ? "Generating Path..." : "Plan Goals"}
                  </Button>
                </form>

                {goalResult && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                    <div className="grid grid-cols-3 gap-3 border-b border-slate-800/60 pb-3 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Feasibility</span>
                        <p className="text-sm font-black text-indigo-400 mt-1">{goalResult.overall_feasibility_score}%</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Difficulty</span>
                        <p className="text-sm font-black text-amber-400 mt-1">{goalResult.overall_difficulty}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Risk Level</span>
                        <p className="text-sm font-black text-rose-400 mt-1">{goalResult.overall_risk_level}</p>
                      </div>
                    </div>

                    {/* Gap analysis table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-bold">
                            <th className="py-2">Metric</th>
                            <th className="py-2">Current</th>
                            <th className="py-2">Target</th>
                            <th className="py-2">Gap</th>
                            <th className="py-2">Req Growth</th>
                            <th className="py-2 text-right">Monthly Target</th>
                          </tr>
                        </thead>
                        <tbody>
                          {goalResult.gaps.map((item) => (
                            <tr key={item.metric_name} className="border-b border-slate-900 text-slate-200">
                              <td className="py-2 font-semibold text-white">{item.metric_name}</td>
                              <td className="py-2">${item.current_value.toLocaleString()}</td>
                              <td className="py-2">${item.target_value.toLocaleString()}</td>
                              <td className="py-2 text-rose-400">${item.gap.toLocaleString()} ({item.gap_pct}%)</td>
                              <td className="py-2 font-bold text-indigo-400">{item.required_growth_pct}%</td>
                              <td className="py-2 text-right font-semibold text-emerald-400">+{item.monthly_target.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                      <p className="text-[9px] uppercase tracking-wider text-indigo-400 font-black mb-1">Recommended Strategy Plan</p>
                      <p className="text-xs text-slate-300 leading-relaxed italic">"{goalResult.recommended_strategy}"</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan steps Checklist</p>
                      <div className="space-y-2">
                        {goalResult.plan_steps.map((st: any) => (
                          <div key={st.step} className="flex gap-3 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40">
                            <span className="text-indigo-400 font-bold">{st.step}.</span>
                            <div>
                              <p className="font-semibold text-white">{st.description}</p>
                              <span className="text-[10px] text-slate-500">Sub-target milestone: ${st.target_subvalue.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
          )}

          {/* Tab 4: Root Cause Analysis */}
          {activeTab === 'rootcause' && (
            <div className="max-w-4xl mx-auto">
              <GlassCard className="p-6 border-slate-800/80 bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Root Cause Analysis</h3>
                    <span className="text-[10px] text-slate-400">Identify primary variance drivers dynamically</span>
                  </div>
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                </div>

                {datasets.length === 0 && (
                  <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Please upload a dataset to begin Root Cause Analysis variance tracking.
                  </div>
                )}

                <div className="flex gap-2 mb-4 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  {['Revenue', 'Profit', 'Orders', 'Customers'].map((metric) => (
                    <button
                      key={metric}
                      onClick={() => triggerRootCauseRefresh(metric)}
                      className={`flex-1 text-center py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedRootCauseMetric === metric ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>

                {rootCause ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall Period Deviation</span>
                      <strong className={`text-sm ${rootCause.deviation_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {rootCause.deviation_pct >= 0 ? '+' : ''}{rootCause.deviation_pct}%
                      </strong>
                    </div>

                    <div className="space-y-2 border-t border-slate-800/60 pt-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Variance Drivers (Dynamic dimensions)</p>
                      {rootCause.possible_causes.map((cause: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span className="truncate">{cause.factor}</span>
                            <strong>{cause.contribution_pct}% contribution</strong>
                          </div>
                          <div className="bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${cause.contribution_pct}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-800/60 pt-3 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Root Cause Synthesis</p>
                      {rootCause.insights.map((ins: string, idx: number) => (
                        <div key={idx} className="flex gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/40">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{ins}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No root cause analysis computed.</p>
                )}
              </GlassCard>
            </div>
          )}

          {/* Tab 5: Executive Advisor */}
          {activeTab === 'advisor' && (
            <div className="max-w-4xl mx-auto">
              <GlassCard className="p-6 border-slate-800/80 bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">AI Executive Advisor</h3>
                    <span className="text-[10px] text-slate-400">Ask strategic questions and get data-backed insights</span>
                  </div>
                  <Brain className="w-5 h-5 text-indigo-400" />
                </div>

                {datasets.length === 0 && (
                  <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Please upload a dataset to begin Executive AI Advisor consultations.
                  </div>
                )}

                <form onSubmit={handleAdvisorSubmit} className="flex gap-3 mb-6">
                  <input
                    type="text"
                    disabled={datasets.length === 0}
                    value={advisorQuery}
                    onChange={(e) => setAdvisorQuery(e.target.value)}
                    placeholder={datasets.length === 0 ? "Advisor consultations require an uploaded dataset" : "e.g., Why is profit decreasing? or What region performs best?"}
                    className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  <Button type="submit" size="sm" variant="primary" disabled={advisorLoading || datasets.length === 0}>
                    {advisorLoading ? "Thinking..." : "Query Advisor"}
                  </Button>
                </form>

                {advisorResponse && (
                  <div className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Advisor Synthesis
                      </span>
                      <span className="text-[10px] text-slate-500">Confidence: {advisorResponse.confidence_score}%</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic">
                      "{advisorResponse.response_text}"
                    </p>
                    <div className="border-t border-slate-800/80 pt-3">
                      <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Suggested Actions</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {advisorResponse.suggested_actions.map((act, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/40 border border-slate-800/40 px-3 py-2 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span className="truncate">{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
          )}

          {/* Tab 6: Decision History */}
          {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto">
              <GlassCard className="p-6 border-slate-800/80 bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Strategic Decision History</h3>
                    <span className="text-[10px] text-slate-400">Audit log of simulations and advisor queries</span>
                  </div>
                  <RefreshCw className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                  {historyLoading ? (
                    <div className="text-center p-6 text-xs text-slate-400">Loading audit history...</div>
                  ) : historyItems.length > 0 ? (
                    historyItems.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              item.decision_type === 'simulation' ? 'text-indigo-400 bg-indigo-500/10' : 'text-emerald-400 bg-emerald-500/10'
                            }`}>
                              {item.decision_type.toUpperCase()}
                            </span>
                            <h4 className="text-xs font-bold text-white">{item.scenario_type}</h4>
                          </div>
                          <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500">Initiator</span>
                            <p className="text-slate-300 font-semibold truncate">{item.user_email}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">Risk Level</span>
                            <p className={`font-bold ${
                              item.risk_level === 'High' ? 'text-rose-400' : item.risk_level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>{item.risk_level}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">Confidence Score</span>
                            <p className="text-indigo-400 font-bold">{item.confidence_score}%</p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded bg-slate-900/60 text-xs text-slate-300 italic border border-slate-850">
                          <strong>Output Summary:</strong> {item.output_summary}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500 italic">
                      No decisions or queries logged yet.
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
