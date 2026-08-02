import React, { useState } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Globe, Shield, Key } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [apiKey, setApiKey] = useState('bi_sk_live_2026_99812450012837');
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-glow">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">System & Workspace Settings</h1>
        <p className="text-slate-400 text-xs mt-1">Configure theme preferences, language, API credentials, and email notification rules.</p>
      </div>

      <GlassCard className="space-y-6">
        {/* Theme Settings */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Interface Theme</h3>
            <p className="text-xs text-slate-400">Switch between dark glassmorphism and light mode.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme} className="gap-2">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            {theme === 'dark' ? 'Dark Theme Active' : 'Light Theme Active'}
          </Button>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Workspace Language</h3>
            <p className="text-xs text-slate-400">Select language for natural language AI responses.</p>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="en">English (US)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        {/* API Credentials */}
        <div className="space-y-2 pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" /> API Access Keys
          </h3>
          <p className="text-xs text-slate-400">REST API Token for external data warehouse integrations.</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={apiKey}
              className="flex-1 bg-slate-900 text-xs font-mono text-indigo-300 border border-slate-800 rounded-xl px-4 py-2"
            />
            <Button size="sm" variant="secondary" onClick={() => alert('API Key regenerated')}>Regenerate</Button>
          </div>
        </div>

        {/* Email Alerts Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Email Digest & Alerts</h3>
            <p className="text-xs text-slate-400">Receive scheduled weekly executive summaries via email.</p>
          </div>
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.checked)}
            className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
          />
        </div>
      </GlassCard>
    </div>
  );
};
