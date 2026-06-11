const nodemailer = require('nodemailer');

// Khởi tạo transporter 1 lần (singleton). Nếu thiếu cấu hình SMTP thì trả null
// để toàn bộ luồng email tự bỏ qua, không làm hỏng nghiệp vụ đặt hàng.
let transporter = null;
let initialized = false;

function getTransporter() {
  if (initialized) return transporter;
  initialized = true;

  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!host || !user || !pass) {
    console.warn('[email] Chưa cấu hình SMTP (MAIL_HOST/MAIL_USER/MAIL_PASS) — sẽ bỏ qua việc gửi email.');
    return null;
  }

  const port = Number(process.env.MAIL_PORT || 587);
  transporter = nodemailer.createTransport({
    host,
    port,
    // 465 = SSL ngầm định; các port khác (587, 2525) dùng STARTTLS
    secure: String(process.env.MAIL_SECURE || '').toLowerCase() === 'true' || port === 465,
    auth: { user, pass },
  });

  return transporter;
}

const PAYMENT_LABEL = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  momo: 'Ví MoMo',
  zalopay: 'ZaloPay',
  vnpay: 'VNPay',
};

const formatVND = (n) =>
  Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' ₫';

const escapeHtml = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function buildOrderEmailHtml(order) {
  const {
    customerName, orderCode, items = [], totalPrice,
    shippingName, shippingPhone, shippingAddress,
    paymentMethod, paymentStatus, note, customerUrl,
  } = order;

  const itemRows = items
    .map((it) => {
      const variant = [it.color_name, it.storage_label].filter(Boolean).join(' - ');
      const subtotal = Number(it.price || 0) * Number(it.quantity || 0);
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;">
            ${escapeHtml(it.name)}
            ${variant ? `<br><span style="font-size:12px;color:#888;">${escapeHtml(variant)}</span>` : ''}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:center;">${Number(it.quantity || 0)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;white-space:nowrap;">${formatVND(it.price)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;white-space:nowrap;font-weight:600;">${formatVND(subtotal)}</td>
        </tr>`;
    })
    .join('');

  const isPrepaidPending =
    ['bank_transfer', 'momo', 'zalopay', 'vnpay'].includes(paymentMethod) && paymentStatus === 'pending';

  const paymentNote = isPrepaidPending
    ? `<div style="margin-top:16px;padding:12px 14px;background:#fff8e1;border:1px solid #ffe082;border-radius:8px;font-size:13px;color:#8d6e00;">
         <strong>Lưu ý:</strong> Đơn hàng đang chờ thanh toán. Vui lòng chuyển khoản theo hướng dẫn với nội dung
         <strong>${escapeHtml(orderCode)}</strong>. Hệ thống sẽ tự động xác nhận sau khi nhận được tiền.
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#e91e63;padding:28px 32px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">Candy Digital</div>
            <div style="font-size:14px;color:#ffd6e5;margin-top:4px;">Cảm ơn bạn đã đặt hàng!</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="font-size:15px;color:#333;margin:0 0 6px;">Xin chào <strong>${escapeHtml(customerName || 'quý khách')}</strong>,</p>
            <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 18px;">
              Chúng tôi đã nhận được đơn hàng của bạn. Dưới đây là thông tin chi tiết:
            </p>

            <div style="background:#fafafa;border:1px solid #eee;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
              <span style="font-size:13px;color:#888;">Mã đơn hàng</span><br>
              <span style="font-size:20px;font-weight:bold;color:#e91e63;letter-spacing:1px;">${escapeHtml(orderCode)}</span>
            </div>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:8px;">
              <thead>
                <tr style="background:#f0f0f0;">
                  <th align="left" style="padding:10px 8px;font-size:13px;color:#555;">Sản phẩm</th>
                  <th align="center" style="padding:10px 8px;font-size:13px;color:#555;">SL</th>
                  <th align="right" style="padding:10px 8px;font-size:13px;color:#555;">Đơn giá</th>
                  <th align="right" style="padding:10px 8px;font-size:13px;color:#555;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="right" style="padding:14px 8px 0;font-size:16px;color:#333;">
                  Tổng cộng: <strong style="color:#e91e63;font-size:18px;">${formatVND(totalPrice)}</strong>
                </td>
              </tr>
            </table>

            ${paymentNote}

            <div style="margin-top:24px;border-top:1px solid #eee;padding-top:18px;">
              <h3 style="font-size:15px;color:#333;margin:0 0 10px;">Thông tin giao hàng</h3>
              <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">
                <strong>Người nhận:</strong> ${escapeHtml(shippingName)}<br>
                <strong>Điện thoại:</strong> ${escapeHtml(shippingPhone)}<br>
                <strong>Địa chỉ:</strong> ${escapeHtml(shippingAddress)}<br>
                <strong>Thanh toán:</strong> ${escapeHtml(PAYMENT_LABEL[paymentMethod] || paymentMethod)}
                ${note ? `<br><strong>Ghi chú:</strong> ${escapeHtml(note)}` : ''}
              </p>
            </div>

            ${customerUrl ? `
            <div style="text-align:center;margin-top:28px;">
              <a href="${escapeHtml(customerUrl)}" style="display:inline-block;background:#e91e63;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">Xem đơn hàng của tôi</a>
            </div>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
            <p style="font-size:12px;color:#999;line-height:1.6;margin:0;">
              Email này được gửi tự động, vui lòng không trả lời.<br>
              © 2026 Candy Digital. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Gửi email xác nhận đặt hàng cho khách. Không bao giờ ném lỗi ra ngoài
 * (chỉ log), để việc gửi email không làm hỏng luồng tạo đơn.
 * @returns {Promise<boolean>} true nếu đã gửi, false nếu bị bỏ qua/lỗi.
 */
async function sendOrderConfirmationEmail(order) {
  try {
    if (!order || !order.to) return false;

    const tx = getTransporter();
    if (!tx) return false;

    const from = process.env.MAIL_FROM || process.env.MAIL_USER;
    const html = buildOrderEmailHtml(order);

    await tx.sendMail({
      from: `"Candy Digital" <${from}>`,
      to: order.to,
      subject: `Xác nhận đơn hàng ${order.orderCode} - Candy Digital`,
      html,
    });

    console.log(`[email] Đã gửi email xác nhận đơn ${order.orderCode} tới ${order.to}`);
    return true;
  } catch (err) {
    console.error('[email] Gửi email xác nhận đơn thất bại:', err.message);
    return false;
  }
}

module.exports = { sendOrderConfirmationEmail };
