require('dotenv').config();
const { ensureSchema } = require('../src/config/schema-updater');
const db = require('../src/config/db');

(async () => {
  try {
    console.log('Running ensureSchema...');
    await ensureSchema();
    console.log('✅ Schema applied');

    const [products] = await db.query("SHOW COLUMNS FROM products");
    console.log('PRODUCTS columns now:');
    products.forEach((c) => console.log(`  - ${c.Field}`));

    const [colors] = await db.query("SHOW COLUMNS FROM product_colors");
    console.log('PRODUCT_COLORS columns now:');
    colors.forEach((c) => console.log(`  - ${c.Field}`));

    process.exit(0);
  } catch (err) {
    console.error('Schema error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
