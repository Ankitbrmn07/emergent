import sys
import os

# Add backend root directory to sys.path so app modules import cleanly on Vercel
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Vercel Serverless Function Entry Point
handler = app
