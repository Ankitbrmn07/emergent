export interface User {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  groq_api_key?: string;
  openrouter_api_key?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: 'Groq' | 'OpenRouter' | string;
  category?: string;
  context_window: number;
  description: string;
  recommended?: boolean;
  is_free?: boolean;
}

export type GroqModelInfo = ModelInfo;

export interface AgentPermissions {
  READ: string;
  WRITE: string;
  EXECUTE: string;
  DATABASE: string;
  NETWORK: string;
  DEPLOY: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar: string;
  category: string;
  provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  system_instructions: string;
  behavior_rules?: string;
  response_style: string;
  safety_rules?: string;
  permissions: AgentPermissions;
  memory_enabled: boolean;
  is_active: boolean;
  is_published: boolean;
  tool_ids?: string[];
  knowledge_base_ids?: string[];
  created_at?: string;
}

export interface Tool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_builtin: boolean;
  category: string;
  http_method?: string;
  endpoint_url?: string;
  auth_type?: string;
  parameters_schema: any;
  response_schema: any;
  required_permission?: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  total_documents: number;
  total_chunks: number;
  created_at?: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  chunk_count: number;
  created_at?: string;
}

export interface Conversation {
  id: string;
  agent_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface ToolCallItem {
  tool_name: string;
  status: string;
  result: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tokens_used?: number;
  latency_ms?: number;
  tool_calls?: ToolCallItem[];
  created_at?: string;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  details: string;
}

export interface PendingApproval {
  tool_name: string;
  action_description: string;
  parameters: any;
}

export interface ExecutionInspector {
  id: string;
  status: string;
  duration_ms: number;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  timeline: TimelineEvent[];
  pending_approval?: PendingApproval;
}

export interface ApprovalItem {
  id: string;
  execution_id: string;
  agent_id: string;
  tool_name: string;
  action_description: string;
  parameters: any;
  status: 'pending' | 'approved' | 'rejected';
  requested_at?: string;
  resolved_at?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  api_key?: string;
  rate_limit: number;
  is_active: boolean;
  created_at?: string;
  last_used_at?: string;
}

export interface TestCaseItem {
  id: string;
  name: string;
  input_prompt: string;
  expected_tool?: string;
  expected_keywords: string[];
  safety_criteria?: string;
  created_at?: string;
}

export interface EvalRunResult {
  test_case_name: string;
  model_used: string;
  passed: boolean;
  score: number;
  latency_ms: number;
  tokens_used: number;
  actual_response: string;
  actual_tools_called: string[];
  evaluation_reasons: string[];
}
