import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative">
      <GlassCard className="w-full max-w-md p-8 border border-indigo-500/30 shadow-glow">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-glow text-white mx-auto mb-4">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Enterprise Sign In</h2>
          <p className="text-slate-400 text-sm mt-1">Access your BI analytics & AI forecasting engine</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Workspace'} <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="my-6">
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2 text-xs"
            onClick={() => loginGoogle().then(() => navigate('/dashboard'))}
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
            Single Sign-On (Google Enterprise OAuth)
          </Button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account? <Link to="/register" className="text-indigo-400 font-semibold hover:underline">Register company</Link>
        </p>
      </GlassCard>
    </div>
  );
};
