import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, AsyncGenerator
from app.services.groq_provider import GroqProviderService
from app.services.openrouter_provider import OpenRouterProviderService
from app.services.tool_executor import ToolExecutorService
from app.services.rag_engine import RAGEngineService

class AgentRuntimeService:
    def __init__(self, user_groq_api_key: Optional[str] = None, user_openrouter_api_key: Optional[str] = None):
        self.groq_service = GroqProviderService(api_key=user_groq_api_key)
        self.openrouter_service = OpenRouterProviderService(api_key=user_openrouter_api_key)

    async def run_agent_step(
        self,
        agent_config: Dict[str, Any],
        user_message: str,
        history: List[Dict[str, str]],
        enabled_tools: List[Dict[str, Any]],
        knowledge_chunks: Optional[List[Dict[str, Any]]] = None,
        permissions: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Executes a complete agent reasoning step with tools, permissions, and Multi-Provider LLM (Groq or OpenRouter)
        """
        start_time = time.time()
        permissions = permissions or {
            "READ": "allowed",
            "WRITE": "approval_required",
            "EXECUTE": "allowed",
            "DATABASE": "approval_required",
            "NETWORK": "allowed",
            "DEPLOY": "denied"
        }

        model_name = agent_config.get("model_name", "llama-3.3-70b-versatile")
        provider = agent_config.get("provider")
        if not provider:
            if "/" in model_name or "free" in model_name or ":" in model_name:
                provider = "OpenRouter"
            else:
                provider = "Groq"

        timeline = []
        timeline.append({
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "event": "Agent Started",
            "details": f"Initializing agent session via {provider} provider with model '{model_name}'"
        })

        # 1. RAG Context Retrieval if knowledge base chunks exist
        rag_context_str = ""
        if knowledge_chunks:
            timeline.append({
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                "event": "Knowledge Search",
                "details": f"Searching through {len(knowledge_chunks)} document vectors..."
            })
            top_chunks = RAGEngineService.search_chunks(user_message, knowledge_chunks, top_k=3)
            if top_chunks:
                rag_context_str = "\n\n--- RELEVANT KNOWLEDGE BASE CONTEXT ---\n" + "\n".join([
                    f"[Doc: {c['document_filename']} | Score: {round(c['score'], 2)}]\n{c['content']}"
                    for c in top_chunks
                ]) + "\n----------------------------------------\n"

        # 2. Build Messages Array
        system_instruction = (
            f"Agent Name: {agent_config.get('name', 'AI Assistant')}\n"
            f"System Instructions: {agent_config.get('system_instructions', 'Help user solve their request efficiently.')}\n"
            f"Behavior Rules: {agent_config.get('behavior_rules', 'Be concise and accurate.')}\n"
            f"Response Style: {agent_config.get('response_style', 'Professional')}\n"
            f"Safety Rules: {agent_config.get('safety_rules', 'Never execute dangerous destructive commands without permission.')}\n"
            f"{rag_context_str}"
        )

        messages = [{"role": "system", "content": system_instruction}]
        
        # Add conversation history
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Format tool definitions
        formatted_tools = []
        for tool in enabled_tools:
            formatted_tools.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": json.loads(tool.get("parameters_schema", "{}")) if isinstance(tool.get("parameters_schema"), str) else (tool.get("parameters_schema") or {})
                }
            })

        # 3. Call Provider Service (Groq or OpenRouter)
        timeline.append({
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "event": f"{provider} LLM Reasoning",
            "details": f"Querying {provider} model '{model_name}' with {len(formatted_tools)} tool definitions"
        })

        if provider == "OpenRouter":
            llm_resp = await self.openrouter_service.chat_completion(
                messages=messages,
                model=model_name,
                temperature=agent_config.get("temperature", 0.7),
                max_tokens=agent_config.get("max_tokens", 4096),
                tools=formatted_tools if formatted_tools else None
            )
        else:
            llm_resp = await self.groq_service.chat_completion(
                messages=messages,
                model=model_name,
                temperature=agent_config.get("temperature", 0.7),
                max_tokens=agent_config.get("max_tokens", 4096),
                tools=formatted_tools if formatted_tools else None
            )

        tool_calls = llm_resp.get("tool_calls")
        executed_tools_log = []
        pending_approval_request = None

        # 4. Handle Tool Executions if requested by LLM
        if tool_calls:
            for tool_call in tool_calls:
                func_name = tool_call["function"]["name"]
                args_raw = tool_call["function"]["arguments"]
                args = json.loads(args_raw) if isinstance(args_raw, str) else args_raw

                timeline.append({
                    "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    "event": "Tool Selection",
                    "details": f"Agent selected tool '{func_name}' with parameters: {json.dumps(args)}"
                })

                # Check Permissions & Approvals
                req_perm = "WRITE" if func_name in ["file_writer", "db_query"] else "EXECUTE"
                perm_setting = permissions.get(req_perm, "allowed")

                if perm_setting == "approval_required":
                    timeline.append({
                        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                        "event": "Approval Required",
                        "details": f"Tool '{func_name}' requires human approval before execution."
                    })
                    pending_approval_request = {
                        "tool_name": func_name,
                        "action_description": f"Agent requests execution of '{func_name}' with parameters {json.dumps(args)}",
                        "parameters": args
                    }
                    break
                elif perm_setting == "denied":
                    executed_tools_log.append({
                        "tool_name": func_name,
                        "status": "denied",
                        "result": {"error": f"Permission Denied: {req_perm} is blocked by agent policy."}
                    })
                    continue

                # Execute Tool
                timeline.append({
                    "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    "event": "Tool Execution",
                    "details": f"Executing tool '{func_name}'..."
                })

                custom_cfg = next((t for t in enabled_tools if t["name"] == func_name and not t.get("is_builtin")), None)

                tool_res, tool_status = await ToolExecutorService.execute_tool(
                    tool_name=func_name,
                    arguments=args,
                    agent_permissions=permissions,
                    custom_tool_config=custom_cfg
                )

                timeline.append({
                    "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    "event": "Tool Completed",
                    "details": f"Tool '{func_name}' finished in {tool_res.get('_execution_time_ms', 0)}ms"
                })

                executed_tools_log.append({
                    "tool_name": func_name,
                    "status": tool_status,
                    "result": tool_res
                })

                # Feed tool result back to LLM for final response synthesis
                messages.append({
                    "role": "assistant",
                    "content": llm_resp.get("content") or "",
                    "tool_calls": tool_calls
                })
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.get("id", "call_1"),
                    "content": json.dumps(tool_res)
                })

                # Second turn for final synthesis
                if provider == "OpenRouter":
                    second_resp = await self.openrouter_service.chat_completion(
                        messages=messages,
                        model=model_name,
                        temperature=agent_config.get("temperature", 0.7)
                    )
                else:
                    second_resp = await self.groq_service.chat_completion(
                        messages=messages,
                        model=model_name,
                        temperature=agent_config.get("temperature", 0.7)
                    )
                llm_resp["content"] = second_resp.get("content")
                llm_resp["prompt_tokens"] += second_resp.get("prompt_tokens", 0)
                llm_resp["completion_tokens"] += second_resp.get("completion_tokens", 0)
                llm_resp["total_tokens"] += second_resp.get("total_tokens", 0)

        timeline.append({
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "event": "Final Response",
            "details": f"Agent generated final response successfully via {provider}."
        })

        elapsed_ms = (time.time() - start_time) * 1000

        return {
            "status": "pending_approval" if pending_approval_request else "completed",
            "response": llm_resp.get("content", ""),
            "tool_calls": tool_calls,
            "executed_tools": executed_tools_log,
            "pending_approval": pending_approval_request,
            "model_used": model_name,
            "provider": provider,
            "duration_ms": round(elapsed_ms, 2),
            "prompt_tokens": llm_resp.get("prompt_tokens", 0),
            "completion_tokens": llm_resp.get("completion_tokens", 0),
            "total_tokens": llm_resp.get("total_tokens", 0),
            "timeline": timeline
        }
