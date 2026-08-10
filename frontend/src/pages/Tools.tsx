import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Globe, Calculator, Calendar, FileText, Code2, Database, Shield, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { Tool } from '../types';

export const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'get_customer',
    display_name: 'Get Customer Record',
    description: 'Fetch customer profile details by customer_id from external API.',
    category: 'custom',
    http_method: 'GET',
    endpoint_url: '/api/customers/{id}',
    auth_type: 'none',
    parameters_schema: { customer_id: 'string' },
    required_permission: 'EXECUTE'
  });

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const resp = await apiClient.get('/tools');
      setTools(resp.data);
    } catch (err) {
      console.error('Error loading tools:', err);
    }
  };

  const handleCreateCustomTool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/tools', formData);
      setIsModalOpen(false);
      await loadTools();
    } catch (err: any) {
      alert('Error creating tool: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (confirm('Delete this custom tool?')) {
      await apiClient.delete(`/tools/${id}`);
      await loadTools();
    }
  };

  const getToolIcon = (name: string) => {
    if (name.includes('web')) return Globe;
    if (name.includes('calc')) return Calculator;
    if (name.includes('date')) return Calendar;
    if (name.includes('file')) return FileText;
    if (name.includes('db')) return Database;
    if (name.includes('code')) return Code2;
    return Wrench;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-purple-400" />
            <span>Tools & Integrations Management</span>
          </h1>
          <p className="text-xs text-slate-400">Manage built-in function tools and construct custom HTTP API endpoints</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-600/20 flex items-center space-x-2 transition-all glow-purple"
        >
          <Plus className="w-4 h-4" />
          <span>Define Custom Tool</span>
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map(tool => {
          const Icon = getToolIcon(tool.name);
          return (
            <div
              key={tool.id}
              className="glass-card rounded-2xl p-5 space-y-4 flex flex-col justify-between border border-slate-800 hover:border-purple-500/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tool.is_builtin
                        ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                        : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {tool.is_builtin ? 'Built-in Tool' : 'Custom HTTP Tool'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white">{tool.display_name}</h3>
                  <p className="text-[11px] font-mono text-purple-400 mt-0.5">{tool.name}</p>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{tool.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Req Permission: <code className="text-amber-400">{tool.required_permission || 'EXECUTE'}</code></span>
                {!tool.is_builtin && (
                  <button
                    onClick={() => handleDeleteTool(tool.id)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                    title="Delete Tool"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Custom Tool Creation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">Define Custom HTTP API Tool</h3>
            <form onSubmit={handleCreateCustomTool} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Tool Code Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">HTTP Method</label>
                  <select
                    value={formData.http_method}
                    onChange={e => setFormData({ ...formData, http_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 mb-1">Endpoint URL</label>
                  <input
                    type="text"
                    value={formData.endpoint_url}
                    onChange={e => setFormData({ ...formData, endpoint_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/20"
                >
                  Create Tool Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
