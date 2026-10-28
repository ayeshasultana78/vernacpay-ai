"""
FastAPI Server for Voice-Native Vernacular Micro-Commerce Agent.
Exposes endpoints for voice-to-JSON intent routing, micro-commerce guardrails, and audio prompts.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from intent_router import IntentRouter
from guardrails import CommerceGuardrail
from vernacular_tts import VernacularAudioLedger

app = FastAPI(
    title="VernacPay AI Agent Engine",
    description="Vernacular Voice-to-JSON Micro-Commerce AI Agent with Isolated Financial Guardrails",
    version="1.0.0"
)

# Enable CORS for local dev and frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = IntentRouter()
guardrails = CommerceGuardrail(max_limit_inr=10000.0, max_limit_usd=150.0)

class VoiceCommandRequest(BaseModel):
    transcript: str = Field(description="Spoken command transcript from speech recognition or audio")
    audio_base64: Optional[str] = Field(default=None, description="Optional raw audio base64")
    merchant_id: Optional[str] = Field(default="merchant_001", description="Merchant unique identifier")

class GuardrailCheckRequest(BaseModel):
    amount: float
    currency: Optional[str] = "INR"

DEMO_PROMPTS = [
    {
        "id": "hi_vendor",
        "lang": "hi",
        "language_name": "हिन्दी (Hindi)",
        "role": "Street Tea & Snack Vendor",
        "icon": "☕",
        "transcript": "रमेश भाई से चाय और समोसे के 120 रुपये लो",
        "expected_amount": 120,
        "description": "Chai stall owner charging regular customer for evening snacks"
    },
    {
        "id": "te_tutor",
        "lang": "te",
        "language_name": "తెలుగు (Telugu)",
        "role": "Local Math Tutor",
        "icon": "📚",
        "transcript": "ఈ నెల ట్యూషన్ ఫీజు 500 రూపాయలు తీసుకోండి",
        "expected_amount": 500,
        "description": "Neighborhood tutor requesting monthly tuition fee"
    },
    {
        "id": "ur_grocer",
        "lang": "ur",
        "language_name": "اردو (Urdu)",
        "role": "Neighborhood Kirana / Dairy",
        "icon": "🥛",
        "transcript": "احمد صاحب سے دودھ اور انڈے کے 350 روپے لو",
        "expected_amount": 350,
        "description": "Local dairy shopkeeper generating bill for essentials"
    },
    {
        "id": "ta_autorickshaw",
        "lang": "ta",
        "language_name": "தமிழ் (Tamil)",
        "role": "Auto Rickshaw Driver",
        "icon": "🛺",
        "transcript": "ரமேஷ் அண்ணாவிடம் 150 ரூபாய் வசூலிக்கவும்",
        "expected_amount": 150,
        "description": "Driver collecting meter fare upon destination arrival"
    },
    {
        "id": "en_classes",
        "lang": "en",
        "language_name": "English / Hinglish",
        "role": "Freelance Home Tutor",
        "icon": "🎓",
        "transcript": "Charge 500 rupees for this month's classes",
        "expected_amount": 500,
        "description": "Standard vernacular micro-commerce tuition command"
    },
    {
        "id": "safety_violation",
        "lang": "en",
        "language_name": "Safety Boundary Test",
        "role": "High-Value Transaction (Exceeds Limit)",
        "icon": "🛡️",
        "transcript": "Charge 25,000 rupees for high value electronics and phones",
        "expected_amount": 25000,
        "description": "Triggers automated micro-commerce guardrail safety block"
    }
]

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "VernacPay-Python-AI-Engine",
        "gemini_active": router.api_key is not None,
        "model": "gemini-3.8-flash"
    }

@app.get("/api/agent/demo-samples")
def get_demo_samples():
    """Return pre-curated regional micro-commerce commands for immediate 1-click verification."""
    return {"samples": DEMO_PROMPTS}

@app.post("/api/agent/parse-command")
def parse_voice_command(request: VoiceCommandRequest):
    """
    Core Voice-to-JSON Intent Routing Endpoint:
    1. Parses speech into structured JSON payload.
    2. Runs safety guardrails (transaction bounds, injection defense).
    3. Returns approved payload + audio ledger prompts.
    """
    transcript = request.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Spoken transcript cannot be empty.")

    # 1. Voice-to-JSON Intent Extraction
    intent_payload = router.process_voice_command(transcript)

    # 2. Safety Architecture: Evaluate against micro-commerce bounds
    guardrail_result = guardrails.evaluate_intent_payload(intent_payload)

    # If guardrail fails, inject vernacular rejection audio prompt
    if not guardrail_result["passed"]:
        rejection_audio = VernacularAudioLedger.get_rejection_prompt(
            lang=intent_payload.get("detected_language", "en"),
            amount=intent_payload.get("amount", 0.0),
            max_allowed=guardrails.max_limit_inr
        )
        guardrail_result["rejection_audio"] = rejection_audio

    return {
        "success": True,
        "intent_payload": intent_payload,
        "guardrail": guardrail_result,
        "merchant_id": request.merchant_id
    }

@app.post("/api/agent/validate-guardrail")
def validate_guardrail(request: GuardrailCheckRequest):
    passed, reason, meta = guardrails.validate_transaction_bounds(request.amount, request.currency or "INR")
    return {
        "passed": passed,
        "reason": reason,
        "metadata": meta
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
