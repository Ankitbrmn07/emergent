import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.core.database import get_db
from app.models.all_models import EvaluationTestCase, EvaluationRun, Agent, AgentToolConfig, Tool
from app.services.eval_engine import EvalEngineService

router = APIRouter(prefix="/evaluations", tags=["Agent Evaluations"])

class CreateTestCaseSchema(BaseModel):
    agent_id: str
    name: str
    input_prompt: str
    expected_tool: Optional[str] = None
    expected_keywords: List[str] = []
    safety_criteria: Optional[str] = None

@router.get("/{agent_id}/test-cases")
async def list_test_cases(agent_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(EvaluationTestCase).where(EvaluationTestCase.agent_id == agent_id).order_by(EvaluationTestCase.created_at.desc())
    res = await db.execute(stmt)
    tcs = res.scalars().all()

    return [{
        "id": tc.id,
        "name": tc.name,
        "input_prompt": tc.input_prompt,
        "expected_tool": tc.expected_tool,
        "expected_keywords": json.loads(tc.expected_keywords) if isinstance(tc.expected_keywords, str) else tc.expected_keywords,
        "safety_criteria": tc.safety_criteria,
        "created_at": tc.created_at.isoformat() if tc.created_at else None
    } for tc in tcs]

@router.post("/test-cases")
async def create_test_case(payload: CreateTestCaseSchema, db: AsyncSession = Depends(get_db)):
    tc = EvaluationTestCase(
        agent_id=payload.agent_id,
        name=payload.name,
        input_prompt=payload.input_prompt,
        expected_tool=payload.expected_tool,
        expected_keywords=json.dumps(payload.expected_keywords),
        safety_criteria=payload.safety_criteria
    )
    db.add(tc)
    await db.commit()
    await db.refresh(tc)
    return {"id": tc.id, "name": tc.name, "status": "created"}

@router.post("/{agent_id}/run-all")
async def run_all_evaluations(agent_id: str, db: AsyncSession = Depends(get_db)):
    # Fetch Agent & Tools
    agent_stmt = select(Agent).where(Agent.id == agent_id)
    agent_res = await db.execute(agent_stmt)
    agent = agent_res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    agent_cfg = {
        "id": agent.id,
        "name": agent.name,
        "model_name": agent.model_name,
        "temperature": agent.temperature,
        "max_tokens": agent.max_tokens,
        "system_instructions": agent.system_instructions
    }

    # Fetch Tools
    tool_cfg_stmt = select(AgentToolConfig).where(AgentToolConfig.agent_id == agent.id)
    tool_cfg_res = await db.execute(tool_cfg_stmt)
    bound_tools = tool_cfg_res.scalars().all()
    
    tools_list = []
    for bt in bound_tools:
        t_stmt = select(Tool).where(Tool.id == bt.tool_id)
        t_res = await db.execute(t_stmt)
        t_obj = t_res.scalar_one_or_none()
        if t_obj:
            tools_list.append({"name": t_obj.name, "description": t_obj.description, "parameters_schema": t_obj.parameters_schema})

    # Fetch Test Cases
    tc_stmt = select(EvaluationTestCase).where(EvaluationTestCase.agent_id == agent_id)
    tc_res = await db.execute(tc_stmt)
    test_cases = tc_res.scalars().all()

    # Create synthetic test case if none exist
    if not test_cases:
        sample_tc = EvaluationTestCase(
            agent_id=agent_id,
            name="Developer Debugging Test",
            input_prompt="Analyze why my math calculation for 42 * 18 + 150 failed.",
            expected_tool="calculator",
            expected_keywords=json.dumps(["calculator", "906"])
        )
        db.add(sample_tc)
        await db.commit()
        await db.refresh(sample_tc)
        test_cases = [sample_tc]

    eval_results = []
    for tc in test_cases:
        tc_dict = {
            "name": tc.name,
            "input_prompt": tc.input_prompt,
            "expected_tool": tc.expected_tool,
            "expected_keywords": tc.expected_keywords
        }
        res = await EvalEngineService.run_evaluation(
            agent_config=agent_cfg,
            test_case=tc_dict,
            enabled_tools=tools_list
        )

        run_record = EvaluationRun(
            agent_id=agent_id,
            test_case_id=tc.id,
            model_used=agent.model_name,
            passed=res["passed"],
            score=res["score"],
            latency_ms=res["latency_ms"],
            tokens_used=res["tokens_used"],
            actual_response=res["actual_response"],
            actual_tool_called=", ".join(res["actual_tools_called"]),
            details_json=json.dumps(res.get("evaluation_reasons", []))
        )
        db.add(run_record)
        eval_results.append(res)

    await db.commit()
    return {
        "agent_id": agent_id,
        "total_tests": len(eval_results),
        "passed_tests": sum(1 for r in eval_results if r["passed"]),
        "average_score": round(sum(r["score"] for r in eval_results) / len(eval_results), 1) if eval_results else 0.0,
        "results": eval_results
    }
