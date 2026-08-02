import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, User, Sparkles, Pin, Trash2, Edit3, Plus, 
  Search, Database, Cpu, RefreshCw, Download, CheckCircle2, 
  Code, BarChart3, HelpCircle, ShieldCheck, ChevronRight, MessageSquare
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { Dataset, ConversationItem, ChatMessageItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis, Tooltip } from 'recharts';

export const AIChatPage: React.FC = () => {
  const { hasRole } = useAuth();
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | undefined>(undefined);
  
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [searchConv, setSearchConv] = useState('');
  
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelProvider, setModelProvider] = useState('llama3.1');
  const [localMessages, setLocalMessages] = useState<ChatMessageItem[]>([]);

  // Modals
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDatasets();
    loadConversations();
  }, []);

  useEffect(() => {
    if (datasets.length === 0 && !activeConversation) {
      setActiveConversation({
        id: -1,
        user_id: 1,
        title: "AI Business Intelligence Assistant",
        dataset_id: undefined,
        model_provider: modelProvider,
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: []
      });
    }
  }, [datasets, activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, localMessages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDatasets = async () => {
    try {
      const list = await api.getDatasets();
      setDatasets(list);
      if (list.length > 0) setSelectedDatasetId(list[0].id);
    } catch (err) {}
  };

  const loadConversations = async (searchQuery?: string) => {
    try {
      const list = await api.getConversations(searchQuery || searchConv);
      setConversations(list);
      if (list.length > 0 && !activeConversation) {
        setActiveConversation(list[0]);
        setModelProvider(list[0].model_provider || 'llama3.1');
      }
    } catch (err) {}
  };

  const handleCreateNewChat = async () => {
    try {
      const newConv = await api.createConversation("New Business Query", selectedDatasetId, modelProvider);
      await loadConversations();
      setActiveConversation(newConv);
    } catch (err) {}
  };

  const handleSelectConversation = async (convId: number) => {
    try {
      const fullConv = await api.getConversationHistory(convId);
      setActiveConversation(fullConv);
      setModelProvider(fullConv.model_provider || 'llama3.1');
    } catch (err) {}
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || inputMessage;
    if (!text.trim() || !activeConversation) return;

    if (!customPrompt) setInputMessage('');
    setLoading(true);

    if (datasets.length === 0) {
      const tempUserMsg: ChatMessageItem = {
        id: Date.now(),
        conversation_id: activeConversation.id,
        sender: 'user',
        message_text: text,
        created_at: new Date().toISOString()
      };
      const tempSystemMsg: ChatMessageItem = {
        id: Date.now() + 1,
        conversation_id: activeConversation.id,
        sender: 'assistant',
        message_text: "I don't have any uploaded business data yet. Upload a dataset and I'll analyze it.",
        created_at: new Date().toISOString(),
        confidence_score: 100,
        sources_json: []
      };
      setLocalMessages((prev) => [...prev, tempUserMsg, tempSystemMsg]);
      setLoading(false);
      return;
    }

    // Optimistic UI insert for User message
    const tempUserMsg: ChatMessageItem = {
      id: Date.now(),
      conversation_id: activeConversation.id,
      sender: 'user',
      message_text: text,
      created_at: new Date().toISOString()
    };

    setActiveConversation((prev) => prev ? {
      ...prev,
      messages: [...prev.messages, tempUserMsg]
    } : null);

    try {
      const assistantMsg = await api.sendChatMessage(activeConversation.id, text, selectedDatasetId);
      setActiveConversation((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, assistantMsg]
      } : null);
      await loadConversations();
    } catch (err) {
      alert('RAG Chat request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateConversation(conv.id, undefined, !conv.is_pinned);
      await loadConversations();
    } catch (err) {}
  };

  const handleRenameConversation = async () => {
    if (!activeConversation || !newTitle.trim()) return;
    try {
      const updated = await api.updateConversation(activeConversation.id, newTitle.trim());
      setRenameModalOpen(false);
      await loadConversations();
      setActiveConversation(updated);
    } catch (err) {}
  };

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    try {
      await api.deleteConversation(activeConversation.id);
      setDeleteModalOpen(false);
      setActiveConversation(null);
      await loadConversations();
    } catch (err) {}
  };

  const handleModelSwitch = async (newProvider: string) => {
    setModelProvider(newProvider);
    if (activeConversation) {
      await api.updateConversation(activeConversation.id, undefined, undefined, newProvider);
    }
  };

  const exportChatHistory = () => {
    if (!activeConversation) return;
    const jsonStr = JSON.stringify(activeConversation, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${activeConversation.title.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const suggestedQuestions = [
    "Which region has highest sales?",
    "Forecast next month's revenue.",
    "Show profit trends.",
    "Detect anomalies."
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 overflow-hidden">
      {/* Sidebar: Conversation History */}
      <div className="w-80 glass-panel border border-slate-800 rounded-2xl p-4 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
          {/* New Chat Button */}
          <Button onClick={handleCreateNewChat} className="w-full gap-2 text-xs py-2.5">
            <Plus className="w-4 h-4" /> New AI Query Session
          </Button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchConv}
              onChange={(e) => { setSearchConv(e.target.value); loadConversations(e.target.value); }}
              placeholder="Search chat history..."
              className="w-full bg-slate-900 text-xs text-slate-200 placeholder-slate-500 rounded-xl pl-8 pr-3 py-2 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Conversations History List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                  activeConversation?.id === conv.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-glow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{conv.title}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleTogglePin(conv, e)}
                    className={`p-1 rounded hover:bg-slate-800 ${conv.is_pinned ? 'text-amber-400 opacity-100' : 'text-slate-400'}`}
                    title={conv.is_pinned ? "Unpin Chat" : "Pin Chat"}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Settings Summary Footer */}
        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between items-center">
          <span>Active RAG FAISS Index</span>
          <Badge variant="success">Persisted</Badge>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 glass-panel border border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-w-0">
        {/* Top Workspace Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white max-w-md truncate">{activeConversation?.title || "AI Business Intelligence Query"}</h2>
                {hasRole(['Admin', 'Manager', 'Analyst']) && activeConversation && (
                  <button onClick={() => { setNewTitle(activeConversation.title); setRenameModalOpen(true); }} className="text-slate-400 hover:text-indigo-300">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-400">RAG LangChain Agent &bull; FAISS Embeddings</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* LLM Model Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-xs">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <select
                value={modelProvider}
                onChange={(e) => handleModelSwitch(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="llama3.1">Llama 3.1 Enterprise</option>
                <option value="gemini-pro">Google Gemini 1.5 Pro</option>
                <option value="gpt-4o">OpenAI GPT-4o</option>
              </select>
            </div>

            {/* Dataset Target Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-xs">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedDatasetId || ''}
                onChange={(e) => setSelectedDatasetId(Number(e.target.value))}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <Button size="sm" variant="ghost" onClick={exportChatHistory} className="p-2" title="Export Chat Transcript">
              <Download className="w-4 h-4 text-slate-400 hover:text-white" />
            </Button>

            {hasRole(['Admin', 'Manager', 'Analyst']) && activeConversation && (
              <Button size="sm" variant="ghost" onClick={() => setDeleteModalOpen(true)} className="p-2 text-rose-400 hover:bg-rose-500/10" title="Delete Chat">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Message Stream Body */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
          {((datasets.length === 0 && localMessages.length === 0) || (datasets.length > 0 && (!activeConversation || !activeConversation.messages || activeConversation.messages.length === 0))) && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6 bg-slate-900/40 rounded-xl border border-slate-800/40 backdrop-blur-sm">
              <Bot className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-white mb-1">RAG Analytical Assistant</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Ask any questions about the business. Suggested prompt chips are available below.
              </p>
            </div>
          )}
          {(datasets.length === 0 ? localMessages : (activeConversation?.messages || [])).map((m) => (
            <div key={m.id} className={`flex gap-3.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white flex-shrink-0 text-xs font-bold shadow-glow">
                  AI
                </div>
              )}

              <div className={`max-w-3xl space-y-3.5 ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-2xl p-4 shadow-glow' : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-2xl p-5'}`}>
                {/* Structured Text */}
                <div className="text-xs leading-relaxed whitespace-pre-line space-y-2">
                  {m.message_text}
                </div>

                {/* Supporting Metric Cards */}
                {m.data_summary_json && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                    {Object.entries(m.data_summary_json).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">{k}</span>
                        <span className="text-xs font-extrabold text-indigo-300">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Generated Recharts Chart */}
                {m.chart_spec_json && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 mt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> {m.chart_spec_json.title}
                      </span>
                      <Badge variant="purple">Recharts Visualizer</Badge>
                    </div>

                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {m.chart_spec_json.type === 'area' ? (
                          <AreaChart data={m.chart_spec_json.data}>
                            <XAxis dataKey={m.chart_spec_json.xAxisKey} stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${v/1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                            {m.chart_spec_json.series.map((s: any) => (
                              <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} stroke={s.color} fill={s.color} fillOpacity={0.2} name={s.name} />
                            ))}
                          </AreaChart>
                        ) : m.chart_spec_json.type === 'pie' ? (
                          <PieChart>
                            <Pie data={m.chart_spec_json.data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="count">
                              {m.chart_spec_json.data.map((entry: any, i: number) => (
                                <Cell key={i} fill={entry.category.includes('Critical') ? '#ef4444' : (entry.category.includes('Moderate') ? '#f59e0b' : '#10b981')} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                          </PieChart>
                        ) : (
                          <BarChart data={m.chart_spec_json.data}>
                            <XAxis dataKey={m.chart_spec_json.xAxisKey} stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${v/1000000}M`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                            {m.chart_spec_json.series.map((s: any) => (
                              <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color} radius={[4, 4, 0, 0]} name={s.name} />
                            ))}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* SQL Query Box */}
                {m.sql_query && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300">
                    <span className="text-slate-500 block mb-1 font-sans font-bold flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-emerald-400" /> Executed Natural Language SQL Query:
                    </span>
                    {m.sql_query}
                  </div>
                )}

                {/* Confidence & Sources Footer */}
                {m.sender === 'assistant' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <div className="flex gap-1.5">
                      {m.sources_json?.map((src, i) => (
                        <span key={i} className="bg-slate-800 px-2 py-0.5 rounded font-mono">{src}</span>
                      ))}
                    </div>
                    {m.confidence_score && (
                      <span className="font-mono text-indigo-400 font-bold">Confidence: {m.confidence_score}%</span>
                    )}
                  </div>
                )}

                {/* Suggested Follow-Up Questions */}
                {m.follow_ups_json && m.follow_ups_json.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> Suggested Follow-up Queries:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.follow_ups_json.map((fq, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(fq)}
                          className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
                        >
                          {fq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0 text-xs">
                  Me
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-indigo-400">
              <RefreshCw className="w-4 h-4 animate-spin" /> Retrieving vector chunks & generating RAG answer...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Suggested Prompt Chips */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80 flex-shrink-0">
          {/* Quick Suggested Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            {suggestedQuestions.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-800 whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask an analytical business query (e.g. 'Why did sales decrease in March?')..."
              className="flex-1 bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
            <Button type="submit" className="gap-2" disabled={loading}>
              <Send className="w-4 h-4" /> Send
            </Button>
          </form>
        </div>
      </div>

      {/* Rename Conversation Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 border border-indigo-500/40 shadow-glow">
            <h3 className="text-lg font-bold text-white mb-2">Rename Query Session</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-900 text-sm text-slate-100 rounded-xl px-4 py-2.5 border border-slate-800 mb-4 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRenameModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleRenameConversation}>Save Title</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Delete Conversation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 border border-rose-500/40 shadow-glow">
            <h3 className="text-lg font-bold text-rose-400 mb-2">Delete Conversation</h3>
            <p className="text-xs text-slate-300 mb-6">Are you sure you want to delete this chat session and its memory history?</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteConversation}>Delete Chat</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
