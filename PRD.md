# 📄 Product Requirements Document (PRD)

## Project: VernacPay AI — Voice-Native, Vernacular Micro-Commerce Agent
**Status:** Approved & Implemented (v1.0.0)  
**Target Date:** 2026-10-28  
**Domain:** Financial Inclusion, Conversational AI, Agentic Commerce  

---

## 1. Executive Summary & Vision

Over **60% of the world’s employed workforce operates in the informal economy** (street vendors, kirana owners, fruit stalls, domestic tutors, auto-rickshaw drivers). While mobile devices and payment rails (UPI in India, Pix in Brazil, PayPal globally) are ubiquitous, digital financial inclusion remains stalled by **UI friction, English-first software paradigms, and complex navigation**.

**VernacPay AI** replaces graphical menus and manual typing with **regional voice commands as the active driver**. Merchants speak naturally in their mother tongue (Hindi, Telugu, Urdu, Tamil, Bengali, or Indian English), and an autonomous AI agent translates the speech into a validated, structured JSON payload, enforces strict micro-commerce safety bounds, tokenizes the payment via the PayPal Agentic Commerce toolkit, renders a dynamic QR code, and speaks back real-time audio confirmations over a screen-free "Soundbox 2.0".

---

## 2. Problem Statement & Impact

### 2.1 The Problem
1. **Digital Literacy Barrier**: Traditional banking apps require reading complex English menus, navigating multi-level screens, entering recipient IDs, and typing amounts.
2. **Keypad Typographic Errors**: Typing amounts manually during busy market rush hours leads to wrong amounts, decimal mistakes, or keypad manipulation.
3. **Passive Soundboxes**: Existing soundboxes (e.g., Paytm/PhonePe soundbox) are completely passive—they only play an audio announcement *after* a customer initiates and types the payment. The merchant has zero voice-driven agency to request funds.

### 2.2 Expected Impact
- **Zero Digital Literacy Required**: Any vendor capable of speech can initiate, verify, and settle transactions.
- **Transaction Initiation Time**: Reduced from ~45 seconds (unlock phone, open app, type amount, generate QR) to **< 3 seconds** (speak command).
- **Fraud & Error Reduction**: Automatic phonetic normalization and monetary caps eliminate typographic and unauthorized transfers.

---

## 3. Target User Personas

| Persona | Role & Context | Spoken Vernacular Example | Key Need |
|---|---|---|---|
| **Ramesh (42)** | Street Tea Stall Owner (busy roadside counter) | *"रमेश भाई से चाय और समोसे के 120 रुपये लो"* | Hands-free operation, fast counter turnover, noisy environment audio ack. |
| **Lakshmi (34)** | Neighborhood Math Tutor (home classes) | *"ఈ నెల ట్యూషన్ ఫీజు 500 రూపాయలు తీసుకోండి"* | Monthly recurring fee collection without awkward payment conversations. |
| **Ahmed (48)** | Kirana & Dairy Shopkeeper | *"احمد صاحب سے دودھ اور انڈے کے 350 روپے لو"* | Accurate billing for groceries without touching greasy phone screens. |
| **Murugan (38)** | Auto-Rickshaw Driver | *"ரமேஷ் அண்ணாவிடம் 150 ரூபாய் வசூலிக்கவும்"* | Sunlight legibility and loud verbal confirmation while driving. |

---

## 4. Product Features & Requirements

### 4.1 Feature Breakdown

#### FR-01: Vernacular Voice Ingestion & Normalization
- **Requirement:** Accept voice input in regional dialects via browser Web Speech API and backend audio transcription.
- **Dialects Supported:** Hindi (`hi-IN`), Telugu (`te-IN`), Urdu (`ur-PK`), Tamil (`ta-IN`), Bengali (`bn-IN`), and English (`en-IN`).
- **Phonetic Quantity Normalization:** Must convert colloquial words (e.g., *paanch sau*, *aidu vandhalu*, *dhai sau*, *dedh sau*) into exact numerical values.

#### FR-02: Voice-to-JSON Intent Routing
- **Requirement:** Route voice transcripts into an immutable structured JSON payload:
  ```json
  {
    "intent": "REQUEST_PAYMENT",
    "amount": 500.0,
    "currency": "INR",
    "counterparty": "Ramesh bhai",
    "item_description": "This month's classes",
    "detected_language": "hi",
    "confidence": 0.96
  }
  ```
- **Engine:** Google Gemini 3.8 Flash (`interactions` API) with an integrated deterministic semantic parser fallback.

#### FR-03: Financial Safety Architecture & Guardrails
- **Requirement:** Enforce a strict monetary cap before any payment token is created.
- **Default Micro-Commerce Cap:** **₹10,000 INR** ($150 USD).
- **Action on Violation:** Block token creation immediately, emit an audio rejection buzzer, and speak a localized warning.
- **AI Isolation:** The AI model is strictly quarantined from bank credentials, private keys, or wallet balances.

#### FR-04: Dynamic Link & QR Code Generation
- **Requirement:** Generate localized, one-time payment links and high-resolution QR codes (320x320 SVG/PNG data URI).
- **Protocols Supported:**
  1. **UPI Intent URI**: `upi://pay?pa={merchant_vpa}&am={amount}&cu=INR&tn={note}`
  2. **PayPal Agentic Commerce**: Tokenized checkout order link (`https://www.sandbox.paypal.com/checkoutnow?token=...`).

#### FR-05: Screen-Free Audio Ledger ("VernacSoundbox 2.0")
- **Requirement:** Real-time verbal reconciliation without requiring the merchant to look at the screen.
  - **On QR Creation:** Immediate spoken prompt: *"₹120 का क्यूआर कोड तैयार है। रमेश भाई से स्कैन करवाएं।"*
  - **On Settlement:** Harmonic multi-tone payment chime (E5, G#5, B5, E6) followed by vernacular settlement speech: *"पेमेंट प्राप्त हुआ! रमेश भाई से ₹120 सफल।"*

#### FR-06: Real-Time Event Streaming & Settlement Webhook
- **Requirement:** Server-Sent Events (SSE) pipe at `/api/commerce/events` pushing instant `payment_settled` triggers to all connected soundbox clients.
- **Interactive Simulator:** 1-click "Customer Pays Now" trigger to test full end-to-end reconciliation.

#### FR-07: Voice Daily Ledger & Reconciliation
- **Requirement:** Audible daily tally (*"आज का कुल हिसाब"*) announcing total revenue and count of settled orders.

---

## 5. Non-Functional Requirements (NFRs)

| Metric | Target | Rationale |
|---|---|---|
| **Voice-to-QR Latency** | < 1.5 seconds | Street vendors cannot afford delay during market rush. |
| **Settlement Audio Latency** | < 400 milliseconds | Merchant needs immediate confidence that funds cleared. |
| **Sunlight Legibility** | High-contrast (AAA) | Street stalls operate under harsh outdoor sunlight. |
| **Offline / Fallback Resilience** | 100% heuristic fallback | System operates even when external AI or PayPal APIs experience transient downtime. |
| **PII & Data Protection** | Zero raw audio retention | Customer voice is ephemeral; only sanitized transaction metadata is persisted. |

---

## 6. Success Metrics & KPIs

1. **Transaction Completion Rate:** > 95% of spoken commands parsed accurately on first attempt.
2. **Dispute & Typo Reduction:** 100% elimination of keypad-induced amount errors.
3. **Soundbox Audio Clarity:** Speech understood by vendors across noisy ambient environments (> 75 dB).
4. **Safety Enforcement:** 100% interception of out-of-bounds amounts (> ₹10,000) prior to tokenization.
