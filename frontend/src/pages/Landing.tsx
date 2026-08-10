import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Zap, Cpu, Wrench, Shield, ArrowRight, Play, CheckCircle2, Terminal, Code, Sparkles, Layers, Database } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const models = [
    { name: 'Llama 3.3 70B', speed: '1,200 tok/s', context: '128K', badge: 'Flagship Reasoning & Coding' },
    { name: 'DeepSeek R1 Distill', speed: '980 tok/s', context: '128K', badge: 'Deep Mathematical Logic' },
    { name: 'Llama 3.1 8B', speed: '2,500 tok/s', context: '128K', badge: 'Ultra-Fast Sub-Second' },
    { name: 'Mixtral 8x7B', speed: '1,100 tok/s', context: '32K', badge: 'High Throughput MoE' }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* Top Header */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            Buildr<span className="text-purple-400">AI</span>
          </span>
        </div>
        <div className="flex items-center space-x-6 text-xs font-medium text-slate-300">
          <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
          <a href="#models" className="hover:text-purple-400 transition-colors">Groq LPU Models</a>
          <a href="#workflow" className="hover:text-purple-400 transition-colors">Visual Workflows</a>
          <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a>
          <Link to="/auth?mode=login" className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all text-white">
            Log In
          </Link>
          <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 flex items-center space-x-1.5 transition-all">
            <span>Build Your AI Agent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-8 pt-20 pb-16 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Powered by Groq LPUs & Llama 3.3 70B</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">Sub-Second Agentic Inference</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto">
          Build & Deploy Production-Ready <br />
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            AI Agents with Groq Speed
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Create, configure, test, and publish custom AI agents equipped with tools, RAG knowledge bases, visual node workflows, human approval gates, and production REST APIs.
        </p>

        <div className="flex items-center justify-center space-x-4 pt-4">
          <Link
            to="/dashboard"
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-purple-600/30 flex items-center space-x-2 glow-purple transition-all"
          >
            <Bot className="w-5 h-5" />
            <span>Build Your AI Agent</span>
          </Link>
          <Link
            to="/playground"
            className="px-6 py-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80 text-white font-semibold text-sm flex items-center space-x-2 transition-all"
          >
            <Play className="w-4 h-4 text-purple-400 fill-purple-400" />
            <span>Try Live Demo</span>
          </Link>
        </div>

        {/* Live Terminal Agent Workflow Mock */}
        <div id="workflow" className="mt-12 text-left max-w-4xl mx-auto glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs font-mono text-slate-400 ml-2">Developer Assistant — Groq Execution Pipeline</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
              <Zap className="w-3 h-3 fill-emerald-400" />
              <span>180ms Latency</span>
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="text-slate-400">
              <span className="text-purple-400">user@buildr:~$</span> Analyze math formula: 42 * 18 + 150 & verify customer #101
            </div>
            <div className="pl-4 border-l-2 border-purple-500/50 space-y-2 py-1">
              <div className="text-slate-300 flex items-center space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">REASONING</span>
                <span>Agent selected tools: <code className="text-amber-300">[calculator, http_request]</code></span>
              </div>
              <div className="text-slate-300 flex items-center space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">TOOL RUN</span>
                <span>calculator(42 * 18 + 150) ➔ <span className="text-emerald-400">906</span></span>
              </div>
              <div className="text-slate-300 flex items-center space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">TOOL RUN</span>
                <span>get_customer(id=101) ➔ <span className="text-emerald-400">HTTP 200 OK</span></span>
              </div>
              <div className="text-emerald-300 pt-1">
                <strong>Agent Response:</strong> The math calculation yields 906. Customer #101 verified successfully in 145ms.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Groq Model Benchmarks Grid */}
      <section id="models" className="py-16 px-8 max-w-6xl mx-auto space-y-8 border-t border-slate-800/80">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Supported Groq LPU Models</h2>
          <p className="text-xs text-slate-400">Instant model switching with sub-second execution speeds</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {models.map((m, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <Cpu className="w-6 h-6 text-purple-400" />
                <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  {m.speed}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{m.name}</h3>
                <p className="text-[11px] text-purple-300 font-mono mt-0.5">{m.badge}</p>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                <span>Context Window</span>
                <span className="font-mono text-slate-200">{m.context}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Platform Features Grid */}
      <section id="features" className="py-16 px-8 max-w-6xl mx-auto space-y-12 border-t border-slate-800/80">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Full-Stack SaaS Platform Architecture</h2>
          <p className="text-sm text-slate-400">Everything needed to design, run, and inspect enterprise AI agents</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Tools & Custom APIs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equip agents with Web Search, Code Runner, Math Evaluator, and custom REST HTTP API tools with JSON schema parameters.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">RAG Knowledge Base</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload PDF, TXT, DOCX, CSV, Markdown, and JSON documents. Vector embedding pipeline indexing chunks for similarity retrieval.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Visual Workflow Builder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag-and-drop node graph canvas (Start ➔ Agent ➔ Knowledge Search ➔ Condition ➔ Tool ➔ Approval Gate ➔ End).
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Human Approval Gates</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure strict permissions (READ, WRITE, EXECUTE, DATABASE, DEPLOY). Dangerous write actions trigger human approval queue.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Developer REST API</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Publish agents as REST endpoints (<code className="text-purple-300">POST /v1/agents/&#123;id&#125;/run</code>) with API key authorization and rate limits.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Evaluation & Benchmarks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create automated test cases, evaluate model tool accuracy, response scoring, latency distribution, and token costs.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="py-16 px-8 max-w-6xl mx-auto space-y-8 border-t border-slate-800/80">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Developer & Enterprise Pricing</h2>
          <p className="text-xs text-slate-400">Transparent pricing for scaling AI agent operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Developer Free</h3>
              <div className="text-3xl font-extrabold text-white">$0 <span className="text-xs font-normal text-slate-400">/ mo</span></div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Up to 3 Active Agents</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Groq Llama 3.3 70B Access</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Built-in Tools & RAG Base</span></li>
              </ul>
            </div>
            <Link to="/dashboard" className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center text-xs font-semibold text-white hover:bg-slate-700">
              Start Free
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-6 flex flex-col justify-between border-purple-500/50 glow-purple relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-purple-600 text-[10px] font-bold text-white">
              POPULAR
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Pro Studio</h3>
              <div className="text-3xl font-extrabold text-white">$49 <span className="text-xs font-normal text-slate-400">/ mo</span></div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Unlimited AI Agents</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Custom Groq API Key</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Visual Workflow Builder</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>REST API & Key Generation</span></li>
              </ul>
            </div>
            <Link to="/dashboard" className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-center text-xs font-semibold text-white shadow-lg shadow-purple-600/30">
              Upgrade to Pro
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Enterprise</h3>
              <div className="text-3xl font-extrabold text-white">Custom</div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Dedicated Groq LPU Clusters</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Human Approval Audit Trails</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>On-Prem / Private VPC</span></li>
              </ul>
            </div>
            <a href="mailto:enterprise@buildr.ai" className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center text-xs font-semibold text-white hover:bg-slate-700">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 max-w-6xl mx-auto w-full mt-auto">
        <div className="flex items-center space-x-2 text-slate-300">
          <Bot className="w-4 h-4 text-purple-400" />
          <span className="font-bold">BuildrAI Studio</span>
          <span>© 2026 Emergent Agent Platform</span>
        </div>
        <div className="flex items-center space-x-6 text-slate-400">
          <span>Groq LPU Engine</span>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Documentation</span>
        </div>
      </footer>
    </div>
  );
};
