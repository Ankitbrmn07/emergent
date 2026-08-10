import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.core.config import settings
from app.models.all_models import Agent, AgentToolConfig, AgentKnowledgeBase, Tool

router = APIRouter(prefix="/agents", tags=["Agents"])

class CreateAgentSchema(BaseModel):
    name: str
    description: Optional[str] = None
    avatar: str = "bot-1"
    category: str = "developer"
    provider: str = "Groq"
    model_name: str = "llama-3.3-70b-versatile"
    temperature: float = 0.7
    max_tokens: int = 4096
    system_instructions: str
    behavior_rules: Optional[str] = None
    response_style: str = "Professional & Concise"
    safety_rules: Optional[str] = None
    permissions: Optional[Dict[str, str]] = None
    memory_enabled: bool = True
    tool_ids: List[str] = []
    knowledge_base_ids: List[str] = []

@router.get("/models")
async def get_available_models():
    return settings.AVAILABLE_GROQ_MODELS + settings.AVAILABLE_OPENROUTER_MODELS

@router.get("")
async def list_agents(user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    stmt = select(Agent).order_by(Agent.created_at.desc())
    res = await db.execute(stmt)
    agents = res.scalars().all()
    
    output = []
    for a in agents:
        perms = json.loads(a.permissions) if isinstance(a.permissions, str) else a.permissions
        output.append({
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "avatar": a.avatar,
            "category": a.category,
            "provider": a.provider,
            "model_name": a.model_name,
            "temperature": a.temperature,
            "max_tokens": a.max_tokens,
            "system_instructions": a.system_instructions,
            "behavior_rules": a.behavior_rules,
            "response_style": a.response_style,
            "safety_rules": a.safety_rules,
            "permissions": perms,
            "memory_enabled": a.memory_enabled,
            "is_active": a.is_active,
            "is_published": a.is_published,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return output

@router.get("/{agent_id}")
async def get_agent_detail(agent_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Agent).where(Agent.id == agent_id)
    res = await db.execute(stmt)
    a = res.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Agent not found.")
    
    # Load attached tools
    tool_stmt = select(AgentToolConfig).where(AgentToolConfig.agent_id == agent_id)
    tool_res = await db.execute(tool_stmt)
    bound_tools = tool_res.scalars().all()
    tool_ids = [bt.tool_id for bt in bound_tools]

    # Load attached knowledge bases
    kb_stmt = select(AgentKnowledgeBase).where(AgentKnowledgeBase.agent_id == agent_id)
    kb_res = await db.execute(kb_stmt)
    bound_kbs = kb_res.scalars().all()
    kb_ids = [bk.knowledge_base_id for bk in bound_kbs]

    perms = json.loads(a.permissions) if isinstance(a.permissions, str) else a.permissions
    return {
        "id": a.id,
        "name": a.name,
        "description": a.description,
        "avatar": a.avatar,
        "category": a.category,
        "provider": a.provider,
        "model_name": a.model_name,
        "temperature": a.temperature,
        "max_tokens": a.max_tokens,
        "system_instructions": a.system_instructions,
        "behavior_rules": a.behavior_rules,
        "response_style": a.response_style,
        "safety_rules": a.safety_rules,
        "permissions": perms,
        "memory_enabled": a.memory_enabled,
        "tool_ids": tool_ids,
        "knowledge_base_ids": kb_ids
    }

@router.post("")
async def create_agent(payload: CreateAgentSchema, user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    perms_str = json.dumps(payload.permissions or {
        "READ": "allowed",
        "WRITE": "approval_required",
        "EXECUTE": "allowed",
        "DATABASE": "approval_required",
        "NETWORK": "allowed",
        "DEPLOY": "denied"
    })

    agent = Agent(
        user_id=user_id,
        name=payload.name,
        description=payload.description,
        avatar=payload.avatar,
        category=payload.category,
        provider=payload.provider,
        model_name=payload.model_name,
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
        system_instructions=payload.system_instructions,
        behavior_rules=payload.behavior_rules,
        response_style=payload.response_style,
        safety_rules=payload.safety_rules,
        permissions=perms_str,
        memory_enabled=payload.memory_enabled
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    # Bind tools
    for tid in payload.tool_ids:
        db.add(AgentToolConfig(agent_id=agent.id, tool_id=tid))

    # Bind knowledge bases
    for kbid in payload.knowledge_base_ids:
        db.add(AgentKnowledgeBase(agent_id=agent.id, knowledge_base_id=kbid))

    await db.commit()
    return {"id": agent.id, "name": agent.name, "status": "created"}

@router.put("/{agent_id}")
async def update_agent(agent_id: str, payload: CreateAgentSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(Agent).where(Agent.id == agent_id)
    res = await db.execute(stmt)
    agent = res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    agent.name = payload.name
    agent.description = payload.description
    agent.avatar = payload.avatar
    agent.category = payload.category
    agent.provider = payload.provider
    agent.model_name = payload.model_name
    agent.temperature = payload.temperature
    agent.max_tokens = payload.max_tokens
    agent.system_instructions = payload.system_instructions
    agent.behavior_rules = payload.behavior_rules
    agent.response_style = payload.response_style
    agent.safety_rules = payload.safety_rules
    agent.permissions = json.dumps(payload.permissions) if payload.permissions else agent.permissions
    agent.memory_enabled = payload.memory_enabled

    # Rebind tool_ids
    if payload.tool_ids is not None:
        await db.execute(delete(AgentToolConfig).where(AgentToolConfig.agent_id == agent_id))
        for tid in payload.tool_ids:
            db.add(AgentToolConfig(agent_id=agent.id, tool_id=tid))

    # Rebind knowledge_base_ids
    if payload.knowledge_base_ids is not None:
        await db.execute(delete(AgentKnowledgeBase).where(AgentKnowledgeBase.agent_id == agent_id))
        for kbid in payload.knowledge_base_ids:
            db.add(AgentKnowledgeBase(agent_id=agent.id, knowledge_base_id=kbid))

    await db.commit()
    return {"id": agent.id, "name": agent.name, "status": "updated"}

@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Agent).where(Agent.id == agent_id)
    res = await db.execute(stmt)
    agent = res.scalar_one_or_none()
    if agent:
        await db.delete(agent)
        await db.commit()
    return {"status": "deleted"}
