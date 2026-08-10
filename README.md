# Buildr AI — Production-Ready AI Agent Platform (Groq LPUs)

A modular, full-stack AI Agent SaaS platform where users can create, configure, test, monitor, and deploy custom AI agents powered by **Groq LPU Models** (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `deepseek-r1-distill-llama-70b`, `mixtral-8x7b-32768`, `gemma2-9b-it`).

Equipped with function tools, RAG vector knowledge bases, visual node workflow DAGs, human approval gates, developer REST APIs, token telemetry, and evaluation suites.

---

## 1. Architecture Overview

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, React Flow node canvas.
- **Backend**: Python 3.13 FastAPI, Pydantic v2, Async SQLAlchemy ORM, SQLite / PostgreSQL vector support (`pgvector`), SSE streaming execution loop, JWT Authentication.
- **Groq Provider Engine**: Sub-second agentic inference via `groq` SDK / OpenAI-compatible endpoint with function tool schemas and smart fallback simulation mode.

---

## 2. Environment Setup

Copy `.env.example` to `.env` or configure the following environment variables:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
DATABASE_URL=sqlite+aiosqlite:///./agent_platform.db
SECRET_KEY=groq-agent-platform-super-secret-jwt-key-2026
DEFAULT_MODEL=llama-3.3-70b-versatile
```

Users can also dynamically set their own `GROQ_API_KEY` directly inside the platform's UI via the top navigation bar header.

---

## 3. Installation & Local Development

### Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### Frontend Setup (Vite React TS)
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- Web Application: `http://127.0.0.1:5173`

---

## 4. Platform Features

1. **Landing Page** (`/landing`): Hero overview, Groq model benchmarks, features grid, pricing matrix.
2. **Dashboard** (`/dashboard`): Real-time metrics for total agents, active conversations, tool calls, Groq token usage, and activity feed.
3. **Agent Creation Wizard** (`/agents`): 4-step wizard for configuring agent persona, Groq model, system prompts, tool selection, and safety rules.
4. **Chat Playground** (`/playground`): ChatGPT-style testing interface with side-by-side **Execution Inspector Drawer**, step-by-step latency, and real-time execution timeline traces.
5. **Tools Management** (`/tools`): Built-in function tools (Web Search, Math Calculator, Date/Time, File Reader/Writer, Code Execution, DB Query) and Custom HTTP API Builder with JSON schemas.
6. **RAG Knowledge Base** (`/knowledge`): Multi-format document parser (PDF, TXT, DOCX, CSV, MD, JSON), chunk index status, and vector similarity search test playground.
7. **Workflow Builder** (`/workflows`): Visual node DAG builder (Start ➔ Agent ➔ Knowledge Search ➔ Condition ➔ Tool ➔ Approval Gate ➔ End).
8. **Human Approvals** (`/approvals`): Authorization queue for sensitive operations (file writes, database mutations).
9. **Developer API & Keys** (`/api-keys`): API Key generator (`groq_agent_sk_...`) and endpoint publishing (`POST /api/v1/api_keys/v1/agents/{agent_id}/run`) with cURL code generator.
10. **Observability** (`/observability`): Token throughput charts and timeline trace logs.
11. **Agent Evaluation Studio** (`/evaluations`): Automated test suite benchmark runner scoring tool accuracy and response metrics.
12. **Admin Control Panel** (`/admin`): Platform health, user/agent counts, and security audit log trail.

---

## 5. Deployment Instructions

### Docker Production Setup
The architecture is Docker-ready:
```bash
docker-compose up --build -d
```
- PostgreSQL with `pgvector` enabled for vector indexing.
- Redis for caching & background task queues.
- FastAPI backend served via Uvicorn workers.
- Vite frontend compiled to production static assets served via NGINX.
