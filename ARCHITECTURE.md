# 🏛️ System Architecture

## Project: VernacPay AI — Voice-Native, Vernacular Micro-Commerce Agent
**Architecture Version:** 1.0.0  
**Stack:** Python (FastAPI, Gemini 3.8 Flash) • Node.js (Express, PayPal Agentic Commerce) • Web Audio & Speech Client  

---

## 1. High-Level Architectural Topology

VernacPay AI uses an **air-gapped, dual-service architecture** that strictly decouples the non-deterministic Generative AI layer from the deterministic financial commerce and tokenization layer.

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer (Public Stall Terminal / Soundbox)"]
        UI["Vernacular Mobile Web UI"]
        Mic["Web Speech API (Push-to-Talk)"]
        AudioSynth["Web Audio Chime Synthesizer & TTS Engine"]
        SSEListener["SSE Real-Time Event Listener"]
    end

    subgraph PythonLayer["Python AI Agent Engine (Port 8000)"]
        Router["Intent Router (intent_router.py)"]
        GeminiClient["Google GenAI SDK (Gemini 3.8 Flash)"]
        HeuristicFallback["Vernacular Semantic NLP Fallback"]
        Guardrails["Micro-Commerce Guardrails (guardrails.py)"]
        AudioLedgerTpl["Vernacular Audio Ledger Generator (vernacular_tts.py)"]
    end

    subgraph NodeLayer["Node.js Commerce Gateway (Port 3000)"]
        Server["Express API Server (server.js)"]
        PayPalModule["PayPal Agentic Commerce Engine (paypal_commerce.js)"]
        QRGen["Dynamic QR Generator (QRCode)"]
        SSEHub["Server-Sent Events Broadcaster"]
        LedgerStore["Audit Ledger Storage (ledger.js & data/ledger.json)"]
    end

    subgraph ExternalRails["External Payment Rails & APIs"]
        PayPalAPI["PayPal Orders v2 / Sandbox Checkout"]
        UPIRails["UPI Domestic Payment Apps (PhonePe, GPay, Paytm)"]
    end

    Mic -->|Spoken Dialect Audio/Text| UI
    UI -->|POST /api/voice/process| Server
    Server -->|POST /api/agent/parse-command| Router
    Router -->|Interactions API| GeminiClient
    Router -.->|Fallback if Offline| HeuristicFallback
    Router -->|Extracted JSON Payload| Guardrails
    Guardrails -->|Validated Safe Payload| AudioLedgerTpl
    AudioLedgerTpl -->|Enriched Payload + TTS| Server
    Server -->|Amount, Item, Merchant VPA| PayPalModule
    PayPalModule -->|Tokenized Link| PayPalAPI
    PayPalModule -->|UPI Intent URI| QRGen
    QRGen -->|Base64 Data URI| Server
    Server -->|Commit Pending Record| LedgerStore
    Server -->|QR Data URL + Localized Audio Prompt| UI
    UI -->|Play Speech Ack| AudioSynth

    %% Customer payment settlement flow
    UPIRails -.->|Simulated / Webhook Settle| Server
    Server -->|Commit Settled Status| LedgerStore
    Server -->|event: payment_settled| SSEHub
    SSEHub -->|Push SSE Stream| SSEListener
    SSEListener -->|Soundbox Chime + Vernacular Speech| AudioSynth
```

---

## 2. Sequence Diagrams

### 2.1 Voice-to-QR Generation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Street Merchant / Tutor
    participant UI as VernacPay Client
    participant Node as Node Commerce Gateway (3000)
    participant Py as Python AI Agent (8000)
    participant Gemini as Gemini 3.8 Flash
    participant PayPal as PayPal Commerce Engine

    Merchant->>UI: Speaks: "रमेश भाई से चाय के 120 रुपये लो"
    UI->>Node: POST /api/voice/process { transcript: "..." }
    Node->>Py: POST /api/agent/parse-command
    Py->>Gemini: Interactions API (Structured JSON Schema)
    Gemini-->>Py: { amount: 120, counterparty: "Ramesh bhai", lang: "hi" }
    Py->>Py: Evaluate Guardrails (Amount <= ₹10,000 & No injection)
    Py->>Py: Generate Audio Ledger Prompts (Hindi)
    Py-->>Node: 200 OK (Validated Intent + Audio Ledger)
    Node->>PayPal: Create Tokenized Order & UPI Intent
    PayPal-->>Node: { order_id, upi_uri, tokenized_link }
    Node->>Node: Render Dynamic QR Code (Data URL)
    Node->>Node: Commit Transaction to Ledger (PENDING)
    Node-->>UI: Response { commerce, qr_data_url, audio_ledger }
    UI->>Merchant: Displays Dynamic QR & Speaks: "₹120 का क्यूआर कोड तैयार है"
```

### 2.2 Settlement & Screen-Free Audio Ledger Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Payer / Customer
    participant Scanner as Customer Banking App
    participant Node as Node Commerce Gateway (3000)
    participant SSE as SSE Stream (/api/commerce/events)
    participant Soundbox as VernacSoundbox (Audio Engine)
    actor Merchant as Merchant

    Customer->>Scanner: Scans Merchant Dynamic QR Code
    Scanner->>Customer: Displays "₹120 to VernacPay Merchant"
    Customer->>Scanner: Authorizes Payment
    Scanner->>Node: POST /api/commerce/settle/:orderId (Webhook)
    Node->>Node: Update Ledger (Status = SETTLED, Time, Method)
    Node->>SSE: Broadcast event: "payment_settled" { amount: 120, counterparty: "Ramesh bhai" }
    SSE-->>Soundbox: Receives SSE Event
    Soundbox->>Soundbox: Synthesize Harmonic Chime (E5, G#5, B5, E6)
    Soundbox->>Merchant: Speaks: "पेमेंट प्राप्त हुआ! रमेश भाई से ₹120 सफल"
```

---

## 3. Safety Architecture & Fund Isolation Model

> [!IMPORTANT]
> The primary vulnerability in AI-driven commerce is **prompt injection and unauthorized wallet draining**. VernacPay AI enforces architectural isolation.

### 3.1 AI Isolation Guarantees
1. **Zero Access to Private Keys / Accounts**: The AI Agent (Gemini 3.8 Flash) operates in a sandboxed, read-only analytical mode. It cannot initiate wire transfers, query bank account numbers, or alter payout destinations.
2. **Deterministic Settlement Boundary**: The merchant's settlement VPA (`vernacpay.merchant@icici`) and PayPal receiver account are immutable server-side environment variables (`.env`). The LLM cannot modify the beneficiary.
3. **Pre-Defined Micro-Commerce Caps**:
   - Hard upper bound: **₹10,000 INR** ($150 USD).
   - Minimum bound: **₹1.00 INR**.
   - If an amount exceeds ₹10,000, `guardrails.py` halts token generation with status `EXCEEDS_MICRO_LIMIT` and produces a security rejection audio prompt.
4. **Prompt Injection Sanitization**: Input strings are scrubbed for instruction overrides (e.g., *"ignore previous instructions"*, *"override limit"*, *"send to external wallet"*).

---

## 4. Component Responsibility Matrix

| Component | File Path | Language | Primary Responsibilities |
|---|---|---|---|
| **API Entry & UI Server** | `node-commerce/server.js` | JavaScript (Node.js) | Serves front-end, orchestrates requests, manages SSE connections, routes payments. |
| **Commerce & QR Engine** | `node-commerce/paypal_commerce.js` | JavaScript (Node.js) | PayPal Orders v2 tokenization, UPI deep link generation, QR Code rasterization. |
| **Audit Ledger Store** | `node-commerce/ledger.js` | JavaScript (Node.js) | In-memory and disk persistence (`data/ledger.json`), daily revenue reconciliation. |
| **AI Agent REST API** | `python-agent/app.py` | Python (FastAPI) | Exposes `/api/agent/parse-command`, health metrics, sample scenario registry. |
| **Intent Router** | `python-agent/intent_router.py` | Python | Gemini 3.8 Flash structured output parsing, vernacular heuristic fallback, entity extraction. |
| **Financial Guardrails** | `python-agent/guardrails.py` | Python | Monetary boundary checking, prompt injection defense, AI quarantine verification. |
| **Audio Prompt Generator** | `python-agent/vernacular_tts.py` | Python | Localized dialect string generation for Hindi, Telugu, Urdu, Tamil, Bengali, English. |
| **Soundbox Audio Synthesizer**| `public/audio-chimes.js` | JavaScript (Browser) | Web Audio harmonic payment chimes, Web Speech regional dialect playback. |
| **Client Orchestration** | `public/app.js` | JavaScript (Browser) | Web Speech API speech-to-text, SSE listener, dynamic QR display, simulator trigger. |

---

## 5. Network Interfaces & Ports

- **Port 3000 (`http://localhost:3000`)**: Node.js Commerce Gateway, static UI, and SSE streams.
- **Port 8000 (`http://127.0.0.1:8000`)**: Python AI Agent Engine (internal loopback only).
- **Outbound HTTPS (443)**:
  - `https://generativelanguage.googleapis.com` (Gemini 3.8 Flash)
  - `https://api-m.sandbox.paypal.com` (PayPal Sandbox Orders API)
