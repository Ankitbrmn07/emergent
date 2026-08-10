import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Buildr AI - Groq AI Agent Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "groq-agent-platform-super-secret-jwt-key-2026-buildr"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Groq API Configuration
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "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")
    DEFAULT_MODEL: str = "llama-3.3-70b-versatile"
    
    # Supported Groq Models
    AVAILABLE_GROQ_MODELS: list[dict] = [
        {
            "id": "llama-3.3-70b-versatile",
            "name": "Llama 3.3 70B Versatile",
            "provider": "Groq",
            "context_window": 128000,
            "description": "Most intelligent general model on Groq, ideal for reasoning, coding, & tool selection.",
            "recommended": True
        },
        {
            "id": "llama-3.1-8b-instant",
            "name": "Llama 3.1 8B Instant",
            "provider": "Groq",
            "context_window": 128000,
            "description": "Ultra-fast lightweight model for quick tasks and simple tool executions."
        },
        {
            "id": "deepseek-r1-distill-llama-70b",
            "name": "DeepSeek R1 Distill Llama 70B",
            "provider": "Groq",
            "context_window": 128000,
            "description": "Specialized reasoning model for complex logic, math, and analytical debugging."
        },
        {
            "id": "mixtral-8x7b-32768",
            "name": "Mixtral 8x7B Instruct",
            "provider": "Groq",
            "context_window": 32768,
            "description": "High-throughput Mixture of Experts model."
        },
        {
            "id": "gemma2-9b-it",
            "name": "Gemma 2 9B Instruct",
            "provider": "Groq",
            "context_window": 8192,
            "description": "Google lightweight instruction-tuned model."
        }
    ]
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./agent_platform.db")

    class Config:
        case_sensitive = True

settings = Settings()
