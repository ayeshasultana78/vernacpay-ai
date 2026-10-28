/**
 * PayPal Agentic Commerce & Dynamic Payment Link / QR Generator.
 * 
 * Implements:
 * 1. PayPal Agentic Commerce Toolkit / Orders API v2 tokenized link generation.
 * 2. UPI Dynamic Intent URI generation (upi://pay?pa=...&am=...&cu=INR).
 * 3. High-resolution QR Code generation (data URI) for instant counter scan.
 * 4. Token isolation: isolating LLMs from raw credentials or direct money movement.
 */

const QRCode = require('qrcode');
const crypto = require('crypto');

class PayPalCommerceEngine {
    constructor(options = {}) {
        this.clientId = process.env.PAYPAL_CLIENT_ID || options.clientId || '';
        this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || options.clientSecret || '';
        this.environment = process.env.PAYPAL_ENV || options.environment || 'sandbox';
        this.merchantVpa = process.env.MERCHANT_UPI_VPA || 'vernacpay.merchant@icici';
        this.merchantName = process.env.MERCHANT_BUSINESS_NAME || 'VernacPay Store';
    }

    /**
     * Obtains PayPal OAuth 2.0 Access Token if credentials are provided
     */
    async getPayPalAccessToken() {
        if (!this.clientId || !this.clientSecret) {
            return null;
        }

        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const endpoint = this.environment === 'production' 
            ? 'https://api-m.paypal.com/v1/oauth2/token'
            : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });
            const data = await res.json();
            return data.access_token;
        } catch (err) {
            console.error('[PayPal Commerce] Token generation error:', err.message);
            return null;
        }
    }

    /**
     * Generates dynamic UPI intent string for Indian micro-merchants
     */
    generateUpiIntentUri(amount, counterparty, description, orderId) {
        const cleanAmt = Number(amount).toFixed(2);
        const encodedName = encodeURIComponent(this.merchantName);
        const encodedNote = encodeURIComponent(description || `Order ${orderId}`);
        return `upi://pay?pa=${this.merchantVpa}&pn=${encodedName}&mc=5499&tid=${orderId}&tr=${orderId}&tn=${encodedNote}&am=${cleanAmt}&cu=INR`;
    }

    /**
     * Creates a tokenized payment order link & dynamic QR code
     */
    async createPaymentRequest({ amount, currency = 'INR', counterparty = '', item_description = '', merchant_id = 'merch_001' }) {
        const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const cleanAmt = Number(amount).toFixed(2);
        
        let tokenizedLink = '';
        let isRealPayPal = false;

        // 1. Try real PayPal Orders v2 API if credentials exist
        const accessToken = await this.getPayPalAccessToken();
        if (accessToken) {
            try {
                const endpoint = this.environment === 'production'
                    ? 'https://api-m.paypal.com/v2/checkout/orders'
                    : 'https://api-m.sandbox.paypal.com/v2/checkout/orders';

                // Convert INR to USD equivalent if needed for standard PayPal sandbox (approx 1 USD = 85 INR)
                const paypalCurrency = currency.toUpperCase() === 'INR' ? 'USD' : currency.toUpperCase();
                const paypalAmount = currency.toUpperCase() === 'INR' 
                    ? (amount / 85.0).toFixed(2) 
                    : cleanAmt;

                const orderPayload = {
                    intent: 'CAPTURE',
                    purchase_units: [{
                        reference_id: orderId,
                        description: item_description || `Vernacular micro-payment for ${counterparty || 'customer'}`,
                        custom_id: merchant_id,
                        amount: {
                            currency_code: paypalCurrency,
                            value: String(paypalAmount)
                        }
                    }],
                    application_context: {
                        brand_name: this.merchantName,
                        user_action: 'PAY_NOW',
                        return_url: `http://localhost:3000/api/commerce/return?orderId=${orderId}`,
                        cancel_url: `http://localhost:3000/api/commerce/cancel?orderId=${orderId}`
                    }
                };

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderPayload)
                });

                const paypalOrder = await res.json();
                if (paypalOrder.id) {
                    const approveLink = paypalOrder.links?.find(l => l.rel === 'approve')?.href;
                    if (approveLink) {
                        tokenizedLink = approveLink;
                        isRealPayPal = true;
                    }
                }
            } catch (ppErr) {
                console.warn('[PayPal Commerce] API request failed, falling back to Agentic Sandbox Token:', ppErr.message);
            }
        }

        // 2. Tokenized link fallback (Agentic Sandbox Token)
        if (!tokenizedLink) {
            const mockToken = `EC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
            tokenizedLink = `https://www.sandbox.paypal.com/checkoutnow?token=${mockToken}&orderId=${orderId}&amount=${cleanAmt}&cu=${currency}`;
        }

        // 3. Generate native UPI Intent URI for dual payment scan
        const upiIntentUri = this.generateUpiIntentUri(amount, counterparty, item_description, orderId);

        // 4. Generate high-resolution Dynamic QR Code (QR Data URL)
        // We encode the UPI Intent for standard domestic micro-merchants or direct PayPal URL
        const qrPayload = currency.toUpperCase() === 'INR' ? upiIntentUri : tokenizedLink;
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 320,
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        });

        return {
            order_id: orderId,
            tokenized_payment_link: tokenizedLink,
            upi_intent_uri: upiIntentUri,
            qr_code_data_url: qrDataUrl,
            qr_target_type: currency.toUpperCase() === 'INR' ? 'UPI_DEEP_LINK' : 'PAYPAL_AGENTIC_TOKEN',
            amount: Number(cleanAmt),
            currency: currency.toUpperCase(),
            counterparty,
            item_description,
            is_live_paypal: isRealPayPal,
            status: 'PENDING_CUSTOMER_ACTION',
            created_at: new Date().toISOString()
        };
    }
}

module.exports = new PayPalCommerceEngine();
