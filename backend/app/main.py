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

@app.on_event("startup")
async def startup_event():
    # 1. Initialize Database Schemas
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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
                is_admin=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

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

            # Bind all built-in tools to default agent
            for tool_id in tool_map.values():
                db.add(AgentToolConfig(agent_id=default_agent.id, tool_id=tool_id))
            
            # Seed Default Knowledge Base
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
