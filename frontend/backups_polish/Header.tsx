import React from 'react';
import { Sun, Moon, Bell, Search, LogOut, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC<{ title?: string }> = ({ title = 'Executive BI Workspace' }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 glass-panel border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
        <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          PostgreSQL Live Engine
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Input */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search datasets, forecasts..."
            className="w-full bg-slate-900/80 text-xs text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 border border-slate-800 focus:outline-none focus:border-indigo-500/60"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
          title="Toggle Dark/Light mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors relative"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
        </button>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src={user?.avatar_url || "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"}
              alt="Profile"
              className="w-8 h-8 rounded-lg object-cover border border-indigo-500/30"
            />
          </button>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
