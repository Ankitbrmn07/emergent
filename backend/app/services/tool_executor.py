import json
import time
import httpx
import math
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

class ToolExecutorService:
    @staticmethod
    async def execute_tool(
        tool_name: str,
        arguments: Dict[str, Any],
        agent_permissions: Dict[str, str] = None,
        custom_tool_config: Dict[str, Any] = None
    ) -> Tuple[Dict[str, Any], str]:
        """
        Executes a tool and returns (result_dict, status)
        """
        start_time = time.time()
        agent_permissions = agent_permissions or {}

        # 1. Built-in Tool Dispatcher
        if tool_name == "web_search":
            query = arguments.get("query", "")
            res = {
                "query": query,
                "results": [
                    {
                        "title": f"Official Documentation for {query}",
                        "snippet": f"Comprehensive guide and API specs regarding {query}. Groq LPUs accelerate Llama 3.3 models with high token throughput.",
                        "url": f"https://docs.groq.com/search?q={query}"
                    },
                    {
                        "title": f"Best Practices & Architecture - {query}",
                        "snippet": f"Building scalable agentic workflows using function calling, tool permissions, and modular RAG architecture.",
                        "url": "https://buildr.ai/guides/agent-architecture"
                    }
                ]
            }
        elif tool_name == "calculator":
            expr = arguments.get("expression", "0")
            try:
                # Safe evaluation for math expressions
                allowed_names = {"sin": math.sin, "cos": math.cos, "sqrt": math.sqrt, "pi": math.pi, "e": math.e}
                calc_val = eval(expr, {"__builtins__": None}, allowed_names)
                res = {"expression": expr, "result": calc_val}
            except Exception as e:
                res = {"expression": expr, "error": f"Math Evaluation Error: {str(e)}"}

        elif tool_name == "date_time":
            now = datetime.now(timezone.utc)
            res = {
                "utc_now": now.isoformat(),
                "formatted": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
                "day_of_week": now.strftime("%A")
            }

        elif tool_name == "file_reader":
            filename = arguments.get("filename", "sample.txt")
            res = {
                "filename": filename,
                "content": f"// Simulated file content for {filename}\nconst API_CONFIG = {{ provider: 'Groq', model: 'llama-3.3-70b-versatile' }};\nexport default API_CONFIG;",
                "lines": 3
            }

        elif tool_name == "file_writer":
            # Check permissions
            if agent_permissions.get("WRITE") == "denied":
                return {"error": "Permission Denied: WRITE_FILES is blocked for this agent."}, "denied"
            filename = arguments.get("filename", "output.txt")
            content = arguments.get("content", "")
            res = {
                "status": "success",
                "filename": filename,
                "bytes_written": len(content),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        elif tool_name == "json_parser":
            raw_text = arguments.get("text", "{}")
            try:
                parsed = json.loads(raw_text)
                res = {"status": "valid_json", "keys": list(parsed.keys()) if isinstance(parsed, dict) else [], "data": parsed}
            except Exception as e:
                res = {"status": "invalid_json", "error": str(e)}

        elif tool_name == "http_request" or custom_tool_config:
            # Custom HTTP Tool or generic HTTP Request
            url = arguments.get("url") or (custom_tool_config.get("endpoint_url") if custom_tool_config else None) or "https://httpbin.org/get"
            method = (arguments.get("method") or (custom_tool_config.get("http_method") if custom_tool_config else "GET")).upper()
            
            # Simple SSRF protection block
            if any(blocked in url.lower() for blocked in ["localhost", "127.0.0.1", "169.254.169.254"]):
                return {"error": "SSRF Protection: Requests to local loopback addresses are blocked."}, "denied"

            async with httpx.AsyncClient(timeout=10.0) as client:
                try:
                    if method == "POST":
                        resp = await client.post(url, json=arguments.get("data", {}))
                    else:
                        resp = await client.get(url, params=arguments.get("params", {}))
                    
                    try:
                        resp_data = resp.json()
                    except:
                        resp_data = resp.text[:500]

                    res = {
                        "status_code": resp.status_code,
                        "data": resp_data
                    }
                except Exception as e:
                    res = {"error": f"HTTP Error: {str(e)}"}

        elif tool_name == "code_execution":
            code = arguments.get("code", "print('Hello Groq Agent')")
            res = {
                "code": code,
                "stdout": "Hello Groq Agent\n[Execution completed successfully]",
                "stderr": "",
                "exit_code": 0
            }

        elif tool_name == "db_query":
            query = arguments.get("query", "SELECT * FROM users")
            res = {
                "query": query,
                "rows_affected": 2,
                "results": [
                    {"id": 1, "username": "alex_dev", "role": "Engineer"},
                    {"id": 2, "username": "sarah_ai", "role": "Architect"}
                ]
            }

        else:
            res = {"error": f"Unknown tool: {tool_name}"}

        elapsed = (time.time() - start_time) * 1000
        res["_execution_time_ms"] = round(elapsed, 2)
        return res, "completed"
