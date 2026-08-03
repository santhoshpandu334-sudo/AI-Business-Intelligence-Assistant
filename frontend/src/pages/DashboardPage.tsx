import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  Sparkles, 
  UploadCloud, 
  FileText, 
  Bot, 
  TrendingDown, 
  Activity,
  Layers,
  PieChart as PieChartIcon,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Database
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { Dataset, Insight, DashboardSummaryData } from '../types';
import { useDataset } from '../context/DatasetContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { datasets, uniqueDatasets, selectedDatasetId, setSelectedDatasetId, loading: datasetsLoading } = useDataset();
  const [insights, setInsights] = useState<Insight[]>([]);
  
  // Dashboard Summary Data State
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  useEffect(() => {
    if (!datasetsLoading && datasets.length === 0) {
      setLoading(false);
    }
  }, [datasets, datasetsLoading]);

  useEffect(() => {
    if (selectedDatasetId !== undefined) {
      loadDashboardData(selectedDatasetId);
      loadInsights(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadDashboardData = async (datasetId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardSummary(datasetId, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        product: filterProduct || undefined,
        region: filterRegion || undefined,
        category: filterCategory || undefined,
        customer: filterCustomer || undefined
      });
      setSummary(data);
    } catch (err: any) {
      setError("Error processing business intelligence metrics. Please verify dataset format.");
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async (datasetId: number) => {
    try {
      const list = await api.getInsights(datasetId);
      setInsights(list);
    } catch (err) {}
  };

  const handleApplyFilters = () => {
    if (selectedDatasetId !== undefined) {
      loadDashboardData(selectedDatasetId);
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterProduct('');
    setFilterRegion('');
    setFilterCategory('');
    setFilterCustomer('');
    if (selectedDatasetId !== undefined) {
      setLoading(true);
      api.getDashboardSummary(selectedDatasetId).then((data) => {
        setSummary(data);
        setLoading(false);
      }).catch(() => {
        setError("Error loading metrics.");
        setLoading(false);
      });
    }
  };

  const emptySummary: DashboardSummaryData = {
    kpis: {
      total_revenue: 0,
      total_profit: 0,
      active_customers: 0,
      total_orders: 0,
      avg_order_value: 0,
      profit_margin: 0,
      dataset_health_score: 0,
      revenue_growth_pct: 0,
      profit_growth_pct: 0,
    },
    charts: {
      trend_data: [],
      product_data: [],
      region_data: [],
      category_data: [],
    },
    health: {
      revenue_score: 0,
      profit_score: 0,
      customer_score: 0,
      inventory_score: 0,
      overall_score: 0,
    }
  };
  const activeSummary = summary || emptySummary;

  return (
    <div className="space-y-6">
      {/* Top Banner & Target Dataset Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800 shadow-glow">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Executive Analytics Workspace
            </span>
            <span className="text-xs text-slate-400 font-mono">Live RAG Aggregator</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Enterprise Performance Analytics</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Target Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">Target Dataset:</span>
            {datasetsLoading ? (
              <span className="text-slate-400 font-mono animate-pulse">Loading datasets...</span>
            ) : uniqueDatasets.length === 0 ? (
              <span className="text-slate-500 font-bold">No datasets uploaded yet.</span>
            ) : (
              <select
                value={selectedDatasetId || ''}
                onChange={(e) => setSelectedDatasetId(Number(e.target.value))}
                className="bg-slate-950 text-xs text-white focus:outline-none font-bold cursor-pointer"
              >
                {uniqueDatasets.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-950 text-white">{d.name}</option>
                ))}
              </select>
            )}
          </div>

          <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => navigate('/upload')}>
            <UploadCloud className="w-4 h-4" /> Datasets
          </Button>
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => navigate('/chat')}>
            <Bot className="w-4 h-4" /> RAG Chat
          </Button>
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => navigate('/forecast')}>
            <TrendingUp className="w-4 h-4" /> ML Forecast
          </Button>
          <Button size="sm" variant="primary" className="gap-1.5" onClick={() => navigate('/reports')}>
            <FileText className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <GlassCard className="p-4 border-slate-800">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/80">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Interactive Dimensional Filters</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Product</label>
            <input
              type="text"
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              placeholder="e.g. AI Suite"
              className="w-full bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Region</label>
            <input
              type="text"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              placeholder="e.g. Bangalore"
              className="w-full bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Category</label>
            <input
              type="text"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              placeholder="e.g. Software"
              className="w-full bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Customer</label>
            <input
              type="text"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full bg-slate-950 text-xs text-white placeholder-slate-600 rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <Button size="sm" variant="ghost" onClick={handleResetFilters} className="text-xs">
            <RotateCw className="w-3.5 h-3.5 mr-1" /> Reset Filters
          </Button>
          <Button size="sm" variant="primary" onClick={handleApplyFilters} className="text-xs">
            <Search className="w-3.5 h-3.5 mr-1" /> Apply Filters
          </Button>
        </div>
      </GlassCard>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        /* Loading Skeleton states */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            <div className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          </div>
        </div>
      ) : (datasets.length === 0 || summary) ? (
        <div className="space-y-6">
          {/* Executive KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Revenue</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><DollarSign className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-white">
                {datasets.length === 0 ? "—" : `$${activeSummary.kpis.total_revenue.toLocaleString()}`}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                {datasets.length === 0 ? (
                  <span className="text-slate-500">No dataset uploaded</span>
                ) : (
                  <>
                    <Badge variant="success"><ArrowUpRight className="w-3 h-3" /> +{activeSummary.kpis.revenue_growth_pct}%</Badge>
                    <span className="text-slate-400">vs benchmark</span>
                  </>
                )}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Gross Profit</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-white">
                {datasets.length === 0 ? "—" : `$${activeSummary.kpis.total_profit.toLocaleString()}`}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                {datasets.length === 0 ? (
                  <span className="text-slate-500">No dataset uploaded</span>
                ) : (
                  <Badge variant="success"><ArrowUpRight className="w-3 h-3" /> {activeSummary.kpis.profit_margin}% margin</Badge>
                )}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Orders</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><ShoppingBag className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-white">
                {datasets.length === 0 ? "—" : activeSummary.kpis.total_orders.toLocaleString()}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                {datasets.length === 0 ? (
                  <span className="text-slate-500">No dataset uploaded</span>
                ) : (
                  <Badge variant="success">AOV: ${activeSummary.kpis.avg_order_value}</Badge>
                )}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Active Customers</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Users className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-white">
                {datasets.length === 0 ? "—" : activeSummary.kpis.active_customers.toLocaleString()}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                {datasets.length === 0 ? (
                  <span className="text-slate-500">No dataset uploaded</span>
                ) : (
                  <span className="text-slate-400">Unique entities</span>
                )}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Dataset Health</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><CheckCircle className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-white">
                {datasets.length === 0 ? "—" : `${activeSummary.kpis.dataset_health_score}/100`}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                {datasets.length === 0 ? (
                  <span className="text-slate-500">No dataset uploaded</span>
                ) : (
                  <Badge variant={activeSummary.kpis.dataset_health_score > 80 ? 'success' : 'warning'}>
                    {activeSummary.kpis.dataset_health_score > 80 ? 'Excellent' : 'Needs Clean'}
                  </Badge>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Business Health Engine Analysis */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-glow">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Business Health Engine Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Overall Index Score</span>
                <h4 className="text-3xl font-black text-indigo-400">{datasets.length === 0 ? "—" : `${activeSummary.health.overall_score}%`}</h4>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${datasets.length === 0 ? 0 : activeSummary.health.overall_score}%` }}></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Revenue Health</span>
                <h4 className="text-2xl font-black text-white">{datasets.length === 0 ? "—" : `${activeSummary.health.revenue_score}%`}</h4>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${datasets.length === 0 ? 0 : activeSummary.health.revenue_score}%` }}></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Profit Margin Health</span>
                <h4 className="text-2xl font-black text-white">{datasets.length === 0 ? "—" : `${activeSummary.health.profit_score}%`}</h4>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full" style={{ width: `${datasets.length === 0 ? 0 : activeSummary.health.profit_score}%` }}></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Customer Retention Health</span>
                <h4 className="text-2xl font-black text-white">{datasets.length === 0 ? "—" : `${activeSummary.health.customer_score}%`}</h4>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${datasets.length === 0 ? 0 : activeSummary.health.customer_score}%` }}></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Inventory Buffer Health</span>
                <h4 className="text-2xl font-black text-white">{datasets.length === 0 ? "—" : `${activeSummary.health.inventory_score}%`}</h4>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${datasets.length === 0 ? 0 : activeSummary.health.inventory_score}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue vs Profit Trend */}
            <GlassCard className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Revenue & Profit Performance Trend</h3>
                  <p className="text-xs text-slate-400">Monthly financial run-rates</p>
                </div>
                <Badge variant="info">Recharts Enabled</Badge>
              </div>

              <div className="h-72 w-full relative">
                {datasets.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 rounded-xl border border-slate-800/40 backdrop-blur-sm z-10 text-center p-4">
                    <p className="text-sm font-bold text-white">No data available</p>
                    <p className="text-xs text-slate-400 mt-1">Upload a dataset to activate analytics.</p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeSummary.charts.trend_data}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Gross Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Product Driver Breakdown */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Top Sales Driver Share</h3>
                  <p className="text-xs text-slate-400">Product revenue contribution percentage</p>
                </div>
                <PieChartIcon className="w-4 h-4 text-slate-400" />
              </div>

              <div className="h-56 w-full flex items-center justify-center relative">
                {datasets.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 rounded-xl border border-slate-800/40 backdrop-blur-sm z-10 text-center p-4">
                    <p className="text-sm font-bold text-white">No data available</p>
                    <p className="text-xs text-slate-400 mt-1">Upload a dataset to activate analytics.</p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeSummary.charts.product_data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {activeSummary.charts.product_data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 mt-2">
                {datasets.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-2">No product metrics available.</p>
                ) : activeSummary.charts.product_data.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-300 font-medium truncate max-w-[140px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Regional Sales & Latest Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Sales Contributions */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Top Sales Regions</h3>
                  <p className="text-xs text-slate-400">Total tracked ARR contribution per region</p>
                </div>
              </div>

              <div className="h-60 w-full relative">
                {datasets.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 rounded-xl border border-slate-800/40 backdrop-blur-sm z-10 text-center p-4">
                    <p className="text-sm font-bold text-white">No data available</p>
                    <p className="text-xs text-slate-400 mt-1">Upload a dataset to activate analytics.</p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeSummary.charts.region_data}>
                    <XAxis dataKey="region" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Bar dataKey="sales" fill="#818cf8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* AI Insights feed */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Live AI Insight Stream</h3>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/insights')}>View All</Button>
              </div>

              <div className="space-y-3">
                {insights.slice(0, 3).map((ins) => (
                  <div key={ins.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">{ins.title}</span>
                      <Badge variant={ins.importance === 'High' ? 'danger' : 'info'}>{ins.importance}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{ins.content}</p>
                  </div>
                ))}
                {(insights.length === 0 || datasets.length === 0) && (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-slate-400 italic">Synthesizing live dataset insights...</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 glass-panel rounded-2xl border border-slate-800 text-center">
          <Activity className="w-12 h-12 text-slate-400 mb-3 animate-pulse" />
          <p className="text-sm text-slate-300">Choose a dataset above to construct the business dashboard metrics.</p>
        </div>
      )}
    </div>
  );
};
export default DashboardPage;
