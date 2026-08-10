import React, { useEffect, useState } from 'react';
import { GitFork, Play, Save, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { Agent } from '../types';

export const WorkflowBuilderPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [workflowNodes, setWorkflowNodes] = useState<any[]>([]);
  const [workflowEdges, setWorkflowEdges] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testInput, setTestInput] = useState('Analyze system login logs and verify credentials');
  const [executionResult, setExecutionResult] = useState<any>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const resp = await apiClient.get('/agents');
      setAgents(resp.data);
      if (resp.data.length > 0) {
        setSelectedAgentId(resp.data[0].id);
        loadWorkflow(resp.data[0].id);
      }
    } catch (err) {
      console.error('Error loading agents for workflow:', err);
    }
  };

  const loadWorkflow = async (agentId: string) => {
    try {
      const resp = await apiClient.get(`/workflows/${agentId}`);
      setWorkflowNodes(resp.data.nodes || []);
      setWorkflowEdges(resp.data.edges || []);
      setExecutionResult(null);
    } catch (err) {
      console.error('Error loading workflow:', err);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    loadWorkflow(agentId);
  };

  const handleSaveWorkflow = async () => {
    if (!selectedAgentId) return;
    try {
      await apiClient.post(`/workflows/${selectedAgentId}`, {
        nodes: workflowNodes,
        edges: workflowEdges
      });
      alert('Workflow DAG layout saved successfully!');
    } catch (err) {
      alert('Error saving workflow: ' + err);
    }
  };

  const handleRunWorkflow = async () => {
    if (!selectedAgentId || isRunning) return;
    setIsRunning(true);
    try {
      const resp = await apiClient.post(`/workflows/${selectedAgentId}/run`, {
        input_text: testInput
      });
      setExecutionResult(resp.data);
    } catch (err) {
      console.error('Error running workflow:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start': return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'agent': return 'border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300';
      case 'knowledge_search': return 'border-indigo-500/50 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400';
      case 'condition': return 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'tool': return 'border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400';
      case 'human_approval': return 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-400';
      case 'end': return 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default: return 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <GitFork className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Visual Agent Workflow Canvas</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">Design multi-node orchestration DAGs (Start ➔ Agent ➔ Knowledge Search ➔ Condition ➔ Tool ➔ Approval ➔ End)</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedAgentId}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm font-medium"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <button
            onClick={handleSaveWorkflow}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-xs flex items-center space-x-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Workflow</span>
          </button>

          <button
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-600/20 flex items-center space-x-1.5 glow-purple"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span className="text-white">{isRunning ? 'Executing...' : 'Run Test'}</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas Representation */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 min-h-[380px] flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">Node Flow Execution Pipeline</span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">5 Graph Nodes Connected</span>
        </div>

        {/* Node Flow Visual Grid */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-8">
          {workflowNodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              <div className={`p-4 rounded-2xl border-2 space-y-1 shadow-lg text-center min-w-[140px] ${getNodeColor(node.type)}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">{node.type}</span>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">{node.label}</span>
              </div>
              {idx < workflowNodes.length - 1 && (
                <div className="text-slate-400 dark:text-slate-600 font-bold text-sm">➔</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Test Prompt Input Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center space-x-3">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Workflow initial trigger input..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-sm"
          />
          <button
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-600/20"
          >
            Execute Workflow DAG
          </button>
        </div>
      </div>

      {/* Workflow Run Execution Inspector Log */}
      {executionResult && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Workflow DAG Execution Trace</span>
            </h3>
            <span className="text-purple-600 dark:text-purple-400 font-bold">Total Duration: {executionResult.duration_ms}ms</span>
          </div>

          <div className="space-y-2">
            <div className="text-slate-600 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-200">Final Output:</strong> {executionResult.final_output}
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Step Logs</span>
              {executionResult.execution_logs.map((log: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-purple-700 dark:text-purple-300 font-bold">Step {log.step}: {log.label}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{log.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
