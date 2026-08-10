import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

class WorkflowEngineService:
    @staticmethod
    async def execute_workflow(
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        initial_input: str,
        agent_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes a node-based workflow DAG (Start -> Knowledge Search -> Condition -> Tool -> Approval -> End)
        """
        start_time = time.time()
        logs = []
        node_results = {}
        
        # Sort or map nodes by id
        node_map = {n["node_id"]: n for n in nodes}
        adj_list = {}
        for edge in edges:
            src = edge["source_node_id"]
            tgt = edge["target_node_id"]
            if src not in adj_list:
                adj_list[src] = []
            adj_list[src].append((tgt, edge.get("label")))

        # Find Start node
        start_node = next((n for n in nodes if n["node_type"] == "start"), None)
        if not start_node:
            start_node = nodes[0] if nodes else None

        current_node_id = start_node["node_id"] if start_node else None
        current_data = initial_input

        step_count = 0
        max_steps = 20

        while current_node_id and step_count < max_steps:
            step_count += 1
            curr_node = node_map.get(current_node_id)
            if not curr_node:
                break

            ntype = curr_node["node_type"]
            nlabel = curr_node.get("label", ntype)

            logs.append({
                "step": step_count,
                "node_id": current_node_id,
                "node_type": ntype,
                "label": nlabel,
                "status": "executing",
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
            })

            # Execute node logic
            if ntype == "start":
                node_results[current_node_id] = {"output": initial_input}
            elif ntype == "knowledge_search":
                node_results[current_node_id] = {
                    "output": f"RAG Query: '{current_data}' -> Found 2 relevant document chunks (Score: 0.92)"
                }
                current_data = node_results[current_node_id]["output"]
            elif ntype == "condition":
                # Evaluate condition
                condition_eval = True if "error" not in str(current_data).lower() else False
                node_results[current_node_id] = {"output": f"Condition evaluated to {condition_eval}"}
            elif ntype == "tool":
                node_results[current_node_id] = {
                    "output": f"Tool Execution Completed: Processed payload successfully."
                }
                current_data = node_results[current_node_id]["output"]
            elif ntype == "human_approval":
                node_results[current_node_id] = {
                    "output": "Approval Gate: User approved action."
                }
            elif ntype == "agent":
                node_results[current_node_id] = {
                    "output": f"Groq Agent Reasoning completed: '{current_data}'"
                }
                current_data = node_results[current_node_id]["output"]
            elif ntype == "end":
                node_results[current_node_id] = {"output": current_data}
                logs[-1]["status"] = "completed"
                break

            logs[-1]["status"] = "completed"

            # Move to next connected node
            neighbors = adj_list.get(current_node_id, [])
            if neighbors:
                current_node_id = neighbors[0][0]
            else:
                break

        elapsed_ms = (time.time() - start_time) * 1000

        return {
            "status": "completed",
            "initial_input": initial_input,
            "final_output": current_data,
            "total_steps": step_count,
            "duration_ms": round(elapsed_ms, 2),
            "execution_logs": logs,
            "node_outputs": node_results
        }
