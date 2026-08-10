import asyncio
import os
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, inspect
from app.core.config import settings
from app.core.database import Base
from app.models.all_models import (
    User, Agent, Tool, KnowledgeBase, Document, DocumentChunk,
    Conversation, Message, AgentToolConfig, AgentKnowledgeBase,
    AgentExecution, ToolExecution, ApprovalRequest, ApiKey
)

async def test_and_migrate():
    pg_url = settings.DATABASE_URL
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif pg_url.startswith("postgresql://") and not pg_url.startswith("postgresql+asyncpg://"):
        pg_url = pg_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if "?" in pg_url:
        base_part, query_part = pg_url.split("?", 1)
        params = [p for p in query_part.split("&") if not p.startswith("pgbouncer") and not p.startswith("supa")]
        pg_url = base_part + ("?" + "&".join(params) if params else "")

    print(f"[+] Connecting to Supabase PostgreSQL at: {pg_url.split('@')[-1] if '@' in pg_url else pg_url}")

    pg_engine = create_async_engine(pg_url, echo=False)
    pg_session_factory = async_sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)

    # 1. Create all Tables in Supabase Postgres
    print("[+] Creating table schemas in Supabase PostgreSQL...")
    async with pg_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[SUCCESS] Table schemas created successfully in Supabase!")

    # 2. Check if local SQLite database exists for data migration
    sqlite_path = "agent_platform.db"
    if os.path.exists(sqlite_path):
        print(f"[+] Found local SQLite database at {sqlite_path}. Migrating records to Supabase...")
        sqlite_engine = create_async_engine(f"sqlite+aiosqlite:///{sqlite_path}", echo=False)
        sqlite_session_factory = async_sessionmaker(sqlite_engine, class_=AsyncSession, expire_on_commit=False)

        async with sqlite_session_factory() as s_db, pg_session_factory() as p_db:
            # Migrate Users
            users = (await s_db.execute(select(User))).scalars().all()
            for u in users:
                existing = (await p_db.execute(select(User).where(User.id == u.id))).scalar_one_or_none()
                if not existing:
                    p_db.add(User(
                        id=u.id, name=u.name, email=u.email,
                        hashed_password=u.hashed_password, is_admin=u.is_admin,
                        groq_api_key=u.groq_api_key, openrouter_api_key=u.openrouter_api_key,
                        created_at=u.created_at
                    ))
            await p_db.commit()
            print(f"   -> Migrated {len(users)} users")

            # Migrate Tools
            tools = (await s_db.execute(select(Tool))).scalars().all()
            for t in tools:
                existing = (await p_db.execute(select(Tool).where(Tool.id == t.id))).scalar_one_or_none()
                if not existing:
                    p_db.add(Tool(
                        id=t.id, name=t.name, display_name=t.display_name,
                        description=t.description, is_builtin=t.is_builtin,
                        category=t.category, http_method=t.http_method,
                        endpoint_url=t.endpoint_url, auth_type=t.auth_type,
                        parameters_schema=t.parameters_schema, required_permission=t.required_permission
                    ))
            await p_db.commit()
            print(f"   -> Migrated {len(tools)} tools")

            # Migrate Agents
            agents = (await s_db.execute(select(Agent))).scalars().all()
            for a in agents:
                existing = (await p_db.execute(select(Agent).where(Agent.id == a.id))).scalar_one_or_none()
                if not existing:
                    p_db.add(Agent(
                        id=a.id, user_id=a.user_id, name=a.name, description=a.description,
                        avatar=a.avatar, category=a.category, provider=a.provider,
                        model_name=a.model_name, temperature=a.temperature,
                        max_tokens=a.max_tokens, system_instructions=a.system_instructions,
                        behavior_rules=a.behavior_rules, response_style=a.response_style,
                        safety_rules=a.safety_rules, permissions=a.permissions,
                        memory_enabled=a.memory_enabled, is_active=a.is_active,
                        is_published=a.is_published, created_at=a.created_at
                    ))
            await p_db.commit()
            print(f"   -> Migrated {len(agents)} agents")

            # Migrate Knowledge Bases
            kbs = (await s_db.execute(select(KnowledgeBase))).scalars().all()
            for k in kbs:
                existing = (await p_db.execute(select(KnowledgeBase).where(KnowledgeBase.id == k.id))).scalar_one_or_none()
                if not existing:
                    p_db.add(KnowledgeBase(
                        id=k.id, user_id=k.user_id, name=k.name, description=k.description,
                        total_documents=k.total_documents, total_chunks=k.total_chunks,
                        created_at=k.created_at
                    ))
            await p_db.commit()
            print(f"   -> Migrated {len(kbs)} knowledge bases")

            # Migrate Documents & Chunks
            docs = (await s_db.execute(select(Document))).scalars().all()
            for d in docs:
                existing = (await p_db.execute(select(Document).where(Document.id == d.id))).scalar_one_or_none()
                if not existing:
                    p_db.add(Document(
                        id=d.id, knowledge_base_id=d.knowledge_base_id, filename=d.filename,
                        file_type=d.file_type, file_size=d.file_size, status=d.status,
                        chunk_count=d.chunk_count, created_at=getattr(d, 'uploaded_at', getattr(d, 'created_at', None))
                    ))
            await p_db.commit()

            chunks = (await s_db.execute(select(DocumentChunk))).scalars().all()
            for c in chunks:
                existing = (await p_db.execute(select(DocumentChunk).where(DocumentChunk.id == c.id))).scalar_one_or_none()
                if not existing:
                    p_db.add(DocumentChunk(
                        id=c.id, document_id=c.document_id, chunk_index=c.chunk_index,
                        content=c.content, embedding_json=c.embedding_json
                    ))
            await p_db.commit()
            print(f"   -> Migrated {len(docs)} documents & {len(chunks)} document chunks")

        await sqlite_engine.dispose()

    print("[SUCCESS] Supabase PostgreSQL DB migration completed successfully!")
    await pg_engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_and_migrate())
