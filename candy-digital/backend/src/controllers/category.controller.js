const db = require('../config/db');

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) AS product_count
       FROM categories c WHERE c.is_active = 1 ORDER BY c.parent_id ASC, c.id ASC`
    );

    // Build tree structure
    const parents = rows.filter(c => !c.parent_id);
    const children = rows.filter(c => c.parent_id);
    const tree = parents.map(p => ({
      ...p,
      children: children.filter(c => c.parent_id === p.id),
    }));

    res.json({ success: true, data: tree });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Admin CRUD
const adminGetCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, p.name AS parent_name,
              (SELECT COUNT(*) FROM products WHERE category_id = c.id) AS product_count
       FROM categories c LEFT JOIN categories p ON c.parent_id = p.id ORDER BY c.parent_id ASC, c.id ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

    const [result] = await db.query(
      'INSERT INTO categories (name, slug, parent_id, image_url) VALUES (?, ?, ?, ?)',
      [name, `${slug}-${Date.now()}`, parent_id || null, req.file ? `/uploads/products/${req.file.filename}` : null]
    );

    res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, parent_id, is_active } = req.body;
    await db.query(
      'UPDATE categories SET name=?, parent_id=?, is_active=? WHERE id=?',
      [name, parent_id || null, is_active, req.params.id]
    );
    res.json({ success: true, message: 'Cập nhật danh mục thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?', [req.params.id]
    );
    if (count > 0) {
      return res.status(400).json({ success: false, message: 'Danh mục đang có sản phẩm, không thể xóa' });
    }
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { getCategories, adminGetCategories, createCategory, updateCategory, deleteCategory };
