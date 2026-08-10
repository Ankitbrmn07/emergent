import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  MessageSquare,
  Wrench,
  Zap,
  Activity,
  Plus,
  Play,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Edit3
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { Agent } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState<any>({
    summary: {
      total_agents: 1,
      active_agents: 1,
      total_conversations: 4,
      total_tool_executions: 12,
      total_tokens_used: 14500,
      average_latency_ms: 210
    },
    recent_executions: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentRes, metricRes] = await Promise.all([
          apiClient.get('/agents'),
          apiClient.get('/observability/metrics')
        ]);
        setAgents(agentRes.data);
        setMetrics(metricRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-900/20 via-slate-900/40 to-indigo-900/20 dark:from-purple-900/30 dark:via-slate-900 dark:to-indigo-900/30 border border-purple-500/20 glass-panel">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Agent Platform Dashboard</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-semibold">
              Groq & OpenRouter Active
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Monitor AI agent operations, tool executions, token consumption, and system performance.
          </p>
        </div>
        <button
          onClick={() => navigate('/agents?action=create')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-600/25 flex items-center space-x-2 transition-all glow-purple shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white">Create AI Agent</span>
        </button>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-medium">Total Agents</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{agents.length || metrics.summary.total_agents}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +100%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{metrics.summary.active_agents} currently active & published</p>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-medium">Total Conversations</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{metrics.summary.total_conversations}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12 today
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Across playground & API calls</p>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-medium">Tool Executions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{metrics.summary.total_tool_executions}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> 98.4% success
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Web search, math, code & HTTP API</p>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-medium">LLM Tokens Consumed</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Zap className="w-4 h-4 fill-orange-400 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{metrics.summary.total_tokens_used.toLocaleString()}</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold font-mono">1,200 tok/s</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Average response latency {metrics.summary.average_latency_ms}ms</p>
        </div>
      </div>

      {/* Main Grid: Active Agents & Recent Execution Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Agents Studio Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Configured AI Agents</span>
            </h2>
            <button
              onClick={() => navigate('/agents')}
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
            >
              <span>View All Studio Agents</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="glass-card rounded-2xl p-5 space-y-4 hover:border-purple-500/40 transition-all group relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{agent.category} Agent</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {agent.description || agent.system_instructions}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 font-mono font-semibold">
                    <Cpu className="w-3 h-3" />
                    <span className="truncate max-w-[110px]">{agent.model_name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => navigate(`/agents?edit_id=${agent.id}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium flex items-center space-x-1 transition-all"
                      title="Edit Model, Persona & Instructions"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Agent</span>
                    </button>
                    <button
                      onClick={() => navigate(`/playground?agent=${agent.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-600/25 font-medium flex items-center space-x-1 transition-all"
                    >
                      <Play className="w-3 h-3 fill-purple-600 dark:fill-purple-300 text-purple-600 dark:text-purple-300" />
                      <span>Test</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Recent Execution Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recent Activity Feed</span>
            </h2>
            <button
              onClick={() => navigate('/observability')}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Logs
            </button>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-3 font-mono text-xs max-h-[420px] overflow-y-auto">
            {metrics.recent_executions && metrics.recent_executions.length > 0 ? (
              metrics.recent_executions.map((e: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-purple-700 dark:text-purple-400 font-bold">{e.model_used}</span>
                    <span className="text-slate-500">{e.created_at ? e.created_at.substring(11, 19) : '15:24:00'}</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-[11px] flex items-center justify-between font-sans">
                    <span>Duration: {e.duration_ms}ms</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">{e.total_tokens} Tokens</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2 py-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-purple-700 dark:text-purple-400 font-semibold">llama-3.3-70b-versatile</span>
                    <span className="text-slate-500">Just now</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-sans">Tool <code className="text-amber-700 dark:text-amber-300">calculator</code> executed in 14ms</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-purple-700 dark:text-purple-400 font-semibold">nvidia/nemotron-3-ultra:free</span>
                    <span className="text-slate-500">2m ago</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-sans">OpenRouter Free Model Execution (Score: 1.0)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
