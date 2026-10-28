# 📋 Implementation Roadmap & Tasks

## Project: VernacPay AI — Voice-Native, Vernacular Micro-Commerce Agent
**Current Milestone:** Milestone 1.0 — Core Voice-to-JSON & Soundbox 2.0  
**Overall Completion:** 100% Core MVP Delivered & Verified  

---

## 🏁 Phase 1: Core AI & Vernacular Intent Routing (COMPLETED ✅)

- [x] **TASK-101: Project Architecture Setup**
  - Scaffold dual-service repository: `python-agent/`, `node-commerce/`, `public/`.
  - Configure root `package.json` with unified start scripts.
  - *Status:* Completed.

- [x] **TASK-102: Python FastAPI Agent Engine**
  - Implement `python-agent/app.py` with `/api/agent/parse-command` and `/health`.
  - Configure CORS middleware and Pydantic validation schemas.
  - *Status:* Completed.

- [x] **TASK-103: Voice-to-JSON Vernacular Intent Router**
  - Implement `python-agent/intent_router.py`.
  - Integrate Google GenAI SDK with Gemini 3.8 Flash (`interactions` API).
  - Implement deterministic vernacular semantic parser fallback for offline/no-key usage.
  - Support multi-script Indic numerals (Devanagari, Telugu, Urdu, Tamil, Bengali, Latin).
  - *Status:* Completed.

- [x] **TASK-104: Financial Safety Architecture & Guardrails**
  - Implement `python-agent/guardrails.py`.
  - Enforce micro-commerce bounds (Max ₹10,000 INR / $150 USD, Min ₹1.00).
  - Implement prompt injection & fund hijacking sanitization.
  - *Status:* Completed.

- [x] **TASK-105: Vernacular Audio Ledger Prompt Generator**
  - Implement `python-agent/vernacular_tts.py`.
  - Support natural spoken prompts for Hindi, Telugu, Urdu, Tamil, Bengali, and English.
  - *Status:* Completed.

- [x] **TASK-106: Python Unit Verification Test Suite**
  - Build `python-agent/test_router.py` with UTF-8 stdout encoding.
  - Verify Hindi street vendor, Telugu tutor, Urdu dairy, and high-value safety violation commands.
  - *Status:* Completed (All 5/5 tests passed).

---

## ⚡ Phase 2: Gateway & PayPal Agentic Commerce (COMPLETED ✅)

- [x] **TASK-201: Node.js Express Gateway**
  - Implement `node-commerce/server.js` on port 3000.
  - Forward spoken transcripts to Python AI engine at `127.0.0.1:8000`.
  - Implement graceful fallback when Python service is restarting.
  - *Status:* Completed.

- [x] **TASK-202: PayPal Agentic Commerce & Dynamic QR Generation**
  - Implement `node-commerce/paypal_commerce.js`.
  - Integrate PayPal Orders v2 API / Sandbox Tokenizer.
  - Generate dynamic UPI Intent Deep Links (`upi://pay?...`).
  - Render 320px high-contrast QR code Data URLs using `qrcode`.
  - *Status:* Completed.

- [x] **TASK-203: Real-Time Server-Sent Events (SSE) Broadcaster**
  - Build SSE stream at `/api/commerce/events` in `server.js`.
  - Support real-time `payment_settled` event pushing to soundbox clients.
  - *Status:* Completed.

- [x] **TASK-204: Transaction Audit Ledger Store**
  - Implement `node-commerce/ledger.js`.
  - Store transaction logs in `data/ledger.json`.
  - Implement `/api/ledger/daily-summary` for daily revenue and settlement counts.
  - *Status:* Completed.

---

## 🔊 Phase 3: Vernacular UI, Audio Chimes & Soundbox 2.0 (COMPLETED ✅)

- [x] **TASK-301: Sunlight-Readable Responsive UI**
  - Build `public/index.html` and `public/style.css`.
  - Implement high-contrast dark palette, tactile card structures, and mobile-responsive layout.
  - *Status:* Completed.

- [x] **TASK-302: Tactile 110px Push-to-Talk Mic**
  - Oversized microphone button with CSS ripple wave animations.
  - Integrated with browser Web Speech API (`SpeechRecognition`).
  - *Status:* Completed.

- [x] **TASK-303: Dialect Switcher & 1-Click Demo Scenarios**
  - Quick selector pills for Hindi, Telugu, Urdu, Tamil, Bengali, and English.
  - 6 interactive 1-click test cards for instant evaluation without microphone permissions.
  - *Status:* Completed.

- [x] **TASK-304: Web Audio Chime Synthesizer & Soundbox Engine**
  - Build `public/audio-chimes.js` using Web Audio API oscillators.
  - Synthesize 4-tone harmonic chime (E5, G#5, B5, E6).
  - Synthesize QR creation ping and security alert buzzer.
  - Integrate Web Speech API speech synthesis with regional voice mapping.
  - *Status:* Completed.

- [x] **TASK-305: Customer Settlement Simulator**
  - Build "Customer Pays Now" button to simulate customer QR scan and payment.
  - Trigger `/api/commerce/settle/:orderId` and verify instant soundbox audio playback.
  - *Status:* Completed.

---

## 🔮 Phase 4: Production Hardening & Enhancements (NEXT STEPS 📌)

- [ ] **TASK-401: Noise-Robust Voice Activity Detection (VAD)**
  - Integrate client-side Silero-VAD or WebRTC VAD to filter out market horn noise and crowd chatter.
  - *Priority:* Medium.

- [ ] **TASK-402: Offline Edge Model Integration**
  - Bundle lightweight quantized ONNX model for on-device voice parsing when cell signal drops to 2G/EDGE.
  - *Priority:* Medium.

- [ ] **TASK-403: Multi-Merchant Authentication & Session JWTs**
  - Add merchant login with phone number OTP and authenticated merchant VPA binding.
  - *Priority:* High.

- [ ] **TASK-404: Cloud Webhook Ingress (PayPal / Payment Gateway)**
  - Add public webhook endpoint verified with HMAC-SHA256 signature for live PayPal/Razorpay IPNs.
  - *Priority:* High.

---

## 🛠️ Phase 5: Dedicated Hardware IoT Soundbox (ROADMAP 🚀)

- [ ] **TASK-501: ESP32-S3 / Raspberry Pi Zero 2W Firmware**
  - Implement MicroPython / C++ firmware to connect to `/api/commerce/events` over Wi-Fi/4G SIM.
  - Connect I2S DAC (MAX98357A) and 3W speaker for physical standalone soundbox unit.
- [ ] **TASK-502: Hardware Push-to-Talk Button & Thermal Receipt Printer Integration**
  - Add physical push-to-talk microphone button and optional Bluetooth receipt printing.

---

## 🧪 Verification Matrix & Test Sign-off

| Test Case | Scenario / Dialect | Input Spoken Text | Expected Result | Status |
|---|---|---|---|---|
| **TC-01** | Hindi Chai Stall | *"रमेश भाई से चाय और समोसे के 120 रुपये लो"* | Amount: ₹120, CP: Ramesh bhai, QR generated | **PASS ✅** |
| **TC-02** | Telugu Tutor | *"ఈ నెల ట్యూషన్ ఫీజు 500 రూపాయలు తీసుకోండి"* | Amount: ₹500, Lang: te, Telugu QR audio | **PASS ✅** |
| **TC-03** | Urdu Dairy | *"احمد صاحب سے دودھ اور انڈے کے 350 روپے لو"* | Amount: ₹350, CP: Ahmed Sahab, Urdu audio | **PASS ✅** |
| **TC-04** | Tamil Auto | *"ரமேஷ் அண்ணாவிடம் 150 ரூபாய் வசூலிக்கவும்"* | Amount: ₹150, CP: Ramesh anna, Tamil audio | **PASS ✅** |
| **TC-05** | English Tutor | *"Charge 500 rupees for this month's classes"*| Amount: ₹500, Reason: classes, English audio | **PASS ✅** |
| **TC-06** | Safety Limit Guardrail | *"Charge 25000 rupees for high value electronics"*| Status: `EXCEEDS_MICRO_LIMIT`, Blocked | **PASS ✅** |
| **TC-07** | Settlement Webhook | Settle `ORD-...` via customer simulator | SSE push received, soundbox chime & voice played | **PASS ✅** |
| **TC-08** | Daily Tally | Click *"आज का हिसाब"* | Audio readout of daily revenue & transaction count | **PASS ✅** |
