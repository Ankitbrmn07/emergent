import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.all_models import User, Agent, Tool, AgentToolConfig, KnowledgeBase, Document, DocumentChunk
from app.core.security import get_password_hash
from sqlalchemy import select

# Import Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.agents import router as agents_router
from app.api.v1.tools import router as tools_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.workflows import router as workflows_router
from app.api.v1.approvals import router as approvals_router
from app.api.v1.api_keys import router as api_keys_router
from app.api.v1.observability import router as observability_router
from app.api.v1.evaluations import router as evaluations_router
from app.api.v1.admin import router as admin_router
from app.api.v1.speech import router as speech_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-Ready AI Agent SaaS Platform powered by Groq LPU Models",
    version="1.0.0"
)

# Enable CORS for frontend Vite app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root_health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_STR
    }

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(agents_router, prefix=settings.API_V1_STR)
app.include_router(tools_router, prefix=settings.API_V1_STR)
app.include_router(knowledge_router, prefix=settings.API_V1_STR)
app.include_router(conversations_router, prefix=settings.API_V1_STR)
app.include_router(workflows_router, prefix=settings.API_V1_STR)
app.include_router(approvals_router, prefix=settings.API_V1_STR)
app.include_router(api_keys_router, prefix=settings.API_V1_STR)
app.include_router(observability_router, prefix=settings.API_V1_STR)
app.include_router(evaluations_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(speech_router, prefix=settings.API_V1_STR)

from sqlalchemy import select, text

@app.on_event("startup")
async def startup_event():
    try:
        # 1. Initialize Database Schemas
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN openrouter_api_key TEXT;"))
            except Exception:
                pass

        # 2. Seed Default Built-in Tools & Default Demo Agent
        async with AsyncSessionLocal() as db:
            # Seed Built-in Tools
            builtin_tools_data = [
                {"name": "web_search", "display_name": "Web Search", "description": "Search documentation, web pages, and developer guides.", "category": "search"},
                {"name": "calculator", "display_name": "Math Calculator", "description": "Perform exact mathematical operations and logical evaluations.", "category": "utility"},
                {"name": "date_time", "display_name": "Date & Time", "description": "Get current UTC timestamp and calendar metrics.", "category": "utility"},
                {"name": "file_reader", "display_name": "File Reader", "description": "Read file contents and code snippet files.", "category": "filesystem"},
                {"name": "file_writer", "display_name": "File Writer", "description": "Write code files or output reports to disk.", "category": "filesystem"},
                {"name": "json_parser", "display_name": "JSON Parser", "description": "Validate and extract JSON key-value schemas.", "category": "utility"},
                {"name": "http_request", "display_name": "HTTP Request", "description": "Execute external API GET/POST requests.", "category": "network"},
                {"name": "db_query", "display_name": "Database Query", "description": "Execute SQL queries against databases.", "category": "database"},
                {"name": "code_execution", "display_name": "Code Execution", "description": "Run Python code snippets in a safe isolated environment.", "category": "code"}
            ]

            tool_map = {}
            for t_data in builtin_tools_data:
                stmt = select(Tool).where(Tool.name == t_data["name"])
                res = await db.execute(stmt)
                t_obj = res.scalar_one_or_none()
                if not t_obj:
                    t_obj = Tool(
                        name=t_data["name"],
                        display_name=t_data["display_name"],
                        description=t_data["description"],
                        is_builtin=True,
                        category=t_data["category"]
                    )
                    db.add(t_obj)
                    await db.commit()
                    await db.refresh(t_obj)
                tool_map[t_data["name"]] = t_obj.id

            # Seed Default User
            u_stmt = select(User).where(User.email == "demo@emergent.ai")
            u_res = await db.execute(u_stmt)
            user = u_res.scalar_one_or_none()
            if not user:
                user = User(
                    id="default_user",
                    email="demo@emergent.ai",
                    name="Alex Developer",
                    hashed_password=get_password_hash("password123"),
                    is_admin=True,
                    groq_api_key="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",
                    openrouter_api_key="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"
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
            else:
                if not user.groq_api_key:
                    user.groq_api_key = "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"
                if not user.openrouter_api_key:
                    user.openrouter_api_key = "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"
                await db.commit()

            # Seed Default "Developer Assistant" Agent (Groq powered)
            a_stmt = select(Agent).where(Agent.name == "Developer Assistant")
            a_res = await db.execute(a_stmt)
            default_agent = a_res.scalar_one_or_none()
            if not default_agent:
                default_agent = Agent(
                    id="dev_assistant_agent_01",
                    user_id=user.id,
                    name="Developer Assistant",
                    description="AI agent that helps developers analyze, debug, write code, and search documentation.",
                    avatar="code-bot",
                    category="developer",
                    provider="Groq",
                    model_name="llama-3.3-70b-versatile",
                    temperature=0.7,
                    max_tokens=4096,
                    system_instructions="You are a professional software development assistant powered by Groq's LPU Llama 3.3 70B model. Analyze user requests carefully, choose the appropriate tools (Web Search, Code Execution, Math Calculator, File Reader), explain errors clearly, and maintain high code quality.",
                    behavior_rules="Always test code snippets mentally or with tools before providing answers. Ask for approval before writing files or deleting databases.",
                    response_style="Professional & Concise",
                    safety_rules="Never perform destructive system commands without human approval.",
                    permissions=json.dumps({
                        "READ": "allowed",
                        "WRITE": "approval_required",
                        "EXECUTE": "allowed",
                        "DATABASE": "approval_required",
                        "NETWORK": "allowed",
                        "DEPLOY": "denied"
                    })
                )
                db.add(default_agent)
                await db.commit()
                await db.refresh(default_agent)

                for tool_id in tool_map.values():
                    db.add(AgentToolConfig(agent_id=default_agent.id, tool_id=tool_id))
                await db.commit()

            # Seed Default "OpenRouter Nemotron Agent" (OpenRouter powered)
            or_stmt = select(Agent).where(Agent.name == "OpenRouter Nemotron Ultra")
            or_res = await db.execute(or_stmt)
            or_agent = or_res.scalar_one_or_none()
            if not or_agent:
                or_agent = Agent(
                    id="openrouter_nemotron_agent_02",
                    user_id=user.id,
                    name="OpenRouter Nemotron Ultra",
                    description="AI Agent powered by NVIDIA Nemotron 3 Ultra (free) via OpenRouter Network with 1,000,000 token context window.",
                    avatar="brain-bot",
                    category="researcher",
                    provider="OpenRouter",
                    model_name="nvidia/nemotron-3-ultra:free",
                    temperature=0.7,
                    max_tokens=4096,
                    system_instructions="You are a research & analysis agent powered by NVIDIA Nemotron 3 Ultra via OpenRouter. You specialize in deep reasoning, multi-document context analysis, web search, and tool execution.",
                    behavior_rules="Provide thorough structured answers using markdown formatting.",
                    response_style="Detailed & Analytical",
                    safety_rules="Maintain safety guidelines.",
                    permissions=json.dumps({
                        "READ": "allowed",
                        "WRITE": "approval_required",
                        "EXECUTE": "allowed",
                        "DATABASE": "approval_required",
                        "NETWORK": "allowed",
                        "DEPLOY": "denied"
                    })
                )
                db.add(or_agent)
                await db.commit()
                await db.refresh(or_agent)

                for tool_id in tool_map.values():
                    db.add(AgentToolConfig(agent_id=or_agent.id, tool_id=tool_id))
                await db.commit()

            # Seed Fish Audio Speech Agent
            fish_agent_stmt = select(Agent).where(Agent.id == "fish_audio_speech_agent_01")
            fish_res = await db.execute(fish_agent_stmt)
            if not fish_res.scalar_one_or_none():
                fish_agent = Agent(
                    id="fish_audio_speech_agent_01",
                    user_id=user.id,
                    name="Fish Audio Speech Assistant",
                    description="AI Agent powered by Fish Audio S2.1 Pro (free) via OpenRouter for speech synthesis and text-to-speech workflows.",
                    avatar="mic-bot",
                    category="speech_audio",
                    provider="OpenRouter",
                    model_name="fish-audio/s2.1-pro-free:free",
                    temperature=0.7,
                    max_tokens=4096,
                    system_instructions="You are a specialized speech & audio assistant powered by Fish Audio S2.1 Pro via OpenRouter. You process audio generation requests and speech synthesis instructions.",
                    behavior_rules="Provide clear, well-formatted speech outputs.",
                    response_style="Expressive & Natural",
                    safety_rules="Follow standard content safety rules.",
                    permissions=json.dumps({
                        "READ": "allowed",
                        "WRITE": "allowed",
                        "EXECUTE": "allowed",
                        "DATABASE": "allowed",
                        "NETWORK": "allowed",
                        "DEPLOY": "denied"
                    })
                )
                db.add(fish_agent)
                await db.commit()
            await db.refresh(default_agent)

            # Bind all built-in tools to default agent
            for tool_id in tool_map.values():
                db.add(AgentToolConfig(agent_id=default_agent.id, tool_id=tool_id))
            
            # Seed Default Knowledge Base
            kb_stmt = select(KnowledgeBase).where(KnowledgeBase.id == "default_kb_01")
            kb_res = await db.execute(kb_stmt)
            if not kb_res.scalar_one_or_none():
                kb = KnowledgeBase(
                    id="default_kb_01",
                    user_id=user.id,
                    name="Groq Architecture & API Docs",
                    description="Documentation for Groq LPUs, Llama 3.3 70B models, and agent function calling.",
                    total_documents=1,
                    total_chunks=3
                )
                db.add(kb)
                await db.commit()

                doc = Document(
                    id="doc_groq_01",
                    knowledge_base_id=kb.id,
                    filename="groq_agent_guide.md",
                    file_type="md",
                    file_size=1240,
                    status="indexed",
                    chunk_count=3
                )
                db.add(doc)
                await db.commit()

                chunks_texts = [
                    "Groq LPU (Language Processing Unit) is designed to provide ultra-fast inference speed for large language models like Llama 3.3 70B Versatile and DeepSeek R1.",
                    "Function calling on Groq allows agentic workflows to bind tools dynamically, executing web searches, python code sandboxes, and database queries in real-time.",
                    "RAG knowledge bases split uploaded documents into overlapping chunks, indexing vectors for semantic similarity retrieval during agent reasoning turns."
                ]

                for idx, ctext in enumerate(chunks_texts):
                    db.add(DocumentChunk(
                        document_id=doc.id,
                        chunk_index=idx,
                        content=ctext
                    ))

                await db.commit()

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Buildr AI - Groq AI Agent Platform API",
        "version": "1.0.0",
        "default_model": "llama-3.3-70b-versatile"
    }
