import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.models.all_models import Tool

router = APIRouter(prefix="/tools", tags=["Tools"])

class CreateCustomToolSchema(BaseModel):
    name: str
    display_name: str
    description: str
    category: str = "custom"
    http_method: str = "GET"
    endpoint_url: str
    auth_type: str = "none"
    auth_token: Optional[str] = None
    parameters_schema: Dict[str, Any] = {}
    response_schema: Dict[str, Any] = {}
    required_permission: str = "EXECUTE"

@router.get("")
async def list_tools(db: AsyncSession = Depends(get_db)):
    stmt = select(Tool).order_by(Tool.is_builtin.desc(), Tool.display_name)
    res = await db.execute(stmt)
    tools = res.scalars().all()

    output = []
    for t in tools:
        output.append({
            "id": t.id,
            "name": t.name,
            "display_name": t.display_name,
            "description": t.description,
            "is_builtin": t.is_builtin,
            "category": t.category,
            "http_method": t.http_method,
            "endpoint_url": t.endpoint_url,
            "auth_type": t.auth_type,
            "parameters_schema": json.loads(t.parameters_schema) if isinstance(t.parameters_schema, str) else t.parameters_schema,
            "response_schema": json.loads(t.response_schema) if isinstance(t.response_schema, str) else t.response_schema,
            "required_permission": t.required_permission
        })
    return output

@router.post("")
async def create_custom_tool(payload: CreateCustomToolSchema, db: AsyncSession = Depends(get_db)):
    # Check uniqueness of tool name
    stmt = select(Tool).where(Tool.name == payload.name)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tool name must be unique.")

    tool = Tool(
        name=payload.name,
        display_name=payload.display_name,
        description=payload.description,
        is_builtin=False,
        category=payload.category,
        http_method=payload.http_method,
        endpoint_url=payload.endpoint_url,
        auth_type=payload.auth_type,
        auth_token=payload.auth_token,
        parameters_schema=json.dumps(payload.parameters_schema),
        response_schema=json.dumps(payload.response_schema),
        required_permission=payload.required_permission
    )
    db.add(tool)
    await db.commit()
    await db.refresh(tool)
    return {"id": tool.id, "name": tool.name, "status": "created"}

@router.delete("/{tool_id}")
async def delete_tool(tool_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Tool).where(Tool.id == tool_id)
    res = await db.execute(stmt)
    tool = res.scalar_one_or_none()
    if tool and not tool.is_builtin:
        await db.delete(tool)
        await db.commit()
    return {"status": "deleted"}
