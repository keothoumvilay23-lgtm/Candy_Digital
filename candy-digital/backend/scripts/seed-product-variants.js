// Seed colors + storage tiers for all existing products.
// Re-running is safe: this script REPLACES all colors/variants of each listed product.
// Usage: node scripts/seed-product-variants.js
require('dotenv').config();
const db = require('../src/config/db');

// Each product: list of colors and (optionally) storage options.
const PRODUCTS = {
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

(async () => {
  try {
    let total = 0;
    for (const [slug, data] of Object.entries(PRODUCTS)) {
      const [rows] = await db.query('SELECT id, name FROM products WHERE slug = ?', [slug]);
      if (!rows.length) {
        console.log(`⚠️  Bỏ qua (không thấy slug): ${slug}`);
        continue;
      }
      const productId = rows[0].id;

      // Replace colors
      await db.query('DELETE FROM product_colors WHERE product_id = ?', [productId]);
      for (let i = 0; i < data.colors.length; i += 1) {
        const c = data.colors[i];
        await db.query(
          `INSERT INTO product_colors (product_id, name, hex_code, sort_order, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          [productId, c.name, c.hex, i]
        );
      }

      // Replace storage tiers (need to clear cart variants first to keep FK clean)
      await db.query(
        `UPDATE carts SET variant_id = NULL
         WHERE variant_id IN (SELECT id FROM (SELECT id FROM product_variants WHERE product_id = ?) AS v)`,
        [productId]
      );
      await db.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
      for (let i = 0; i < data.storage.length; i += 1) {
        const s = data.storage[i];
        await db.query(
          `INSERT INTO product_variants (product_id, color, storage_label, price, stock, is_active, sort_order)
           VALUES (?, NULL, ?, ?, ?, 1, ?)`,
          [productId, s.label, s.price, s.stock, i]
        );
      }

      console.log(
        `✅ [${productId}] ${rows[0].name} — ${data.colors.length} màu, ${data.storage.length} dung lượng`
      );
      total += 1;
    }
    console.log(`\nDONE. Đã cập nhật ${total} sản phẩm.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
