import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Sparkles, 
  BarChart3, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Database, 
  FileSpreadsheet, 
  Lock, 
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [demoQuery, setDemoQuery] = useState('What is our forecasted Q4 revenue growth?');
  const [demoResponse, setDemoResponse] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleRunDemo = () => {
    setLoadingDemo(true);
    setTimeout(() => {
      setDemoResponse("Retrieval-Augmented Generation (RAG) complete: Q4 Revenue is forecasted to hit $18.4M (+28.4% YoY) with a 95% confidence interval spanning $17.1M to $19.7M. Primary growth driver: Enterprise Cloud expansion (+34.2%).");
      setLoadingDemo(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-glow text-white font-bold text-xl">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">AI BI ASSISTANT</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">How It Works</a>
          <a href="#demo" className="hover:text-indigo-400 transition-colors">AI Demo</a>
          <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-indigo-400 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
          <Button variant="primary" onClick={() => navigate('/register')}>Get Started Free</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-6 max-w-7xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold text-xs mb-6 shadow-glow">
            <Sparkles className="w-4 h-4" /> Next-Gen Enterprise AI Intelligence Suite
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight mb-6">
            Transform Raw Enterprise Data into <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Actionable Revenue Decisions</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            RAG-powered conversational analytics, predictive Machine Learning forecasting (Prophet, XGBoost), Isolation Forest anomaly detection, and automated executive reporting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 text-base" onClick={() => navigate('/register')}>
              Launch Assistant <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={() => navigate('/login')}>
              Live Demo Login
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Interactive AI Demo Section */}
      <section id="demo" className="py-16 px-6 max-w-5xl mx-auto relative z-10">
        <GlassCard className="p-8 border border-indigo-500/30 shadow-glow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-mono text-slate-400 ml-2">RAG AI Query Engine - Live Test</span>
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-semibold border border-indigo-500/30">
              Llama 3.1 + FAISS Index
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={demoQuery}
                onChange={(e) => setDemoQuery(e.target.value)}
                placeholder="Ask any natural language business question..."
                className="flex-1 bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <Button onClick={handleRunDemo} disabled={loadingDemo}>
                {loadingDemo ? 'Running RAG...' : 'Ask AI'}
              </Button>
            </div>

            {demoResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-slate-200 text-sm leading-relaxed"
              >
                <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                  <BrainCircuit className="w-4 h-4" /> AI Answer Output:
                </div>
                {demoResponse}
              </motion.div>
            )}
          </div>
        </GlassCard>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">Enterprise Capability Suite</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Built from the ground up for high-scale enterprise operations and financial governance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard>
            <BrainCircuit className="w-10 h-10 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">RAG Conversational Engine</h3>
            <p className="text-slate-400 text-sm">Query massive structured datasets in natural language. Powered by LangChain, FAISS vector indexing, and SentenceTransformers.</p>
          </GlassCard>

          <GlassCard>
            <BarChart3 className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">ML Predictive Forecasting</h3>
            <p className="text-slate-400 text-sm">Time-series forecasting using Prophet, XGBoost, Random Forest, and Linear Regression with dynamic scenario sliders.</p>
          </GlassCard>

          <GlassCard>
            <ShieldCheck className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Isolation Forest Anomalies</h3>
            <p className="text-slate-400 text-sm">Automated multi-variate anomaly detection flagging fraud, double billing, unusual revenue drops, and spike patterns.</p>
          </GlassCard>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">Transparent Enterprise Pricing</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Choose the tier built for your enterprise team size.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard className="border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <p className="text-3xl font-extrabold text-indigo-400 mb-6">$99 <span className="text-sm font-normal text-slate-400">/mo</span></p>
            <ul className="space-y-3 text-sm text-slate-300 mb-8">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 5 Team Seats</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> RAG Data Chat</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Standard PDF Reports</li>
            </ul>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/register')}>Start Trial</Button>
          </GlassCard>

          <GlassCard className="border-2 border-indigo-500 shadow-glow relative">
            <span className="absolute -top-3 right-6 bg-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase">Popular</span>
            <h3 className="text-xl font-bold text-white mb-2">Pro Business</h3>
            <p className="text-3xl font-extrabold text-indigo-400 mb-6">$299 <span className="text-sm font-normal text-slate-400">/mo</span></p>
            <ul className="space-y-3 text-sm text-slate-300 mb-8">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 25 Team Seats</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> ML Forecasting (XGBoost / Prophet)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> PDF, Excel & Word Exports</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Anomaly Detection Engine</li>
            </ul>
            <Button variant="primary" className="w-full" onClick={() => navigate('/register')}>Get Started</Button>
          </GlassCard>

          <GlassCard className="border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-2">Enterprise Custom</h3>
            <p className="text-3xl font-extrabold text-indigo-400 mb-6">Contact Us</p>
            <ul className="space-y-3 text-sm text-slate-300 mb-8">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Team Seats</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dedicated PostgreSQL Cluster</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom SLA & Audit Logs</li>
            </ul>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/register')}>Contact Sales</Button>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-12 px-6 max-w-7xl mx-auto text-center text-slate-500 text-sm">
        <p>© 2026 AI Business Intelligence Assistant. Production-Ready Enterprise SaaS Platform.</p>
      </footer>
    </div>
  );
};
