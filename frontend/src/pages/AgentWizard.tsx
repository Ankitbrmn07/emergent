import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Cpu, FileText, Wrench, Check, ArrowRight, ArrowLeft, Zap, Sparkles, Globe } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { Tool, KnowledgeBase, GroqModelInfo } from '../types';

export const AgentWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Available Data
  const [availableModels, setAvailableModels] = useState<GroqModelInfo[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: 'Developer Assistant',
    description: 'AI agent that helps developers analyze, debug, and write software projects.',
    avatar: 'code-bot',
    category: 'developer',
    provider: 'Groq',
    model_name: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4096,
    system_instructions: 'You are a professional software development assistant powered by Groq LPU Llama 3.3 70B. Analyze requests carefully before selecting tools. Maintain code clean principles.',
    behavior_rules: 'Test code logic with calculator/code runner tools before providing answers. Never delete files without explicit approval.',
    response_style: 'Professional & Concise',
    safety_rules: 'Never execute destructive database or filesystem operations without human authorization.',
    permissions: {
      READ: 'allowed',
      WRITE: 'approval_required',
      EXECUTE: 'allowed',
      DATABASE: 'approval_required',
      NETWORK: 'allowed',
      DEPLOY: 'denied'
    },
    memory_enabled: true,
    tool_ids: [] as string[],
    knowledge_base_ids: [] as string[]
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [modelRes, toolRes, kbRes] = await Promise.all([
          apiClient.get('/agents/models'),
          apiClient.get('/tools'),
          apiClient.get('/knowledge')
        ]);
        setAvailableModels(modelRes.data);
        setTools(toolRes.data);
        setKnowledgeBases(kbRes.data);

        // Preselect all built-in tools by default
        const defaultToolIds = toolRes.data.map((t: Tool) => t.id);
        const defaultKbIds = kbRes.data.map((k: KnowledgeBase) => k.id);
        setFormData(prev => ({
          ...prev,
          tool_ids: defaultToolIds,
          knowledge_base_ids: defaultKbIds
        }));
      } catch (err) {
        console.error('Failed loading wizard data:', err);
      }
    };
    loadInitialData();
  }, []);

  const handleToggleTool = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tool_ids: prev.tool_ids.includes(id)
        ? prev.tool_ids.filter(t => t !== id)
        : [...prev.tool_ids, id]
    }));
  };

  const handleToggleKb = (id: string) => {
    setFormData(prev => ({
      ...prev,
      knowledge_base_ids: prev.knowledge_base_ids.includes(id)
        ? prev.knowledge_base_ids.filter(k => k !== id)
        : [...prev.knowledge_base_ids, id]
    }));
  };

  const handleSubmit = async () => {
    try {
      const resp = await apiClient.post('/agents', formData);
      navigate(`/playground?agent=${resp.data.id}`);
    } catch (err) {
      alert('Error creating agent: ' + err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <span>Agent Creation Wizard</span>
          </h1>
          <p className="text-xs text-slate-400">Configure persona, Groq model, system instructions, tools, and permissions</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
          <span>Step {step} of 4</span>
        </div>
      </div>

      {/* Wizard Step Progress Tracker */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { num: 1, title: '1. Basic Info', icon: Bot },
          { num: 2, title: '2. Groq Model', icon: Cpu },
          { num: 3, title: '3. Instructions', icon: FileText },
          { num: 4, title: '4. Tools & Safety', icon: Wrench }
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-2.5 ${
                isActive
                  ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-lg shadow-purple-600/10'
                  : isDone
                  ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isActive ? 'bg-purple-600 text-white' : isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 text-emerald-400" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-medium truncate">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-white border-b border-slate-800/80 pb-2">Step 1 — Basic Agent Metadata</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Developer Assistant"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="developer">Developer & Software</option>
                  <option value="researcher">Web & Data Researcher</option>
                  <option value="customer_support">Customer Support & API</option>
                  <option value="analyst">Financial & Data Analyst</option>
                  <option value="general">General Assistant</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this agent is designed to accomplish..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Multi-Provider AI Model Selection */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800/80 pb-2 flex items-center justify-between">
              <span>Step 2 — Model & Provider Selection</span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-mono flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 fill-purple-400" />
                <span>Groq LPU & OpenRouter Network</span>
              </span>
            </h2>

            {/* Groq Models Group */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Groq LPU Engine Models</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableModels.filter(m => m.provider === 'Groq').map(m => (
                  <div
                    key={m.id}
                    onClick={() => setFormData({ ...formData, model_name: m.id, provider: m.provider })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                      formData.model_name === m.id
                        ? 'bg-purple-600/15 border-purple-500 shadow-lg shadow-purple-600/15'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>{m.name}</span>
                      </h4>
                      {m.recommended && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{m.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Context: {m.context_window.toLocaleString()} tokens</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FREE LPU</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* OpenRouter Models Group */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>OpenRouter Network Models (Including Free Tier)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableModels.filter(m => m.provider === 'OpenRouter').map(m => (
                  <div
                    key={m.id}
                    onClick={() => setFormData({ ...formData, model_name: m.id, provider: m.provider })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                      formData.model_name === m.id
                        ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-600/15'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>{m.name}</span>
                      </h4>
                      {m.is_free && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          FREE MODEL
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{m.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Context: {m.context_window.toLocaleString()} tokens</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{m.category || 'OpenRouter'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex justify-between">
                  <span>Temperature (Randomness)</span>
                  <span className="font-mono text-purple-400">{formData.temperature}</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={formData.temperature}
                  onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Max Token Limit</label>
                <select
                  value={formData.max_tokens}
                  onChange={e => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  <option value={2048}>2,048 Tokens</option>
                  <option value={4096}>4,096 Tokens (Standard)</option>
                  <option value={8192}>8,192 Tokens (Extended)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Instructions & Safety */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-white border-b border-slate-800/80 pb-2">Step 3 — System Instructions & Behavior Guidelines</h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">System Instructions (Core Prompt)</label>
              <textarea
                rows={5}
                value={formData.system_instructions}
                onChange={e => setFormData({ ...formData, system_instructions: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Behavior Rules</label>
                <textarea
                  rows={3}
                  value={formData.behavior_rules}
                  onChange={e => setFormData({ ...formData, behavior_rules: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Safety Constraints</label>
                <textarea
                  rows={3}
                  value={formData.safety_rules}
                  onChange={e => setFormData({ ...formData, safety_rules: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Tools & Knowledge Selection */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-white border-b border-slate-800/80 pb-2">Step 4 — Attach Tools & RAG Knowledge Bases</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">Available Agent Tools</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tools.map(t => {
                  const isChecked = formData.tool_ids.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTool(t.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                        isChecked ? 'bg-purple-600/15 border-purple-500/50 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                          <Wrench className="w-3.5 h-3.5 text-purple-400" />
                          <span>{t.display_name}</span>
                        </span>
                        <input type="checkbox" checked={isChecked} onChange={() => {}} className="accent-purple-500" />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {knowledgeBases.length > 0 && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-200 mb-2">Attached RAG Knowledge Bases</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {knowledgeBases.map(kb => {
                    const isChecked = formData.knowledge_base_ids.includes(kb.id);
                    return (
                      <div
                        key={kb.id}
                        onClick={() => handleToggleKb(kb.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isChecked ? 'bg-indigo-600/15 border-indigo-500/50 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs text-white">{kb.name}</p>
                          <p className="text-[10px] text-slate-400">{kb.total_documents} Docs | {kb.total_chunks} Chunks Indexed</p>
                        </div>
                        <input type="checkbox" checked={isChecked} onChange={() => {}} className="accent-indigo-500" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-600/20 flex items-center space-x-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-600/25 flex items-center space-x-2 glow-purple"
            >
              <Sparkles className="w-4 h-4" />
              <span>Deploy Agent to Playground</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
