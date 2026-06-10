const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [`role = 'user'`];
    let params = [];

    if (search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (status === 'active') { where.push('is_active = 1'); }
    if (status === 'blocked') { where.push('is_active = 0'); }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    const [rows] = await db.query(
      `SELECT id, name, email, phone, is_active, created_at,
              (SELECT COUNT(*) FROM orders WHERE user_id = users.id) AS order_count
       FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);

    res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, is_active, role FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    if (rows[0].role === 'admin') return res.status(403).json({ success: false, message: 'Không thể khóa tài khoản admin' });

    const newStatus = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ success: true, message: newStatus ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/admin/accounts  (manage admin accounts)
const getAdminAccounts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, is_active, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/admin/accounts
const createAdminAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email đã tồn tại' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
      [name, email, hashed]
    );
    res.status(201).json({ success: true, message: 'Tạo tài khoản admin thành công', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// DELETE /api/admin/accounts/:id
const deleteAdminAccount = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản của chính mình' });
    }
    await db.query(`DELETE FROM users WHERE id = ? AND role = 'admin'`, [req.params.id]);
    res.json({ success: true, message: 'Xóa tài khoản admin thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { getUsers, toggleUserStatus, getAdminAccounts, createAdminAccount, deleteAdminAccount };
