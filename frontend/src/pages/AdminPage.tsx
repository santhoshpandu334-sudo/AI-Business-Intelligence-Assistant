import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, AuditLogItem, AdminStats } from '../types';

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Deletion and toast states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(console.error);
    api.getAllUsers().then(setUsers).catch(console.error);
    api.getAuditLogs().then(setAuditLogs).catch(console.error);
  }, []);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.updateRole(userId, newRole);
      const updated = await api.getAllUsers();
      setUsers(updated);
    } catch {
      showToast("Role update failed", "error");
    }
  };

  const canDeleteUser = (u: User) => {
    if (u.id === currentUser?.id) return false;
    if ((u.role as string) === 'Super Admin' || u.email?.toLowerCase().includes('superadmin')) return false;
    return ['Manager', 'Analyst', 'Employee'].includes(u.role);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUserId(userToDelete.id);
    try {
      await api.deleteUser(userToDelete.id);
      showToast("User deleted successfully.", "success");
      const updatedUsers = await api.getAllUsers();
      setUsers(updatedUsers);
      const updatedStats = await api.getAdminStats();
      setStats(updatedStats);
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      showToast("Unable to delete user.", "error");
    } finally {
      setDeletingUserId(null);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-glow flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
            System Governance
          </span>

          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Admin Operations Console
          </h1>
        </div>

        <Badge variant={stats?.system_health ? "success" : "warning"}>
          {stats?.system_health ?? "Admin statistics are currently unavailable."}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <GlassCard>
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Registered Users
          </span>

          <h3 className="text-2xl font-black text-white mt-1">
            {stats?.total_users ?? users.length ?? 0}
          </h3>

          <span className="text-[11px] text-indigo-400 font-mono">
            Role Access Controlled
          </span>
        </GlassCard>

        <GlassCard>
          <span className="text-xs font-semibold text-slate-400 uppercase">
            24h API Requests
          </span>

          <h3 className="text-2xl font-black text-white mt-1">
            {(stats?.api_requests_24h ?? 0).toLocaleString()}
          </h3>

          <span className="text-[11px] text-emerald-400 font-mono">
            Avg Latency: {stats?.avg_latency_ms ?? 0} ms
          </span>
        </GlassCard>

        <GlassCard>
          <span className="text-xs font-semibold text-slate-400 uppercase">
            AI Queries Processed
          </span>

          <h3 className="text-2xl font-black text-white mt-1">
            {(stats?.total_ai_queries ?? 0).toLocaleString()}
          </h3>

          <span className="text-[11px] text-purple-400 font-mono">
            RAG Token Monitoring Active
          </span>
        </GlassCard>

        <GlassCard>
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Storage Used
          </span>

          <h3 className="text-2xl font-black text-white mt-1">
            {stats?.storage_used_mb ?? 0} MB
          </h3>

          <span className="text-[11px] text-slate-400 font-mono">
            Max Quota: 10,240 MB
          </span>
        </GlassCard>

      </div>

      {/* User Management */}
      <GlassCard>

        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          User & Role Management
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">

          <table className="w-full text-left text-xs text-slate-300">

            <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">

              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Company</th>
                <th className="p-3">Role</th>
                <th className="p-3">Change Role</th>
                <th className="p-3">Actions</th>
              </tr>

            </thead>

            <tbody>

              {users.length === 0 ? (

                <tr>
                  <td colSpan={5} className="text-center p-6 text-slate-400">
                    No users found
                  </td>
                </tr>

              ) : (

                users.map((u) => (

                  <tr key={u.id} className="border-b border-slate-800">

                    <td className="p-3">
                      <div className="font-semibold text-white">
                        {u.full_name ?? "Unknown"}
                      </div>

                      <div className="text-xs text-slate-400">
                        {u.email ?? "Unknown"}
                      </div>
                    </td>

                    <td className="p-3">
                      {u.company_name ?? "Unknown"}
                    </td>

                    <td className="p-3">

                      <Badge
                        variant={
                          u.role === "Admin"
                            ? "purple"
                            : u.role === "Manager"
                            ? "info"
                            : u.role === "Analyst"
                            ? "success"
                            : "warning"
                        }
                      >
                        {u.role ?? "Unknown"}
                      </Badge>

                    </td>

                    <td className="p-3">

                      <select
                        value={u.role ?? "Employee"}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value)
                        }
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 cursor-pointer"
                      >
                        <option className="bg-slate-900 text-slate-200">Admin</option>
                        <option className="bg-slate-900 text-slate-200">Manager</option>
                        <option className="bg-slate-900 text-slate-200">Analyst</option>
                        <option className="bg-slate-900 text-slate-200">Employee</option>
                      </select>

                    </td>

                    <td className="p-3">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={!canDeleteUser(u) || deletingUserId === u.id}
                        onClick={() => {
                          setUserToDelete(u);
                          setDeleteModalOpen(true);
                        }}
                        className="gap-1.5 px-2.5 py-1.5 text-xs border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-40 disabled:hover:bg-rose-500/10 disabled:cursor-not-allowed"
                        title={!canDeleteUser(u) ? "Cannot delete this account." : "Delete User"}
                      >
                        {deletingUserId === u.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete
                      </Button>
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </GlassCard>

      {/* Audit Logs */}
      <GlassCard>

        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Audit Logs
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">

          <table className="w-full text-left text-xs text-slate-300">

            <thead className="bg-slate-900 text-slate-400">

              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Action</th>
                <th className="p-3">Resource</th>
                <th className="p-3">Details</th>
              </tr>

            </thead>

            <tbody>

              {auditLogs.length === 0 ? (

                <tr>
                  <td colSpan={4} className="text-center p-6 text-slate-400">
                    No audit logs found
                  </td>
                </tr>

              ) : (

                auditLogs.map((log) => (

                  <tr key={log.id} className="border-b border-slate-800">

                    <td className="p-3">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString()
                        : "-"}
                    </td>

                    <td className="p-3">
                      {log.action ?? "Unknown"}
                    </td>

                    <td className="p-3">
                      {log.resource ?? "Unknown"}
                    </td>

                    <td className="p-3">
                      {log.details ?? "OK"}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </GlassCard>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 border border-rose-500/40 shadow-glow">
            <h3 className="text-lg font-bold text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" /> Delete User?
            </h3>
            <div className="text-xs text-slate-300 space-y-3 mb-6">
              <p>Are you sure you want to permanently delete this user?</p>
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 space-y-1">
                <div><span className="text-slate-500">Name:</span> <span className="font-bold text-white font-mono">{userToDelete.full_name}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-bold text-white font-mono">{userToDelete.email}</span></div>
              </div>
              <p className="text-rose-400/90 font-medium">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => { setDeleteModalOpen(false); setUserToDelete(null); }}>Cancel</Button>
              <Button type="button" variant="danger" className="bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={handleDeleteUser}>Delete User</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-glow border text-xs font-medium flex items-center gap-2 ${
              toastMessage.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default AdminPage;