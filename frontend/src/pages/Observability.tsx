import React, { useEffect, useState } from 'react';
import { Activity, Clock, Cpu, Zap, BarChart2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiClient } from '../services/apiClient';

export const ObservabilityPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const resp = await apiClient.get('/observability/metrics');
      setMetrics(resp.data);
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };

  const chartData = [
    { time: '09:00', tokens: 1200, latency: 180 },
    { time: '10:00', tokens: 2400, latency: 195 },
    { time: '11:00', tokens: 1800, latency: 210 },
    { time: '12:00', tokens: 3600, latency: 165 },
    { time: '13:00', tokens: 4800, latency: 145 },
    { time: '14:00', tokens: 3100, latency: 170 },
    { time: '15:00', tokens: 5400, latency: 150 }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Observability & Token Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400">Track execution latency distribution, token usage per Groq model, and tool call timelines</p>
        </div>
      </div>

      {/* Recharts Token Usage Chart */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <span>Token Throughput Over Time (Groq LPUs)</span>
          </h3>
          <span className="text-xs font-mono text-emerald-400 font-semibold">1,200 Tokens / sec</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="tokens" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#tokenGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Execution Timeline Feed */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 font-mono text-xs">
        <h3 className="font-bold text-sm text-white font-sans border-b border-slate-800 pb-3 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Execution Timeline Traces</span>
        </h3>

        <div className="space-y-3">
          {metrics?.recent_executions && metrics.recent_executions.length > 0 ? (
            metrics.recent_executions.map((e: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300 font-bold">Execution #{e.id.substring(0, 8)}</span>
                  <span className="text-emerald-400 font-bold">{e.duration_ms}ms</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between font-sans">
                  <span>Model: <code className="text-amber-300">{e.model_used}</code></span>
                  <span>Tokens: {e.total_tokens}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 py-4 text-center font-sans">No recent execution traces logged.</p>
          )}
        </div>
      </div>
    </div>
  );
};
