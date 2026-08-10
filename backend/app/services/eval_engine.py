import json
import time
from typing import Dict, Any, List
from app.services.agent_runtime import AgentRuntimeService

class EvalEngineService:
    @staticmethod
    async def run_evaluation(
        agent_config: Dict[str, Any],
        test_case: Dict[str, Any],
        enabled_tools: List[Dict[str, Any]],
        user_groq_key: str = None
    ) -> Dict[str, Any]:
        """
        Runs an automated evaluation benchmark test case against an agent
        """
        runtime = AgentRuntimeService(user_groq_api_key=user_groq_key)
        start_time = time.time()

        res = await runtime.run_agent_step(
            agent_config=agent_config,
            user_message=test_case["input_prompt"],
            history=[],
            enabled_tools=enabled_tools
        )

        response_text = res.get("response", "")
        executed_tools = res.get("executed_tools", [])
        tool_called_names = [t["tool_name"] for t in executed_tools]

        # Score evaluation metrics
        expected_tool = test_case.get("expected_tool")
        expected_keywords = json.loads(test_case.get("expected_keywords", "[]")) if isinstance(test_case.get("expected_keywords"), str) else test_case.get("expected_keywords", [])

        score = 100.0
        passed = True
        reasons = []

        if expected_tool and expected_tool not in tool_called_names:
            score -= 40.0
            reasons.append(f"Expected tool '{expected_tool}' was not called (Called: {tool_called_names}).")

        if expected_keywords:
            matched = sum(1 for kw in expected_keywords if kw.lower() in response_text.lower())
            if matched < len(expected_keywords):
                penalty = (len(expected_keywords) - matched) * 15.0
                score -= penalty
                reasons.append(f"Missing expected keywords: {[kw for kw in expected_keywords if kw.lower() not in response_text.lower()]}")

        if score < 60.0:
            passed = False

        return {
            "test_case_name": test_case.get("name", "Test Case"),
            "model_used": agent_config.get("model_name", "llama-3.3-70b-versatile"),
            "passed": passed,
            "score": max(0.0, score),
            "latency_ms": res.get("duration_ms", 0.0),
            "tokens_used": res.get("total_tokens", 0),
            "actual_response": response_text,
            "actual_tools_called": tool_called_names,
            "evaluation_reasons": reasons
        }
