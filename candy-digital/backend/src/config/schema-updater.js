const db = require('./db');

const columnExists = async (tableName, columnName) => {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows.length > 0;
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  if (!(await columnExists(tableName, columnName))) {
    await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
};

const constraintExists = async (tableName, constraintName) => {
  const [rows] = await db.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [tableName, constraintName]
  );
  return rows.length > 0;
};

const addConstraintIfMissing = async (tableName, constraintName, sql) => {
  if (!(await constraintExists(tableName, constraintName))) {
    await db.query(sql);
  }
};

const indexExists = async (tableName, indexName) => {
  const [rows] = await db.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return rows.length > 0;
};

const addIndexIfMissing = async (tableName, indexName, columns) => {
  if (!(await indexExists(tableName, indexName))) {
    await db.query(`ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\` (${columns})`);
  }
};

const dropIndexIfExists = async (tableName, indexName) => {
  if (await indexExists(tableName, indexName)) {
    await db.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
  }
};

const ensureSchema = async () => {
  // product_variants here is repurposed to hold STORAGE OPTIONS (e.g. 128GB / 256GB / 512GB)
  // with per-storage price and stock. Color is independent and stored in product_colors.
  await db.query(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      color VARCHAR(50) NULL,
      storage_label VARCHAR(50) NOT NULL,
      price DECIMAL(15,2) NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Allow the legacy NOT NULL color column on existing installations.
  await db.query('ALTER TABLE product_variants MODIFY COLUMN color VARCHAR(50) NULL');

  await db.query(`
    CREATE TABLE IF NOT EXISTS product_colors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      name VARCHAR(50) NOT NULL,
      hex_code VARCHAR(10) NULL,
      image_url VARCHAR(500) NULL,
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  await addColumnIfMissing('product_colors', 'image_url', 'VARCHAR(500) NULL AFTER hex_code');
  await addColumnIfMissing('product_colors', 'gallery_json', 'JSON NULL AFTER image_url');

  // Rich product info (TGDD-style detail page)
  await addColumnIfMissing('products', 'short_description', 'VARCHAR(500) NULL AFTER description');
  await addColumnIfMissing('products', 'warranty', 'VARCHAR(100) NULL AFTER brand');
  await addColumnIfMissing('products', 'origin', 'VARCHAR(100) NULL AFTER warranty');
  await addColumnIfMissing('products', 'highlights', 'JSON NULL AFTER origin');
  await addColumnIfMissing('products', 'specifications', 'JSON NULL AFTER highlights');

  await addColumnIfMissing('carts', 'variant_id', 'INT NULL AFTER product_id');
  await addColumnIfMissing('carts', 'color_name', 'VARCHAR(50) NULL AFTER variant_id');
  await addColumnIfMissing('carts', 'storage_label', 'VARCHAR(50) NULL AFTER color_name');
  await addColumnIfMissing('carts', 'unit_price', 'DECIMAL(15,2) NULL AFTER storage_label');
  await addConstraintIfMissing(
    'carts',
    'fk_carts_variant_id',
    'ALTER TABLE carts ADD CONSTRAINT fk_carts_variant_id FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL'
  );

  // The original UNIQUE KEY (user_id, product_id) blocks adding the same product
  // with multiple variants. Replace it with a wider unique key.
  // Need a backing index on product_id first, otherwise the FK on product_id
  // prevents dropping the old unique index.
  await addIndexIfMissing('carts', 'idx_carts_product_id', '`product_id`');
  await addIndexIfMissing('carts', 'idx_carts_user_id', '`user_id`');
  await dropIndexIfExists('carts', 'unique_cart_item');
  await addIndexIfMissing(
    'carts',
    'unique_cart_item_variant',
    '`user_id`, `product_id`, `variant_id`'
  );

  await db.query(`
    CREATE TABLE IF NOT EXISTS payment_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      method VARCHAR(30) NOT NULL UNIQUE,
      label VARCHAR(100) NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      account_name VARCHAR(150) DEFAULT NULL,
      account_number VARCHAR(50) DEFAULT NULL,
      bank_code VARCHAR(20) DEFAULT NULL,
      bank_name VARCHAR(100) DEFAULT NULL,
      qr_image_url VARCHAR(500) DEFAULT NULL,
      instruction TEXT,
      sort_order INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    INSERT IGNORE INTO payment_settings (method, label, is_active, sort_order, instruction)
    VALUES
      ('cod', 'Thanh toán khi nhận hàng (COD)', 1, 0, 'Khách thanh toán bằng tiền mặt khi nhận hàng.'),
      ('bank_transfer', 'Chuyển khoản ngân hàng', 1, 1, 'Vui lòng chuyển khoản theo thông tin bên dưới và ghi đúng nội dung chuyển khoản.'),
      ('momo', 'Ví MoMo', 1, 2, 'Vui lòng quét mã QR MoMo hoặc chuyển tới số điện thoại bên dưới.'),
      ('zalopay', 'ZaloPay', 1, 3, 'Vui lòng quét mã QR ZaloPay hoặc chuyển tới số điện thoại bên dưới.'),
      ('vnpay', 'VNPay (ATM/QR/Thẻ quốc tế)', 1, 4, 'Bạn sẽ được chuyển sang cổng VNPay để thanh toán. Hệ thống tự xác nhận qua IPN.')
  `);

  // Bổ sung 'vnpay' vào enum payment_method cho các cài đặt cũ (idempotent).
  await db.query(
    "ALTER TABLE orders MODIFY COLUMN payment_method ENUM('cod','bank_transfer','momo','zalopay','vnpay') DEFAULT 'cod'"
  );

  // Payer info captured from customer when checking out (for non-COD methods)
  await addColumnIfMissing('orders', 'payer_bank_name', 'VARCHAR(100) NULL AFTER payment_method');
  await addColumnIfMissing('orders', 'payer_account_number', 'VARCHAR(50) NULL AFTER payer_bank_name');
  await addColumnIfMissing('orders', 'payer_account_name', 'VARCHAR(150) NULL AFTER payer_account_number');

  // Thanh toán trả trước: pending → admin/webhook; paid sau khi admin xác nhận (hoặc đơn cũ đã xử lý)
  await addColumnIfMissing(
    'orders',
    'payment_status',
    "VARCHAR(20) NOT NULL DEFAULT 'na' COMMENT 'na|pending|paid' AFTER payer_account_name"
  );
  await addColumnIfMissing('orders', 'bank_in_amount', 'DECIMAL(15,2) NULL AFTER payment_status');
  await addColumnIfMissing('orders', 'bank_in_content', 'TEXT NULL AFTER bank_in_amount');
  await addColumnIfMissing('orders', 'bank_in_reference', 'VARCHAR(150) NULL AFTER bank_in_content');
  await addColumnIfMissing('orders', 'bank_in_at', 'DATETIME NULL AFTER bank_in_reference');
  await addColumnIfMissing('orders', 'bank_in_account', 'VARCHAR(80) NULL AFTER bank_in_at');
  await addColumnIfMissing('orders', 'bank_in_raw', 'JSON NULL AFTER bank_in_account');
  await addColumnIfMissing('orders', 'payment_confirmed_at', 'DATETIME NULL AFTER bank_in_raw');

  await db.query(`
    UPDATE orders SET payment_status = 'paid'
    WHERE payment_method IN ('bank_transfer','momo','zalopay')
      AND status IN ('confirmed','shipping','done')
      AND (payment_status IS NULL OR payment_status = '' OR payment_status = 'na')
  `);
  await db.query(`
    UPDATE orders SET payment_status = 'pending'
    WHERE payment_method IN ('bank_transfer','momo','zalopay')
      AND status = 'pending'
      AND (payment_status IS NULL OR payment_status = '' OR payment_status = 'na')
  `);
  await db.query(`
    UPDATE orders SET payment_status = 'na'
    WHERE (payment_method IS NULL OR payment_method = 'cod')
      AND (payment_status IS NULL OR payment_status = '' OR payment_status = 'na')
  `);
  await db.query(`
    UPDATE orders SET payment_status = 'na'
    WHERE status = 'cancelled' AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '')
  `);

  await db.query(`
    UPDATE orders SET payment_status = 'pending'
    WHERE payment_method IN ('bank_transfer','momo','zalopay')
      AND status = 'pending'
      AND (payment_status IS NULL OR payment_status = '')
  `);
  await addColumnIfMissing('order_items', 'variant_id', 'INT NULL AFTER product_id');
  await addColumnIfMissing('order_items', 'color_name', 'VARCHAR(50) NULL AFTER product_name');
  await addColumnIfMissing('order_items', 'storage_label', 'VARCHAR(50) NULL AFTER color_name');
  await addConstraintIfMissing(
    'order_items',
    'fk_order_items_variant_id',
    'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_variant_id FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL'
  );

  // ============================================================
  // PROMOTION CAMPAIGNS
  // Admin tự cấu hình các đợt khuyến mãi (11.11, 12.12, Black Friday...).
  // Mỗi campaign có % giảm giá thật, khung thời gian áp dụng, phạm vi
  // (toàn bộ / theo danh mục / theo từng sản phẩm) và độ ưu tiên.
  // ============================================================
  await db.query(`
    CREATE TABLE IF NOT EXISTS promotion_campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(150) NOT NULL UNIQUE,
      banner_text VARCHAR(255) NULL,
      description TEXT NULL,
      discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
      starts_at DATETIME NOT NULL,
      ends_at DATETIME NOT NULL,
      scope ENUM('all','category','product') NOT NULL DEFAULT 'all',
      priority INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_promotion_active_window (is_active, starts_at, ends_at)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS promotion_campaign_targets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      campaign_id INT NOT NULL,
      target_type ENUM('category','product') NOT NULL,
      target_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_campaign_target (campaign_id, target_type, target_id),
      INDEX idx_target_lookup (target_type, target_id),
      FOREIGN KEY (campaign_id) REFERENCES promotion_campaigns(id) ON DELETE CASCADE
    )
  `);

  // Seed các campaign mẫu — chỉ chèn lần đầu, admin có thể chỉnh sửa hoặc xoá sau đó.
  const [[{ campaignCount }]] = await db.query(
    'SELECT COUNT(*) AS campaignCount FROM promotion_campaigns'
  );
  if (campaignCount === 0) {
    const year = new Date().getFullYear();
    await db.query(
      `INSERT INTO promotion_campaigns
        (name, slug, banner_text, description, discount_percent, starts_at, ends_at, scope, priority, is_active)
       VALUES
        (?, 'sale-11-11', '11.11 · Single Day Mega Sale', 'Đợt giảm giá toàn sàn nhân ngày 11.11.', 30.00, ?, ?, 'all', 110, 1),
        (?, 'sale-12-12', '12.12 · Year-End Sale', 'Tổng kết năm — giảm sâu toàn ngành hàng.', 25.00, ?, ?, 'all', 120, 1),
        (?, 'black-friday', 'BLACK FRIDAY · Cyber Week', 'Tuần lễ vàng của ngành công nghệ.', 35.00, ?, ?, 'all', 99, 1)`,
      [
        `Sale 11.11 ${year}`, `${year}-11-10 00:00:00`, `${year}-11-12 23:59:59`,
        `Sale 12.12 ${year}`, `${year}-12-11 00:00:00`, `${year}-12-13 23:59:59`,
        `Black Friday ${year}`, `${year}-11-24 00:00:00`, `${year}-11-30 23:59:59`,
      ]
    );
  }
};

module.exports = { ensureSchema };
