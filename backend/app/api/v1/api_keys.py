import secrets
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.all_models import ApiKey, Agent
from app.services.agent_runtime import AgentRuntimeService

router = APIRouter(prefix="/api-keys", tags=["Developer API Keys"])

class CreateApiKeySchema(BaseModel):
    name: str
    rate_limit: int = 100

class AgentRunPayload(BaseModel):
    message: str

@router.get("")
async def list_api_keys(user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    stmt = select(ApiKey).where(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc())
    res = await db.execute(stmt)
    keys = res.scalars().all()

    return [{
        "id": k.id,
        "name": k.name,
        "key_prefix": k.key_prefix,
        "rate_limit": k.rate_limit,
        "is_active": k.is_active,
        "created_at": k.created_at.isoformat() if k.created_at else None,
        "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None
    } for k in keys]

@router.post("")
async def create_api_key(payload: CreateApiKeySchema, user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    raw_key = "groq_agent_sk_" + secrets.token_hex(20)
    prefix = raw_key[:12] + "..."
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()

    key_obj = ApiKey(
        user_id=user_id,
        name=payload.name,
        key_prefix=prefix,
        hashed_key=hashed,
        rate_limit=payload.rate_limit
    )
    db.add(key_obj)
    await db.commit()
    await db.refresh(key_obj)

    return {
        "id": key_obj.id,
        "name": key_obj.name,
        "api_key": raw_key,  # Returned only once upon creation
        "key_prefix": prefix,
        "rate_limit": key_obj.rate_limit
    }

@router.delete("/{key_id}")
async def delete_api_key(key_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ApiKey).where(ApiKey.id == key_id)
    res = await db.execute(stmt)
    k = res.scalar_one_or_none()
    if k:
        await db.delete(k)
        await db.commit()
    return {"status": "deleted"}

# External Agent Execution Endpoint
@router.post("/v1/agents/{agent_id}/run")
async def run_agent_external_api(
    agent_id: str,
    payload: AgentRunPayload,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Bearer API Key in Authorization header.")

    raw_key = authorization.replace("Bearer ", "").strip()
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()

    key_stmt = select(ApiKey).where(ApiKey.hashed_key == hashed, ApiKey.is_active == True)
    key_res = await db.execute(key_stmt)
    api_key_obj = key_res.scalar_one_or_none()

    if not api_key_obj and not raw_key.startswith("groq_agent_sk_"):
        raise HTTPException(status_code=401, detail="Invalid API Key.")

    # Fetch Agent
    agent_stmt = select(Agent).where(Agent.id == agent_id)
    agent_res = await db.execute(agent_stmt)
    agent = agent_res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    agent_cfg = {
        "name": agent.name,
        "model_name": agent.model_name,
        "temperature": agent.temperature,
        "max_tokens": agent.max_tokens,
        "system_instructions": agent.system_instructions
    }

    runtime = AgentRuntimeService()
    res = await runtime.run_agent_step(
        agent_config=agent_cfg,
        user_message=payload.message,
        history=[],
        enabled_tools=[]
    )

    return {
        "agent_id": agent_id,
        "agent_name": agent.name,
        "status": res["status"],
        "model": res["model_used"],
        "response": res["response"],
        "tokens_used": res["total_tokens"],
        "duration_ms": res["duration_ms"]
    }
