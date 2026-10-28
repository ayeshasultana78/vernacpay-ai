# 🎙️ VernacPay AI: Voice-Native, Vernacular Micro-Commerce Agent

> **An autonomous AI agent that completely replaces graphical user interfaces with regional speech for initiating and settling financial transactions.**

---

## 🌟 The Problem & Socioeconomic Impact

Over **60% of the world's employed population works in the informal economy**—street food vendors, local home tutors, neighborhood kirana and dairy owners, auto-rickshaw drivers, and independent tradespeople.

While smartphone penetration in emerging economies is near-universal, **UI friction and English-first banking paradigms lock out millions**:
- Complex cascading menus, password resets, and verification codes create extreme friction.
- Typographic keypad errors frequently cause misdirected or incorrect payments.
- Existing digital payment apps only use regional languages **passively**—acting merely as a one-way speaker box that announces *"Paytm par 50 rupaye prapt hue"* *after* the customer has already scanned and manually typed the amount.

### How VernacPay is Different
**VernacPay turns voice from a passive reporter into the active transactional driver.**
A local vendor dictates their command naturally in **Hindi, Telugu, Urdu, Tamil, Bengali, or English** (e.g. *"रमेश भाई से चाय और समोसे के 120 रुपये लो"* or *"Charge 500 rupees for this month's classes"*), and the AI autonomously handles the backend routing, enforces micro-commerce safety bounds, tokenizes the payment via PayPal's Agentic Commerce toolkit, renders an instant dynamic QR code, and provides real-time screen-free audio ledger confirmations when funds clear.

---

## 🏗️ System Architecture

```
                                  [ Regional Voice Input ]
                     (Hindi, Telugu, Urdu, Tamil, Bengali, English)
                                            │
                                            ▼
               ┌────────────────────────────────────────────────────────┐
               │              Python AI Agent Engine (Port 8000)        │
               │  - Gemini 3.8 Flash (Interactions API / Structured JSON)│
               │  - Vernacular Dialect & Numeral Extraction NLP         │
               │  - Pre-defined Micro-Commerce Safety Guardrails        │
               └────────────────────────────┬───────────────────────────┘
                                            │ Structured Intent Payload
                                            ▼
               ┌────────────────────────────────────────────────────────┐
               │          Node.js Commerce Gateway (Port 3000)          │
               │  - PayPal Agentic Commerce Toolkit / Orders API v2     │
               │  - Isolated Tokenization (AI never handles raw funds)  │
               │  - Dynamic UPI & PayPal QR Code Generator              │
               │  - Real-Time Server-Sent Events (SSE) Broadcast        │
               └────────────────────────────┬───────────────────────────┘
                                            │
                                            ▼
               ┌────────────────────────────────────────────────────────┐
               │        Screen-Free VernacSoundbox 2.0 (Front-End)      │
               │  - Instant Dynamic QR Display for Customer Phone       │
               │  - Web Audio Harmonic Chime Synthesizer                │
               │  - Regional Speech Synthesis Audio Ledger              │
               │  - Customer 1-Click Settlement Simulator               │
               └────────────────────────────────────────────────────────┘
```

---

## 🛡️ Safety Architecture & Financial Guardrails

The system isolates the AI from raw fund custody:
1. **AI Isolation from Funds**: The language model only translates intent and triggers tokenized API endpoints. The LLM cannot authorize bank transfers or modify the merchant's authenticated payout destination.
2. **Pre-Defined Micro-Commerce Boundaries**:
   - Hard upper limit cap (default **₹10,000 INR** or **$150 USD**).
   - Any transaction exceeding this limit is blocked automatically with a localized voice alert (*"Transaction exceeds safety boundary. High-value transactions require manual banking app 2FA"*).
3. **Typographic Error Elimination**: Because amounts are spoken and parsed using vernacular phonetic normalization (handling words like *"paanch sau"*, *"aidu vandhalu"*, *"dhai sau"*), numeric keypad manipulation is eliminated.
4. **Prompt Injection & Hijack Defense**: Sanitizes voice transcripts against injection phrases (e.g. *"ignore previous instructions"*, *"transfer to external wallet"*).

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ or v22+
- **Python**: v3.10+ (Python 3.12 verified)

### 2. Install Dependencies
```bash
# Install Node dependencies
npm install

# (Optional) Install Python packages if running full Python service
pip install -r python-agent/requirements.txt
```

### 3. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
- `GEMINI_API_KEY`: Your Google Gemini API key (uses `gemini-3.8-flash`). If not supplied, VernacPay's built-in high-precision vernacular semantic parser activates automatically.
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`: Your PayPal Sandbox API credentials. If not supplied, autonomous Agentic Commerce sandbox mode creates tokenized checkout links.

### 4. Run the Application
You can run the Node.js Commerce Gateway directly:
```bash
npm start
```
The server will start on **`http://localhost:3000`**.

To run the Python AI Agent alongside it:
```bash
npm run start:python
```

---

## 🧪 Testing Verified Vernacular Scenarios

| Scenario | Spoken Vernacular Command | Extracted Intent | Guardrail Status | Soundbox Vernacular Voice |
|---|---|---|---|---|
| 🇮🇳 **Tea Stall (Hindi)** | *"रमेश भाई से चाय और समोसे के 120 रुपये लो"* | `amount: 120`, `cp: Ramesh bhai` | `APPROVED` | *"Ramesh bhai से ₹120 का क्यूआर कोड तैयार है।"* |
| 🇮🇳 **Math Tutor (Telugu)** | *"ఈ నెల ట్యూషన్ ఫీజు 500 రూపాయలు తీసుకోండి"* | `amount: 500`, `cp: Customer` | `APPROVED` | *"500 రూపాయల చెల్లింపు కోడ్ సిద్ధంగా ఉంది."* |
| 🇵🇰 **Dairy Store (Urdu)** | *"احمد صاحب سے دودھ اور انڈے کے 350 روپے لو"* | `amount: 350`, `cp: Ahmed Sahab` | `APPROVED` | *"350 روپے کا کیو آر کوڈ بن چکا ہے۔"* |
| 🇮🇳 **Auto Driver (Tamil)** | *"ரமேஷ் அண்ணாவிடம் 150 ரூபாய் வசூலிக்கவும்"* | `amount: 150`, `cp: Ramesh anna` | `APPROVED` | *"150 ரூபாய் க்யூஆர் குறியீடு தயாராக உள்ளது."* |
| 🌐 **Tutor (English)** | *"Charge 500 rupees for this month's classes"* | `amount: 500`, `cp: Customer` | `APPROVED` | *"Payment QR code for ₹500 is ready."* |
| 🛡️ **Safety Block** | *"Charge 25,000 rupees for high value electronics"* | `amount: 25000` | `BLOCKED (EXCEEDS_MICRO_LIMIT)` | *"अलर्ट! 25000 रुपये की सीमा बहुत अधिक है।"* |

---

## 📱 User Interface Features

- **Giant Push-to-Talk Microphone**: Oversized, high-contrast, tactile button with ripple animations for outdoor daylight legibility on street stalls.
- **Dialect Switcher Bar**: 1-tap switching between Hindi, Telugu, Urdu, Tamil, Bengali, and Indian English.
- **Hardware Soundbox 2.0 Simulation**: Animated speaker grill that bounces and vibrates when transactions settle, playing harmonic multi-tone chimes and regional voice readouts.
- **Customer Settlement Simulator**: 1-click button allowing merchants or evaluators to simulate the customer scanning the QR code and completing payment, instantly triggering real-time SSE audio confirmations.
- **Screen-Free Audio Ledger**: Real-time transaction audit stream with audio replay buttons and a *"आज का हिसाब"* (Speak Today's Tally) voice summary.
