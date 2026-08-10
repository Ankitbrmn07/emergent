import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Buildr AI - Multi-Provider AI Agent Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "groq-agent-platform-super-secret-jwt-key-2026-buildr"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Provider API Keys
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "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")
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY", "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")
    DEFAULT_MODEL: str = "openai/gpt-oss-120b"
    
    # Supported Groq LPU Models (Default: GPT-OSS 120B)
    AVAILABLE_GROQ_MODELS: list[dict] = [
        {
            "id": "openai/gpt-oss-120b",
            "name": "OpenAI: GPT-OSS 120B (Groq Engine)",
            "provider": "Groq",
            "context_window": 128000,
            "description": "Flagship 120B open reasoning model executing on ultra-low latency Groq LPUs.",
            "recommended": True,
            "is_default": True
        },
        {
            "id": "llama-3.3-70b-versatile",
            "name": "Llama 3.3 70B Versatile",
            "provider": "Groq",
            "context_window": 128000,
            "description": "Flagship 70B model with high reasoning, tool execution, and code generation.",
            "recommended": True
        },
        {
            "id": "deepseek-r1-distill-llama-70b",
            "name": "DeepSeek R1 Distill 70B",
            "provider": "Groq",
            "context_window": 128000,
            "description": "State-of-the-art DeepSeek reasoning model for complex math and logic chain-of-thought.",
            "recommended": True
        },
        {
            "id": "llama-3.1-8b-instant",
            "name": "Llama 3.1 8B Instant",
            "provider": "Groq",
            "context_window": 128000,
            "description": "Ultra-fast sub-second latency model for lightweight classification and tool routing."
        },
        {
            "id": "mixtral-8x7b-32768",
            "name": "Mixtral 8x7B MoE",
            "provider": "Groq",
            "context_window": 32768,
            "description": "High-throughput Mixture-of-Experts architecture for multi-step tasks."
        },
        {
            "id": "gemma2-9b-it",
            "name": "Gemma 2 9B IT",
            "provider": "Groq",
            "context_window": 8192,
            "description": "Google lightweight instruction-tuned model."
        }
    ]

    # Supported OpenRouter Models (Default: Free Models Router & Fish Audio)
    AVAILABLE_OPENROUTER_MODELS: list[dict] = [
        {
            "id": "openrouter/free-models-router",
            "name": "OpenRouter: Free Models Auto-Router",
            "provider": "OpenRouter",
            "category": "Auto Router & Reasoning",
            "context_window": 200000,
            "description": "Automatically routes requests to the best available free LLM endpoint on OpenRouter.",
            "is_free": True,
            "recommended": True,
            "is_default": True
        },
        {
            "id": "fish-audio/s2.1-pro-free:free",
            "name": "Fish Audio: S2.1 Pro Speech (free)",
            "provider": "OpenRouter",
            "category": "Text to Speech & Audio",
            "context_window": 32768,
            "description": "Fish Audio S2.1 Pro multilingual speech synthesis & audio model.",
            "is_free": True,
            "recommended": True
        },
        {
            "id": "openrouter/free-models-router",
            "name": "OpenRouter: Free Models Auto-Router",
            "provider": "OpenRouter",
            "category": "Auto Router",
            "context_window": 128000,
            "description": "Automatically routes requests to the best available free LLM endpoint on OpenRouter.",
            "is_free": True,
            "recommended": True
        },
        {
            "id": "nvidia/nemotron-3-ultra:free",
            "name": "NVIDIA: Nemotron 3 Ultra (free)",
            "provider": "OpenRouter",
            "category": "Reasoning & Tool Use",
            "context_window": 1000000,
            "description": "NVIDIA 1M context window model for massive document reasoning and tool use.",
            "is_free": True
        },
        {
            "id": "poolside/laguna-s-2.1:free",
            "name": "Poolside: Laguna S 2.1 (free)",
            "provider": "OpenRouter",
            "category": "Coding & Tool Use",
            "context_window": 262144,
            "description": "High throughput coding agent model with 262k context.",
            "is_free": True
        },
        {
            "id": "nvidia/nemotron-3-super:free",
            "name": "NVIDIA: Nemotron 3 Super (free)",
            "provider": "OpenRouter",
            "category": "Reasoning",
            "context_window": 262144,
            "description": "Deep reasoning model for high precision multi-turn instructions.",
            "is_free": True
        },
        {
            "id": "cohere/north-mini-code:free",
            "name": "Cohere: North Mini Code (free)",
            "provider": "OpenRouter",
            "category": "Coding",
            "context_window": 256000,
            "description": "Cohere code generation model with low latency execution.",
            "is_free": True
        },
        {
            "id": "poolside/laguna-xs-2.1:free",
            "name": "Poolside: Laguna XS 2.1 (free)",
            "provider": "OpenRouter",
            "category": "Fast Tool Use",
            "context_window": 262144,
            "description": "Ultra fast (65 t/s) lightweight coding & reasoning model.",
            "is_free": True
        },
        {
            "id": "nvidia/nemotron-3-nano-30b-a3b:free",
            "name": "NVIDIA: Nemotron 3 Nano 30B A3B (free)",
            "provider": "OpenRouter",
            "category": "Multilingual & Tool Use",
            "context_window": 256000,
            "description": "88 t/s high performance 30B architecture.",
            "is_free": True
        },
        {
            "id": "inclusionai/ling-3.0-tiny:free",
            "name": "InclusionAI: Ling 3.0 Tiny (free)",
            "provider": "OpenRouter",
            "category": "General Text",
            "context_window": 262144,
            "description": "91 t/s high throughput assistant model.",
            "is_free": True
        },
        {
            "id": "nvidia/nemotron-3-nano-omni:free",
            "name": "NVIDIA: Nemotron 3 Nano Omni (free)",
            "provider": "OpenRouter",
            "category": "Multimodal & Speech",
            "context_window": 256000,
            "description": "Multimodal Omni model supporting text and structured tasks.",
            "is_free": True
        },
        {
            "id": "google/gemma-4-26b-a4b:free",
            "name": "Google: Gemma 4 26B A4B (free)",
            "provider": "OpenRouter",
            "category": "Vision & Text",
            "context_window": 262144,
            "description": "Google Gemma 4 vision and text instruction model.",
            "is_free": True
        },
        {
            "id": "nvidia/nemotron-nano-9b-v2:free",
            "name": "NVIDIA: Nemotron Nano 9B V2 (free)",
            "provider": "OpenRouter",
            "category": "Fast Text",
            "context_window": 128000,
            "description": "Lightweight Nemotron Nano v2 instruction model.",
            "is_free": True
        },
        {
            "id": "openai/gpt-oss-20b:free",
            "name": "OpenAI: gpt-oss-20b (free)",
            "provider": "OpenRouter",
            "category": "Reasoning & Tool Use",
            "context_window": 131072,
            "description": "OpenAI open source 20B reasoning architecture.",
            "is_free": True
        },
        {
            "id": "google/gemma-4-31b:free",
            "name": "Google: Gemma 4 31B (free)",
            "provider": "OpenRouter",
            "category": "General Text",
            "context_window": 262144,
            "description": "Google Gemma 4 31B parameter instruction model.",
            "is_free": True
        },
        {
            "id": "nvidia/nemotron-3.5-content-safety:free",
            "name": "NVIDIA: Nemotron 3.5 Content Safety (free)",
            "provider": "OpenRouter",
            "category": "Safety & Moderation",
            "context_window": 128000,
            "description": "Ultra fast safety moderation & content filter engine.",
            "is_free": True
        },
        {
            "id": "openai/gpt-oss-120b",
            "name": "OpenAI: GPT OSS 120B",
            "provider": "OpenRouter",
            "category": "Advanced Reasoning",
            "context_window": 128000,
            "description": "Flagship 120B reasoning model for multi-step agent planning.",
            "is_free": False
        },
        {
            "id": "qwen/qwen-3.6-27b",
            "name": "Qwen 3.6 27B Instruct",
            "provider": "OpenRouter",
            "category": "Multilingual & Coding",
            "context_window": 32768,
            "description": "Qwen 3.6 high intelligence multilingual and tool calling model.",
            "is_free": False
        }
    ]

    # Database Configuration (Default: Supabase PostgreSQL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres.yrhykpojdsehesmwhuqk:94VgnJAkECwGZz04@aws-0-us-east-1.pooler.supabase.com:5432/postgres")

settings = Settings()
