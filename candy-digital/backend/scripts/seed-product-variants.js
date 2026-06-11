// Seed colors + storage tiers for all existing products.
// Re-running is safe: this script REPLACES all colors/variants of each listed product.
// Usage: node scripts/seed-product-variants.js
require('dotenv').config();
const db = require('../src/config/db');
const { VARIANT_SEED: PRODUCTS } = require('../src/config/seed-variants');

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
