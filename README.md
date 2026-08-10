# BuildrAI — Production-Ready Multi-LLM AI Agent SaaS Platform

A professional, full-stack AI Agent SaaS platform built with **React, TypeScript, Vite, Tailwind CSS, FastAPI, SQLAlchemy, Supabase PostgreSQL**, powered by **Groq LPU Models** and **OpenRouter Network Models**.

---

## 🌟 New Feature: AI Speech & Audio Studio (`/speech`)

We have added a dedicated **AI Speech & Audio Studio** powered by the **Fish Audio S2.1 Pro (Free)** model on OpenRouter (`fish-audio/s2.1-pro-free:free`):

- **Fish Audio S2.1 Pro Model Engine**: Zero-shot speech synthesis with fast token generation and natural pitch intonation.
- **Dedicated Studio Dashboard (`/speech`)**:
  - Text-to-Speech prompt input with quick presets (Platform Greeting, Developer Pitch, Security Notice, Podcast Intro).
  - Target voice models (English Expressive, Studio Narrator, Casual Assistant, Spanish Natural, French Studio).
  - Real-time voice controls: Speaking rate (0.5x - 2.0x), Pitch adjustment, Cadence emotion selector.
  - Interactive Web Audio player with animated waveform visualization and speech script inspector.
- **Playground Audio Integration**: Added a **"Listen Speech 🔊"** button on every assistant message bubble in the Chat Playground (`/playground`).
- **REST API Endpoint**: `POST /api/v1/speech/synthesize` for programmatically generating speech scripts and voice audio representations.

---

## 🔑 Pre-Configured Provider API Keys

- **Groq API Key**: `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`
- **OpenRouter Speech Key**: `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`
- **Supabase Database**: `db.yrhykpojdsehesmwhuqk.supabase.co`

---

## 🚀 How to Run the Program

```powershell
# Terminal 1: Launch FastAPI Backend Server
cd backend
.\venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Launch Vite Frontend Dev Server
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

- **Web Application URL**: `http://127.0.0.1:5173`
- **Speech & Audio Studio**: `http://127.0.0.1:5173/speech`
