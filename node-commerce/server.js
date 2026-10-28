/**
 * Node.js Commerce Gateway & VernacPay API Server.
 * 
 * Bridges Voice-to-JSON Python Agent, PayPal Agentic Commerce Toolkit,
 * Dynamic QR Generation, and Real-Time Screen-Free Audio Ledger (SSE).
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const paypalCommerce = require('./paypal_commerce');
const ledger = require('./ledger');

const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON_AGENT_URL = process.env.PYTHON_AGENT_URL || 'http://127.0.0.1:8000';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Server-Sent Events (SSE) Client registry for real-time soundbox notifications
let sseClients = [];

function broadcastSseEvent(eventType, data) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => {
        try {
            client.res.write(message);
        } catch (err) {
            console.error('[SSE] Error writing to client:', err.message);
        }
    });
}

// Clean up stale SSE connections
setInterval(() => {
    sseClients = sseClients.filter(c => !c.res.writableEnded);
}, 15000);

/**
 * Health Check Endpoint
 */
app.get('/api/health', async (req, res) => {
    let pythonHealthy = false;
    try {
        const pyRes = await fetch(`${PYTHON_AGENT_URL}/health`, { signal: AbortSignal.timeout(2000) });
        pythonHealthy = pyRes.ok;
    } catch (e) {
        pythonHealthy = false;
    }

    res.json({
        node_status: 'online',
        python_agent_status: pythonHealthy ? 'connected' : 'offline',
        paypal_mode: paypalCommerce.clientId ? 'live_sandbox_credentials' : 'agentic_toolkit_simulation',
        timestamp: new Date().toISOString()
    });
});

/**
 * Real-Time SSE Stream for Screen-Free Audio Ledger Confirmations
 */
app.get('/api/commerce/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    // Initial greeting / ping
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, status: 'soundbox_connected' })}\n\n`);

    req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
    });
});

/**
 * Voice-to-JSON Command Processing Endpoint
 * Orchestrates Python Agent -> Safety Guardrails -> PayPal Dynamic Tokenization -> Ledger
 */
app.post('/api/voice/process', async (req, res) => {
    const { transcript, audio_base64, merchant_id } = req.body;

    if (!transcript || !transcript.trim()) {
        return res.status(400).json({ error: 'Spoken transcript is required.' });
    }

    try {
        let agentResult = null;

        // 1. Dispatch voice transcript to Python AI Agent Engine
        try {
            const pyResp = await fetch(`${PYTHON_AGENT_URL}/api/agent/parse-command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, audio_base64, merchant_id: merchant_id || 'merch_001' }),
                signal: AbortSignal.timeout(6000)
            });

            if (pyResp.ok) {
                agentResult = await pyResp.json();
            }
        } catch (pyErr) {
            console.warn('[Server] Python agent service unavailable, using integrated fallback:', pyErr.message);
        }

        // 2. Direct Node fallback if Python agent is temporarily offline
        if (!agentResult) {
            agentResult = simulateLocalIntentParsing(transcript);
        }

        const { intent_payload, guardrail } = agentResult;

        // 3. Safety Guardrail Verification: Disallow token creation if boundaries are violated
        if (!guardrail.passed) {
            const blockedTx = ledger.addTransaction({
                order_id: `BLK-${Date.now().toString(36).toUpperCase()}`,
                raw_transcript: transcript,
                amount: intent_payload.amount || 0,
                currency: intent_payload.currency || 'INR',
                counterparty: intent_payload.counterparty || '',
                item_description: intent_payload.item_description || '',
                status: 'REJECTED_GUARDRAIL',
                error_reason: guardrail.error,
                created_at: new Date().toISOString()
            });

            return res.json({
                success: false,
                guardrail_blocked: true,
                intent: intent_payload,
                guardrail,
                rejection_speech: guardrail.rejection_audio?.speech || guardrail.error,
                transaction: blockedTx
            });
        }

        // 4. Trigger PayPal Agentic Commerce Toolkit / Dynamic Link Generation
        const commerceOrder = await paypalCommerce.createPaymentRequest({
            amount: intent_payload.amount,
            currency: intent_payload.currency,
            counterparty: intent_payload.counterparty,
            item_description: intent_payload.item_description,
            merchant_id: merchant_id || 'merch_001'
        });

        // 5. Commit record into Screen-Free Audio Ledger
        const ledgerRecord = ledger.addTransaction({
            ...commerceOrder,
            raw_transcript: transcript,
            intent: intent_payload.intent,
            detected_language: intent_payload.detected_language,
            confidence: intent_payload.confidence,
            audio_ledger: intent_payload.audio_ledger
        });

        // 6. Return response to merchant screen
        res.json({
            success: true,
            guardrail_blocked: false,
            intent: intent_payload,
            guardrail,
            commerce: commerceOrder,
            audio_ledger: intent_payload.audio_ledger,
            transaction: ledgerRecord
        });

    } catch (err) {
        console.error('[Server] Voice process error:', err);
        res.status(500).json({ error: 'Failed to process voice payment command: ' + err.message });
    }
});

/**
 * Customer Settlement Endpoint (Webhook or Payment Simulation)
 * Pushes real-time Soundbox Audio Ledger confirmation
 */
app.post('/api/commerce/settle/:orderId', (req, res) => {
    const { orderId } = req.params;
    const { payment_method = 'UPI PhonePe / Google Pay' } = req.body || {};

    const tx = ledger.settleTransaction(orderId, payment_method);
    if (!tx) {
        return res.status(404).json({ error: 'Order not found in ledger.' });
    }

    // Determine localized settlement speech
    const settledSpeech = tx.audio_ledger?.settled_speech || 
        `Payment of ${tx.amount} rupees received successfully from ${tx.counterparty || 'customer'}.`;

    const settlementPayload = {
        order_id: tx.order_id,
        amount: tx.amount,
        currency: tx.currency,
        counterparty: tx.counterparty,
        payment_method,
        settled_at: tx.settled_at,
        settled_speech: settledSpeech,
        lang_code: tx.audio_ledger?.lang_code || 'en-IN'
    };

    // Broadcast SSE to all open merchant terminals
    broadcastSseEvent('payment_settled', settlementPayload);

    res.json({
        success: true,
        message: 'Transaction settled and audio ledger broadcast emitted.',
        settlement: settlementPayload
    });
});

/**
 * Transaction History Endpoint
 */
app.get('/api/ledger', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({
        transactions: ledger.getAllTransactions(limit)
    });
});

/**
 * Daily Summary & Voice Reconciliation
 */
app.get('/api/ledger/daily-summary', (req, res) => {
    res.json(ledger.getDailySummary());
});

/**
 * Local intent parsing fallback when Python agent is offline
 */
function simulateLocalIntentParsing(transcript) {
    const clean = transcript.trim();
    const lower = clean.toLowerCase();
    const normalizedLower = lower.replace(/(?<=\d),(?=\d)/g, '');
    
    let amount = 0;
    const digits = normalizedLower.match(/(?:₹|\$|rs\.?)?\s*([0-9]+(?:\.[0-9]+)?)/);
    if (digits) {
        amount = parseFloat(digits[1]);
    } else if (lower.includes('fifteen hundred') || lower.includes('pandrah sau')) {
        amount = 1500;
    } else if (lower.includes('paanch sau') || lower.includes('panch sau') || clean.includes('500') || clean.includes('ఐదు వందలు')) {
        amount = 500;
    } else if (lower.includes('ek sau bees') || clean.includes('120')) {
        amount = 120;
    } else if (clean.includes('350') || lower.includes('teen sau pachas')) {
        amount = 350;
    }

    let lang = 'en';
    if (/[\u0900-\u097f]/.test(clean)) lang = 'hi';
    else if (/(?:charge|please|classes|tuition|bill|payment|request|send|take)/.test(lower)) lang = 'en';
    else if (/rupaye|bhai|sau|hazaar/.test(lower)) lang = 'hi';
    else if (/[\u0c00-\u0c7f]/.test(clean)) lang = 'te';
    else if (/[\u0600-\u06ff]/.test(clean)) lang = 'ur';
    else if (/[\u0b80-\u0bff]/.test(clean)) lang = 'ta';

    let cp = 'Customer';
    if (/ramesh|रमेश|ரமேஷ்/.test(lower)) cp = 'Ramesh bhai';
    else if (/ahmed|احمد/.test(lower)) cp = 'Ahmed Sahab';

    const passed = amount > 0 && amount <= 10000;

    return {
        intent_payload: {
            intent: 'REQUEST_PAYMENT',
            amount: amount,
            currency: 'INR',
            counterparty: cp,
            item_description: 'Vernacular micro-order',
            detected_language: lang,
            confidence: 0.95,
            raw_transcript: clean,
            audio_ledger: {
                lang,
                lang_code: lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : (lang === 'ur' ? 'ur-PK' : 'en-IN')),
                qr_created_speech: lang === 'hi' 
                    ? `${cp} से ₹${amount} का क्यूआर कोड तैयार है।` 
                    : (lang === 'te' ? `${amount} రూపాయల చెల్లింపు కోడ్ సిద్ధంగా ఉంది.` : `Payment QR for ₹${amount} is ready.`),
                settled_speech: lang === 'hi'
                    ? `पेमेंट प्राप्त हुआ! ${cp} से ₹${amount} सफल।`
                    : (lang === 'te' ? `చెల్లింపు పూర్తయింది! ${amount} రూపాయలు స్వీకరించబడ్డాయి.` : `Payment of ₹${amount} received from ${cp}.`)
            }
        },
        guardrail: {
            passed: passed,
            status: passed ? 'APPROVED_FOR_TOKENIZATION' : 'EXCEEDS_MICRO_LIMIT',
            error: passed ? null : `Amount of ₹${amount} exceeds safety limit of ₹10,000.`,
            rejection_audio: {
                speech: `अलर्ट! ${amount} रुपये की सीमा बहुत अधिक है।`
            }
        }
    };
}

app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` VernacPay Node.js Commerce Gateway running on http://localhost:${PORT}`);
    console.log(` PayPal Integration: ${paypalCommerce.clientId ? 'Sandbox Configured' : 'Agentic Toolkit Sandbox Simulation'}`);
    console.log(` Real-Time Audio Ledger SSE: http://localhost:${PORT}/api/commerce/events`);
    console.log(` Serving Vernacular UI from /public`);
    console.log(`=======================================================`);
});
