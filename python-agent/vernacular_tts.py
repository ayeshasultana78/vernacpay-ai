"""
Vernacular Audio Ledger Prompt Generator.

Generates natural spoken phrases across regional languages for:
1. QR Code / Link Creation Prompt (Spoken immediately back to the merchant)
2. Settlement Confirmation Prompt (Spoken when funds clear - Soundbox 2.0)
3. Safety Rejection Prompt (Spoken when safety bounds are exceeded)
"""

from typing import Dict, Any

TEMPLATES = {
    "hi": {
        "name": "हिन्दी (Hindi)",
        "qr_created": "{counterparty_prefix}₹{amount} का क्यूआर कोड तैयार है। {action_suffix}",
        "settled": "पेमेंट प्राप्त हुआ! {counterparty_text}₹{amount} सफल।",
        "rejected_limit": "अलर्ट! {amount} रुपये की सीमा बहुत अधिक है। अधिकतम सीमा {max_allowed} रुपये है।",
        "clarify": "कृपया राशि स्पष्ट करें। क्या आप पेमेंट का क्यूआर कोड बनाना चाहते हैं?",
        "lang_code": "hi-IN",
        "default_counterparty": "ग्राहक"
    },
    "te": {
        "name": "తెలుగు (Telugu)",
        "qr_created": "{amount} రూపాయల చెల్లింపు కోడ్ సిద్ధంగా ఉంది. {counterparty_suffix}",
        "settled": "చెల్లింపు పూర్తయింది! {counterparty_text}{amount} రూపాయలు విజయవంతంగా స్వీకరించబడ్డాయి.",
        "rejected_limit": "హెచ్చరిక! {amount} రూపాయలు పరిమితి దాటింది. గరిష్ట పరిమితి {max_allowed} రూపాయలు.",
        "clarify": "దయచేసి మొత్తం వివరంగా చెప్పండి.",
        "lang_code": "te-IN",
        "default_counterparty": "కస్టమర్"
    },
    "ur": {
        "name": "اردو (Urdu)",
        "qr_created": "{amount} روپے کا کیو آر کوڈ بن چکا ہے۔ {counterparty_suffix}",
        "settled": "ادائیگی موصول ہو گئی! {counterparty_text}{amount} روپے موصول ہو گئے۔",
        "rejected_limit": "خبردار! {amount} روپے کی رقم مائیکرو کامرس حد سے زیادہ ہے۔ زیادہ سے زیادہ حد {max_allowed} روپے ہے۔",
        "clarify": "براہ کرم رقم واضح طور پر بتائیں۔",
        "lang_code": "ur-PK",
        "default_counterparty": "گاہک"
    },
    "ta": {
        "name": "தமிழ் (Tamil)",
        "qr_created": "{amount} ரூபாய் க்யூஆர் குறியீடு தயாராக உள்ளது. {counterparty_suffix}",
        "settled": "பணம் பெறப்பட்டது! {counterparty_text}{amount} ரூபாய் வெற்றிகரமாக சேர்ந்தது.",
        "rejected_limit": "எச்சரிக்கை! {amount} ரூபாய் அனுமதிக்கப்பட்ட வரம்பை தாண்டியுள்ளது. அதிகபட்சம் {max_allowed} ரூபாய்.",
        "clarify": "தயவுசெய்து தொகையை தெளிவாக கூறவும்.",
        "lang_code": "ta-IN",
        "default_counterparty": "வாடிக்கையாளர்"
    },
    "bn": {
        "name": "বাংলা (Bengali)",
        "qr_created": "{amount} টাকার কিউআর কোড প্রস্তুত হয়েছে। {counterparty_suffix}",
        "settled": "পেমেন্ট সম্পন্ন হয়েছে! {counterparty_text}{amount} টাকা সফলভাবে পাওয়া গেছে।",
        "rejected_limit": "সতর্কতা! {amount} টাকার পরিমাণ অনুমোদিত সীমার বেশি। সর্বোচ্চ সীমা {max_allowed} টাকা।",
        "clarify": "অনুগ্রহ করে টাকার পরিমাণ স্পষ্ট করে বলুন।",
        "lang_code": "bn-IN",
        "default_counterparty": "গ্রাহক"
    },
    "en": {
        "name": "English",
        "qr_created": "Payment QR code for ₹{amount} is ready. {action_suffix}",
        "settled": "Payment received! ₹{amount} from {counterparty_text} cleared successfully.",
        "rejected_limit": "Security Alert! Amount of ₹{amount} exceeds micro-commerce boundary of ₹{max_allowed}.",
        "clarify": "Could you clarify the payment amount?",
        "lang_code": "en-IN",
        "default_counterparty": "customer"
    }
}

class VernacularAudioLedger:
    @staticmethod
    def get_prompts(lang: str, amount: float, counterparty: str = "", note: str = "") -> Dict[str, str]:
        l = lang.lower() if lang else "en"
        if l not in TEMPLATES:
            # Fallback heuristics for Hinglish / dialect codes
            if "hi" in l or "hin" in l:
                l = "hi"
            elif "te" in l or "tel" in l:
                l = "te"
            elif "ur" in l or "urd" in l:
                l = "ur"
            elif "ta" in l or "tam" in l:
                l = "ta"
            elif "bn" in l or "ben" in l:
                l = "bn"
            else:
                l = "en"

        tpl = TEMPLATES[l]
        amt_str = f"{amount:g}"

        # Localized suffixes based on counterparty
        if l == "hi":
            prefix = f"{counterparty} से " if counterparty else ""
            suffix = f"{counterparty} से स्कैन करवाएं।" if counterparty else "ग्राहक से स्कैन करवाएं।"
            settled_cp = f"{counterparty} से " if counterparty else ""
            created_msg = tpl["qr_created"].format(counterparty_prefix=prefix, amount=amt_str, action_suffix=suffix)
            settled_msg = tpl["settled"].format(counterparty_text=settled_cp, amount=amt_str)
        elif l == "te":
            suffix = f"{counterparty}కి చూపించండి." if counterparty else "కస్టమర్‌కి చూపించండి."
            settled_cp = f"{counterparty} నుండి " if counterparty else ""
            created_msg = tpl["qr_created"].format(amount=amt_str, counterparty_suffix=suffix)
            settled_msg = tpl["settled"].format(counterparty_text=settled_cp, amount=amt_str)
        elif l == "ur":
            suffix = f"{counterparty} سے اسکین کروائیں۔" if counterparty else "گاہک سے اسکین کروائیں۔"
            settled_cp = f"{counterparty} سے " if counterparty else ""
            created_msg = tpl["qr_created"].format(amount=amt_str, counterparty_suffix=suffix)
            settled_msg = tpl["settled"].format(counterparty_text=settled_cp, amount=amt_str)
        elif l == "ta":
            suffix = f"{counterparty} இடம் ஸ்கேன் செய்யச் சொல்லுங்கள்." if counterparty else "வாடிக்கையாளரிடம் காண்பிக்கவும்."
            settled_cp = f"{counterparty} இடமிருந்து " if counterparty else ""
            created_msg = tpl["qr_created"].format(amount=amt_str, counterparty_suffix=suffix)
            settled_msg = tpl["settled"].format(counterparty_text=settled_cp, amount=amt_str)
        elif l == "bn":
            suffix = f"{counterparty}-কে দেখান।" if counterparty else "গ্রাহককে দেখান।"
            settled_cp = f"{counterparty} থেকে " if counterparty else ""
            created_msg = tpl["qr_created"].format(amount=amt_str, counterparty_suffix=suffix)
            settled_msg = tpl["settled"].format(counterparty_text=settled_cp, amount=amt_str)
        else: # en
            suffix = f"Ask {counterparty} to scan." if counterparty else "Ready for customer scan."
            settled_cp = f"{counterparty} " if counterparty else "customer "
            created_msg = tpl["qr_created"].format(amount=amt_str, action_suffix=suffix)
            settled_msg = tpl["settled"].format(counterparty_text=settled_cp, amount=amt_str)

        return {
            "lang": l,
            "lang_code": tpl["lang_code"],
            "language_name": tpl["name"],
            "qr_created_speech": created_msg,
            "settled_speech": settled_msg
        }

    @staticmethod
    def get_rejection_prompt(lang: str, amount: float, max_allowed: float) -> Dict[str, str]:
        l = lang.lower() if lang in TEMPLATES else "en"
        tpl = TEMPLATES[l]
        msg = tpl["rejected_limit"].format(amount=f"{amount:g}", max_allowed=f"{max_allowed:g}")
        return {
            "lang": l,
            "lang_code": tpl["lang_code"],
            "speech": msg
        }
