import React, { useEffect, useState } from 'react';
import { Code2, Key, Copy, Check, Trash2, Terminal } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { ApiKeyItem } from '../types';

export const ApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const resp = await apiClient.get('/api-keys');
      setKeys(resp.data);
    } catch (err) {
      console.error('Error loading API keys:', err);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const resp = await apiClient.post('/api-keys', { name: newKeyName, rate_limit: 100 });
      setGeneratedKey(resp.data.api_key);
      setNewKeyName('');
      await loadKeys();
    } catch (err) {
      alert('Error generating API key: ' + err);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (confirm('Revoke this API Key?')) {
      await apiClient.delete(`/api-keys/${id}`);
      await loadKeys();
    }
  };

  const curlSnippet = `curl -X POST http://localhost:8000/api/v1/api-keys/v1/agents/dev_assistant_agent_01/run \\
  -H "Authorization: Bearer ${generatedKey || 'groq_agent_sk_your_key_here'}" \\
  -H "Content-Type: application/json" \\
  -d '{ "message": "Analyze this code error: ZeroDivisionError" }'`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Developer API Keys & Endpoint Publishing</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">Publish your AI agent as an external REST API endpoint (<code className="text-purple-700 dark:text-purple-300">POST /api/v1/agents/&#123;id&#125;/run</code>)</p>
        </div>
      </div>

      {/* Generated Key Banner if just created */}
      {generatedKey && (
        <div className="p-5 rounded-2xl bg-purple-600/20 border border-purple-500/50 space-y-3 glow-purple">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>New API Key Generated — Save It Now</span>
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold">Won't be shown again</span>
          </div>
          <div className="flex items-center space-x-3 bg-slate-900 dark:bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
            <span className="flex-1 truncate">{generatedKey}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-sans text-xs flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Key Form & Keys List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 h-fit">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Generate New API Key</h3>
          <form onSubmit={handleCreateKey} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Key Name / Description</label>
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Backend Service"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20"
            >
              + Generate Key
            </button>
          </form>
        </div>

        {/* Existing Keys Table */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Active API Keys</h3>
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{k.name}</span>
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">{k.key_prefix}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{k.rate_limit} req/min</span>
                  <button onClick={() => handleDeleteKey(k.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* cURL Snippet Guide */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-300 font-sans font-bold border-b border-slate-200 dark:border-slate-800 pb-2">
          <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Integration cURL Snippet</span>
        </div>
        <pre className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-800 text-slate-200 dark:text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
          {curlSnippet}
        </pre>
      </div>
    </div>
  );
};
