/**
 * Audio Chime Synthesizer & Vernacular Speech Engine.
 * 
 * Uses Web Audio API to synthesize the iconic payment soundbox chimes
 * and Web Speech API for low-latency regional dialect speech synthesis.
 */

class SoundboxAudioEngine {
    constructor() {
        this.audioCtx = null;
        this.synth = window.speechSynthesis;
        this.soundEnabled = true;
    }

    initAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    /**
     * Synthesizes the iconic multi-tone "Payment Received" chime:
     * Plays a sequence of harmonic pleasant chimes (E5, G#5, B5, E6).
     */
    playPaymentChime() {
        if (!this.soundEnabled) return;
        this.initAudioContext();

        const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
        const now = this.audioCtx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            gain.gain.setValueAtTime(0, now + idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.38);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.40);
        });
    }

    /**
     * Synthesizes QR Code Generated notification ping
     */
    playQrReadyChime() {
        if (!this.soundEnabled) return;
        this.initAudioContext();

        const now = this.audioCtx.currentTime;
        const freqs = [523.25, 783.99]; // C5, G5
        freqs.forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.09);

            gain.gain.setValueAtTime(0, now + idx * 0.09);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.09 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.28);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.30);
        });
    }

    /**
     * Synthesizes safety alert buzzer for guardrail violations
     */
    playSecurityAlertChime() {
        if (!this.soundEnabled) return;
        this.initAudioContext();

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(180, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
    }

    /**
     * Speaks vernacular text using regional voices in the browser
     */
    speakVernacular(text, langCode = 'hi-IN', onEndCallback = null) {
        if (!this.soundEnabled || !this.synth) return;
        this.initAudioContext();

        // Cancel pending speech to prevent queue build up
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 0.95; // Slightly measured rate for street vendors
        utterance.pitch = 1.05;

        // Try to select native matching voice if available
        const voices = this.synth.getVoices();
        const matchedVoice = voices.find(v => v.lang.startsWith(langCode.slice(0, 2)));
        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }

        if (onEndCallback) {
            utterance.onend = onEndCallback;
        }

        this.synth.speak(utterance);
    }

    /**
     * Complete soundbox sequence: chime first, then vernacular announcement
     */
    announcePaymentSettled(speechText, langCode = 'hi-IN') {
        this.playPaymentChime();
        setTimeout(() => {
            this.speakVernacular(speechText, langCode);
        }, 550);
    }

    announceQrCreated(speechText, langCode = 'hi-IN') {
        this.playQrReadyChime();
        setTimeout(() => {
            this.speakVernacular(speechText, langCode);
        }, 300);
    }

    announceSecurityViolation(speechText, langCode = 'hi-IN') {
        this.playSecurityAlertChime();
        setTimeout(() => {
            this.speakVernacular(speechText, langCode);
        }, 350);
    }
}

window.soundbox = new SoundboxAudioEngine();
