const db = require('../config/db');

const PUBLIC_FIELDS = `id, method, label, is_active, account_name, account_number,
  bank_code, bank_name, qr_image_url, instruction, sort_order, updated_at`;

// GET /api/payment-settings  (public, only active methods)
const getActivePaymentSettings = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${PUBLIC_FIELDS} FROM payment_settings ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/payment-settings/admin/list  (admin)
const adminGetPaymentSettings = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${PUBLIC_FIELDS} FROM payment_settings ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/payment-settings/admin/:id  (admin)
const adminUpdatePaymentSetting = async (req, res) => {
  try {
    const {
      label,
      is_active,
      account_name,
      account_number,
      bank_code,
      bank_name,
      qr_image_url,
      instruction,
      sort_order,
    } = req.body;

    const labelValue = (label || '').trim();
    if (!labelValue) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên phương thức' });
    }

    await db.query(
      `UPDATE payment_settings
       SET label = ?, is_active = ?, account_name = ?, account_number = ?,
           bank_code = ?, bank_name = ?, qr_image_url = ?, instruction = ?,
           sort_order = ?
       WHERE id = ?`,
      [
        labelValue,
        is_active ? 1 : 0,
        account_name || null,
        account_number || null,
        bank_code || null,
        bank_name || null,
        qr_image_url || null,
        instruction || null,
        Number.isInteger(Number(sort_order)) ? Number(sort_order) : 0,
        req.params.id,
      ]
    );

    res.json({ success: true, message: 'Đã cập nhật cấu hình thanh toán' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/payment-settings/admin/upload-qr  (admin) - upload QR image
const adminUploadQrImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Chưa chọn file' });
    }
    const url = `/uploads/products/${req.file.filename}`;
    res.json({ success: true, data: { url } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getActivePaymentSettings,
  adminGetPaymentSettings,
  adminUpdatePaymentSetting,
  adminUploadQrImage,
};
