import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { ApprovalItem } from '../types';

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    loadApprovals();
  }, [filter]);

  const loadApprovals = async () => {
    try {
      const resp = await apiClient.get(`/approvals?status=${filter}`);
      setApprovals(resp.data);
    } catch (err) {
      console.error('Error loading approvals:', err);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiClient.post(`/approvals/${id}/action`, { action });
      await loadApprovals();
    } catch (err) {
      alert('Error updating approval request: ' + err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span>Human Approval Center</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">Review and authorize sensitive agent operations (file modifications, production DB queries, deployment requests)</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-medium">
          {['pending', 'approved', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                filter === f ? 'bg-purple-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Approvals List */}
      <div className="space-y-4">
        {approvals.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 space-y-3 border border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Queue Empty</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">No {filter} human approval requests found in the pipeline.</p>
            </div>
          </div>
        ) : (
          approvals.map(app => (
            <div
              key={app.id}
              className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                    Tool: {app.tool_name}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {app.id.substring(0, 8)}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{app.action_description}</h3>
                <div className="text-[11px] font-mono text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  Parameters: {JSON.stringify(app.parameters)}
                </div>
              </div>

              {app.status === 'pending' ? (
                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => handleAction(app.id, 'reject')}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Action</span>
                  </button>
                  <button
                    onClick={() => handleAction(app.id, 'approve')}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span className="text-white">Approve & Continue</span>
                  </button>
                </div>
              ) : (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                    app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                  }`}
                >
                  {app.status}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
