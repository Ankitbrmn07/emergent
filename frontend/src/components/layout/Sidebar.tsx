import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Play,
  Wrench,
  BookOpen,
  GitFork,
  ShieldAlert,
  Code2,
  Activity,
  CheckSquare,
  ShieldCheck,
  Globe
} from 'lucide-react';

interface SidebarProps {
  onNewAgentClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewAgentClick }) => {
  const navItems = [
    { label: 'Landing Page', path: '/landing', icon: Globe },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Agents Studio', path: '/agents', icon: Bot },
    { label: 'Chat Playground', path: '/playground', icon: Play },
    { label: 'Tools Management', path: '/tools', icon: Wrench },
    { label: 'Knowledge Base (RAG)', path: '/knowledge', icon: BookOpen },
    { label: 'Workflow Builder', path: '/workflows', icon: GitFork },
    { label: 'Human Approvals', path: '/approvals', icon: ShieldAlert },
    { label: 'Developer API & Keys', path: '/api-keys', icon: Code2 },
    { label: 'Observability & Logs', path: '/observability', icon: Activity },
    { label: 'Agent Evaluations', path: '/evaluations', icon: CheckSquare },
    { label: 'Admin Panel', path: '/admin', icon: ShieldCheck }
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] flex flex-col justify-between p-4 h-[calc(100vh-4rem)] sticky top-16 transition-colors">
      <div className="space-y-4">
        {/* Create Agent CTA Button */}
        <button
          onClick={onNewAgentClick}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-600/25 flex items-center justify-center space-x-2 transition-all glow-purple"
        >
          <Bot className="w-4 h-4 text-white" />
          <span className="text-white">+ Create New Agent</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Groq LPU Info Footnote */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-900 dark:text-slate-200 flex items-center space-x-1">
          <span>Groq LPU Acceleration</span>
        </p>
        <p className="text-[10px] text-slate-500 leading-tight">
          Llama 3.3 70B & DeepSeek R1 models executing at ultra-low latency.
        </p>
      </div>
    </aside>
  );
};
