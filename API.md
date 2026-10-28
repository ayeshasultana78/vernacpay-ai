# 🔌 API Reference & Integration Guide

## Project: VernacPay AI
**Gateway Base URL:** `http://localhost:3000`  
**Python AI Engine Base URL:** `http://127.0.0.1:8000`  
**Content-Type:** `application/json`  

---

## 1. Node.js Commerce Gateway Endpoints

### 1.1 Process Spoken Command
Processes a merchant's vernacular speech command, executes intent extraction, verifies safety boundaries, and creates dynamic tokenized payment links and QR codes.

- **Method:** `POST`
- **Path:** `/api/voice/process`
- **Request Body:**
  ```json
  {
    "transcript": "रमेश भाई से चाय और समोसे के 120 रुपये लो",
    "merchant_id": "merch_001"
  }
  ```
- **Success Response (`200 OK` - Approved):**
  ```json
  {
    "success": true,
    "guardrail_blocked": false,
    "intent": {
      "intent": "REQUEST_PAYMENT",
      "amount": 120.0,
      "currency": "INR",
      "counterparty": "Ramesh bhai",
      "item_description": "Chai and Samosas",
      "detected_language": "hi",
      "confidence": 0.96,
      "raw_transcript": "रमेश भाई से चाय और समोसे के 120 रुपये लो"
    },
    "guardrail": {
      "passed": true,
      "status": "APPROVED_FOR_TOKENIZATION",
      "error": null,
      "safe_for_token_generation": true,
      "metadata": {
        "guardrail_status": "APPROVED",
        "max_allowed": 10000.0,
        "requires_2fa": false
      }
    },
    "commerce": {
      "order_id": "ORD-M7A1-884A",
      "tokenized_payment_link": "https://www.sandbox.paypal.com/checkoutnow?token=EC-4A73...",
      "upi_intent_uri": "upi://pay?pa=vernacpay.merchant@icici&pn=VernacPay%20Store&mc=5499&tid=ORD-M7A1-884A&tr=ORD-M7A1-884A&tn=Chai%20and%20Samosas&am=120.00&cu=INR",
      "qr_code_data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAU...",
      "qr_target_type": "UPI_DEEP_LINK",
      "amount": 120.0,
      "currency": "INR",
      "counterparty": "Ramesh bhai",
      "item_description": "Chai and Samosas",
      "status": "PENDING_CUSTOMER_ACTION",
      "created_at": "2026-10-28T18:00:00.000Z"
    },
    "audio_ledger": {
      "lang": "hi",
      "lang_code": "hi-IN",
      "language_name": "हिन्दी (Hindi)",
      "qr_created_speech": "Ramesh bhai से ₹120 का क्यूआर कोड तैयार है। Ramesh bhai से स्कैन करवाएं।",
      "settled_speech": "पेमेंट प्राप्त हुआ! Ramesh bhai से ₹120 सफल।"
    }
  }
  ```

- **Rejection Response (`200 OK` - Guardrail Blocked):**
  ```json
  {
    "success": false,
    "guardrail_blocked": true,
    "intent": {
      "amount": 25000.0,
      "currency": "INR"
    },
    "guardrail": {
      "passed": false,
      "status": "EXCEEDS_MICRO_LIMIT",
      "error": "Transaction amount of 25000.0 INR exceeds the micro-commerce safety boundary of 10000.0 INR. High-value transactions require manual banking app 2FA."
    },
    "rejection_speech": "अलर्ट! 25000 रुपये की सीमा बहुत अधिक है। अधिकतम सीमा 10000 रुपये है।"
  }
  ```

---

### 1.2 Customer Payment Settlement (Webhook / Simulator)
Triggers settlement of a pending order, commits the status to the ledger, and broadcasts an SSE event to soundbox clients.

- **Method:** `POST`
- **Path:** `/api/commerce/settle/:orderId`
- **Request Body:**
  ```json
  {
    "payment_method": "UPI PhonePe / Google Pay"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Transaction settled and audio ledger broadcast emitted.",
    "settlement": {
      "order_id": "ORD-M7A1-884A",
      "amount": 120.0,
      "currency": "INR",
      "counterparty": "Ramesh bhai",
      "payment_method": "UPI PhonePe / Google Pay",
      "settled_at": "2026-10-28T18:01:15.000Z",
      "settled_speech": "पेमेंट प्राप्त हुआ! Ramesh bhai से ₹120 सफल।",
      "lang_code": "hi-IN"
    }
  }
  ```

---

### 1.3 Real-Time Audio Ledger Stream (SSE)
Pushes real-time notifications to the client or hardware soundbox.

- **Method:** `GET`
- **Path:** `/api/commerce/events`
- **Protocol:** Server-Sent Events (`text/event-stream`)
- **Event Name:** `payment_settled`
- **Event Payload Example:**
  ```text
  event: payment_settled
  data: {"order_id":"ORD-M7A1-884A","amount":120,"currency":"INR","counterparty":"Ramesh bhai","settled_speech":"पेमेंट प्राप्त हुआ! Ramesh bhai से ₹120 सफल।","lang_code":"hi-IN"}
  ```

---

### 1.4 Transaction Ledger History
Retrieves historical transactions and their current status.

- **Method:** `GET`
- **Path:** `/api/ledger?limit=50`
- **Response (`200 OK`):**
  ```json
  {
    "transactions": [
      {
        "order_id": "ORD-M7A1-884A",
        "raw_transcript": "रमेश भाई से चाय और समोसे के 120 रुपये लो",
        "amount": 120.0,
        "currency": "INR",
        "counterparty": "Ramesh bhai",
        "status": "SETTLED",
        "created_at": "2026-10-28T18:00:00.000Z",
        "settled_at": "2026-10-28T18:01:15.000Z"
      }
    ]
  }
  ```

---

### 1.5 Daily Revenue Summary
Returns today's total revenue, order count, and pre-formatted voice announcements in regional dialects.

- **Method:** `GET`
- **Path:** `/api/ledger/daily-summary`
- **Response (`200 OK`):**
  ```json
  {
    "date": "2026-10-28",
    "settled_count": 12,
    "total_collection_inr": 2450.0,
    "audio_announcement": {
      "hi": "आज का कुल कलेक्शन 2450 रुपये है, कुल 12 सफल भुगतान।",
      "te": "ఈ రోజు మొత్తం కలెక్షన్ 2450 రూపాయలు, మొత్తం 12 లావాదేవీలు పూర్తయ్యాయి.",
      "ur": "آج کا کل جمع شدہ رقم 2450 روپے ہے، کل 12 کامیاب ادائیگیاں۔",
      "en": "Today's total collection is ₹2450 across 12 settled transactions."
    }
  }
  ```

---

### 1.6 Health Check
- **Method:** `GET`
- **Path:** `/api/health`
- **Response (`200 OK`):**
  ```json
  {
    "node_status": "online",
    "python_agent_status": "connected",
    "paypal_mode": "agentic_toolkit_simulation",
    "timestamp": "2026-10-28T18:00:00.000Z"
  }
  ```

---

## 2. Python AI Agent Engine Endpoints (Port 8000)

### 2.1 Parse Spoken Command
Direct endpoint for the intent router & guardrails.

- **Method:** `POST`
- **Path:** `/api/agent/parse-command`
- **Request Body:**
  ```json
  {
    "transcript": "ఈ నెల ట్యూషన్ ఫీజు 500 రూపాయలు తీసుకోండి",
    "merchant_id": "merch_001"
  }
  ```

### 2.2 Validate Guardrail Boundary
- **Method:** `POST`
- **Path:** `/api/agent/validate-guardrail`
- **Request Body:**
  ```json
  {
    "amount": 5000.0,
    "currency": "INR"
  }
  ```
