import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Cpu, 
  Sliders, 
  Play, 
  CheckCircle,
  AlertOctagon,
  ShieldAlert,
  Zap,
  Activity,
  Calendar,
  AlertTriangle,
  RotateCw,
  Database,
  ArrowRight,
  TrendingDown,
  Percent
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { Dataset, ForecastPoint, ForecastDashboardData } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, Line, ComposedChart } from 'recharts';

import { useNavigate } from 'react-router-dom';

export const ForecastPage: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | undefined>(undefined);
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [targetMetric, setTargetMetric] = useState<'revenue' | 'profit' | 'orders'>('revenue');
  
  // Dashboard Summary State
  const [dashboardData, setDashboardData] = useState<ForecastDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId !== undefined) {
      loadForecastData(selectedDatasetId, horizonDays);
    }
  }, [selectedDatasetId, horizonDays]);

  const loadDatasets = async () => {
    try {
      const list = await api.getDatasets();
      setDatasets(list);
      if (list.length > 0) {
        setSelectedDatasetId(list[0].id);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError("Failed to fetch enterprise datasets.");
      setLoading(false);
    }
  };

  const loadForecastData = async (datasetId: number, horizon: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getForecastDashboard(datasetId, horizon);
      setDashboardData(data);
    } catch (err: any) {
      setError("Error running predictive ML model. Verify dataset formats.");
    } finally {
      setLoading(false);
    }
  };

  const getMetricData = () => {
    if (!dashboardData) return [];
    if (targetMetric === 'revenue') return dashboardData.revenue_forecast;
    if (targetMetric === 'profit') return dashboardData.profit_forecast;
    return dashboardData.orders_forecast;
  };

  if (datasets.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 glass-panel rounded-2xl border border-slate-800">
        <Cpu className="w-16 h-16 text-indigo-400 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2">No Enterprise Datasets Found</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          To run predictive algorithms and anomaly detection, upload a transactions, sales, or business records dataset first.
        </p>
        <Button onClick={() => navigate('/upload')} variant="primary" className="gap-2">
          Upload Dataset
        </Button>
      </div>
    );
  }

  const chartData = getMetricData();

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-glow flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Machine Learning Predictive Suite
            </span>
            <span className="text-xs text-slate-400 font-mono">Meta Prophet & Isolation Forest</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Forecasting & Anomalies</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Target Dataset Selector */}
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

          {/* Horizon Selection */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">Horizon:</span>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="bg-transparent focus:outline-none font-bold text-white cursor-pointer"
            >
              <option value={7}>Next 7 Days</option>
              <option value={30}>Next 30 Days</option>
              <option value={90}>Next 90 Days</option>
              <option value={365}>Next 12 Months</option>
            </select>
          </div>

          {/* Target Metric Selection */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">Metric:</span>
            <select
              value={targetMetric}
              onChange={(e: any) => setTargetMetric(e.target.value)}
              className="bg-transparent focus:outline-none font-bold text-white cursor-pointer"
            >
              <option value="revenue">Revenue</option>
              <option value="profit">Profit</option>
              <option value="orders">Orders</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
          <div className="col-span-full h-80 rounded-2xl bg-slate-900/60 border border-slate-800 mt-4" />
        </div>
      ) : dashboardData ? (
        <div className="space-y-6">
          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Forecasted Revenue</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><TrendingUp className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-white">${dashboardData.forecast_kpis.forecasted_revenue.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-400 font-mono">Sum for next {horizonDays} days</span>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Forecasted Profit</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-white">${dashboardData.forecast_kpis.forecasted_profit.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-400 font-mono">Net projected earnings</span>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Forecasted Orders</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Activity className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-white">{dashboardData.forecast_kpis.forecasted_orders.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-400 font-mono">Transaction units</span>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Outliers Detected</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400"><AlertOctagon className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-rose-400">{dashboardData.forecast_kpis.anomalies_count}</h3>
              <span className="text-[10px] text-slate-400 font-mono">Isolation Forest flags</span>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Overall Risk Rating</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><ShieldAlert className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-amber-400">{dashboardData.forecast_kpis.overall_risk_score}%</h3>
              <span className="text-[10px] text-slate-400 font-mono">Integrated risk score</span>
            </GlassCard>
          </div>

          {/* Forecasting Recharts and Risk Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Forecasting Area Chart */}
            <GlassCard className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" /> Projected {targetMetric.toUpperCase()} Path
                  </h3>
                  <p className="text-xs text-slate-400">Predicted timeline with 95% Confidence Band (Upper/Lower prediction interval)</p>
                </div>
                <Badge variant="purple">Meta Prophet Fallback Model</Badge>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" height={36} />
                    
                    {/* Confidence Band Area */}
                    <Area 
                      type="monotone" 
                      dataKey="upper_bound" 
                      stroke="transparent" 
                      fill="url(#colorConfidence)" 
                      name="Prediction Bounds (Upper/Lower)" 
                    />
                    
                    {/* Predicted Line */}
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#a855f7" 
                      strokeWidth={3} 
                      dot={false} 
                      name="Predicted Trajectory" 
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="lower_bound" 
                      stroke="#475569" 
                      strokeDasharray="3 3" 
                      dot={false} 
                      name="Confidence Floor" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Risk analysis panel */}
            <GlassCard>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" /> Integrated Risk Analysis Scorecard
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Composite Risk Score</span>
                  <h4 className="text-4xl font-black text-amber-400">{dashboardData.risks.overall_risk}%</h4>
                  <p className="text-[10px] text-slate-500">Volatilities weighted across standard deviations</p>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Revenue Risk</span>
                      <span className="font-bold text-white">{dashboardData.risks.revenue_risk}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full" style={{ width: `${dashboardData.risks.revenue_risk}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Profit Volatility Risk</span>
                      <span className="font-bold text-white">{dashboardData.risks.profit_risk}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${dashboardData.risks.profit_risk}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Inventory Stockout Risk</span>
                      <span className="font-bold text-white">{dashboardData.risks.inventory_risk}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${dashboardData.risks.inventory_risk}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Customer Retention Risk</span>
                      <span className="font-bold text-white">{dashboardData.risks.customer_risk}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${dashboardData.risks.customer_risk}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* AI recommendations & Predictions Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictions Table */}
            <GlassCard>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Predictions Ledger
              </h3>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5">Date Period</th>
                      <th className="py-2.5 text-right">Predicted Value</th>
                      <th className="py-2.5 text-right">Confidence Floor</th>
                      <th className="py-2.5 text-right">Confidence Ceiling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {chartData.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2.5 font-medium">{pt.period}</td>
                        <td className="py-2.5 text-right font-bold text-white">${pt.predicted.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-slate-400">${pt.lower_bound.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-slate-400">${pt.upper_bound.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* AI operational directives list */}
            <GlassCard>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" /> AI Executive Recommendations
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {dashboardData.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{rec.title}</span>
                      <Badge variant={rec.priority === 'Critical' ? 'danger' : rec.priority === 'High' ? 'warning' : 'info'}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{rec.impact}</p>
                    <div className="flex justify-between items-center text-[10px] text-indigo-300 font-semibold pt-1">
                      <span>Benefit: {rec.benefit}</span>
                      <span>Confidence: {rec.confidence_score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Anomaly Detection Log Cards */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-glow">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" /> Isolation Forest Anomaly log
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.anomalies.map((an, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 capitalize">{an.anomaly_type.replace('_', ' ')}</span>
                      <Badge variant="danger">Score: {an.anomaly_score}</Badge>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{an.reasoning}</p>
                  </div>
                  {an.payload_json && (
                    <pre className="text-[10px] bg-slate-900 p-2 rounded-lg border border-slate-800 font-mono text-slate-400 overflow-x-auto">
                      {JSON.stringify(an.payload_json, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default ForecastPage;
