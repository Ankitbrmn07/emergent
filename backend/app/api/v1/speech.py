from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.openrouter_provider import OpenRouterProviderService
from app.core.config import settings

router = APIRouter(prefix="/speech", tags=["Speech & Audio Studio"])

class SynthesizeSpeechRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-expressive"
    speed: Optional[float] = 1.0
    model: Optional[str] = "fish-audio/s2.1-pro-free:free"
    api_key: Optional[str] = None

@router.post("/synthesize")
async def synthesize_speech(req: SynthesizeSpeechRequest) -> Dict[str, Any]:
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text parameter cannot be empty.")

    key_to_use = req.api_key or settings.OPENROUTER_API_KEY or "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"
    provider = OpenRouterProviderService(api_key=key_to_use)

    res = await provider.generate_speech(
        text=req.text,
        voice=req.voice or "en-US-expressive",
        speed=req.speed or 1.0,
        model=req.model or "fish-audio/s2.1-pro-free:free"
    )

    return {
        "status": "success",
        "model": req.model or "fish-audio/s2.1-pro-free:free",
        "provider": "OpenRouter / Fish Audio",
        "voice": req.voice,
        "speed": req.speed,
        "text": req.text,
        "speech_script": res.get("speech_script"),
        "latency_ms": res.get("latency_ms", 310)
    }

@router.get("/voices")
async def get_available_voices():
    return {
        "provider": "Fish Audio / OpenRouter",
        "model": "fish-audio/s2.1-pro-free:free",
        "voices": [
            {"id": "en-US-expressive", "name": "Fish Voice — English Expressive", "gender": "Female", "language": "English"},
            {"id": "en-US-professional", "name": "Fish Voice — English Studio Narrator", "gender": "Male", "language": "English"},
            {"id": "en-US-conversational", "name": "Fish Voice — Casual Assistant", "gender": "Neutral", "language": "English"},
            {"id": "es-ES-natural", "name": "Fish Voice — Spanish Natural", "gender": "Female", "language": "Spanish"},
            {"id": "fr-FR-studio", "name": "Fish Voice — French Studio", "gender": "Male", "language": "French"}
        ]
    }
