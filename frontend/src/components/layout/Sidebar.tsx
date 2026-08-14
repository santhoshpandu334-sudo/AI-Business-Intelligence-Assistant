import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Bot, 
  TrendingUp, 
  Sparkles, 
  ShieldAlert, 
  Bell, 
  Settings, 
  User, 
  ChevronRight,
  Zap,
  Brain,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Upload Data', path: '/upload', icon: UploadCloud },
    { label: 'AI Chat (NLQ)', path: '/chat', icon: Bot },
    { label: 'ML Forecast', path: '/forecast', icon: TrendingUp },
    { label: 'AI Insights', path: '/insights', icon: Sparkles },
    { label: 'Business Consultant', path: '/consultant', icon: Briefcase },
    { label: 'Decision Intelligence', path: '/decision', icon: Brain },
    { label: 'Reports Engine', path: '/reports', icon: FileText },
    ...(user?.role === 'Admin' ? [{ label: 'Admin Console', path: '/admin', icon: ShieldAlert }] : []),
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'My Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 min-h-screen flex flex-col justify-between p-4 relative z-20">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-glow text-white font-bold text-xl">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight">AI BI ASSISTANT</h1>
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Enterprise v1.0
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-500/80 text-white shadow-glow border border-indigo-400/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Card */}
      <div className="pt-4 border-t border-slate-800/60">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <img
            src={user?.avatar_url || "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"}
            alt="Avatar"
            className="w-9 h-9 rounded-lg object-cover border border-indigo-500/30"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-100 truncate">{user?.full_name || 'Guest User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.company_name || 'Acme Corp'}</p>
          </div>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {user?.role || 'Analyst'}
          </span>
        </div>
      </div>
    </aside>
  );
};
