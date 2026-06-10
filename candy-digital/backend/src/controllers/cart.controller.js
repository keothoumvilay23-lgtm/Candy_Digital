const db = require('../config/db');
const {
  loadActiveCampaigns,
  pickCampaignForProduct,
  computeSalePrice,
} = require('../config/promotion.helper');

// GET /api/cart
const getCart = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.quantity, c.product_id, c.variant_id, c.color_name, c.storage_label,
              COALESCE(c.unit_price, p.price) AS price,
              COALESCE(v.stock, p.stock) AS stock,
              p.name, p.brand,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
       FROM carts c
       JOIN products p ON c.product_id = p.id
       LEFT JOIN product_variants v ON c.variant_id = v.id
       WHERE c.user_id = ? AND p.is_active = 1`,
      [req.user.id]
    );

    const total = rows.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ success: true, data: { items: rows, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/cart
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1, variant_id, color_name } = req.body;

    if (!product_id || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    const [products] = await db.query(
      'SELECT id, category_id, stock, price FROM products WHERE id = ? AND is_active = 1',
      [product_id]
    );
    if (!products.length) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    let selectedStorage = null;
    if (variant_id) {
      const [storageRows] = await db.query(
        `SELECT id, storage_label, price, stock
         FROM product_variants
         WHERE id = ? AND product_id = ? AND is_active = 1`,
        [variant_id, product_id]
      );
      if (!storageRows.length) {
        return res.status(400).json({ success: false, message: 'Dung lượng đã chọn không hợp lệ' });
      }
      selectedStorage = storageRows[0];
    }

    let chosenColor = null;
    if (color_name && typeof color_name === 'string') {
      const [colorRows] = await db.query(
        `SELECT name FROM product_colors
         WHERE product_id = ? AND is_active = 1 AND name = ?`,
        [product_id, color_name.trim()]
      );
      if (!colorRows.length) {
        return res.status(400).json({ success: false, message: 'Màu sắc đã chọn không hợp lệ' });
      }
      chosenColor = colorRows[0].name;
    }

    const [existing] = await db.query(
      `SELECT id, quantity
       FROM carts
       WHERE user_id = ? AND product_id = ?
         AND ((variant_id IS NULL AND ? IS NULL) OR variant_id = ?)
         AND ((color_name IS NULL AND ? IS NULL) OR color_name = ?)`,
      [req.user.id, product_id, variant_id || null, variant_id || null, chosenColor, chosenColor]
    );

    const availableStock = selectedStorage ? selectedStorage.stock : products[0].stock;
    const baseListPrice = selectedStorage ? Number(selectedStorage.price) : Number(products[0].price);

    // Snapshot giá theo campaign tại thời điểm thêm giỏ — tránh việc giá thay đổi
    // trong/ngoài đợt khuyến mãi sẽ ảnh hưởng đến giỏ đã có sẵn.
    const campaignData = await loadActiveCampaigns();
    const campaign = pickCampaignForProduct(campaignData, products[0]);
    const unitPrice = campaign
      ? computeSalePrice(baseListPrice, Number(campaign.discount_percent))
      : baseListPrice;

    if (existing.length) {
      const newQty = existing[0].quantity + quantity;
      if (newQty > availableStock) {
        return res.status(400).json({ success: false, message: 'Số lượng vượt quá tồn kho' });
      }
      await db.query(
        'UPDATE carts SET quantity = ? WHERE id = ?',
        [newQty, existing[0].id]
      );
    } else {
      if (quantity > availableStock) {
        return res.status(400).json({ success: false, message: 'Số lượng vượt quá tồn kho' });
      }
      await db.query(
        `INSERT INTO carts (user_id, product_id, variant_id, color_name, storage_label, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          product_id,
          selectedStorage ? selectedStorage.id : null,
          chosenColor,
          selectedStorage ? selectedStorage.storage_label : null,
          unitPrice,
          quantity,
        ]
      );
    }

    res.json({ success: true, message: 'Đã thêm vào giỏ hàng' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/cart/:id
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' });
    }

    const [cartItem] = await db.query(
      `SELECT c.id, c.variant_id, p.stock, v.stock AS variant_stock
       FROM carts c
       JOIN products p ON c.product_id = p.id
       LEFT JOIN product_variants v ON c.variant_id = v.id
       WHERE c.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!cartItem.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ' });
    }
    const maxStock = cartItem[0].variant_id ? cartItem[0].variant_stock : cartItem[0].stock;
    if (quantity > maxStock) {
      return res.status(400).json({ success: false, message: 'Số lượng vượt quá tồn kho' });
    }

    await db.query('UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, req.params.id, req.user.id]);
    res.json({ success: true, message: 'Cập nhật giỏ hàng thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// DELETE /api/cart/:id
const removeFromCart = async (req, res) => {
  try {
    await db.query('DELETE FROM carts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Đã xóa khỏi giỏ hàng' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    await db.query('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
