import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Zap, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
      if (res.reset_token) setToken(res.reset_token);
    } catch (err: any) {
      setMessage('Dispatched password reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <GlassCard className="w-full max-w-md p-8 border border-indigo-500/30 shadow-glow text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-glow text-white mx-auto mb-4">
          <Zap className="w-6 h-6 fill-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Forgot Password</h2>
        <p className="text-slate-400 text-sm mt-1 mb-6">Enter your email to receive password reset tokens.</p>

        {message ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              {message}
            </div>
            {token && (
              <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40 text-left">
                <span className="text-[11px] text-slate-400 block font-mono">Generated Password Reset Token:</span>
                <p className="text-xs text-indigo-300 font-mono break-all mt-1">{token}</p>
                <Link to={`/reset-password?token=${token}&email=${encodeURIComponent(email)}`} className="mt-3 block text-center py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                  Proceed to Reset Password
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Send Reset Instructions'}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
