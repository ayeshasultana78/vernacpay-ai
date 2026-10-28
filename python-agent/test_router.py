import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from intent_router import IntentRouter
from guardrails import CommerceGuardrail

router = IntentRouter()
guardrails = CommerceGuardrail()

tests = [
    "रमेश भाई से चाय और समोसे के 120 रुपये लो",
    "ఈ నెల ట్యూషన్ ఫీజు 500 రూపాయలు తీసుకోండి",
    "احمد صاحب سے دودھ اور انڈے کے 350 روپے لو",
    "Charge 500 rupees for this month's classes",
    "Charge 25000 rupees for high value electronics"
]

print("=== RUNNING VERNACULAR MICRO-COMMERCE ROUTER TESTS ===")
all_passed = True
for t in tests:
    res = router.process_voice_command(t)
    gr = guardrails.evaluate_intent_payload(res)
    amt = res.get("amount")
    lang = res.get("detected_language")
    cp = res.get("counterparty")
    safe = gr.get("passed")
    status = gr.get("status")
    speech = res.get("audio_ledger", {}).get("qr_created_speech", "")

    print(f"\n[Spoken]: {t}")
    print(f" -> Extracted Amount: Rs {amt} | Lang: {lang} | Counterparty: {cp}")
    print(f" -> Guardrail Passed: {safe} ({status})")
    print(f" -> Merchant Audio Prompt: {speech}")

    if "25000" in t:
        if safe != False:
            all_passed = False
            print("FAILED: High-value limit should have blocked 25000")
    else:
        if amt <= 0 or not safe:
            all_passed = False
            print(f"FAILED on test: {t}")

print("\n" + ("ALL TESTS PASSED SUCCESSFULLY!" if all_passed else "SOME TESTS FAILED"))
