require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  try {
    const [products] = await db.query('SELECT id, slug, name FROM products ORDER BY id');
    for (const p of products) {
      const [colors] = await db.query('SELECT name, hex_code FROM product_colors WHERE product_id = ? ORDER BY sort_order', [p.id]);
      const [storage] = await db.query('SELECT storage_label, price, stock FROM product_variants WHERE product_id = ? ORDER BY sort_order', [p.id]);
      console.log(`#${p.id} ${p.name}`);
      console.log(`  Màu (${colors.length}):`, colors.map((c) => `${c.name}${c.hex_code ? '/' + c.hex_code : ''}`).join(', ') || '(trống)');
      console.log(`  GB (${storage.length}):`, storage.map((s) => `${s.storage_label} ${s.price}`).join(', ') || '(trống)');
    }
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
