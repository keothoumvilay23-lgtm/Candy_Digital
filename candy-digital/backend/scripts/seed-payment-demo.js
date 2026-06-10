// Seed demo payment settings (run once with: node scripts/seed-payment-demo.js)
require('dotenv').config();
const db = require('../src/config/db');

const demos = [
  {
    method: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    is_active: 1,
    instruction: 'Khách thanh toán bằng tiền mặt khi nhận hàng. Phí ship được cộng vào lúc giao.',
  },
  {
    method: 'bank_transfer',
    label: 'Chuyển khoản ngân hàng',
    is_active: 1,
    bank_code: 'VCB',
    bank_name: 'Vietcombank',
    account_number: '1031234567890',
    account_name: 'CANDY DIGITAL',
    instruction: 'Vui lòng chuyển khoản chính xác số tiền và ghi đúng nội dung CK để được xác nhận đơn nhanh nhất.',
    qr_image_url: null,
  },
  {
    method: 'momo',
    label: 'Ví MoMo',
    is_active: 1,
    bank_code: null,
    bank_name: null,
    account_number: '0901234567',
    account_name: 'CANDY DIGITAL',
    instruction: 'Quét mã QR MoMo bên dưới hoặc chuyển tới số 0901234567 (Candy Digital).',
    qr_image_url: null,
  },
  {
    method: 'zalopay',
    label: 'ZaloPay',
    is_active: 1,
    bank_code: null,
    bank_name: null,
    account_number: '0901234567',
    account_name: 'CANDY DIGITAL',
    instruction: 'Quét mã QR ZaloPay bên dưới hoặc chuyển tới số 0901234567 (Candy Digital).',
    qr_image_url: null,
  },
];

(async () => {
  try {
    for (const d of demos) {
      await db.query(
        `UPDATE payment_settings
         SET label = ?, is_active = ?, account_name = ?, account_number = ?,
             bank_code = ?, bank_name = ?, qr_image_url = ?, instruction = ?
         WHERE method = ?`,
        [
          d.label,
          d.is_active,
          d.account_name || null,
          d.account_number || null,
          d.bank_code || null,
          d.bank_name || null,
          d.qr_image_url || null,
          d.instruction || null,
          d.method,
        ]
      );
      console.log(`✅ Updated ${d.method}`);
    }
    console.log('\nDONE. Mở /admin/payment-settings để xem hoặc chỉnh sửa lại.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed lỗi:', err.message);
    process.exit(1);
  }
})();
