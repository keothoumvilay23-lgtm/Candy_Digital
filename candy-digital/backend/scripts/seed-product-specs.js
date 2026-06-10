// Seed sample TGDD-style specs + highlights for an iPhone product.
// Usage: node scripts/seed-product-specs.js
require('dotenv').config();
const db = require('../src/config/db');

const HIGHLIGHTS = [
  'Chip Apple A18 Pro mạnh mẽ, hiệu năng vượt trội',
  'Camera chính 48MP với Photonic Engine - chụp đêm sắc nét',
  'Màn hình Super Retina XDR 6.9", ProMotion 120Hz, độ sáng 3000 nits',
  'Khung Titan cao cấp, nhẹ và bền bỉ',
  'Pin trâu cho 37 giờ xem video, sạc nhanh 20W',
  'Hỗ trợ Apple Intelligence - trợ lý AI thông minh',
];

const SPECIFICATIONS = [
  {
    group: 'Cấu hình & Bộ nhớ',
    items: [
      { label: 'Hệ điều hành', value: 'iOS 18' },
      { label: 'Chip xử lý (CPU)', value: 'Apple A18 Pro 6 nhân' },
      { label: 'Tốc độ CPU', value: 'Hãng không công bố' },
      { label: 'Chip đồ hoạ (GPU)', value: 'Apple GPU 6 nhân' },
      { label: 'RAM', value: '8 GB' },
      { label: 'Dung lượng lưu trữ', value: '256 GB' },
      { label: 'Dung lượng còn lại (khả dụng)', value: 'khoảng 241 GB' },
      { label: 'Danh bạ', value: 'Không giới hạn' },
    ],
  },
  {
    group: 'Camera & Màn hình',
    items: [
      { label: 'Độ phân giải camera sau', value: 'Chính 48 MP & Phụ 48 MP, 48 MP' },
      { label: 'Quay phim camera sau', value: 'HD 720p@30fps; FullHD 1080p@60/30/25/120fps; 4K 2160p@60/30/25fps; 2.8K 60fps' },
      { label: 'Tính năng camera sau', value: 'Chế độ hành động (Action Mode); Ban đêm (Night Mode); Photonic Engine' },
      { label: 'Độ phân giải camera trước', value: '18 MP' },
      { label: 'Tính năng camera trước', value: 'Smart HDR 5; Xoá phông; Video hiển thị kép; Tự động lấy nét (AF); Trôi nhanh thời gian (Time Lapse); Retina Flash; Quay video HD/Full HD/4K; Quay chậm (Slow Motion); Live Photos; Deep Fusion; Cinematic; Chụp ảnh Raw; Chụp đêm; Chống rung điện tử kỹ thuật số (EIS); TrueDepth; Photonic Engine' },
      { label: 'Công nghệ màn hình', value: 'OLED' },
      { label: 'Độ phân giải màn hình', value: 'Super Retina XDR (1320 x 2868 Pixels)' },
      { label: 'Màn hình rộng', value: '6.9" - Tần số quét 120 Hz' },
      { label: 'Độ sáng tối đa', value: '3000 nits' },
    ],
  },
  {
    group: 'Pin & Sạc',
    items: [
      { label: 'Dung lượng pin', value: '4685 mAh' },
      { label: 'Loại pin', value: 'Li-Ion' },
      { label: 'Hỗ trợ sạc tối đa', value: '20 W' },
      { label: 'Công nghệ pin', value: 'Sạc nhanh, Sạc không dây MagSafe 25W, Sạc Qi 15W' },
    ],
  },
  {
    group: 'Tiện ích',
    items: [
      { label: 'Tính năng đặc biệt', value: 'Apple Intelligence; Camera Control; Action Button' },
      { label: 'Bảo mật nâng cao', value: 'Mở khoá khuôn mặt Face ID' },
      { label: 'Tính năng khác', value: 'Chống nước, chống bụi IP68; Cảm biến vân tay (tích hợp tuỳ phiên bản)' },
    ],
  },
  {
    group: 'Kết nối',
    items: [
      { label: 'Mạng di động', value: '5G' },
      { label: 'SIM', value: '1 Nano SIM & 1 eSIM' },
      { label: 'Wi-Fi', value: 'Wi-Fi 7' },
      { label: 'GPS', value: 'GPS, GLONASS, GALILEO, QZSS, BEIDOU' },
      { label: 'Bluetooth', value: 'v5.3' },
      { label: 'Cổng kết nối / sạc', value: 'Type-C' },
      { label: 'Jack tai nghe', value: 'Type-C' },
    ],
  },
  {
    group: 'Thiết kế & Chất liệu',
    items: [
      { label: 'Thiết kế', value: 'Nguyên khối' },
      { label: 'Chất liệu', value: 'Khung Titan & mặt lưng kính cường lực' },
      { label: 'Kích thước, khối lượng', value: 'Dài 163 mm - Ngang 77.6 mm - Dày 8.25 mm - Nặng 227 g' },
      { label: 'Thời điểm ra mắt', value: '09/2024' },
    ],
  },
];

(async () => {
  try {
    // Find the latest iPhone Pro Max product. Fallback to product id=11.
    const [rows] = await db.query(
      `SELECT id, name FROM products
       WHERE name LIKE '%Pro Max%' OR slug LIKE '%pro-max%'
       ORDER BY id DESC LIMIT 1`
    );

    let target;
    if (rows.length) {
      target = rows[0];
    } else {
      const [first] = await db.query('SELECT id, name FROM products ORDER BY id LIMIT 1');
      target = first[0];
    }

    if (!target) {
      console.error('No products found to seed.');
      process.exit(1);
    }

    await db.query(
      `UPDATE products
       SET short_description = ?, warranty = ?, origin = ?,
           highlights = ?, specifications = ?
       WHERE id = ?`,
      [
        'Chip A18 Pro · Camera 48MP · Titan · 6.9" 120Hz · Apple Intelligence',
        '12 tháng',
        'Chính hãng VN/A',
        JSON.stringify(HIGHLIGHTS),
        JSON.stringify(SPECIFICATIONS),
        target.id,
      ]
    );

    console.log(`✅ Seeded specs + highlights cho sản phẩm: [#${target.id}] ${target.name}`);
    console.log(`   ${HIGHLIGHTS.length} highlights, ${SPECIFICATIONS.length} groups`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
