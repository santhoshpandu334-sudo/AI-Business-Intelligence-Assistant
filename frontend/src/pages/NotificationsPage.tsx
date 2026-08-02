import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-glow flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Notification Center & Alert Scheduler</h1>
          <p className="text-slate-400 text-xs mt-1">Scheduled report delivery, revenue threshold alerts, and AI insights feed.</p>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <GlassCard key={n.id} className="flex items-start justify-between p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{n.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{n.message}</p>
                <span className="text-[10px] text-slate-500 font-mono mt-2 block">{new Date(n.created_at).toLocaleString()}</span>
              </div>
            </div>
            <Badge variant={n.type === 'alert' ? 'danger' : 'info'}>{n.type}</Badge>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
