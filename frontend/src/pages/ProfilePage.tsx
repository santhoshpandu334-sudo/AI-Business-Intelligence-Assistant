import React, { useState } from 'react';
import { User as UserIcon, Mail, Building, Shield, Lock, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [company, setCompany] = useState(user?.company_name || '');
  const [success, setSuccess] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-glow">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">User Account Profile</h1>
        <p className="text-slate-400 text-xs mt-1">Manage personal credentials, role authorization, and company details.</p>
      </div>

      <GlassCard className="space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <img
            src={user?.avatar_url || "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"}
            alt="Avatar"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-glow"
          />
          <div>
            <h2 className="text-lg font-bold text-white">{user?.full_name || 'Enterprise User'}</h2>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="purple">{user?.role || 'Analyst'}</Badge>
              <Badge variant="success">Active Verified Account</Badge>
            </div>
          </div>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            Profile details updated successfully.
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-900 text-sm text-slate-100 rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company / Organization</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-900 text-sm text-slate-100 rounded-xl px-4 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <Button type="submit">Save Profile Changes</Button>
        </form>
      </GlassCard>
    </div>
  );
};
