require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  try {
    const [products] = await db.query(
      "SHOW COLUMNS FROM products"
    );
    console.log('PRODUCTS columns:');
    products.forEach((c) => console.log(`  - ${c.Field} (${c.Type})`));

    const [colors] = await db.query(
      "SHOW COLUMNS FROM product_colors"
    );
    console.log('\nPRODUCT_COLORS columns:');
    colors.forEach((c) => console.log(`  - ${c.Field} (${c.Type})`));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
