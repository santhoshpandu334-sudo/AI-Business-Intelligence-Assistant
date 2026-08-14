import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, Shield, Key } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { useDataset } from '../context/DatasetContext';

export const SettingsPage: React.FC = () => {
  const { selectedDatasetId } = useDataset();
  const [language, setLanguage] = useState('en');
  const [apiKey, setApiKey] = useState('bi_sk_live_2026_99812450012837');
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [lastDigestSent, setLastDigestSent] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchEmailPreference = async () => {
      setLoading(true);
      try {
        const data = await api.getEmailPreference();
        setEmailAlerts(data.email_digest_enabled);
        setUserEmail(data.user_email);
        setLastDigestSent(data.last_digest_sent);
      } catch (err) {
        console.error('Failed to load email preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmailPreference();
  }, []);

  const handleToggleEmailAlerts = async (checked: boolean) => {
    setEmailAlerts(checked);
    setSaving(true);
    setStatusMsg(null);
    try {
      const data = await api.updateEmailPreference(checked);
      setEmailAlerts(data.email_digest_enabled);
      setLastDigestSent(data.last_digest_sent);
      setStatusMsg({ text: 'Preferences updated successfully.', type: 'success' });
    } catch (err) {
      console.error('Failed to update email preferences:', err);
      setEmailAlerts(!checked); // Revert checkbox state
      setStatusMsg({ text: 'Failed to update preferences.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestDigest = async () => {
    if (!selectedDatasetId) {
      setStatusMsg({ text: 'No active dataset selected. Please upload/select a dataset on the dashboard first.', type: 'error' });
      return;
    }
    setSaving(true);
    setStatusMsg(null);
    try {
      const data = await api.triggerEmailDigestTest(selectedDatasetId);
      setStatusMsg({ text: data.message || 'Test digest generated successfully.', type: 'success' });
      // Reload preference to capture new last_digest_sent timestamp
      const pref = await api.getEmailPreference();
      setLastDigestSent(pref.last_digest_sent);
    } catch (err: any) {
      console.error('Failed to send test digest:', err);
      setStatusMsg({ text: err.message || 'Failed to trigger test email digest.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

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
            <p className="text-xs text-slate-400">Dark glassmorphism theme is enforced for executive workspaces.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Dark Mode Enforced
          </span>
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
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Email Digest & Alerts
                {saving && <span className="text-xs text-indigo-400 animate-pulse">(Saving...)</span>}
                {loading && <span className="text-xs text-slate-500 animate-pulse">(Loading...)</span>}
              </h3>
              <p className="text-xs text-slate-400">Receive scheduled weekly executive summaries via email.</p>
              {userEmail && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Recipient Address: <span className="font-mono text-indigo-300">{userEmail}</span>
                  {lastDigestSent && (
                    <span className="ml-2">
                      | Last Sent: <span className="text-emerald-400 font-semibold">{new Date(lastDigestSent).toLocaleString()}</span>
                    </span>
                  )}
                </p>
              )}
            </div>
            <input
              type="checkbox"
              disabled={loading || saving}
              checked={emailAlerts}
              onChange={(e) => handleToggleEmailAlerts(e.target.checked)}
              className="w-5 h-5 accent-indigo-500 rounded cursor-pointer disabled:opacity-55"
            />
          </div>

          {/* Test Digest Action */}
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
            <div>
              <h4 className="text-xs font-bold text-white">Verify Dynamic Ingestion</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Sends a test digest compiled from your active dataset workspace.</p>
            </div>
            <Button 
              size="sm" 
              variant="secondary" 
              disabled={loading || saving}
              onClick={handleSendTestDigest}
            >
              Send Test Digest
            </Button>
          </div>

          {statusMsg && (
            <div className={`text-xs px-4 py-2.5 rounded-xl border ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {statusMsg.text}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
