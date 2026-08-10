import React, { useEffect, useState } from 'react';
import { CheckSquare, Play, Plus, Award, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { Agent, TestCaseItem } from '../types';

export const EvaluationsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCaseItem[]>([]);
  const [evalResults, setEvalResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const resp = await apiClient.get('/agents');
      setAgents(resp.data);
      if (resp.data.length > 0) {
        setSelectedAgentId(resp.data[0].id);
        loadTestCases(resp.data[0].id);
      }
    } catch (err) {
      console.error('Error loading agents:', err);
    }
  };

  const loadTestCases = async (agentId: string) => {
    try {
      const resp = await apiClient.get(`/evaluations/${agentId}/test-cases`);
      setTestCases(resp.data);
      setEvalResults(null);
    } catch (err) {
      console.error('Error loading test cases:', err);
    }
  };

  const handleAgentChange = (id: string) => {
    setSelectedAgentId(id);
    loadTestCases(id);
  };

  const handleRunAllEvals = async () => {
    if (!selectedAgentId || isRunning) return;
    setIsRunning(true);
    try {
      const resp = await apiClient.post(`/evaluations/${selectedAgentId}/run-all`);
      setEvalResults(resp.data);
    } catch (err) {
      console.error('Error running evals:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-purple-400" />
            <span>Agent Evaluation Studio</span>
          </h1>
          <p className="text-xs text-slate-400">Benchmark agent tool selection accuracy, response quality, and latency metrics</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedAgentId}
            onChange={e => handleAgentChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <button
            onClick={handleRunAllEvals}
            disabled={isRunning}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-600/20 flex items-center space-x-1.5 glow-purple"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isRunning ? 'Benchmarking...' : 'Run Benchmark Suite'}</span>
          </button>
        </div>
      </div>

      {/* Summary Scorecard if run completed */}
      {evalResults && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card rounded-2xl p-5 border border-purple-500/40 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold">Average Accuracy Score</span>
            <div className="text-3xl font-extrabold text-purple-400">{evalResults.average_score} / 100</div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-emerald-500/40 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold">Tests Passed</span>
            <div className="text-3xl font-extrabold text-emerald-400">{evalResults.passed_tests} / {evalResults.total_tests}</div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-amber-500/40 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold">Model Evaluated</span>
            <div className="text-sm font-bold text-amber-300 font-mono pt-2">llama-3.3-70b-versatile</div>
          </div>
        </div>
      )}

      {/* Test Cases Results List */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3">Evaluation Benchmark Suite</h3>

        {evalResults?.results ? (
          <div className="space-y-4 font-mono text-xs">
            {evalResults.results.map((res: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center space-x-2">
                    {res.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>{res.test_case_name}</span>
                  </span>
                  <span className="font-bold text-purple-400">Score: {res.score}%</span>
                </div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Actual Tools Called: <code className="text-amber-300">{res.actual_tools_called.join(', ') || 'None'}</code>
                </div>
                <p className="text-[11px] text-slate-400 font-sans line-clamp-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {res.actual_response}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6 text-center">Click "Run Benchmark Suite" to evaluate agent performance metrics against test cases.</p>
        )}
      </div>
    </div>
  );
};
