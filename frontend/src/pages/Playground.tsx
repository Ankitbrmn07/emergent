import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Wrench,
  Zap,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Activity,
  Copy,
  Check,
  Volume2,
  Edit3
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { Agent, Conversation, Message, ExecutionInspector } from '../types';

export const PlaygroundPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentIdParam = searchParams.get('agent');

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inspector, setInspector] = useState<ExecutionInspector | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initPlayground = async () => {
      try {
        const agentRes = await apiClient.get('/agents');
        setAgents(agentRes.data);

        if (agentRes.data.length > 0) {
          const target = agentIdParam ? agentRes.data.find((a: Agent) => a.id === agentIdParam) || agentRes.data[0] : agentRes.data[0];
          setSelectedAgent(target);
          await loadConversations(target.id);
        }
      } catch (err) {
        console.error('Failed initializing playground:', err);
      }
    };
    initPlayground();
  }, [agentIdParam]);

  const loadConversations = async (agentId: string) => {
    try {
      const resp = await apiClient.get(`/conversations?agent_id=${agentId}`);
      setConversations(resp.data);

      if (resp.data.length > 0) {
        setActiveConversation(resp.data[0]);
        await loadMessages(resp.data[0].id);
      } else {
        // Create new conversation
        const newConvResp = await apiClient.post('/conversations', { agent_id: agentId, title: 'Developer Test Session' });
        setActiveConversation(newConvResp.data);
        setConversations([newConvResp.data]);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const resp = await apiClient.get(`/conversations/${convId}/messages`);
      setMessages(resp.data);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSelectAgent = async (agent: Agent) => {
    setSelectedAgent(agent);
    await loadConversations(agent.id);
  };

  const handleNewConversation = async () => {
    if (!selectedAgent) return;
    try {
      const resp = await apiClient.post('/conversations', { agent_id: selectedAgent.id, title: `Test Session ${conversations.length + 1}` });
      setActiveConversation(resp.data);
      setConversations([resp.data, ...conversations]);
      setMessages([]);
      setInspector(null);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation || isGenerating) return;

    const userText = inputText.trim();
    setInputText('');
    setIsGenerating(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: 'temp_u_' + Date.now(),
      role: 'user',
      content: userText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const resp = await apiClient.post(`/conversations/${activeConversation.id}/messages`, { message: userText });
      const { message, execution_inspector } = resp.data;

      setMessages(prev => [...prev, message]);
      setInspector(execution_inspector);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: 'An execution error occurred while processing your request: ' + (err.response?.data?.detail || err.message),
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSpeakSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-4 overflow-hidden">
      {/* Left Sidebar: Conversations & Agent Select */}
      <div className="w-64 glass-panel rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 shrink-0">
        <div className="space-y-4">
          {/* Agent Switcher */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Active Agent</span>
              {selectedAgent && (
                <button
                  onClick={() => navigate(`/agents?edit_id=${selectedAgent.id}`)}
                  className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                  title="Edit agent model, persona & rules"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>Edit Config</span>
                </button>
              )}
            </div>
            <select
              value={selectedAgent?.id || ''}
              onChange={(e) => {
                const target = agents.find(a => a.id === e.target.value);
                if (target) handleSelectAgent(target);
              }}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-medium shadow-sm"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNewConversation}
            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <span>+ New Conversation</span>
          </button>

          {/* Conversation History */}
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-20rem)] pr-1">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">History</span>
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveConversation(c);
                  loadMessages(c.id);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium truncate transition-all ${
                  activeConversation?.id === c.id
                    ? 'bg-purple-600/20 border border-purple-500/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        {/* Model Spec Badge */}
        {selectedAgent && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 shadow-sm">
            <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 font-mono font-semibold">
              <Zap className="w-3.5 h-3.5 fill-orange-400" />
              <span>{selectedAgent.model_name}</span>
            </div>
            <p className="text-[10px] text-slate-500">Provider: {selectedAgent.provider || 'AI'} Engine</p>
          </div>
        )}
      </div>

      {/* Main Center Area: Chat Interface */}
      <div className="flex-1 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
        {/* Chat Top Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">{selectedAgent?.name || 'Developer Assistant'}</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">ReAct reasoning loop with function calling enabled</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
              Ready
            </span>
          </div>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto py-12">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 glow-purple">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Groq AI Agent Playground</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ask programming questions, evaluate math expressions, test custom HTTP tools, or run RAG vector queries.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs w-full pt-2">
                <button
                  onClick={() => setInputText('Analyze math formula: 42 * 18 + 150')}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 text-left text-slate-800 dark:text-slate-300 shadow-sm"
                >
                  <span className="text-purple-600 dark:text-purple-400 font-semibold block">Calculator Tool</span>
                  Calculate 42 * 18 + 150
                </button>
                <button
                  onClick={() => setInputText('Search docs for Groq function calling best practices')}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 text-left text-slate-800 dark:text-slate-300 shadow-sm"
                >
                  <span className="text-purple-600 dark:text-purple-400 font-semibold block">Web Search Tool</span>
                  Search Groq function docs
                </button>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-2 max-w-2xl ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Tool Calls Status Cards */}
                  {m.tool_calls && m.tool_calls.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {m.tool_calls.map((tc, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-purple-300 dark:border-purple-500/30 flex items-center justify-between text-[11px] font-mono shadow-sm">
                          <div className="flex items-center space-x-2">
                            <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="font-bold text-slate-900 dark:text-slate-200">{tc.tool_name}</span>
                            <span className="text-slate-400 dark:text-slate-500">|</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Execution Completed</span>
                          </div>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl relative group ${
                      m.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-600/20'
                        : 'bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-sm'
                    }`}
                  >
                    {m.content}

                    {m.role === 'assistant' && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleSpeakSpeech(m.content)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-700"
                          title="Listen with Fish Audio Speech S2.1"
                        >
                          <Volume2 className="w-3 h-3 text-purple-500" />
                        </button>
                        <button
                          onClick={() => handleCopyText(m.id, m.content)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700"
                          title="Copy message"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {m.latency_ms && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center space-x-2 px-1 font-mono">
                      <span>{m.latency_ms}ms</span>
                      <span>•</span>
                      <span>{m.tokens_used} tokens</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isGenerating && (
            <div className="flex gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 flex items-center space-x-2 animate-pulse shadow-sm">
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-400" />
                <span>Groq LPU Reasoning & Tool Selection...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${selectedAgent?.name || 'Agent'}...`}
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-600/20 disabled:opacity-40 flex items-center space-x-1.5 transition-all glow-purple"
          >
            <span className="text-white">Send</span>
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </form>
      </div>

      {/* Right Sidebar: Execution Inspector Drawer */}
      <div className="w-72 glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 overflow-y-auto space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Execution Inspector</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Live</span>
          </div>

          {inspector ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 block">Latency</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{inspector.duration_ms} ms</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 block">Tokens</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 text-xs">{inspector.tokens.total}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px] shadow-sm">
                <span className="text-slate-500 block text-[10px]">Groq Model</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{inspector.model}</span>
              </div>

              {/* Pending Human Approval Gate Alert */}
              {inspector.pending_approval && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-800 dark:text-amber-300 space-y-2 font-sans">
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Human Approval Required</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">{inspector.pending_approval.action_description}</p>
                </div>
              )}

              {/* Execution Timeline Tracing */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block font-sans">Execution Timeline</span>
                <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-800 pl-3 py-1">
                  {inspector.timeline.map((ev, idx) => (
                    <div key={idx} className="space-y-0.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-purple-700 dark:text-purple-300">{ev.event}</span>
                        <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-sans line-clamp-2">{ev.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Clock className="w-8 h-8 text-slate-400 dark:text-slate-700 mx-auto" />
              <p>Execute an agent message to inspect step-by-step latency, token cost, and tool timeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
