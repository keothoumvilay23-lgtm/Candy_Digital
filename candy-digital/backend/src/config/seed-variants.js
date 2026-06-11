// =============================================================================
// Dữ liệu màu sắc + dung lượng mặc định cho các sản phẩm (theo slug).
// Dùng chung cho:
//   - scripts/seed-product-variants.js  (chạy tay, GHI ĐÈ toàn bộ)
//   - ensureVariantSeed() khi server khởi động (chỉ chèn khi DB còn TRỐNG)
// =============================================================================

const VARIANT_SEED = {
  // ---------------- iPhones ----------------
  'iphone-15-pro-max-256gb': {
    colors: [
      { name: 'Titan Tự Nhiên', hex: '#8e8a83' },
      { name: 'Titan Trắng', hex: '#f5f4ef' },
      { name: 'Titan Xanh', hex: '#2f3a4a' },
      { name: 'Titan Đen', hex: '#1c1c1e' },
    ],
    storage: [
      { label: '256GB', price: 32990000, stock: 12 },
      { label: '512GB', price: 38990000, stock: 7 },
      { label: '1TB', price: 45990000, stock: 4 },
    ],
  },
  'iphone-15-pro-128gb': {
    colors: [
      { name: 'Titan Tự Nhiên', hex: '#8e8a83' },
      { name: 'Titan Trắng', hex: '#f5f4ef' },
      { name: 'Titan Xanh', hex: '#2f3a4a' },
      { name: 'Titan Đen', hex: '#1c1c1e' },
    ],
    storage: [
      { label: '128GB', price: 28990000, stock: 15 },
      { label: '256GB', price: 31990000, stock: 10 },
      { label: '512GB', price: 37990000, stock: 5 },
    ],
  },
  'iphone-14-128gb': {
    colors: [
      { name: 'Đen Midnight', hex: '#1c1c1e' },
      { name: 'Trắng Starlight', hex: '#f0ede5' },
      { name: 'Xanh dương', hex: '#5e7a91' },
      { name: 'Tím', hex: '#bdb1c8' },
      { name: 'Đỏ', hex: '#ba0c2e' },
    ],
    storage: [
      { label: '128GB', price: 19990000, stock: 18 },
      { label: '256GB', price: 22990000, stock: 10 },
      { label: '512GB', price: 27990000, stock: 5 },
    ],
  },

  // ---------------- Samsung ----------------
  'samsung-s24-ultra-256gb': {
    colors: [
      { name: 'Titan Xám', hex: '#94999f' },
      { name: 'Titan Đen', hex: '#4a4a4d' },
      { name: 'Titan Tím', hex: '#c5b4d0' },
      { name: 'Titan Vàng', hex: '#e7d6b3' },
    ],
    storage: [
      { label: '256GB', price: 29990000, stock: 8 },
      { label: '512GB', price: 33990000, stock: 5 },
      { label: '1TB', price: 39990000, stock: 3 },
    ],
  },
  'samsung-s24-128gb': {
    colors: [
      { name: 'Onyx Black', hex: '#25272a' },
      { name: 'Marble Gray', hex: '#b9bcc1' },
      { name: 'Cobalt Violet', hex: '#4d4385' },
      { name: 'Amber Yellow', hex: '#f5cd60' },
    ],
    storage: [
      { label: '128GB', price: 22490000, stock: 14 },
      { label: '256GB', price: 24990000, stock: 9 },
      { label: '512GB', price: 28990000, stock: 4 },
    ],
  },

  // ---------------- Tai nghe ----------------
  // AirPods Pro 2 chỉ có 1 màu trắng - bỏ qua picker.
  'samsung-buds2-pro': {
    colors: [
      { name: 'Graphite', hex: '#2a2c30' },
      { name: 'Trắng', hex: '#f3f1ec' },
      { name: 'Bora Purple', hex: '#837dac' },
    ],
    storage: [],
  },

  // ---------------- Đồng hồ ----------------
  'apple-watch-series-9-45mm': {
    colors: [
      { name: 'Midnight', hex: '#1c1c1e' },
      { name: 'Starlight', hex: '#faf6ee' },
      { name: 'Silver', hex: '#d6d6d6' },
      { name: '(PRODUCT)RED', hex: '#ba0c2e' },
      { name: 'Pink', hex: '#f3b8b1' },
    ],
    storage: [],
  },

  // ---------------- Tablet ----------------
  'ipad-air-m2-256gb-wifi': {
    colors: [
      { name: 'Xám không gian', hex: '#6e7079' },
      { name: 'Xanh Blue', hex: '#aec1d4' },
      { name: 'Tím Purple', hex: '#c8b8cf' },
      { name: 'Vàng Starlight', hex: '#ddd2b9' },
    ],
    storage: [
      { label: '128GB', price: 16990000, stock: 8 },
      { label: '256GB', price: 18990000, stock: 6 },
      { label: '512GB', price: 22990000, stock: 4 },
      { label: '1TB', price: 28990000, stock: 2 },
    ],
  },

  // ---------------- Phụ kiện ----------------
  'op-lung-iphone-15-pro-max': {
    colors: [
      { name: 'Đen', hex: '#25272a' },
      { name: 'Xanh dương', hex: '#4275bd' },
      { name: 'Hồng', hex: '#e7a8b4' },
      { name: 'Be', hex: '#d6c4a4' },
    ],
    storage: [],
  },
};

/**
 * Tự seed màu sắc + dung lượng khi DB còn TRỐNG (chạy lúc server khởi động).
 * An toàn để gọi mỗi lần khởi động: chỉ chèn khi bảng product_colors chưa có dòng nào,
 * nên KHÔNG bao giờ ghi đè dữ liệu admin đã nhập.
 * @param {import('mysql2/promise').Pool} db
 */
async function ensureVariantSeed(db) {
  const [[{ colorCount }]] = await db.query('SELECT COUNT(*) AS colorCount FROM product_colors');
  if (colorCount > 0) return; // Đã có dữ liệu màu → không tự seed nữa.

  let seeded = 0;
  for (const [slug, data] of Object.entries(VARIANT_SEED)) {
    const [rows] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
    if (!rows.length) continue;
    const productId = rows[0].id;

    for (let i = 0; i < data.colors.length; i += 1) {
      const c = data.colors[i];
      await db.query(
        `INSERT INTO product_colors (product_id, name, hex_code, sort_order, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [productId, c.name, c.hex, i]
      );
    }

    // Chỉ chèn dung lượng nếu sản phẩm này chưa có biến thể nào (tránh trùng).
    const [[{ variantCount }]] = await db.query(
      'SELECT COUNT(*) AS variantCount FROM product_variants WHERE product_id = ?',
      [productId]
    );
    if (variantCount === 0) {
      for (let i = 0; i < data.storage.length; i += 1) {
        const s = data.storage[i];
        await db.query(
          `INSERT INTO product_variants (product_id, color, storage_label, price, stock, is_active, sort_order)
           VALUES (?, NULL, ?, ?, ?, 1, ?)`,
          [productId, s.label, s.price, s.stock, i]
        );
      }
    }
    seeded += 1;
  }

  if (seeded > 0) {
    console.log(`🎨 Auto-seed màu sắc/dung lượng cho ${seeded} sản phẩm (DB trống lần đầu).`);
  }
}

module.exports = { VARIANT_SEED, ensureVariantSeed };
