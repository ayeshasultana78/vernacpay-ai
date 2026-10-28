# ⚖️ Engineering, Security & Financial Guardrail Rules

## Project: VernacPay AI
**Document Status:** Mandatory Engineering Standard  
**Last Updated:** 2026-10-28  

All developers, contributors, and autonomous agents modifying the VernacPay AI codebase MUST strictly adhere to the rules outlined in this document.

---

## 1. Financial Guardrails & Boundary Rules (RULE-FIN)

### RULE-FIN-01: Hard Micro-Commerce Monetary Cap
- **Maximum Transaction Limit:** Single transactions must never exceed **₹10,000 INR** (or **$150 USD**).
- **Enforcement:** Validation MUST occur in the backend Python layer (`guardrails.py`) *before* any call to payment tokenization APIs.
- **Action on Violation:**
  - Status must be set to `EXCEEDS_MICRO_LIMIT`.
  - Token/QR generation must be halted.
  - Spoken rejection prompt must be dispatched to the merchant.
  - Transaction must be logged in the ledger as `REJECTED_GUARDRAIL`.

### RULE-FIN-02: Positive Amount & Non-Zero Sanity
- Transactions with amount `<= 0.00` are strictly forbidden.
- Zero or negative amounts must fail validation with status `REJECTED_ZERO_OR_NEGATIVE`.

### RULE-FIN-03: Immutable Beneficiary Payout Address
- The recipient/merchant identifier (`MERCHANT_UPI_VPA` and PayPal Client ID) MUST be sourced exclusively from environment variables or cryptographically signed merchant session tokens.
- **Rule:** The AI agent / LLM MUST NEVER be allowed to specify, override, or alter the payment recipient account.

### RULE-FIN-04: Currency Whitelist
- Supported currencies are strictly limited to `["INR", "USD"]`. Any unsupported currency token defaults to `INR` or fails with an explicit validation error.

---

## 2. AI Safety & Fund Isolation Rules (RULE-SEC)

### RULE-SEC-01: AI Quarantine from Fund Custody
- The Generative AI model (Gemini 3.8 Flash) is strictly an **analytical intent router**.
- The AI has **zero access** to merchant bank login sessions, private keys, or wallet balances.
- The AI's output is treated as **untrusted user input** until sanitized and verified by deterministic business logic in `guardrails.py`.

### RULE-SEC-02: Prompt Injection Scrubbing
- All user-supplied spoken or transcribed strings must be scanned against blacklisted injection signatures (e.g., `ignore previous instructions`, `bypass safety`, `drain wallet`, `transfer to external`).
- Transcripts containing malicious patterns must immediately terminate with `BLOCKED_SECURITY_VIOLATION`.

### RULE-SEC-03: Ephemeral Audio Handling & Privacy
- Audio recorded via the client microphone must NOT be permanently stored on disk or used for model retraining without explicit consent.
- Transcripts stored in `data/ledger.json` must exclude sensitive personal identification numbers (PINs, card CVVs, or OTPs).

---

## 3. Codebase & Architectural Standards (RULE-DEV)

### RULE-DEV-01: Deterministic Fallback Principle
- If external cloud dependencies (e.g., Google Gemini API or PayPal API) become unreachable, the application MUST seamlessly degrade to:
  1. The integrated **Vernacular Heuristic NLP Parser** (`parse_vernacular_heuristic`).
  2. The **Autonomous Agentic Sandbox Tokenizer**.
- The user interface must never crash or display raw 500 stack traces to the merchant.

### RULE-DEV-02: UTF-8 Encoding for Indic Scripts
- All source files, stdout handlers, and API payloads handling Indic languages (Devanagari, Telugu, Nastaliq/Urdu, Tamil, Bengali) MUST explicitly specify `UTF-8` encoding.
- In Python, `sys.stdout.reconfigure(encoding='utf-8')` must be enforced to prevent `cp1252` encoding exceptions on Windows environments.

### RULE-DEV-03: Separation of Responsibilities
- **`python-agent/`**: Solely responsible for speech parsing, intent structuring, guardrails, and phonetic NLP.
- **`node-commerce/`**: Solely responsible for payment order tokenization, QR code rasterization, SSE broadcasting, and transaction ledger persistence.
- **`public/`**: Solely responsible for presentation, microphone capture, Web Audio soundbox synthesis, and customer settlement simulation.

---

## 4. Vernacular Audio & Ergonomics Rules (RULE-UX)

### RULE-UX-01: Honorifics & Cultural Respect
- The intent parser MUST preserve vernacular honorifics when identifying counterparties:
  - Hindi: *bhai*, *bhaiya*, *didi*, *ji*, *masterji*
  - Urdu: *sahab*, *saheb*, *janab*
  - Telugu: *garu*, *anna*
  - Tamil: *anna*, *thambi*
- Preserving these honorifics in spoken confirmations ensures trust and natural merchant-customer dynamics.

### RULE-UX-02: Soundbox Chime-First Protocol
- Any spoken audio settlement announcement MUST be preceded by the signature multi-tone harmonic chime (E5 -> G#5 -> B5 -> E6).
- **Acoustic Rationale:** The chime alerts the merchant and primes their attention above ambient street noise *before* speech syllables begin.

### RULE-UX-03: Speech Rate & Pacing
- TTS playback speed must be calibrated to `0.95x` (slightly measured) to ensure intelligibility in crowded markets and noisy traffic environments.
