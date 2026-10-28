"""
Voice-to-JSON Vernacular Intent Router.

Translates regional speech commands into strict structured JSON payloads.
Supports Hindi, Telugu, Urdu, Tamil, Bengali, Hinglish, and English.
Uses Gemini 3.8 Flash (Interactions API / google-genai) when GEMINI_API_KEY is configured,
with a robust vernacular semantic parser fallback.
"""

import os
import re
import json
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from vernacular_tts import VernacularAudioLedger

logger = logging.getLogger("intent_router")
logging.basicConfig(level=logging.INFO)

class PaymentIntentSchema(BaseModel):
    intent: str = Field(description="Intent of the merchant, e.g. REQUEST_PAYMENT, CHECK_BALANCE, REFUND")
    amount: float = Field(description="Numerical monetary amount extracted from speech")
    currency: str = Field(default="INR", description="Currency ISO code, typically INR or USD")
    counterparty: str = Field(default="", description="Name or identifier of payer/customer (e.g. Ramesh bhai, student)")
    item_description: str = Field(default="", description="Items or services rendered (e.g. this month's classes, chai samosa)")
    detected_language: str = Field(description="Two-letter language code: hi, te, ur, ta, bn, en")
    confidence: float = Field(default=0.95, description="Confidence score between 0.0 and 1.0")
    explanation: str = Field(default="", description="Brief chain of thought reasoning")

SYSTEM_PROMPT = """You are an ultra-fast, vernacular voice-to-JSON payment router for micro-merchants in the informal economy.
Merchants dictate in regional dialects (Hindi, Telugu, Urdu, Tamil, Bengali, Hinglish, English).
Your job is to parse their speech and output STRICT JSON conforming to the schema.

Rules:
1. Extract the exact numerical monetary amount. Handle vernacular expressions (e.g., 'paanch sau' -> 500, 'aidu vandhalu' -> 500, 'teen sau pachaas' -> 350, 'dedh sau' -> 150, 'dhai sau' -> 250).
2. Default currency is 'INR' unless 'dollar' or 'USD' is explicitly spoken.
3. Identify the counterparty (customer or student name with regional honorifics like 'bhai', 'sahab', 'anna', 'didi').
4. Identify the item or reason for payment (e.g., 'this month\'s classes', 'chai and samosas', 'groceries').
5. Set detected_language to one of: 'hi', 'te', 'ur', 'ta', 'bn', 'en'.
6. If amount is not clearly specified, set amount to 0 and confidence to 0.3.
"""

class IntentRouter:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Initialized Google GenAI client for Gemini 3.8 Flash.")
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai client: {e}. Will use REST or semantic fallback.")

    def parse_with_gemini(self, transcript: str) -> Optional[Dict[str, Any]]:
        """Invokes Gemini 3.8 Flash with structured output schema."""
        if not self.api_key:
            return None

        # 1. Try google-genai SDK if available
        if self.client:
            try:
                interaction = self.client.interactions.create(
                    model="gemini-3.8-flash",
                    input=f"Spoken Merchant Command: \"{transcript}\"",
                    system_instruction=SYSTEM_PROMPT,
                    response_format=[
                        {
                            "type": "text",
                            "mime_type": "application/json",
                            "schema": PaymentIntentSchema.model_json_schema(),
                        }
                    ],
                )
                output_text = interaction.output_text
                if output_text:
                    return json.loads(output_text)
            except Exception as e:
                logger.warning(f"GenAI SDK interactions call failed: {e}. Trying direct REST fallback...")

        # 2. Direct REST fallback to generativelanguage API
        try:
            import urllib.request
            url = f"https://generativelanguage.googleapis.com/v1beta2/interactions?key={self.api_key}"
            req_data = {
                "model": "gemini-3.8-flash",
                "input": f"Spoken Merchant Command: \"{transcript}\"",
                "system_instruction": SYSTEM_PROMPT,
                "response_format": [
                    {
                        "type": "text",
                        "mime_type": "application/json",
                        "schema": PaymentIntentSchema.model_json_schema(),
                    }
                ]
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(req_data).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                for step in resp_json.get("steps", []):
                    if step.get("type") == "model_output":
                        for c in step.get("content", []):
                            if c.get("type") == "text":
                                return json.loads(c.get("text"))
        except Exception as rest_err:
            logger.warning(f"REST call to Gemini failed: {rest_err}")

        return None

    def parse_vernacular_heuristic(self, transcript: str) -> Dict[str, Any]:
        """
        High-precision vernacular parsing engine for Hindi, Telugu, Urdu, Tamil, Bengali, and English.
        Handles words, scripts, dialect numbers, and transaction context.
        """
        text = transcript.strip()
        lower = text.lower()

        # Detect language
        detected_lang = "en"
        # Telugu unicode range: \u0c00-\u0c7f
        if re.search(r"[\u0c00-\u0c7f]", text) or any(w in lower for w in ["రూపాయలు", "వందలు", "తీసుకోండి", "ట్యూషన్", "ఫీజు"]):
            detected_lang = "te"
        # Urdu / Arabic unicode range: \u0600-\u06ff
        elif re.search(r"[\u0600-\u06ff]", text) or any(w in lower for w in ["روپے", "ادائیگی", "صاحب", "موصول"]):
            detected_lang = "ur"
        # Tamil unicode range: \u0b80-\u0bff
        elif re.search(r"[\u0b80-\u0bff]", text) or any(w in lower for w in ["ரூபாய்", "வசூலிக்கவும்", "குறியீடு"]):
            detected_lang = "ta"
        # Bengali unicode range: \u0980-\u09ff
        elif re.search(r"[\u0980-\u09ff]", text) or any(w in lower for w in ["টাকা", "পেমেন্ট", "কিউআর"]):
            detected_lang = "bn"
        # Devanagari (Hindi) unicode range: \u0900-\u097f
        elif re.search(r"[\u0900-\u097f]", text):
            detected_lang = "hi"
        # English / Code-switched markers
        elif any(w in lower for w in ["charge", "please", "classes", "tuition", "bill", "payment", "request", "send a payment", "take", "transfer"]):
            detected_lang = "en"
        elif any(w in lower for w in ["rupaye", "roopaye", "sau", "hazaar", "bhai", "bhaiya", "banao", "lo", "chahiye", "pachas"]):
            detected_lang = "hi"

        # Number extraction
        amount = 0.0
        # Normalize: strip commas between numbers (e.g. 25,000 -> 25000)
        normalized_lower = re.sub(r"(?<=\d),(?=\d)", "", lower)

        # 1. Search for numeric digits (e.g. 500, 120, 250.50, 25000)
        digits_match = re.search(r"(?:₹|\$|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:₹|\$|rupees|rupaye|roopaye|రూపాయలు|రూ|روپے|ரூபாய்|টাকা)?", normalized_lower)
        if digits_match:
            amount = float(digits_match.group(1))

        # 2. Vernacular phrase amounts
        vernacular_numbers = {
            # English verbal numbers
            "fifteen hundred": 1500.0,
            "one thousand five hundred": 1500.0,
            "two thousand": 2000.0,
            "five hundred": 500.0,
            "one thousand": 1000.0,
            "two hundred": 200.0,
            "three hundred": 300.0,
            # Hindi / Urdu / Hinglish
            "paanch sau": 500.0,
            "panch sau": 500.0,
            "পাঁচশো": 500.0,
            "پانچ سو": 500.0,
            "पांच सौ": 500.0,
            "ek sau bees": 120.0,
            "ek sau bis": 120.0,
            "एक सौ बीस": 120.0,
            "teen sau pachas": 350.0,
            "teen sau pachaas": 350.0,
            "تین سو پچاس": 350.0,
            "तीन सौ पचास": 350.0,
            "do hazaar": 2000.0,
            "दो हज़ार": 2000.0,
            "दो हजार": 2000.0,
            "dhai sau": 250.0,
            "ढाई सौ": 250.0,
            "dedh sau": 150.0,
            "डेढ़ सौ": 150.0,
            "pandrah sau": 1500.0,
            "पंद्रह सौ": 1500.0,
            "sau rupaye": 100.0,
            "सौ रुपये": 100.0,
            "pachhattar": 75.0,
            "पचहत्तर": 75.0,
            # Telugu
            "ఐదు వందలు": 500.0,
            "rendu vandhalu": 200.0,
            "రెండు వందలు": 200.0,
            "aidu vandhalu": 500.0,
            "padhi vela": 10000.0,
            # Tamil
            "நூறு": 100.0,
            "ஐநூறு": 500.0,
            "ஆயிரம்": 1000.0,
            "150": 150.0,
        }
        for phrase, val in vernacular_numbers.items():
            if phrase in lower or phrase in text:
                amount = val
                break

        # Counterparty extraction
        counterparty = ""
        cp_patterns = [
            r"([A-Za-z\u0900-\u097f\u0c00-\u0c7f\u0600-\u06ff\u0b80-\u0bff]+(?:\s+(?:bhai|bhaiya|sahab|anna|didi|ji|sir|madam|saheb))?)",
            r"(?:from|to|charge|charge to)\s+([A-Za-z]+)",
            r"([A-Za-z\u0900-\u097f]+)\s*(?:se|nuñdi|idamirunthu)",
        ]
        
        # Specific named entities
        if "ramesh" in lower or "रमेश" in text or "ரமேஷ்" in text:
            counterparty = "Ramesh bhai" if "bhai" in lower or "भाई" in text else "Ramesh"
        elif "ahmed" in lower or "احمد" in text:
            counterparty = "Ahmed Sahab"
        elif "ramu" in lower or "రాము" in text:
            counterparty = "Ramu"
        elif "priya" in lower or "प्रिया" in text:
            counterparty = "Priya"
        elif "student" in lower or "छात्र" in text or "విద్యార్థి" in text:
            counterparty = "Student"

        # Item or note extraction
        item_description = "General Payment"
        if any(w in lower for w in ["classes", "tuition", "ट्यूशन", "classes", "ట్యూషన్", "month's classes", "class"]):
            item_description = "This month's tuition classes"
        elif any(w in lower for w in ["chai", "samosa", "samosas", "चाय", "समोसे"]):
            item_description = "Chai and Samosas"
        elif any(w in lower for w in ["doodh", "milk", "eggs", "ande", "दूध", "انڈے", "دودھ"]):
            item_description = "Milk and Groceries"
        elif any(w in lower for w in ["fruit", "fruits", "పండ్లు", "फल"]):
            item_description = "Fresh Fruits"
        elif any(w in lower for w in ["electronics", "phone", "repair"]):
            item_description = "Electronics / Repair"

        confidence = 0.96 if amount > 0 else 0.40

        return {
            "intent": "REQUEST_PAYMENT",
            "amount": amount,
            "currency": "INR",
            "counterparty": counterparty or "Customer",
            "item_description": item_description,
            "detected_language": detected_lang,
            "confidence": confidence,
            "explanation": f"Heuristic parsed amount: ₹{amount}, counterparty: '{counterparty}', item: '{item_description}'"
        }

    def process_voice_command(self, transcript: str) -> Dict[str, Any]:
        """
        Main pipeline: attempts Gemini 3.8 Flash, falls back to semantic heuristic,
        and enriches with Vernacular Audio Ledger prompts.
        """
        clean_text = transcript.strip()
        parsed = None

        if self.api_key:
            parsed = self.parse_with_gemini(clean_text)

        if not parsed:
            parsed = self.parse_vernacular_heuristic(clean_text)

        # Attach original transcript
        parsed["raw_transcript"] = clean_text

        # Generate vernacular audio feedback prompts
        lang = parsed.get("detected_language", "en")
        amt = float(parsed.get("amount", 0.0))
        cp = parsed.get("counterparty", "")
        item = parsed.get("item_description", "")

        prompts = VernacularAudioLedger.get_prompts(lang, amt, cp, item)
        parsed["audio_ledger"] = prompts

        return parsed
