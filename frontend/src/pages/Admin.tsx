import React, { useEffect, useState } from 'react';
import { ShieldCheck, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export const AdminPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const resp = await apiClient.get('/admin/overview');
      setOverview(resp.data);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Admin Platform Control Panel</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">System health, global audit log trails, security rules, and user management</p>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5 border border-emerald-300 dark:border-emerald-500/30 space-y-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Platform Status</span>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{overview?.system_health || 'Healthy'}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-orange-300 dark:border-orange-500/30 space-y-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Groq LPU Engine</span>
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400 flex items-center space-x-2">
            <Zap className="w-5 h-5 fill-orange-400 text-amber-500" />
            <span>Operational</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total System Users</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{overview?.users_count || 1}</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total System Agents</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{overview?.agents_count || 1}</div>
        </div>
      </div>

      {/* Audit Log Trail */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 font-mono text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Platform Audit Trail Logs</span>
        </h3>

        <div className="space-y-2">
          {overview?.audit_logs ? (
            overview.audit_logs.map((log: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-purple-700 dark:text-purple-400 font-bold">[{log.timestamp}]</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">{log.event}</span>
                </div>
                <div className="flex items-center space-x-4 text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400">{log.user}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500">Loading audit trail...</p>
          )}
        </div>
      </div>
    </div>
  );
};
