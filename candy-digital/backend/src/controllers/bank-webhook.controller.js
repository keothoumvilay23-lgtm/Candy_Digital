const db = require('../config/db');

const PREPAID_METHODS = ['bank_transfer', 'momo', 'zalopay'];

function verifyWebhookSecret(req) {
  const secret = process.env.BANK_WEBHOOK_SECRET;
  if (!secret) return true;
  const auth = req.headers.authorization || '';
  const token = auth
    .replace(/^Apikey\s+/i, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  const header = req.headers['x-bank-webhook-secret'];
  return token === secret || header === secret;
}

function extractOrderIdFromContent(text) {
  if (!text || typeof text !== 'string') return null;
  const normalized = text.normalize('NFC').trim();
  const m = normalized.match(/DH\s*0*(\d{1,10})/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

function pickAmount(body) {
  const n = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const x = Number(String(v).replace(/,/g, ''));
    return Number.isFinite(x) ? x : null;
  };
  return (
    n(body.transferAmount)
    ?? n(body.amountIn)
    ?? n(body.amount)
    ?? n(body.amount_in)
    ?? n(body.money)
  );
}

function pickContent(body) {
  return (
    body.content
    ?? body.description
    ?? body.remark
    ?? body.note
    ?? body.message
    ?? ''
  );
}

function pickReference(body) {
  const ref =
    body.referenceCode
    ?? body.reference
    ?? body.ref
    ?? body.transaction_id
    ?? body.id;
  if (ref === undefined || ref === null) return null;
  return String(ref).slice(0, 150);
}

function pickAccount(body) {
  const a = body.accountNumber ?? body.account_number ?? body.from_account ?? body.sender;
  if (!a) return null;
  return String(a).slice(0, 80);
}

function pickTransferredAt(body) {
  const raw = body.transactionDate ?? body.transaction_date ?? body.date ?? body.created_at;
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

// POST /api/orders/webhook/bank-incoming
// Gắn URL này vào dịch vụ thông báo biến động số dư (vd. Sepay): khớp nội dung CK chứa mã DHxxxxxx
const handleBankIncomingWebhook = async (req, res) => {
  try {
    if (!verifyWebhookSecret(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const content = String(pickContent(body));
    const orderId = extractOrderIdFromContent(content);
    if (!orderId) {
      return res.status(200).json({ success: true, message: 'No order code in content', ignored: true });
    }

    const amount = pickAmount(body);
    const reference = pickReference(body);
    const account = pickAccount(body);
    const transferredAt = pickTransferredAt(body);

    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!rows.length) {
      return res.status(200).json({ success: true, message: 'Order not found', ignored: true });
    }
    const order = rows[0];

    if (!PREPAID_METHODS.includes(order.payment_method)) {
      return res.status(200).json({ success: true, message: 'Order is not prepaid', ignored: true });
    }

    if (order.payment_status === 'paid') {
      return res.json({ success: true, message: 'Already paid' });
    }

    if (order.payment_status !== 'pending') {
      return res.status(200).json({ success: true, message: 'Payment state not pending', ignored: true });
    }

    if (reference && order.bank_in_reference === reference) {
      return res.json({ success: true, message: 'Duplicate notification' });
    }

    let rawJson = null;
    try {
      rawJson = JSON.stringify(body);
    } catch {
      rawJson = null;
    }

    await db.query(
      `UPDATE orders SET
        bank_in_amount = ?,
        bank_in_content = ?,
        bank_in_reference = ?,
        bank_in_at = ?,
        bank_in_account = ?,
        bank_in_raw = ?
       WHERE id = ? AND payment_status = 'pending'`,
      [
        amount,
        content || null,
        reference,
        transferredAt,
        account,
        rawJson,
        orderId,
      ]
    );

    // Chỉ tự xác nhận khi webhook được bảo vệ bằng secret VÀ số tiền khớp tổng đơn (tiền vào tài khoản → đơn sang bước tiếp)
    const secretOn = Boolean(process.env.BANK_WEBHOOK_SECRET);
    const autoOk = secretOn && process.env.BANK_WEBHOOK_AUTO_CONFIRM !== '0';
    if (autoOk && amount != null) {
      const [again] = await db.query(
        'SELECT id, total_price, payment_status, status FROM orders WHERE id = ?',
        [orderId]
      );
      const row = again[0];
      if (row && row.payment_status === 'pending') {
        const total = Number(row.total_price);
        const got = Number(amount);
        if (Number.isFinite(total) && Number.isFinite(got) && Math.abs(got - total) <= 1) {
          await db.query(
            `UPDATE orders SET
              payment_status = 'paid',
              payment_confirmed_at = NOW(),
              status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
             WHERE id = ? AND payment_status = 'pending'`,
            [orderId]
          );
          return res.json({
            success: true,
            message: 'Payment auto-confirmed',
            data: { order_id: orderId, auto_confirmed: true },
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Recorded incoming transfer; awaiting admin confirmation',
      data: { order_id: orderId, auto_confirmed: false },
    });
  } catch (err) {
    console.error('Bank webhook error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { handleBankIncomingWebhook };
