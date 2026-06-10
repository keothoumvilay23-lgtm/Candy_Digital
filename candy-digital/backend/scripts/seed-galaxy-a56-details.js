/**
 * Cập nhật đầy đủ nội dung cho Samsung Galaxy A56 5G trong DB candy_digital.
 * Chạy: từ thư mục backend → node scripts/seed-galaxy-a56-details.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../src/config/db');

const SHORT_DESC =
  'Galaxy A56 5G: màn Super AMOLED 6.7" 120 Hz, chip Exynos 1580, camera 50 MP OIS, pin 5000 mAh sạc 45 W, IP67, 5G, One UI 7 (Android 15).';

const LONG_DESC = `Samsung Galaxy A56 5G hướng tới người dùng cần smartphone cân bằng giữa hiệu năng, camera và thời lượng pin, với kết nối 5G và giao diện One UI 7 trên nền Android 15.

Hiệu năng: Vi xử lý Exynos 1580 (4 nm), GPU Xclipse 540 — đáp ứng tốt đa tác vụ, mạng xã hội, giải trí và chỉnh sửa ảnh nhanh.

Màn hình: Super AMOLED 6.7 inch, độ phân giải 1080 × 2340, tần số quét 120 Hz, HDR10+, kính Gorilla Glass Victus+ (theo thông số hãng).

Camera: Sau: 50 MP (góc rộng, OIS) + 12 MP siêu rộng + 5 MP macro. Trước: 12 MP. Quay video tối đa 4K 30 fps (tùy chế độ).

Pin: 5000 mAh, hỗ trợ sạc nhanh có dây 45 W (thời gian sạc phụ thuộc củ sạc và điều kiện sử dụng). Nên dùng phụ kiện tương thích chính hãng.

Khác: Chống nước/bụi IP67; cảm biến vân tay trong màn hình; Wi‑Fi 6; Bluetooth; không có khe thẻ nhớ microSD trên một số phiên bản thị trường.

Màu sắc hàng tham khảo: Awesome Graphite, Awesome Olive, Awesome Pink, Awesome Gray (tùy tồn kho thực tế).`;

const HIGHLIGHTS = [
  'Exynos 1580 (4 nm) + GPU Xclipse 540 — đa nhiệm mượt',
  'Màn Super AMOLED 6.7" 120 Hz, HDR10+ — hiển thị sắc nét',
  'Camera 50 MP OIS + góc siêu rộng 12 MP',
  'Pin 5000 mAh, sạc nhanh 45 W',
  'IP67, kính Gorilla Glass Victus+',
  'Android 15 & One UI 7',
];

const SPECIFICATIONS = [
  {
    group: 'Cấu hình & Bộ nhớ',
    items: [
      { label: 'CPU', value: 'Exynos 1580 (4 nm)' },
      { label: 'GPU', value: 'Xclipse 540' },
      { label: 'RAM', value: '8 GB / 12 GB (theo phiên bản)' },
      { label: 'Bộ nhớ trong', value: '128 GB / 256 GB, UFS 3.1' },
      { label: 'Thẻ nhớ', value: 'Không hỗ trợ microSD (một số SKU)' },
      { label: 'Hệ điều hành', value: 'Android 15 · One UI 7' },
    ],
  },
  {
    group: 'Camera & Màn hình',
    items: [
      { label: 'Màn hình', value: 'Super AMOLED 6.7", 1080 × 2340, 120 Hz, HDR10+' },
      { label: 'Độ sáng / kính', value: 'Gorilla Glass Victus+' },
      { label: 'Camera sau', value: '50 MP (chính, OIS) + 12 MP (siêu rộng) + 5 MP (macro)' },
      { label: 'Camera trước', value: '12 MP' },
      { label: 'Quay video', value: '4K 30 fps; 1080p 30/60 fps' },
    ],
  },
  {
    group: 'Pin & Sạc',
    items: [
      { label: 'Dung lượng pin', value: '5000 mAh' },
      { label: 'Cổng', value: 'USB Type-C' },
      { label: 'Sạc nhanh', value: '45 W (cần bộ sạc tương thích)' },
    ],
  },
  {
    group: 'Kết nối',
    items: [
      { label: 'SIM', value: 'Nano-SIM' },
      { label: 'Mạng di động', value: '5G / 4G LTE' },
      { label: 'Wi‑Fi', value: 'Wi‑Fi 6' },
      { label: 'Bluetooth', value: 'Có (phiên bản theo thiết bị)' },
      { label: 'Định vị', value: 'GPS, GLONASS, Galileo, BeiDou' },
    ],
  },
  {
    group: 'Tiện ích & Thiết kế',
    items: [
      { label: 'Bảo mật', value: 'Cảm biến vân tay trong màn hình' },
      { label: 'Kháng nước/bụi', value: 'IP67' },
      { label: 'Khối lượng / kích thước', value: 'Theo thông số Samsung theo từng thị trường' },
    ],
  },
  {
    group: 'Thông tin chung',
    items: [
      { label: 'Bảo hành', value: '12 tháng chính hãng (theo chính sách cửa hàng)' },
      { label: 'Xuất xứ', value: 'Chính hãng VN/A' },
    ],
  },
];

const COLORS = [
  { name: 'Awesome Graphite', hex: '#3C3C41', sort: 0 },
  { name: 'Awesome Olive', hex: '#5A6B52', sort: 1 },
  { name: 'Awesome Pink', hex: '#E8C4C8', sort: 2 },
  { name: 'Awesome Gray', hex: '#9BA3AE', sort: 3 },
];

/** Giá tham khảo VN — chỉnh theo thực tế cửa hàng */
const STORAGE_OPTIONS = [
  { label: '128GB', price: 13999999, stock: 5, sort: 0 },
  { label: '256GB', price: 15999999, stock: 4, sort: 1 },
];

async function main() {
  const [[product]] = await db.query(
    `SELECT id, name, slug FROM products
     WHERE LOWER(name) LIKE '%galaxy a56%' OR slug LIKE '%a56%'
     ORDER BY id DESC LIMIT 1`
  );

  if (!product) {
    console.error('Không tìm thấy sản phẩm chứa "Galaxy A56" hoặc slug A56. Hãy tạo sản phẩm trong admin trước, rồi chạy lại script.');
    process.exit(1);
  }

  const pid = product.id;
  console.log(`Cập nhật sản phẩm id=${pid} — ${product.name}`);

  await db.query(
    `UPDATE products SET
      short_description = ?,
      description = ?,
      brand = 'Samsung',
      warranty = '12 tháng',
      origin = 'Chính hãng VN/A',
      highlights = ?,
      specifications = ?
    WHERE id = ?`,
    [SHORT_DESC, LONG_DESC, JSON.stringify(HIGHLIGHTS), JSON.stringify(SPECIFICATIONS), pid]
  );

  await db.query('DELETE FROM product_colors WHERE product_id = ?', [pid]);
  for (const c of COLORS) {
    await db.query(
      `INSERT INTO product_colors (product_id, name, hex_code, image_url, sort_order, is_active)
       VALUES (?, ?, ?, NULL, ?, 1)`,
      [pid, c.name, c.hex, c.sort]
    );
  }

  await db.query('DELETE FROM product_variants WHERE product_id = ?', [pid]);
  for (const s of STORAGE_OPTIONS) {
    await db.query(
      `INSERT INTO product_variants (product_id, color, storage_label, price, stock, is_active, sort_order)
       VALUES (?, NULL, ?, ?, ?, 1, ?)`,
      [pid, s.label, s.price, s.stock, s.sort]
    );
  }

  console.log('✅ Đã cập nhật mô tả, highlights, thông số, 4 màu, 2 tùy chọn dung lượng.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
