import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Database, 
  Briefcase, 
  Activity, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare,
  Send,
  Zap,
  ShieldCheck,
  TrendingUp as TrendIcon,
  PieChart as PieIcon,
  ChevronDown,
  ChevronUp,
  FileText
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
import { useDataset } from '../context/DatasetContext';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export const BusinessConsultantPage: React.FC = () => {
  const { uniqueDatasets, selectedDatasetId, setSelectedDatasetId, loading: datasetsLoading } = useDataset();
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Section explanations state
  const [explanations, setExplanations] = useState<Record<string, any>>({});
  const [explainingSection, setExplainingSection] = useState<string | null>(null);

  // Ask Consultant state
  const [question, setQuestion] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [asking, setAsking] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDatasetId !== undefined) {
      loadReport(selectedDatasetId);
    } else {
      setReport(null);
      setExplanations({});
      setChatHistory([]);
    }
  }, [selectedDatasetId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const loadReport = async (datasetId: number, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setExplanations({});
    setChatHistory([]);
    try {
      let data;
      if (forceRefresh) {
        data = await api.analyzeBusiness(datasetId);
      } else {
        data = await api.getConsultantReport(datasetId);
      }
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI Business Consultant report.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (selectedDatasetId !== undefined) {
      loadReport(selectedDatasetId, true);
    }
  };

  const handleDownloadPDF = () => {
    if (selectedDatasetId !== undefined) {
      const url = api.downloadConsultantReportUrl(selectedDatasetId);
      window.open(url, '_blank');
    }
  };

  const handleExplainMore = async (sectionId: string) => {
    if (selectedDatasetId === undefined || !report) return;
    
    // Toggle off if already open
    if (explanations[sectionId]) {
      const updated = { ...explanations };
      delete updated[sectionId];
      setExplanations(updated);
      return;
    }

    setExplainingSection(sectionId);
    try {
      const data = await api.explainReportSection(selectedDatasetId, sectionId, report);
      setExplanations(prev => ({
        ...prev,
        [sectionId]: data
      }));
    } catch (err) {
      alert("Failed to synthesize detailed section explanation.");
    } finally {
      setExplainingSection(null);
    }
  };

  const handleAskConsultant = async (customQuestion?: string) => {
    const queryText = customQuestion || question;
    if (!queryText.trim() || selectedDatasetId === undefined || !report || asking) return;

    setQuestion('');
    const userMsg: ChatMessage = { sender: 'user', text: queryText };
    setChatHistory(prev => [...prev, userMsg]);
    setAsking(true);

    try {
      const formatHistory = chatHistory.map(h => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text
      }));
      const res = await api.askConsultant(selectedDatasetId, queryText, report, formatHistory);
      const assistantMsg: ChatMessage = { sender: 'assistant', text: res.answer };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (err) {
      const assistantMsg: ChatMessage = { 
        sender: 'assistant', 
        text: "I apologize, but I encountered an error retrieving that consultancy context. Let's try again." 
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } finally {
      setAsking(false);
    }
  };

  const suggestedQuestions = [
    "Why did you assign this Business Health Score?",
    "Which recommendation should I implement first?",
    "Explain Recommendation 3.",
    "What is my biggest business risk?",
    "What should management focus on first?",
    "Explain the Executive Summary."
  ];

  const getPriorityColor = (prio: string) => {
    switch (prio.toLowerCase()) {
      case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-emerald-400';
      case 'Good': return 'text-indigo-400';
      case 'Average': return 'text-amber-400';
      default: return 'text-rose-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Selector & Action Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-glow flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Premium Enterprise Suite
            </span>
            <span className="text-xs text-slate-400 font-mono">Dynamic Analytical Synthesis</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" /> AI Business Consultant
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          {selectedDatasetId !== undefined && report && (
            <>
              <Button size="sm" variant="secondary" onClick={handleRegenerate} disabled={loading} className="gap-2">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Regenerate Analysis
              </Button>
              <Button size="sm" variant="primary" onClick={handleDownloadPDF} disabled={loading} className="gap-2">
                <Download className="w-3.5 h-3.5" /> Download Consultant Report
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        /* Loading Skeletons */
        <div className="space-y-6">
          <div className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            <div className="h-96 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          </div>
        </div>
      ) : uniqueDatasets.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-white">No datasets uploaded yet.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload a business dataset (.csv, .xlsx) in the Upload Data module to generate a complete business consultation report.
          </p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* CEO Executive Insights Card (Quick CEO Summary) */}
          <GlassCard className="border-indigo-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-extrabold text-white tracking-tight">CEO Executive Insights</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 ml-auto border border-indigo-500/30">1-Minute Briefing</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Overall Status</span>
                <p className="text-sm font-black text-indigo-400">{report.ceo_insights.overall_status}</p>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase font-mono text-slate-500">Biggest Opportunity</span>
                <p className="text-xs font-bold text-slate-200">{report.ceo_insights.biggest_opportunity}</p>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Immediate Priority</span>
                <p className="text-xs font-bold text-rose-400">{report.ceo_insights.immediate_priority}</p>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-mono text-slate-500">AI Confidence</span>
                <p className="text-sm font-black text-emerald-400">{report.ceo_insights.confidence_score}%</p>
              </div>
            </div>
          </GlassCard>

          {/* Main 8 Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (Health Score, Executive Summary, Strengths, Risks, Root Causes) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Business Health Score & Summary */}
              <GlassCard>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    {/* SVG Circular Progress Ring */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle 
                          cx="32" cy="32" r="26" 
                          stroke="#1e293b" strokeWidth="5" fill="transparent" 
                        />
                        <circle 
                          cx="32" cy="32" r="26" 
                          stroke="#6366f1" strokeWidth="5" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - report.health_score / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-sm font-black text-white">{report.health_score}</span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-white">Business Health Score</h3>
                      <p className="text-xs text-slate-400">
                        Rating: <span className={`font-bold ${getHealthStatusColor(report.health_status)}`}>{report.health_status}</span>
                      </p>
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" onClick={() => handleExplainMore("health_score")} className="text-xs">
                    {explanations["health_score"] ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />} Explain More
                  </Button>
                </div>

                {explanations["health_score"] ? (
                  renderExplainMoreContent("health_score")
                ) : (
                  <div className="space-y-2 text-xs text-slate-300">
                    <p className="font-semibold text-slate-400">Score Rationale:</p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      {report.health_explanation.split('\n').map((line: string, i: number) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </GlassCard>

              {/* Card 2: Executive Summary */}
              <GlassCard>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" /> Executive Summary
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => handleExplainMore("executive_summary")} className="text-xs">
                    {explanations["executive_summary"] ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />} Explain More
                  </Button>
                </div>
                {explanations["executive_summary"] ? (
                  renderExplainMoreContent("executive_summary")
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{report.executive_summary}</p>
                )}
              </GlassCard>

              {/* Card 3 & 4: Key Strengths & Concerns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <GlassCard className="border-emerald-500/10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Key Strengths
                    </h3>
                    <Button size="sm" variant="ghost" onClick={() => handleExplainMore("strengths")} className="text-[10px] px-2 py-1">
                      {explanations["strengths"] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Detail
                    </Button>
                  </div>
                  {explanations["strengths"] ? (
                    renderExplainMoreContent("strengths")
                  ) : (
                    <div className="space-y-3">
                      {report.strengths.map((str: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/15">
                          <h4 className="text-xs font-bold text-emerald-300">{str.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">{str.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>

                {/* Risks */}
                <GlassCard className="border-rose-500/10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="w-4 h-4" /> Risks & Concerns
                    </h3>
                    <Button size="sm" variant="ghost" onClick={() => handleExplainMore("risks")} className="text-[10px] px-2 py-1">
                      {explanations["risks"] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Detail
                    </Button>
                  </div>
                  {explanations["risks"] ? (
                    renderExplainMoreContent("risks")
                  ) : (
                    <div className="space-y-3">
                      {report.risks.map((risk: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/15">
                          <h4 className="text-xs font-bold text-rose-300">{risk.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">{risk.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Card 5: Root Cause Analysis */}
              <GlassCard>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" /> Root Cause Analysis
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => handleExplainMore("root_causes")} className="text-xs">
                    {explanations["root_causes"] ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />} Explain More
                  </Button>
                </div>
                {explanations["root_causes"] ? (
                  renderExplainMoreContent("root_causes")
                ) : (
                  <div className="space-y-2">
                    {report.root_causes.map((rc: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl flex gap-3 text-xs leading-normal">
                        <div className="font-bold text-rose-400 min-w-[120px]">{rc.issue}:</div>
                        <div className="text-slate-300">{rc.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

            </div>

            {/* Right Column (Recommendations, Impact, Confidence) */}
            <div className="space-y-6">
              
              {/* Card 6: Priority Recommendations */}
              <GlassCard>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Recommendations
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => handleExplainMore("recommendations")} className="text-xs">
                    {explanations["recommendations"] ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />} Explain
                  </Button>
                </div>

                {explanations["recommendations"] ? (
                  renderExplainMoreContent("recommendations")
                ) : (
                  <div className="space-y-4">
                    {report.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2 text-xs relative overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-full ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                          <h4 className="font-bold text-white">{rec.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal">{rec.explanation}</p>
                        <div className="text-[10px] text-indigo-400 font-semibold border-t border-slate-800/80 pt-1">
                          Benefit: <span className="text-slate-400 font-normal">{rec.benefit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* Card 7: Expected Business Impact */}
              <GlassCard>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" /> Projected Impact
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => handleExplainMore("impacts")} className="text-xs">
                    {explanations["impacts"] ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />} Explain
                  </Button>
                </div>
                {explanations["impacts"] ? (
                  renderExplainMoreContent("impacts")
                ) : (
                  <div className="space-y-2 text-xs">
                    {Object.entries(report.impacts).map(([vector, level]: any) => (
                      <div key={vector} className="flex justify-between items-center p-2 bg-slate-950/40 border border-slate-900 rounded-lg">
                        <span className="text-slate-400 capitalize">{vector.replace('_', ' ')}</span>
                        <span className={`font-black ${level === 'High' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {level}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* Card 8: AI Confidence Assessment */}
              <GlassCard>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> AI Confidence
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => handleExplainMore("confidence")} className="text-xs">
                    {explanations["confidence"] ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />} Explain
                  </Button>
                </div>
                {explanations["confidence"] ? (
                  renderExplainMoreContent("confidence")
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center relative">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="20" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                          <circle 
                            cx="24" cy="24" r="20" 
                            stroke="#10b981" strokeWidth="4" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={2 * Math.PI * 20 * (1 - report.confidence_score / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-xs font-bold text-white">{report.confidence_score}%</span>
                      </div>
                      <p className="text-slate-300 leading-normal">{report.confidence_explanation}</p>
                    </div>
                  </div>
                )}
              </GlassCard>

            </div>

          </div>

          {/* Contextual Ask Consultant Dialogue Section */}
          <GlassCard className="border-slate-800">
            <h3 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" /> Ask Consultant
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Consult the AI directly. Your generated report acts as primary context and the raw dataset as secondary reference.
            </p>

            {/* Suggestions list */}
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  disabled={asking}
                  onClick={() => handleAskConsultant(q)}
                  className="text-[11px] font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl px-3 py-1.5 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Conversational History container */}
            {chatHistory.length > 0 && (
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900 max-h-80 overflow-y-auto mb-4 space-y-3 scrollbar-thin">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex gap-3 text-xs leading-normal max-w-2xl ${msg.sender === 'user' ? 'ml-auto justify-end' : ''}`}>
                    <div className={`p-3 rounded-2xl border ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 rounded-tr-none' 
                        : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none'
                    }`}>
                      <p className="font-bold text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                        {msg.sender === 'user' ? 'You' : 'AI Business Consultant'}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {asking && (
                  <div className="flex gap-2 items-center text-xs text-slate-500 font-mono animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Consultant is referencing report context...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Input Submission */}
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                disabled={asking}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskConsultant()}
                placeholder="Ask about recommendations, scores, details, or custom dataset pivots..."
                className="flex-1 bg-slate-950/80 text-xs text-white placeholder-slate-600 rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <Button onClick={() => handleAskConsultant()} disabled={asking || !question.trim()} variant="primary" className="px-4">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </GlassCard>

        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-white">Analysis Ready</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Click 'Analyze Business' to execute dynamic column classification and generate your Strategic Consultation Report.
          </p>
          <Button onClick={() => selectedDatasetId && loadReport(selectedDatasetId)} variant="primary" className="gap-2 mx-auto">
            <Activity className="w-4 h-4" /> Analyze Business
          </Button>
        </div>
      )}
    </div>
  );

  // Sub-renderer for the Explain More panels
  function renderExplainMoreContent(sectionId: string) {
    const exp = explanations[sectionId];
    
    if (explainingSection === sectionId || !exp) {
      return (
        <div className="py-6 text-center text-xs text-slate-500 font-mono animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Extracting supporting statistics and charts...
        </div>
      );
    }

    return (
      <div className="space-y-4 pt-3 border-t border-slate-800/80 text-xs">
        <div className="space-y-1">
          <p className="font-bold text-indigo-400">Deconstructive Summary:</p>
          <p className="text-slate-300 leading-relaxed">{exp.deeper_explanation}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="font-bold text-indigo-400">Supporting Statistics:</p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-400">
              {exp.supporting_statistics.map((stat: string, idx: number) => (
                <li key={idx}>{stat}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-indigo-400">Trends & Integrity:</p>
            <p className="text-slate-400">{exp.detected_trends}</p>
            <p className="text-[10px] text-slate-500 font-mono">Confidence Level: {exp.confidence_level}%</p>
          </div>
        </div>

        {exp.relevant_chart && (
          <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{exp.relevant_chart.title}</p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exp.relevant_chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey={exp.relevant_chart.xAxisKey} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b' }} />
                  {exp.relevant_chart.series.map((s: any, idx: number) => (
                    <Bar key={idx} dataKey={s.dataKey} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default BusinessConsultantPage;
