import React, { useState } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck, Zap, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GroqKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroqKeyModal: React.FC<GroqKeyModalProps> = ({ isOpen, onClose }) => {
  const { user, updateApiKeys } = useAuth();
  const [groqKey, setGroqKey] = useState(user?.groq_api_key || '');
  const [openrouterKey, setOpenrouterKey] = useState(user?.openrouter_api_key || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateApiKeys(groqKey.trim(), openrouterKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#111827] dark:bg-[#111827] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100 dark:text-slate-100 light:text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Key className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Provider API Keys Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure Groq LPU and OpenRouter model credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 dark:hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Groq LPU Key Input */}
          <div className="p-4 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Groq LPU Engine Key</span>
              </div>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
              >
                <span>Get Groq Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono shadow-sm"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Powers Llama 3.3 70B, DeepSeek R1 70B, Mixtral 8x7B, and Gemma 2 9B.
            </p>
          </div>

          {/* OpenRouter API Key Input */}
          <div className="p-4 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">OpenRouter Network Key</span>
              </div>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <span>Get OpenRouter Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono shadow-sm"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Powers Nemotron 3 Ultra (free 1M context), Laguna S 2.1, Ling 3.0, Gemma 4, and Free Models Auto-Router.
            </p>
          </div>

          {/* Security & Fallback Note */}
          <div className="p-3 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Multi-Provider Resilient Runtime</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              API keys are stored securely in your workspace session. Zero-cost free tier models are prioritized automatically.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center space-x-2 shadow-lg shadow-purple-600/20"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 text-white" />
                  <span>Save Provider API Keys</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
