-- ============================================================
-- Candy Digital - Database Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS candy_digital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE candy_digital;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id INT DEFAULT NULL,
  image_url VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  brand VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- PRODUCT VARIANTS (COLOR + STORAGE)
-- ============================================================
CREATE TABLE product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  color VARCHAR(50) NOT NULL,
  storage_label VARCHAR(50) NOT NULL,
  price DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- CARTS
-- ============================================================
CREATE TABLE carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT DEFAULT NULL,
  color_name VARCHAR(50) DEFAULT NULL,
  storage_label VARCHAR(50) DEFAULT NULL,
  unit_price DECIMAL(15,2) DEFAULT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_item (user_id, product_id, variant_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  shipping_name VARCHAR(100) NOT NULL,
  shipping_phone VARCHAR(15) NOT NULL,
  shipping_address TEXT NOT NULL,
  payment_method ENUM('cod', 'bank_transfer', 'momo', 'zalopay', 'vnpay') DEFAULT 'cod',
  payer_bank_name VARCHAR(100) DEFAULT NULL,
  payer_account_number VARCHAR(50) DEFAULT NULL,
  payer_account_name VARCHAR(150) DEFAULT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'na',
  bank_in_amount DECIMAL(15,2) DEFAULT NULL,
  bank_in_content TEXT,
  bank_in_reference VARCHAR(150) DEFAULT NULL,
  bank_in_at DATETIME DEFAULT NULL,
  bank_in_account VARCHAR(80) DEFAULT NULL,
  bank_in_raw JSON DEFAULT NULL,
  payment_confirmed_at DATETIME DEFAULT NULL,
  status ENUM('pending', 'confirmed', 'shipping', 'done', 'cancelled') DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  variant_id INT DEFAULT NULL,
  product_name VARCHAR(200) NOT NULL,
  color_name VARCHAR(50) DEFAULT NULL,
  storage_label VARCHAR(50) DEFAULT NULL,
  product_image VARCHAR(255),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
CREATE TABLE chat_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  session_token VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin account (password: Admin@123)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@candydigital.vn', '$2a$10$xldPNb.N1/B/zRvA75ZxuOpSD6n87XYzJV9Y3IO0pUJOoAGFmaNOu', 'admin');

-- Categories
INSERT INTO categories (name, slug, parent_id) VALUES
('Điện thoại', 'dien-thoai', NULL),
('Laptop', 'laptop', NULL),
('Máy tính bảng', 'may-tinh-bang', NULL),
('Tai nghe', 'tai-nghe', NULL),
('Đồng hồ thông minh', 'dong-ho-thong-minh', NULL),
('Phụ kiện', 'phu-kien', NULL);

INSERT INTO categories (name, slug, parent_id) VALUES
('iPhone', 'iphone', 1),
('Samsung', 'samsung', 1),
('Xiaomi', 'xiaomi', 1),
('MacBook', 'macbook', 2),
('iPad', 'ipad', 3);

-- Products
INSERT INTO products (category_id, name, slug, description, price, stock, brand) VALUES
(7, 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 'iPhone 15 Pro Max với chip A17 Pro mạnh mẽ, camera 48MP chuyên nghiệp, màn hình Super Retina XDR 6.7 inch, khung titan cao cấp.', 32990000, 20, 'Apple'),
(7, 'iPhone 15 Pro 128GB', 'iphone-15-pro-128gb', 'iPhone 15 Pro với chip A17 Pro, camera 48MP, màn hình 6.1 inch, thiết kế titan sang trọng.', 28990000, 15, 'Apple'),
(7, 'iPhone 14 128GB', 'iphone-14-128gb', 'iPhone 14 chip A15 Bionic, camera 12MP cải tiến, pin 3279mAh, màn hình 6.1 inch.', 19990000, 30, 'Apple'),
(8, 'Samsung Galaxy S24 Ultra 256GB', 'samsung-s24-ultra-256gb', 'Galaxy S24 Ultra với bút S Pen tích hợp, camera 200MP, chip Snapdragon 8 Gen 3.', 29990000, 12, 'Samsung'),
(8, 'Samsung Galaxy S24 128GB', 'samsung-s24-128gb', 'Galaxy S24 chip Exynos 2400, camera 50MP, màn hình Dynamic AMOLED 6.2 inch.', 22490000, 25, 'Samsung'),
(4, 'AirPods Pro 2', 'airpods-pro-2', 'AirPods Pro thế hệ 2 với chống ồn chủ động, âm thanh không gian, chip H2.', 6490000, 50, 'Apple'),
(4, 'Samsung Galaxy Buds2 Pro', 'samsung-buds2-pro', 'Tai nghe true wireless chống ồn ANC, âm thanh Hi-Fi 24bit, chống nước IPX7.', 3490000, 35, 'Samsung'),
(5, 'Apple Watch Series 9 45mm', 'apple-watch-series-9-45mm', 'Apple Watch S9 với chip S9 SiP, màn hình always-on, đo SpO2, ECG.', 11990000, 18, 'Apple'),
(11, 'iPad Air M2 256GB WiFi', 'ipad-air-m2-256gb-wifi', 'iPad Air chip M2 mạnh mẽ, màn hình Liquid Retina 11 inch, hỗ trợ Apple Pencil Pro.', 18990000, 10, 'Apple'),
(6, 'Ốp lưng iPhone 15 Pro Max', 'op-lung-iphone-15-pro-max', 'Ốp lưng silicon cao cấp cho iPhone 15 Pro Max, chống sốc 4 góc.', 290000, 100, 'Apple');

-- Product images (điện thoại: nhiều góc CDN TGDD tham khảo; sản phẩm khác: ảnh upload cục bộ)
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-tu-nhien-1.jpg', 1, 0),
(1, 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/305660/iphone-15-pro-max-titan-tu-nhien-2-638629415139750508.jpg', 0, 1),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-tu-nhien-3.jpg', 0, 2),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-tu-nhien-4.jpg', 0, 3),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-tu-nhien-tem-99.jpg', 0, 4),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-black-1.jpg', 0, 5),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-black-2.jpg', 0, 6),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-black-3.jpg', 0, 7),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-den-2.jpg', 0, 8),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-trang-2.jpg', 0, 9),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-black-1.jpg', 1, 0),
(2, 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/303831/iphone-15-pro-titan-den-2-638629422334738686.jpg', 0, 1),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-black-3.jpg', 0, 2),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-black-4.jpg', 0, 3),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-titan-tu-nhien-1.jpg', 0, 4),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-titan-tu-nhien-2.jpg', 0, 5),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-titan-tu-nhien-3.jpg', 0, 6),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-titan-tu-nhien-4.jpg', 0, 7),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-blue-1.jpg', 0, 8),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-blue-2.jpg', 0, 9),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-1.jpg', 1, 0),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-2.jpg', 0, 1),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-3.jpg', 0, 2),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-4.jpg', 0, 3),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-5.jpg', 0, 4),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-6.jpg', 0, 5),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-7.jpg', 0, 6),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-8.jpg', 0, 7),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-9.jpg', 0, 8),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-10.jpg', 0, 9),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-1.jpg', 1, 0),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-2.jpg', 0, 1),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-3.jpg', 0, 2),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-4.jpg', 0, 3),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-5.jpg', 0, 4),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-6.jpg', 0, 5),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-7.jpg', 0, 6),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-8.jpg', 0, 7),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-9.jpg', 0, 8),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-10.jpg', 0, 9),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-xam-1.jpg', 1, 0),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-xam-2.jpg', 0, 1),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-xam-3.jpg', 0, 2),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-den-1.jpg', 0, 3),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-den-2.jpg', 0, 4),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-den-3.jpg', 0, 5),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-tim-1.jpg', 0, 6),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-tim-2.jpg', 0, 7),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-tim-3.jpg', 0, 8),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-vang-1.jpg', 0, 9),
(6, '/uploads/products/airpods-pro-2-1.jpg', 1, 1),
(7, '/uploads/products/buds2-pro-1.jpg', 1, 1),
(8, '/uploads/products/watch-s9-1.jpg', 1, 1),
(9, '/uploads/products/ipad-air-m2-1.jpg', 1, 1),
(10, '/uploads/products/op-lung-1.jpg', 1, 1);
