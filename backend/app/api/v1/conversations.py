import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.models.all_models import Conversation, Message, Agent, Tool, AgentToolConfig, AgentKnowledgeBase, DocumentChunk, Document, AgentExecution, ToolExecution, ApprovalRequest
from app.services.agent_runtime import AgentRuntimeService

router = APIRouter(prefix="/conversations", tags=["Conversations"])

class CreateConversationSchema(BaseModel):
    agent_id: str
    title: Optional[str] = "New Conversation"

class SendMessageSchema(BaseModel):
    message: str

@router.get("")
async def list_conversations(agent_id: Optional[str] = None, user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    stmt = select(Conversation).order_by(Conversation.updated_at.desc())
    if agent_id:
        stmt = stmt.where(Conversation.agent_id == agent_id)
    res = await db.execute(stmt)
    convs = res.scalars().all()

    return [{
        "id": c.id,
        "agent_id": c.agent_id,
        "title": c.title,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None
    } for c in convs]

@router.post("")
async def create_conversation(payload: CreateConversationSchema, user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    conv = Conversation(
        user_id=user_id,
        agent_id=payload.agent_id,
        title=payload.title or "New Conversation"
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return {"id": conv.id, "title": conv.title, "agent_id": conv.agent_id}

@router.get("/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    res = await db.execute(stmt)
    msgs = res.scalars().all()

    output = []
    for m in msgs:
        tc = json.loads(m.tool_calls_json) if m.tool_calls_json else None
        output.append({
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "tokens_used": m.tokens_used,
            "latency_ms": m.latency_ms,
            "tool_calls": tc,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })
    return output

@router.post("/{conversation_id}/messages")
async def send_message_to_agent(
    conversation_id: str,
    payload: SendMessageSchema,
    user_id: str = "default_user",
    db: AsyncSession = Depends(get_db)
):
    # Fetch Conversation & Agent
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    agent_stmt = select(Agent).where(Agent.id == conv.agent_id)
    agent_res = await db.execute(agent_stmt)
    agent = agent_res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    # Save User Message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=payload.message
    )
    db.add(user_msg)
    await db.commit()

    # Load Message History
    hist_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    hist_res = await db.execute(hist_stmt)
    all_msgs = hist_res.scalars().all()
    history = [{"role": m.role, "content": m.content} for m in all_msgs[:-1]]

    # Load Enabled Tools
    tool_cfg_stmt = select(AgentToolConfig).where(AgentToolConfig.agent_id == agent.id, AgentToolConfig.is_enabled == True)
    tool_cfg_res = await db.execute(tool_cfg_stmt)
    bound_tools = tool_cfg_res.scalars().all()
    
    tools_list = []
    for bt in bound_tools:
        t_stmt = select(Tool).where(Tool.id == bt.tool_id)
        t_res = await db.execute(t_stmt)
        t_obj = t_res.scalar_one_or_none()
        if t_obj:
            tools_list.append({
                "id": t_obj.id,
                "name": t_obj.name,
                "display_name": t_obj.display_name,
                "description": t_obj.description,
                "is_builtin": t_obj.is_builtin,
                "http_method": t_obj.http_method,
                "endpoint_url": t_obj.endpoint_url,
                "parameters_schema": t_obj.parameters_schema
            })

    # Load Knowledge Base Chunks
    kb_stmt = select(AgentKnowledgeBase).where(AgentKnowledgeBase.agent_id == agent.id)
    kb_res = await db.execute(kb_stmt)
    bound_kbs = kb_res.scalars().all()
    
    knowledge_chunks = []
    for bk in bound_kbs:
        chunk_stmt = select(DocumentChunk, Document.filename).join(Document, DocumentChunk.document_id == Document.id).where(Document.knowledge_base_id == bk.knowledge_base_id)
        chunk_res = await db.execute(chunk_stmt)
        for chunk, fname in chunk_res.all():
            knowledge_chunks.append({
                "id": chunk.id,
                "filename": fname,
                "content": chunk.content,
                "embedding_json": chunk.embedding_json
            })

    # Agent Permissions
    perms = json.loads(agent.permissions) if isinstance(agent.permissions, str) else agent.permissions

    # Fetch User Keys
    u_stmt = select(User).where(User.id == user_id)
    u_res = await db.execute(u_stmt)
    curr_user = u_res.scalar_one_or_none()

    # Build Agent Config Dict
    agent_config = {
        "id": agent.id,
        "name": agent.name,
        "provider": agent.provider,
        "model_name": agent.model_name,
        "temperature": agent.temperature,
        "max_tokens": agent.max_tokens,
        "system_instructions": agent.system_instructions,
        "behavior_rules": agent.behavior_rules,
        "response_style": agent.response_style,
        "safety_rules": agent.safety_rules
    }

    # Execute Agent Runtime Step
    runtime = AgentRuntimeService(
        user_groq_api_key=curr_user.groq_api_key if curr_user else None,
        user_openrouter_api_key=curr_user.openrouter_api_key if curr_user else None
    )
    runtime_res = await runtime.run_agent_step(
        agent_config=agent_config,
        user_message=payload.message,
        history=history,
        enabled_tools=tools_list,
        knowledge_chunks=knowledge_chunks,
        permissions=perms
    )

    # Record Assistant Message
    tc_json = json.dumps(runtime_res.get("executed_tools")) if runtime_res.get("executed_tools") else None
    assistant_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=runtime_res.get("response", ""),
        tokens_used=runtime_res.get("total_tokens", 0),
        latency_ms=runtime_res.get("duration_ms", 0.0),
        tool_calls_json=tc_json
    )
    db.add(assistant_msg)

    # Record Execution Inspector Log
    execution = AgentExecution(
        conversation_id=conversation_id,
        agent_id=agent.id,
        status=runtime_res.get("status", "completed"),
        model_used=agent.model_name,
        duration_ms=runtime_res.get("duration_ms", 0.0),
        prompt_tokens=runtime_res.get("prompt_tokens", 0),
        completion_tokens=runtime_res.get("completion_tokens", 0),
        total_tokens=runtime_res.get("total_tokens", 0),
        timeline_json=json.dumps(runtime_res.get("timeline", []))
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    # Record Individual Tool Executions
    for et in runtime_res.get("executed_tools", []):
        db.add(ToolExecution(
            execution_id=execution.id,
            tool_name=et["tool_name"],
            status=et.get("status", "completed"),
            output_result_json=json.dumps(et.get("result", {}))
        ))

    # If pending approval, create ApprovalRequest
    if runtime_res.get("pending_approval"):
        p_app = runtime_res["pending_approval"]
        db.add(ApprovalRequest(
            execution_id=execution.id,
            agent_id=agent.id,
            tool_name=p_app["tool_name"],
            action_description=p_app["action_description"],
            parameters_json=json.dumps(p_app.get("parameters", {}))
        ))

    await db.commit()

    return {
        "execution_id": execution.id,
        "message": {
            "id": assistant_msg.id,
            "role": assistant_msg.role,
            "content": assistant_msg.content,
            "tokens_used": assistant_msg.tokens_used,
            "latency_ms": assistant_msg.latency_ms,
            "tool_calls": runtime_res.get("executed_tools")
        },
        "execution_inspector": {
            "id": execution.id,
            "status": execution.status,
            "duration_ms": execution.duration_ms,
            "model": execution.model_used,
            "tokens": {
                "prompt": execution.prompt_tokens,
                "completion": execution.completion_tokens,
                "total": execution.total_tokens
            },
            "timeline": runtime_res.get("timeline", []),
            "pending_approval": runtime_res.get("pending_approval")
        }
    }
