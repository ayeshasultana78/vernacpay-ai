/**
 * Audio Ledger & Transaction Registry.
 * 
 * Provides screen-free reconciliation, audit history, and daily summary statistics.
 */

const fs = require('fs');
const path = require('path');

const LEDGER_FILE = path.join(__dirname, '..', 'data', 'ledger.json');

class TransactionLedger {
    constructor() {
        this.transactions = [];
        this.loadLedger();
    }

    loadLedger() {
        try {
            const dataDir = path.dirname(LEDGER_FILE);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            if (fs.existsSync(LEDGER_FILE)) {
                const raw = fs.readFileSync(LEDGER_FILE, 'utf-8');
                this.transactions = JSON.parse(raw);
            }
        } catch (err) {
            console.error('[Ledger] Could not load persisted ledger:', err.message);
            this.transactions = [];
        }
    }

    saveLedger() {
        try {
            const dataDir = path.dirname(LEDGER_FILE);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(LEDGER_FILE, JSON.stringify(this.transactions, null, 2), 'utf-8');
        } catch (err) {
            console.error('[Ledger] Could not save ledger:', err.message);
        }
    }

    addTransaction(tx) {
        this.transactions.unshift(tx);
        // Retain last 200 transactions
        if (this.transactions.length > 200) {
            this.transactions = this.transactions.slice(0, 200);
        }
        this.saveLedger();
        return tx;
    }

    getTransaction(orderId) {
        return this.transactions.find(t => t.order_id === orderId);
    }

    settleTransaction(orderId, paymentMethod = 'UPI / PayPal') {
        const tx = this.getTransaction(orderId);
        if (!tx) {
            return null;
        }
        tx.status = 'SETTLED';
        tx.settled_at = new Date().toISOString();
        tx.payment_method = paymentMethod;
        this.saveLedger();
        return tx;
    }

    getAllTransactions(limit = 50) {
        return this.transactions.slice(0, limit);
    }

    getDailySummary() {
        const today = new Date().toISOString().slice(0, 10);
        const todayTx = this.transactions.filter(t => 
            t.created_at && t.created_at.slice(0, 10) === today && t.status === 'SETTLED'
        );

        const totalAmount = todayTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const count = todayTx.length;

        return {
            date: today,
            settled_count: count,
            total_collection_inr: totalAmount,
            audio_announcement: {
                hi: `आज का कुल कलेक्शन ${totalAmount} रुपये है, कुल ${count} सफल भुगतान।`,
                te: `ఈ రోజు మొత్తం కలెక్షన్ ${totalAmount} రూపాయలు, మొత్తం ${count} లావాదేవీలు పూర్తయ్యాయి.`,
                ur: `آج کا کل جمع شدہ رقم ${totalAmount} روپے ہے، کل ${count} کامیاب ادائیگیاں۔`,
                en: `Today's total collection is ₹${totalAmount} across ${count} settled transactions.`
            }
        };
    }
}

module.exports = new TransactionLedger();
