import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.models.all_models import WorkflowNode, WorkflowEdge, Agent
from app.services.workflow_engine import WorkflowEngineService

router = APIRouter(prefix="/workflows", tags=["Workflows"])

class NodeSchema(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]

class EdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class SaveWorkflowSchema(BaseModel):
    nodes: List[NodeSchema]
    edges: List[EdgeSchema]

class RunWorkflowSchema(BaseModel):
    input_text: str

@router.get("/{agent_id}")
async def get_agent_workflow(agent_id: str, db: AsyncSession = Depends(get_db)):
    node_stmt = select(WorkflowNode).where(WorkflowNode.agent_id == agent_id)
    edge_stmt = select(WorkflowEdge).where(WorkflowEdge.agent_id == agent_id)

    n_res = await db.execute(node_stmt)
    e_res = await db.execute(edge_stmt)

    nodes = n_res.scalars().all()
    edges = e_res.scalars().all()

    # Default fallback workflow if empty
    if not nodes:
        return {
            "nodes": [
                {"id": "node_1", "type": "start", "label": "Start", "data": {"label": "Start"}, "position": {"x": 100, "y": 150}},
                {"id": "node_2", "type": "agent", "label": "Groq Agent", "data": {"label": "Groq Agent"}, "position": {"x": 350, "y": 150}},
                {"id": "node_3", "type": "knowledge_search", "label": "Knowledge Search", "data": {"label": "Knowledge Search"}, "position": {"x": 600, "y": 150}},
                {"id": "node_4", "type": "tool", "label": "Web Search Tool", "data": {"label": "Web Search Tool"}, "position": {"x": 850, "y": 150}},
                {"id": "node_5", "type": "end", "label": "End", "data": {"label": "End"}, "position": {"x": 1100, "y": 150}}
            ],
            "edges": [
                {"id": "edge_1", "source": "node_1", "target": "node_2"},
                {"id": "edge_2", "source": "node_2", "target": "node_3"},
                {"id": "edge_3", "source": "node_3", "target": "node_4"},
                {"id": "edge_4", "source": "node_4", "target": "node_5"}
            ]
        }

    return {
        "nodes": [{
            "id": n.node_id,
            "type": n.node_type,
            "label": n.label,
            "data": json.loads(n.config_json) if n.config_json else {"label": n.label},
            "position": {"x": n.position_x, "y": n.position_y}
        } for n in nodes],
        "edges": [{
            "id": e.edge_id,
            "source": e.source_node_id,
            "target": e.target_node_id,
            "label": e.label
        } for e in edges]
    }

@router.post("/{agent_id}")
async def save_agent_workflow(agent_id: str, payload: SaveWorkflowSchema, db: AsyncSession = Depends(get_db)):
    # Clear existing workflow nodes & edges
    del_nodes = select(WorkflowNode).where(WorkflowNode.agent_id == agent_id)
    del_edges = select(WorkflowEdge).where(WorkflowEdge.agent_id == agent_id)
    
    n_res = await db.execute(del_nodes)
    for n in n_res.scalars().all():
        await db.delete(n)

    e_res = await db.execute(del_edges)
    for e in e_res.scalars().all():
        await db.delete(e)

    # Save new nodes
    for n in payload.nodes:
        db.add(WorkflowNode(
            agent_id=agent_id,
            node_id=n.id,
            node_type=n.type,
            label=n.data.get("label", n.type),
            config_json=json.dumps(n.data),
            position_x=n.position["x"],
            position_y=n.position["y"]
        ))

    # Save new edges
    for e in payload.edges:
        db.add(WorkflowEdge(
            agent_id=agent_id,
            edge_id=e.id,
            source_node_id=e.source,
            target_node_id=e.target,
            label=e.label
        ))

    await db.commit()
    return {"status": "saved", "nodes_count": len(payload.nodes), "edges_count": len(payload.edges)}

@router.post("/{agent_id}/run")
async def run_workflow(agent_id: str, payload: RunWorkflowSchema, db: AsyncSession = Depends(get_db)):
    wf_data = await get_agent_workflow(agent_id, db)
    
    # Load Agent
    agent_stmt = select(Agent).where(Agent.id == agent_id)
    agent_res = await db.execute(agent_stmt)
    agent = agent_res.scalar_one_or_none()

    agent_cfg = {"model_name": agent.model_name if agent else "llama-3.3-70b-versatile"}

    nodes_formatted = [{
        "node_id": n["id"],
        "node_type": n["type"],
        "label": n.get("label", n["type"])
    } for n in wf_data["nodes"]]

    edges_formatted = [{
        "source_node_id": e["source"],
        "target_node_id": e["target"],
        "label": e.get("label")
    } for e in wf_data["edges"]]

    exec_result = await WorkflowEngineService.execute_workflow(
        nodes=nodes_formatted,
        edges=edges_formatted,
        initial_input=payload.input_text,
        agent_config=agent_cfg
    )

    return exec_result
