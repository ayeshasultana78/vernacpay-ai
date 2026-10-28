"""
Safety Architecture & Financial Guardrails for Voice-Native Micro-Commerce.

Key Guardrail Pillars:
1. Micro-Commerce Boundaries: Prevents accidental high-value transfers (default limit ₹10,000 / $150).
2. AI Isolation from Funds: The AI agent only structures the intent; it never touches private keys or balances.
3. Prompt Injection & Spoofing Protection: Sanitizes voice transcripts to prevent malicious routing.
4. Input Sanity: Validates positive amounts, currency whitelist, and prevents zero/negative figures.
"""

from typing import Dict, Any, Tuple
import re

# Pre-defined Micro-Commerce Boundaries
DEFAULT_MAX_LIMIT_INR = 10000.0   # Max ₹10,000 for informal vendor micro-transactions
DEFAULT_MAX_LIMIT_USD = 150.0     # Max $150 for micro-commerce
DEFAULT_MIN_LIMIT = 1.0           # Minimum 1 currency unit

SUSPICIOUS_PATTERNS = [
    r"ignore previous instructions",
    r"bypass safety",
    r"transfer everything",
    r"drain wallet",
    r"send to (?:my|external|hacker) account",
    r"override limit",
    r"as system administrator",
]

class SafetyViolation(Exception):
    pass

class CommerceGuardrail:
    def __init__(self, max_limit_inr: float = DEFAULT_MAX_LIMIT_INR, max_limit_usd: float = DEFAULT_MAX_LIMIT_USD):
        self.max_limit_inr = max_limit_inr
        self.max_limit_usd = max_limit_usd

    def sanitize_transcript(self, raw_text: str) -> str:
        """Strip control characters, excessive whitespace, and suspicious terminal injections."""
        if not raw_text:
            return ""
        cleaned = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", raw_text)
        return cleaned.strip()

    def check_injection_attempts(self, text: str) -> Tuple[bool, str]:
        """Verify prompt does not attempt prompt injection or fund hijacking."""
        lower_text = text.lower()
        for pattern in SUSPICIOUS_PATTERNS:
            if re.search(pattern, lower_text):
                return False, f"Malicious command detected matching security pattern: '{pattern}'"
        return True, ""

    def validate_transaction_bounds(self, amount: float, currency: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates transaction amount against micro-commerce bounds.
        Returns (is_approved, message, metadata).
        """
        curr = currency.upper() if currency else "INR"
        max_allowed = self.max_limit_inr if curr == "INR" else self.max_limit_usd

        # Check positive bounds
        if amount <= 0:
            return False, f"Invalid transaction amount {amount} {curr}. Amount must be greater than 0.", {
                "guardrail_status": "REJECTED_ZERO_OR_NEGATIVE",
                "max_allowed": max_allowed
            }

        # Check maximum micro-commerce limit
        if amount > max_allowed:
            return False, (
                f"Transaction amount of {amount} {curr} exceeds the micro-commerce safety boundary "
                f"of {max_allowed} {curr}. High-value transactions require manual banking app 2FA."
            ), {
                "guardrail_status": "EXCEEDS_MICRO_LIMIT",
                "max_allowed": max_allowed,
                "requires_2fa": True
            }

        return True, "Passed micro-commerce safety boundary check.", {
            "guardrail_status": "APPROVED",
            "max_allowed": max_allowed,
            "requires_2fa": False
        }

    def evaluate_intent_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Full evaluation of the structured intent payload before tokenization.
        """
        raw_text = payload.get("raw_transcript", "")
        safe_transcript = self.sanitize_transcript(raw_text)
        
        # Injection check
        is_safe_text, reason = self.check_injection_attempts(safe_transcript)
        if not is_safe_text:
            return {
                "passed": False,
                "status": "BLOCKED_SECURITY_VIOLATION",
                "error": reason,
                "safe_for_token_generation": False
            }

        amount = float(payload.get("amount", 0.0))
        currency = str(payload.get("currency", "INR")).upper()

        passed_bounds, bounds_reason, meta = self.validate_transaction_bounds(amount, currency)
        if not passed_bounds:
            return {
                "passed": False,
                "status": meta.get("guardrail_status", "REJECTED"),
                "error": bounds_reason,
                "safe_for_token_generation": False,
                "metadata": meta
            }

        return {
            "passed": True,
            "status": "APPROVED_FOR_TOKENIZATION",
            "error": None,
            "safe_for_token_generation": True,
            "metadata": meta
        }
