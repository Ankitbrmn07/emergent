import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Column
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    groq_api_key = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    agents = relationship("Agent", back_populates="owner", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    avatar = Column(String, default="bot-1")
    category = Column(String, default="general")
    is_active = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)
    
    # Model config
    provider = Column(String, default="Groq")
    model_name = Column(String, default="llama-3.3-70b-versatile")
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=4096)
    
    # Instructions
    system_instructions = Column(Text, nullable=False)
    behavior_rules = Column(Text, nullable=True)
    response_style = Column(String, default="Professional & Concise")
    safety_rules = Column(Text, nullable=True)
    
    # Permissions json string e.g. {"READ": "allowed", "WRITE": "approval_required", "DELETE": "denied"}
    permissions = Column(Text, default=json.dumps({
        "READ": "allowed",
        "WRITE": "approval_required",
        "EXECUTE": "allowed",
        "DATABASE": "approval_required",
        "NETWORK": "allowed",
        "DEPLOY": "denied"
    }))
    
    # Memory toggle
    memory_enabled = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    owner = relationship("User", back_populates="agents")
    tools = relationship("AgentToolConfig", back_populates="agent", cascade="all, delete-orphan")
    knowledge_bases = relationship("AgentKnowledgeBase", back_populates="agent", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="agent", cascade="all, delete-orphan")
    workflows = relationship("WorkflowNode", back_populates="agent", cascade="all, delete-orphan")


class Tool(Base):
    __tablename__ = "tools"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    is_builtin = Column(Boolean, default=True)
    category = Column(String, default="utility")
    
    # Custom tool config (HTTP Method, Endpoint, Headers JSON, Query Params JSON, Request Body JSON, Response Schema JSON)
    http_method = Column(String, nullable=True)  # GET, POST, PUT, DELETE
    endpoint_url = Column(String, nullable=True)
    auth_type = Column(String, default="none")  # none, bearer, api_key
    auth_token = Column(String, nullable=True)
    parameters_schema = Column(Text, default="{}")  # JSON Schema string
    response_schema = Column(Text, default="{}")
    required_permission = Column(String, default="EXECUTE")

    created_at = Column(DateTime(timezone=True), default=utc_now)


class AgentToolConfig(Base):
    __tablename__ = "agent_tools"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    tool_id = Column(String, ForeignKey("tools.id"), nullable=False)
    is_enabled = Column(Boolean, default=True)

    agent = relationship("Agent", back_populates="tools")
    tool = relationship("Tool")


class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    total_documents = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    documents = relationship("Document", back_populates="knowledge_base", cascade="all, delete-orphan")


class AgentKnowledgeBase(Base):
    __tablename__ = "agent_knowledge_bases"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    knowledge_base_id = Column(String, ForeignKey("knowledge_bases.id"), nullable=False)

    agent = relationship("Agent", back_populates="knowledge_bases")
    knowledge_base = relationship("KnowledgeBase")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    knowledge_base_id = Column(String, ForeignKey("knowledge_bases.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, txt, docx, csv, md, json
    file_size = Column(Integer, default=0)
    status = Column(String, default="indexed")  # uploading, processing, indexed, error
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    knowledge_base = relationship("KnowledgeBase", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding_json = Column(Text, nullable=True)  # JSON array of floats for cosine search
    metadata_json = Column(Text, default="{}")

    document = relationship("Document", back_populates="chunks")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    title = Column(String, default="New Conversation")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="conversations")
    agent = relationship("Agent", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    executions = relationship("AgentExecution", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system, tool
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    tool_calls_json = Column(Text, nullable=True)  # JSON array of tool calls
    created_at = Column(DateTime(timezone=True), default=utc_now)

    conversation = relationship("Conversation", back_populates="messages")


class AgentExecution(Base):
    __tablename__ = "agent_executions"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    status = Column(String, default="completed")  # running, completed, pending_approval, failed
    model_used = Column(String, default="llama-3.3-70b-versatile")
    duration_ms = Column(Float, default=0.0)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    timeline_json = Column(Text, default="[]")  # JSON timeline events
    created_at = Column(DateTime(timezone=True), default=utc_now)

    conversation = relationship("Conversation", back_populates="executions")
    tool_executions = relationship("ToolExecution", back_populates="execution", cascade="all, delete-orphan")


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("agent_executions.id"), nullable=False)
    tool_name = Column(String, nullable=False)
    input_params_json = Column(Text, default="{}")
    output_result_json = Column(Text, default="{}")
    status = Column(String, default="completed")  # completed, failed, pending_approval, denied
    duration_ms = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    execution = relationship("AgentExecution", back_populates="tool_executions")


class ApprovalRequest(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("agent_executions.id"), nullable=False)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    tool_name = Column(String, nullable=False)
    action_description = Column(Text, nullable=False)
    parameters_json = Column(Text, default="{}")
    status = Column(String, default="pending")  # pending, approved, rejected
    requested_at = Column(DateTime(timezone=True), default=utc_now)
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class AgentMemory(Base):
    __tablename__ = "agent_memory"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    key = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    memory_type = Column(String, default="user_preference")  # user_preference, agent_state, fact
    created_at = Column(DateTime(timezone=True), default=utc_now)


class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    node_id = Column(String, nullable=False)  # UI node ID e.g. "node_1"
    node_type = Column(String, nullable=False)  # start, agent, tool, condition, http_request, knowledge_search, db_query, human_approval, end
    label = Column(String, nullable=False)
    config_json = Column(Text, default="{}")
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)

    agent = relationship("Agent", back_populates="workflows")


class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    edge_id = Column(String, nullable=False)
    source_node_id = Column(String, nullable=False)
    target_node_id = Column(String, nullable=False)
    label = Column(String, nullable=True)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    key_prefix = Column(String, nullable=False)
    hashed_key = Column(String, nullable=False)
    rate_limit = Column(Integer, default=100)  # requests per minute
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="api_keys")


class EvaluationTestCase(Base):
    __tablename__ = "evaluation_test_cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    name = Column(String, nullable=False)
    input_prompt = Column(Text, nullable=False)
    expected_tool = Column(String, nullable=True)
    expected_keywords = Column(Text, default="[]")  # JSON array of expected terms
    safety_criteria = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    test_case_id = Column(String, ForeignKey("evaluation_test_cases.id"), nullable=False)
    model_used = Column(String, nullable=False)
    passed = Column(Boolean, default=True)
    score = Column(Float, default=100.0)  # 0 to 100
    latency_ms = Column(Float, default=0.0)
    tokens_used = Column(Integer, default=0)
    actual_response = Column(Text, nullable=False)
    actual_tool_called = Column(String, nullable=True)
    details_json = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), default=utc_now)
