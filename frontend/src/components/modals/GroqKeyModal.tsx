import React, { useState } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GroqKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroqKeyModal: React.FC<GroqKeyModalProps> = ({ isOpen, onClose }) => {
  const { user, updateGroqKey } = useAuth();
  const [apiKey, setApiKey] = useState(user?.groq_api_key || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateGroqKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Zap className="w-5 h-5 fill-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Groq API Key Settings</h3>
              <p className="text-xs text-slate-400">Power your agents with Llama 3.3 70B & DeepSeek R1</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>GROQ_API_KEY</span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center space-x-1"
              >
                <span>Get Free Key from Groq</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Downtime Smart Fallback</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              If left blank, the platform automatically utilizes simulated reasoning turns so you can test all agent features, tool calls, and workflows.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
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
                  <Key className="w-4 h-4" />
                  <span>Save Groq API Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
