/**
 * Mô phỏng webhook sao kê ngân hàng (demo báo cáo / test local).
 *
 * Cách dùng:
 *   node scripts/simulate-webhook.js <order_id> [amount]
 *
 * Ví dụ:
 *   node scripts/simulate-webhook.js 5
 *   node scripts/simulate-webhook.js 5 1500000
 */
require('dotenv').config();

const orderId = parseInt(process.argv[2], 10);
const amountArg = process.argv[3];

if (!orderId) {
  console.error('Usage: node scripts/simulate-webhook.js <order_id> [amount]');
  process.exit(1);
}

const base = process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}`;
const url = `${base}/api/orders/webhook/bank-incoming`;
const orderCode = `DH${String(orderId).padStart(6, '0')}`;
const amount = amountArg ? Number(amountArg) : 100000;

const body = {
  transferAmount: amount,
  content: orderCode,
  referenceCode: `SCRIPT-${Date.now()}`,
  accountNumber: '9999999999',
  transactionDate: new Date().toISOString(),
};

const headers = { 'Content-Type': 'application/json' };
const secret = process.env.BANK_WEBHOOK_SECRET;
if (secret) headers.Authorization = `Apikey ${secret}`;

fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  .then(async (res) => {
    const data = await res.json();
    console.log(`HTTP ${res.status}`, JSON.stringify(data, null, 2));
    if (!res.ok) process.exit(1);
  })
  .catch((err) => {
    console.error('Request failed:', err.message);
    process.exit(1);
  });
