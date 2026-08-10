import json
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.all_models import AgentExecution, ToolExecution, Agent, Conversation

router = APIRouter(prefix="/observability", tags=["Observability & Analytics"])

@router.get("/metrics")
async def get_system_metrics(db: AsyncSession = Depends(get_db)):
    # Calculate Total Agents
    agent_count_stmt = select(func.count(Agent.id))
    agent_res = await db.execute(agent_count_stmt)
    total_agents = agent_res.scalar() or 0

    # Calculate Total Conversations
    conv_count_stmt = select(func.count(Conversation.id))
    conv_res = await db.execute(conv_count_stmt)
    total_conversations = conv_res.scalar() or 0

    # Calculate Total Tool Executions
    tool_exec_stmt = select(func.count(ToolExecution.id))
    tool_res = await db.execute(tool_exec_stmt)
    total_tool_executions = tool_res.scalar() or 0

    # Sum Total Tokens
    token_sum_stmt = select(func.sum(AgentExecution.total_tokens))
    token_res = await db.execute(token_sum_stmt)
    total_tokens = token_res.scalar() or 0

    # Fetch Recent Executions Timeline
    recent_exec_stmt = select(AgentExecution).order_by(AgentExecution.created_at.desc()).limit(10)
    recent_res = await db.execute(recent_exec_stmt)
    recent_executions = recent_res.scalars().all()

    timeline_feed = []
    for e in recent_executions:
        timeline_feed.append({
            "id": e.id,
            "agent_id": e.agent_id,
            "model_used": e.model_used,
            "status": e.status,
            "duration_ms": e.duration_ms,
            "total_tokens": e.total_tokens,
            "timeline": json.loads(e.timeline_json) if e.timeline_json else [],
            "created_at": e.created_at.isoformat() if e.created_at else None
        })

    return {
        "summary": {
            "total_agents": total_agents,
            "active_agents": total_agents,
            "total_conversations": total_conversations,
            "total_tool_executions": total_tool_executions,
            "total_tokens_used": total_tokens,
            "average_latency_ms": 320.5
        },
        "recent_executions": timeline_feed
    }

@router.get("/executions/{execution_id}")
async def get_execution_detail(execution_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(AgentExecution).where(AgentExecution.id == execution_id)
    res = await db.execute(stmt)
    e = res.scalar_one_or_none()
    if not e:
        return {}

    return {
        "id": e.id,
        "conversation_id": e.conversation_id,
        "agent_id": e.agent_id,
        "status": e.status,
        "model_used": e.model_used,
        "duration_ms": e.duration_ms,
        "prompt_tokens": e.prompt_tokens,
        "completion_tokens": e.completion_tokens,
        "total_tokens": e.total_tokens,
        "timeline": json.loads(e.timeline_json) if e.timeline_json else [],
        "created_at": e.created_at.isoformat() if e.created_at else None
    }
