/**
 * Front-end Orchestration for VernacPay AI.
 * 
 * Handles:
 * - Push-to-talk / Continuous Web Speech Recognition across regional Indian dialects.
 * - Real-Time Server-Sent Events (SSE) from the Node.js Commerce Gateway.
 * - Dynamic QR Code presentation & Customer Payment Simulation.
 * - Screen-Free Audio Ledger playback via SoundboxAudioEngine.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const btnMic = document.getElementById('btnMic');
    const voiceStatusText = document.getElementById('voiceStatusText');
    const voiceStatusSub = document.getElementById('voiceStatusSub');
    const transcriptInput = document.getElementById('transcriptInput');
    const btnProcessManual = document.getElementById('btnProcessManual');
    const intentConfidence = document.getElementById('intentConfidence');
    const dialectChips = document.querySelectorAll('.lang-chip');
    const samplePromptsContainer = document.getElementById('samplePromptsContainer');
    
    // QR & Commerce Elements
    const qrCard = document.getElementById('qrCard');
    const qrImage = document.getElementById('qrImage');
    const qrAmountDisplay = document.getElementById('qrAmountDisplay');
    const qrPartyDisplay = document.getElementById('qrPartyDisplay');
    const qrDescDisplay = document.getElementById('qrDescDisplay');
    const qrStatusBadge = document.getElementById('qrStatusBadge');
    const tokenLinkDisplay = document.getElementById('tokenLinkDisplay');
    const btnSimulatePay = document.getElementById('btnSimulatePay');
    const guardrailAlert = document.getElementById('guardrailAlert');
    const guardrailAlertMsg = document.getElementById('guardrailAlertMsg');

    // Hardware Soundbox Unit Elements
    const soundboxUnit = document.getElementById('soundboxUnit');
    const soundboxStatus = document.getElementById('soundboxStatus');
    const btnTodayTally = document.getElementById('btnTodayTally');
    const btnToggleMute = document.getElementById('btnToggleMute');

    // Ledger Elements
    const ledgerStream = document.getElementById('ledgerStream');
    const ledgerSummaryStats = document.getElementById('ledgerSummaryStats');

    // Application State
    let currentLanguage = 'hi-IN';
    let currentLangCode = 'hi';
    let isListening = false;
    let recognition = null;
    let currentActiveOrder = null;

    // Built-in Demo Scenarios for instant 1-click test
    const DEMO_SAMPLES = [
        {
            id: 'hi_vendor',
            lang: 'hi-IN',
            code: 'hi',
            role: 'Street Tea Stall',
            icon: '☕',
            transcript: 'रमेश भाई से चाय और समोसे के 120 रुपये लो',
            amount: 120,
            desc: 'Chai & samosas for regular customer'
        },
        {
            id: 'te_tutor',
            lang: 'te-IN',
            code: 'te',
            role: 'Local Math Tutor',
            icon: '📚',
            transcript: 'ఈ నెల ట్యూషన్ ఫీజు 500 రూపాయలు తీసుకోండి',
            amount: 500,
            desc: 'Monthly tuition fee request'
        },
        {
            id: 'ur_dairy',
            lang: 'ur-PK',
            code: 'ur',
            role: 'Neighborhood Dairy',
            icon: '🥛',
            transcript: 'احمد صاحب سے دودھ اور انڈے کے 350 روپے لو',
            amount: 350,
            desc: 'Milk & essentials bill'
        },
        {
            id: 'ta_auto',
            lang: 'ta-IN',
            code: 'ta',
            role: 'Auto Rickshaw',
            icon: '🛺',
            transcript: 'ரமேஷ் அண்ணாவிடம் 150 ரூபாய் வசூலிக்கவும்',
            amount: 150,
            desc: 'Destination auto fare'
        },
        {
            id: 'en_tutor',
            lang: 'en-IN',
            code: 'en',
            role: 'Home Tutor',
            icon: '🎓',
            transcript: "Charge 500 rupees for this month's classes",
            amount: 500,
            desc: 'Standard tuition fee command'
        },
        {
            id: 'limit_test',
            lang: 'en-IN',
            code: 'en',
            role: 'Safety Guardrail Test',
            icon: '🛡️',
            transcript: 'Charge 25,000 rupees for high value electronics and phones',
            amount: 25000,
            desc: 'Triggers micro-commerce ₹10,000 safety boundary block'
        }
    ];

    // Initialize UI
    renderDemoPills();
    fetchLedger();
    setupSpeechRecognition();
    setupSseConnection();

    // Language Selector Handlers
    dialectChips.forEach(chip => {
        chip.addEventListener('click', () => {
            dialectChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentLanguage = chip.dataset.lang;
            currentLangCode = chip.dataset.code;
            if (recognition) {
                recognition.lang = currentLanguage;
            }
            voiceStatusSub.textContent = `Listening dialect set to ${chip.textContent.trim()}. Speak naturally.`;
        });
    });

    /**
     * Web Speech API Setup for Vernacular Dictation
     */
    function setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            voiceStatusSub.textContent = 'Voice recognition not natively supported by this browser. Use buttons or type below.';
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = currentLanguage;

        recognition.onstart = () => {
            isListening = true;
            btnMic.classList.add('listening');
            voiceStatusText.textContent = 'Listening to your voice...';
            voiceStatusSub.textContent = 'Speak command in your native language (e.g., amount and customer name)...';
            soundboxStatus.textContent = 'Recording regional merchant voice...';
            transcriptInput.value = '';
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            transcriptInput.value = finalTranscript || interimTranscript;
            if (event.results[0] && event.results[0][0]) {
                const conf = Math.round(event.results[0][0].confidence * 100);
                if (conf > 0) {
                    intentConfidence.textContent = `AI Confidence: ${conf}%`;
                }
            }
        };

        recognition.onerror = (event) => {
            console.warn('[Speech] Recognition error:', event.error);
            stopListening();
            voiceStatusText.textContent = 'Microphone paused';
            voiceStatusSub.textContent = `Status: ${event.error}. You can also click any vernacular scenario below.`;
        };

        recognition.onend = () => {
            stopListening();
            const text = transcriptInput.value.trim();
            if (text) {
                voiceStatusText.textContent = 'Routing voice intent to AI agent...';
                processVoiceCommand(text);
            } else {
                voiceStatusText.textContent = 'Press to Speak in Your Dialect';
                soundboxStatus.textContent = 'Voice ready • Waiting for payment command...';
            }
        };
    }

    function toggleListening() {
        if (!recognition) {
            alert('Speech Recognition is not available in this browser. Please use Chrome, Edge, or select a demo scenario.');
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            recognition.lang = currentLanguage;
            try {
                recognition.start();
            } catch (err) {
                console.error('[Speech] Start error:', err);
            }
        }
    }

    function stopListening() {
        isListening = false;
        btnMic.classList.remove('listening');
    }

    btnMic.addEventListener('click', toggleListening);

    // Manual or Keyboard Submit
    btnProcessManual.addEventListener('click', () => {
        const text = transcriptInput.value.trim();
        if (text) {
            processVoiceCommand(text);
        }
    });

    transcriptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = transcriptInput.value.trim();
            if (text) {
                processVoiceCommand(text);
            }
        }
    });

    /**
     * Render Vernacular 1-Click Demo Scenarios
     */
    function renderDemoPills() {
        samplePromptsContainer.innerHTML = '';
        DEMO_SAMPLES.forEach(s => {
            const pill = document.createElement('div');
            pill.className = 'sample-pill';
            pill.innerHTML = `
                <div class="sample-role">${s.icon} ${s.role}</div>
                <div class="sample-text">"${s.transcript}"</div>
                <div class="sample-meta">Amount: ₹${s.amount} • ${s.desc}</div>
            `;
            pill.addEventListener('click', () => {
                // Switch language chip
                currentLanguage = s.lang;
                currentLangCode = s.code;
                dialectChips.forEach(c => {
                    if (c.dataset.code === s.code) c.classList.add('active');
                    else c.classList.remove('active');
                });

                // Set transcript and execute
                transcriptInput.value = s.transcript;
                voiceStatusText.textContent = `Testing: ${s.role}`;
                processVoiceCommand(s.transcript);
            });
            samplePromptsContainer.appendChild(pill);
        });
    }

    /**
     * Core Voice Command Processing
     */
    async function processVoiceCommand(transcript) {
        voiceStatusText.textContent = 'Extracting intent & generating tokenized QR...';
        soundboxStatus.textContent = 'Processing vernacular speech with AI agent...';
        guardrailAlert.style.display = 'none';

        try {
            const res = await fetch('/api/voice/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, merchant_id: 'merchant_001' })
            });

            const data = await res.json();

            if (!data.success && data.guardrail_blocked) {
                // Micro-Commerce Safety Limit Blocked
                handleGuardrailBlock(data);
                return;
            }

            if (data.success && data.commerce) {
                handlePaymentCreated(data);
            } else {
                throw new Error(data.error || 'Could not parse payment command.');
            }

        } catch (err) {
            console.error('[App] Process voice error:', err);
            voiceStatusText.textContent = 'Voice routing error';
            voiceStatusSub.textContent = err.message;
            soundboxStatus.textContent = 'Error processing speech command.';
        }
    }

    /**
     * Handles Successful QR & Payment Link Generation
     */
    function handlePaymentCreated(data) {
        currentActiveOrder = data.commerce;
        const intent = data.intent;
        const audioLedger = data.audio_ledger || {};

        // Update QR Card
        qrAmountDisplay.textContent = `₹${intent.amount.toFixed(2)}`;
        qrPartyDisplay.textContent = `Customer: ${intent.counterparty || 'Walk-in Customer'}`;
        qrDescDisplay.textContent = `Reason: ${intent.item_description || 'Micro-commerce order'}`;
        qrImage.src = data.commerce.qr_code_data_url;
        tokenLinkDisplay.textContent = data.commerce.upi_intent_uri || data.commerce.tokenized_payment_link;
        qrStatusBadge.textContent = 'Scan & Pay Active';
        qrStatusBadge.className = 'badge badge-emerald';

        voiceStatusText.textContent = `Generated QR for ₹${intent.amount}`;
        voiceStatusSub.textContent = `Spoke audio confirmation back to merchant in ${audioLedger.language_name || 'Vernacular'}.`;
        soundboxStatus.textContent = `QR Code Ready: ₹${intent.amount} • Awaiting customer scan`;

        // Screen-free Audio Ledger confirmation prompt
        triggerSoundboxAnimation();
        const speechPrompt = audioLedger.qr_created_speech || `₹${intent.amount} payment QR code ready.`;
        window.soundbox.announceQrCreated(speechPrompt, audioLedger.lang_code || currentLanguage);

        fetchLedger();
    }

    /**
     * Handles Micro-Commerce Guardrail Violation
     */
    function handleGuardrailBlock(data) {
        guardrailAlert.style.display = 'block';
        guardrailAlertMsg.textContent = data.guardrail.error || 'Transaction amount exceeds micro-commerce boundary.';

        voiceStatusText.textContent = '⚠️ Blocked by Safety Guardrail';
        voiceStatusSub.textContent = 'High-value transactions require formal banking 2FA to prevent fraud and manipulation.';
        soundboxStatus.textContent = 'Security boundary alert: Transaction rejected.';

        const rejectionSpeech = data.rejection_speech || 'Security alert. Amount exceeds safety limit.';
        window.soundbox.announceSecurityViolation(rejectionSpeech, currentLanguage);

        fetchLedger();
    }

    /**
     * Customer Simulator: Simulates customer scanning the QR code and paying
     */
    btnSimulatePay.addEventListener('click', async () => {
        if (!currentActiveOrder || !currentActiveOrder.order_id) {
            alert('Please speak a vernacular payment command first to generate a QR code!');
            return;
        }

        btnSimulatePay.disabled = true;
        btnSimulatePay.innerHTML = '<span>⏳ Processing Customer Bank Authorization...</span>';

        try {
            const res = await fetch(`/api/commerce/settle/${currentActiveOrder.order_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_method: 'UPI / Google Pay (Customer Scan)' })
            });
            const data = await res.json();
            console.log('[Simulator] Settlement response:', data);
        } catch (err) {
            console.error('[Simulator] Settle error:', err);
        } finally {
            setTimeout(() => {
                btnSimulatePay.disabled = false;
                btnSimulatePay.innerHTML = '<span>💳 Customer Pays Now (Simulate Settlement)</span>';
            }, 1000);
        }
    });

    /**
     * Real-Time Server-Sent Events (SSE) Listener
     * Powers the Screen-Free Vernacular Audio Ledger (Soundbox 2.0)
     */
    function setupSseConnection() {
        const evtSource = new EventSource('/api/commerce/events');

        evtSource.addEventListener('connected', (e) => {
            console.log('[SSE] Connected to Screen-Free Audio Ledger channel.');
        });

        evtSource.addEventListener('payment_settled', (e) => {
            const data = JSON.parse(e.data);
            console.log('[SSE] Payment settled event received:', data);

            // Update QR card badge
            qrStatusBadge.textContent = 'PAID & SETTLED ✅';
            qrStatusBadge.className = 'badge badge-emerald';
            soundboxStatus.textContent = `Funds cleared! Received ₹${data.amount} from ${data.counterparty || 'customer'}`;

            // Trigger physical soundbox visual vibration & audio chime + vernacular announcement
            triggerSoundboxAnimation();
            window.soundbox.announcePaymentSettled(data.settled_speech, data.lang_code || currentLanguage);

            fetchLedger();
        });

        evtSource.onerror = (err) => {
            console.warn('[SSE] EventSource reconnecting...');
        };
    }

    /**
     * Visual soundbox vibration animation
     */
    function triggerSoundboxAnimation() {
        soundboxUnit.classList.add('vibrating');
        setTimeout(() => {
            soundboxUnit.classList.remove('vibrating');
        }, 1800);
    }

    /**
     * Today's Tally Voice Announcement ("आज का हिसाब")
     */
    btnTodayTally.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/ledger/daily-summary');
            const data = await res.json();
            
            triggerSoundboxAnimation();
            const langCodeKey = currentLangCode in data.audio_announcement ? currentLangCode : 'hi';
            const spokenText = data.audio_announcement[langCodeKey] || data.audio_announcement.en;

            soundboxStatus.textContent = `Daily Tally: ₹${data.total_collection_inr} (${data.settled_count} settled transactions)`;
            window.soundbox.announcePaymentSettled(spokenText, currentLanguage);
        } catch (err) {
            console.error('[Tally] Error:', err);
        }
    });

    // Mute/Unmute toggle
    btnToggleMute.addEventListener('click', () => {
        window.soundbox.soundEnabled = !window.soundbox.soundEnabled;
        btnToggleMute.textContent = window.soundbox.soundEnabled ? '🔔 Sound ON' : '🔕 Sound MUTED';
    });

    /**
     * Fetch & Render Ledger Transactions
     */
    async function fetchLedger() {
        try {
            const [txRes, summaryRes] = await Promise.all([
                fetch('/api/ledger?limit=25'),
                fetch('/api/ledger/daily-summary')
            ]);
            const txData = await txRes.json();
            const summary = await summaryRes.json();

            ledgerSummaryStats.textContent = `Settled: ₹${summary.total_collection_inr} • ${summary.settled_count} Orders`;

            renderLedgerList(txData.transactions || []);
        } catch (err) {
            console.error('[Ledger] Fetch error:', err);
        }
    }

    function renderLedgerList(transactions) {
        if (!transactions.length) {
            ledgerStream.innerHTML = `
                <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 2rem 0;">
                    No voice transactions recorded yet. Speak a regional command to get started!
                </p>
            `;
            return;
        }

        ledgerStream.innerHTML = '';
        transactions.forEach(t => {
            const item = document.createElement('div');
            const isSettled = t.status === 'SETTLED';
            const isBlocked = t.status === 'REJECTED_GUARDRAIL';
            item.className = `ledger-item ${isSettled ? 'settled' : (isBlocked ? 'blocked' : '')}`;

            const timeStr = t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const statusLabel = isSettled ? 'PAID' : (isBlocked ? 'BLOCKED' : 'PENDING');
            const statusColor = isSettled ? '#34d399' : (isBlocked ? '#f87171' : '#fbbf24');

            item.innerHTML = `
                <div>
                    <div style="font-weight: 600; color: #f3f4f6;">
                        ${t.counterparty || 'Customer'} • <span style="color: ${statusColor}; font-size: 0.75rem;">[${statusLabel}]</span>
                    </div>
                    <div class="ledger-desc">
                        "${t.raw_transcript}" • ${t.item_description || 'Local micro-order'}
                    </div>
                </div>
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                    <div class="ledger-amt ${isBlocked ? 'blocked' : ''}">₹${Number(t.amount).toFixed(2)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">${timeStr}</div>
                    ${isSettled && t.audio_ledger?.settled_speech ? `
                        <button class="btn-replay-audio" title="Replay vernacular settlement audio">🔊 Replay</button>
                    ` : ''}
                </div>
            `;

            // Audio Replay button handler
            const replayBtn = item.querySelector('.btn-replay-audio');
            if (replayBtn) {
                replayBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    triggerSoundboxAnimation();
                    window.soundbox.announcePaymentSettled(t.audio_ledger.settled_speech, t.audio_ledger.lang_code || currentLanguage);
                });
            }

            ledgerStream.appendChild(item);
        });
    }
});
