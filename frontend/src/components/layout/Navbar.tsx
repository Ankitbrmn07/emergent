import React, { useState } from 'react';
import { Bot, Key, Zap, Sun, Moon, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onOpenGroqModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenGroqModal }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const hasGroqKey = Boolean(user?.groq_api_key && user.groq_api_key.trim().length > 5);
  const hasOpenRouterKey = Boolean(user?.openrouter_api_key && user.openrouter_api_key.trim().length > 5);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F17]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between transition-colors shadow-sm">
      {/* Brand Logo & Tag */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-slate-900 dark:text-white">
              Buildr<span className="text-purple-600 dark:text-purple-400">AI</span> Studio
            </span>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 rounded-full flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400 fill-amber-400" />
              <span>Multi-LLM Engine</span>
            </span>
          </div>
        </div>
      </div>

      {/* Theme Toggle & Multi-Provider API Key Badges */}
      <div className="flex items-center space-x-3">
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-purple-500 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center shadow-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600" />
          )}
        </button>

        {/* Multi-Provider Key Badge Button */}
        <button
          onClick={onOpenGroqModal}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-2 transition-all ${
            hasGroqKey && hasOpenRouterKey
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 glow-purple'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>
            {hasGroqKey && hasOpenRouterKey
              ? 'Groq & OpenRouter Active'
              : hasOpenRouterKey
              ? 'OpenRouter Key Active'
              : 'Configure Provider Keys'}
          </span>
          {(hasGroqKey || hasOpenRouterKey) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-all text-xs font-medium text-slate-900 dark:text-slate-200 shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-[10px]">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <span>{user?.name || 'Alex Developer'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={onOpenGroqModal}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center space-x-2"
              >
                <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>API Key Settings</span>
              </button>
              <button
                onClick={logout}
                className="w-full px-4 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
