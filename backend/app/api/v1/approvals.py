import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.all_models import ApprovalRequest, AgentExecution

router = APIRouter(prefix="/approvals", tags=["Approvals"])

class ApprovalActionSchema(BaseModel):
    action: str  # approve or reject

@router.get("")
async def list_approvals(status: str = "pending", db: AsyncSession = Depends(get_db)):
    stmt = select(ApprovalRequest).order_by(ApprovalRequest.requested_at.desc())
    if status != "all":
        stmt = stmt.where(ApprovalRequest.status == status)
    res = await db.execute(stmt)
    apps = res.scalars().all()

    output = []
    for a in apps:
        output.append({
            "id": a.id,
            "execution_id": a.execution_id,
            "agent_id": a.agent_id,
            "tool_name": a.tool_name,
            "action_description": a.action_description,
            "parameters": json.loads(a.parameters_json) if a.parameters_json else {},
            "status": a.status,
            "requested_at": a.requested_at.isoformat() if a.requested_at else None,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None
        })
    return output

@router.post("/{approval_id}/action")
async def resolve_approval(approval_id: str, payload: ApprovalActionSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
    res = await db.execute(stmt)
    app_req = res.scalar_one_or_none()

    if not app_req:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    app_req.status = "approved" if payload.action == "approve" else "rejected"
    app_req.resolved_at = datetime.now(timezone.utc)

    # Update associated execution status
    exec_stmt = select(AgentExecution).where(AgentExecution.id == app_req.execution_id)
    exec_res = await db.execute(exec_stmt)
    execution = exec_res.scalar_one_or_none()

    if execution:
        execution.status = "completed" if payload.action == "approve" else "denied"

    await db.commit()
    return {"id": app_req.id, "status": app_req.status}
