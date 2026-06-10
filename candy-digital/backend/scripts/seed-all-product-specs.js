// Seed full specs + highlights + short_description for ALL existing products.
// Usage: node scripts/seed-all-product-specs.js
require('dotenv').config();
const db = require('../src/config/db');

// Helper builders ------------------------------------------------------------

const phoneGroups = ({ os, chip, gpu, ram, storage, available, mainCam, video, frontCam, screenTech, screenRes, screenSize, brightness, battery, charge, magsafe, special, security, sim, wifi, bluetooth, port, design, material, size, releaseDate }) => ([
  {
    group: 'Cấu hình & Bộ nhớ',
    items: [
      { label: 'Hệ điều hành', value: os },
      { label: 'Chip xử lý (CPU)', value: chip },
      { label: 'Tốc độ CPU', value: 'Hãng không công bố' },
      { label: 'Chip đồ hoạ (GPU)', value: gpu },
      { label: 'RAM', value: ram },
      { label: 'Dung lượng lưu trữ', value: storage },
      { label: 'Dung lượng còn lại (khả dụng)', value: available },
      { label: 'Danh bạ', value: 'Không giới hạn' },
    ],
  },
  {
    group: 'Camera & Màn hình',
    items: [
      { label: 'Độ phân giải camera sau', value: mainCam },
      { label: 'Quay phim camera sau', value: video },
      { label: 'Tính năng camera sau', value: 'Chế độ ban đêm; HDR; Photonic/Smart Engine; Quay video Cinematic; Chống rung quang học OIS' },
      { label: 'Độ phân giải camera trước', value: frontCam },
      { label: 'Tính năng camera trước', value: 'Smart HDR; Xoá phông; Tự động lấy nét; Chụp đêm; Live Photos; Photonic Engine' },
      { label: 'Công nghệ màn hình', value: screenTech },
      { label: 'Độ phân giải màn hình', value: screenRes },
      { label: 'Màn hình rộng', value: screenSize },
      { label: 'Độ sáng tối đa', value: brightness },
    ],
  },
  {
    group: 'Pin & Sạc',
    items: [
      { label: 'Dung lượng pin', value: battery },
      { label: 'Loại pin', value: 'Li-Ion' },
      { label: 'Hỗ trợ sạc tối đa', value: charge },
      { label: 'Công nghệ pin', value: magsafe || 'Sạc nhanh, Sạc không dây' },
    ],
  },
  {
    group: 'Tiện ích',
    items: [
      { label: 'Tính năng đặc biệt', value: special },
      { label: 'Bảo mật nâng cao', value: security },
      { label: 'Kháng nước, kháng bụi', value: 'Đạt chuẩn IP68' },
    ],
  },
  {
    group: 'Kết nối',
    items: [
      { label: 'Mạng di động', value: '5G' },
      { label: 'SIM', value: sim },
      { label: 'Wi-Fi', value: wifi },
      { label: 'GPS', value: 'GPS, GLONASS, GALILEO, QZSS, BEIDOU' },
      { label: 'Bluetooth', value: bluetooth },
      { label: 'Cổng kết nối / sạc', value: port },
      { label: 'Jack tai nghe', value: port },
    ],
  },
  {
    group: 'Thiết kế & Chất liệu',
    items: [
      { label: 'Thiết kế', value: design },
      { label: 'Chất liệu', value: material },
      { label: 'Kích thước, khối lượng', value: size },
      { label: 'Thời điểm ra mắt', value: releaseDate },
    ],
  },
]);

// Per-product data -----------------------------------------------------------

const PRODUCTS = {
  // ---------------------- iPhones ----------------------
  'iphone-16-pro-max-1777943641150': {
    short_description: 'Chip A18 Pro · Camera 48MP · Khung Titan · 6.9" 120Hz · Apple Intelligence',
    warranty: '12 tháng',
    origin: 'Chính hãng VN/A',
    highlights: [
      'Chip Apple A18 Pro 6 nhân - hiệu năng vượt trội, AI tích hợp',
      'Camera chính 48MP Fusion với zoom quang 5x, quay video 4K Dolby Vision',
      'Màn hình Super Retina XDR 6.9" ProMotion 120Hz, độ sáng 3000 nits',
      'Khung Titan cấp 5 - nhẹ và bền hơn 20% so với thép',
      'Pin trâu lên đến 37 giờ xem video, sạc nhanh 20W & MagSafe 25W',
      'Apple Intelligence - trợ lý AI riêng tư trên thiết bị',
    ],
    specifications: phoneGroups({
      os: 'iOS 18',
      chip: 'Apple A18 Pro 6 nhân',
      gpu: 'Apple GPU 6 nhân',
      ram: '8 GB',
      storage: '512 GB',
      available: 'khoảng 488 GB',
      mainCam: 'Chính 48 MP & Phụ 48 MP, 12 MP (Tele 5x)',
      video: 'HD 720p; FullHD 1080p@60/30/25/120fps; 4K 2160p@60/30/25fps Dolby Vision',
      frontCam: '12 MP TrueDepth',
      screenTech: 'OLED Super Retina XDR',
      screenRes: '1320 x 2868 Pixels',
      screenSize: '6.9" - Tần số quét 120 Hz',
      brightness: '3000 nits',
      battery: '4685 mAh',
      charge: '20 W',
      magsafe: 'Sạc nhanh có dây 20W; MagSafe 25W; Qi2 15W',
      special: 'Apple Intelligence; Camera Control; Action Button',
      security: 'Mở khoá khuôn mặt Face ID',
      sim: '1 Nano SIM & 1 eSIM',
      wifi: 'Wi-Fi 7 (Wi-Fi 802.11 a/b/g/n/ac/ax/be)',
      bluetooth: 'v5.3',
      port: 'Type-C',
      design: 'Nguyên khối',
      material: 'Khung Titan & mặt lưng kính cường lực',
      size: 'Dài 163 mm - Ngang 77.6 mm - Dày 8.25 mm - Nặng 227 g',
      releaseDate: '09/2024',
    }),
  },

  'iphone-15-pro-max-256gb': {
    short_description: 'Chip A17 Pro · Camera 48MP · Khung Titan · 6.7" 120Hz · Action Button',
    warranty: '12 tháng',
    origin: 'Chính hãng VN/A',
    highlights: [
      'Chip Apple A17 Pro 6 nhân tiến trình 3nm - mạnh nhất iPhone 15',
      'Camera chính 48MP, Tele 5x quang học - chụp xa rõ ràng',
      'Màn hình 6.7" Super Retina XDR ProMotion 120Hz, 2000 nits',
      'Khung Titan đầu tiên trên iPhone - bền và nhẹ hơn',
      'Action Button thay thế gạt rung - tuỳ biến theo nhu cầu',
      'Cổng USB-C tốc độ USB 3 (10Gbps), tương thích phụ kiện chuyên nghiệp',
    ],
    specifications: phoneGroups({
      os: 'iOS 17 (nâng cấp lên iOS 18)',
      chip: 'Apple A17 Pro 6 nhân',
      gpu: 'Apple GPU 6 nhân',
      ram: '8 GB',
      storage: '256 GB',
      available: 'khoảng 241 GB',
      mainCam: 'Chính 48 MP & Phụ 12 MP, 12 MP (Tele 5x)',
      video: 'HD 720p; FullHD 1080p@60/30fps; 4K 2160p@60/30/24fps Dolby Vision',
      frontCam: '12 MP TrueDepth',
      screenTech: 'OLED Super Retina XDR',
      screenRes: '1290 x 2796 Pixels',
      screenSize: '6.7" - Tần số quét 120 Hz',
      brightness: '2000 nits',
      battery: '4422 mAh',
      charge: '20 W',
      magsafe: 'Sạc nhanh 20W; MagSafe 15W; Qi 7.5W',
      special: 'Action Button; Dynamic Island; Camera 5x',
      security: 'Mở khoá khuôn mặt Face ID',
      sim: '1 Nano SIM & 1 eSIM',
      wifi: 'Wi-Fi 6E (Wi-Fi 802.11 a/b/g/n/ac/ax)',
      bluetooth: 'v5.3',
      port: 'Type-C (USB 3, 10Gbps)',
      design: 'Nguyên khối',
      material: 'Khung Titan & mặt lưng kính nhám',
      size: 'Dài 159.9 mm - Ngang 76.7 mm - Dày 8.25 mm - Nặng 221 g',
      releaseDate: '09/2023',
    }),
  },

  'iphone-15-pro-128gb': {
    short_description: 'Chip A17 Pro · Camera 48MP · Khung Titan · 6.1" 120Hz · USB-C',
    warranty: '12 tháng',
    origin: 'Chính hãng VN/A',
    highlights: [
      'Chip Apple A17 Pro 6 nhân tiến trình 3nm',
      'Camera chính 48MP với chế độ Pro, quay 4K ProRes',
      'Màn hình 6.1" ProMotion 120Hz, độ sáng 2000 nits',
      'Khung Titan nhẹ - cảm giác cầm thoải mái',
      'Action Button & Camera 3x quang học',
      'Cổng USB-C tốc độ USB 3 (10Gbps)',
    ],
    specifications: phoneGroups({
      os: 'iOS 17 (nâng cấp lên iOS 18)',
      chip: 'Apple A17 Pro 6 nhân',
      gpu: 'Apple GPU 6 nhân',
      ram: '8 GB',
      storage: '128 GB',
      available: 'khoảng 113 GB',
      mainCam: 'Chính 48 MP & Phụ 12 MP, 12 MP (Tele 3x)',
      video: 'HD 720p; FullHD 1080p@60/30fps; 4K 2160p@60/30/24fps Dolby Vision',
      frontCam: '12 MP TrueDepth',
      screenTech: 'OLED Super Retina XDR',
      screenRes: '1179 x 2556 Pixels',
      screenSize: '6.1" - Tần số quét 120 Hz',
      brightness: '2000 nits',
      battery: '3274 mAh',
      charge: '20 W',
      magsafe: 'Sạc nhanh 20W; MagSafe 15W; Qi 7.5W',
      special: 'Action Button; Dynamic Island',
      security: 'Mở khoá khuôn mặt Face ID',
      sim: '1 Nano SIM & 1 eSIM',
      wifi: 'Wi-Fi 6E (Wi-Fi 802.11 a/b/g/n/ac/ax)',
      bluetooth: 'v5.3',
      port: 'Type-C (USB 3, 10Gbps)',
      design: 'Nguyên khối',
      material: 'Khung Titan & mặt lưng kính nhám',
      size: 'Dài 146.6 mm - Ngang 70.6 mm - Dày 8.25 mm - Nặng 187 g',
      releaseDate: '09/2023',
    }),
  },

  'iphone-14-128gb': {
    short_description: 'Chip A15 Bionic · Camera kép 12MP · Màn hình 6.1" Super Retina XDR',
    warranty: '12 tháng',
    origin: 'Chính hãng VN/A',
    highlights: [
      'Chip Apple A15 Bionic 6 nhân hiệu năng tin cậy',
      'Camera kép 12MP chống rung quang học, chụp đêm tốt',
      'Màn hình OLED 6.1" Super Retina XDR sắc nét',
      'Pin lớn cho cả ngày sử dụng',
      'Tính năng SOS qua vệ tinh & Crash Detection',
      'Hỗ trợ MagSafe và Qi cho sạc không dây tiện lợi',
    ],
    specifications: phoneGroups({
      os: 'iOS 16 (nâng cấp lên iOS 18)',
      chip: 'Apple A15 Bionic 6 nhân',
      gpu: 'Apple GPU 5 nhân',
      ram: '6 GB',
      storage: '128 GB',
      available: 'khoảng 113 GB',
      mainCam: 'Chính 12 MP & Phụ 12 MP (góc rộng)',
      video: 'HD 720p; FullHD 1080p@60/30fps; 4K 2160p@60/30/24fps Cinematic',
      frontCam: '12 MP TrueDepth',
      screenTech: 'OLED Super Retina XDR',
      screenRes: '1170 x 2532 Pixels',
      screenSize: '6.1" - Tần số quét 60 Hz',
      brightness: '1200 nits',
      battery: '3279 mAh',
      charge: '20 W',
      magsafe: 'Sạc nhanh 20W; MagSafe 15W; Qi 7.5W',
      special: 'Crash Detection; Emergency SOS qua vệ tinh',
      security: 'Mở khoá khuôn mặt Face ID',
      sim: '1 Nano SIM & 1 eSIM',
      wifi: 'Wi-Fi 6 (Wi-Fi 802.11 a/b/g/n/ac/ax)',
      bluetooth: 'v5.3',
      port: 'Lightning',
      design: 'Nguyên khối',
      material: 'Khung nhôm & mặt lưng kính',
      size: 'Dài 146.7 mm - Ngang 71.5 mm - Dày 7.8 mm - Nặng 172 g',
      releaseDate: '09/2022',
    }),
  },

  // ---------------------- Samsung ----------------------
  'samsung-s24-ultra-256gb': {
    short_description: 'Snapdragon 8 Gen 3 · Camera 200MP · Bút S Pen · 6.8" QHD+ · Galaxy AI',
    warranty: '12 tháng',
    origin: 'Chính hãng',
    highlights: [
      'Chip Snapdragon 8 Gen 3 for Galaxy - hiệu năng vô địch Android',
      'Camera chính 200MP với zoom quang 5x, zoom số 100x Space Zoom',
      'Màn hình Dynamic AMOLED 2X 6.8" QHD+ 120Hz, độ sáng 2600 nits',
      'Khung Titanium nhẹ, kính Gorilla Armor chống loé',
      'Bút S Pen tích hợp - viết, vẽ, ký tài liệu mượt mà',
      'Galaxy AI - dịch trực tiếp, viết bài, tìm kiếm bằng vòng tròn',
    ],
    specifications: phoneGroups({
      os: 'Android 14, One UI 6.1',
      chip: 'Qualcomm Snapdragon 8 Gen 3 for Galaxy',
      gpu: 'Adreno 750',
      ram: '12 GB',
      storage: '256 GB',
      available: 'khoảng 230 GB',
      mainCam: 'Chính 200 MP & 12 MP (Ultra-wide), 50 MP (Tele 5x), 10 MP (Tele 3x)',
      video: 'HD 720p; FullHD 1080p@60/30fps; 4K 2160p@60/30fps; 8K 4320p@30fps',
      frontCam: '12 MP',
      screenTech: 'Dynamic AMOLED 2X',
      screenRes: '1440 x 3120 Pixels (QHD+)',
      screenSize: '6.8" - Tần số quét 120 Hz',
      brightness: '2600 nits',
      battery: '5000 mAh',
      charge: '45 W',
      magsafe: 'Sạc nhanh có dây 45W; Sạc không dây 15W; Sạc ngược 4.5W',
      special: 'S Pen tích hợp; Galaxy AI; Circle to Search',
      security: 'Cảm biến vân tay dưới màn hình; Mở khoá bằng khuôn mặt',
      sim: '1 Nano SIM & 1 eSIM',
      wifi: 'Wi-Fi 7',
      bluetooth: 'v5.3',
      port: 'Type-C (USB 3.2)',
      design: 'Nguyên khối',
      material: 'Khung Titanium & mặt lưng kính Gorilla Armor',
      size: 'Dài 162.3 mm - Ngang 79 mm - Dày 8.6 mm - Nặng 232 g',
      releaseDate: '01/2024',
    }),
  },

  'samsung-s24-128gb': {
    short_description: 'Exynos 2400 · Camera 50MP · Màn hình 6.2" 120Hz · Galaxy AI',
    warranty: '12 tháng',
    origin: 'Chính hãng',
    highlights: [
      'Chip Exynos 2400 10 nhân - mạnh mẽ và tiết kiệm pin',
      'Camera chính 50MP OIS, zoom quang 3x, chụp đêm rõ nét',
      'Màn hình Dynamic AMOLED 2X 6.2" FHD+ 120Hz, 2600 nits',
      'Galaxy AI - dịch cuộc gọi, tóm tắt văn bản, tìm bằng vòng tròn',
      'Pin 4000mAh, sạc nhanh 25W',
      'Khung nhôm aerospace + mặt lưng kính Gorilla Glass Victus 2',
    ],
    specifications: phoneGroups({
      os: 'Android 14, One UI 6.1',
      chip: 'Samsung Exynos 2400 10 nhân',
      gpu: 'Xclipse 940',
      ram: '8 GB',
      storage: '128 GB',
      available: 'khoảng 113 GB',
      mainCam: 'Chính 50 MP & 12 MP (Ultra-wide), 10 MP (Tele 3x)',
      video: 'HD 720p; FullHD 1080p@60/30fps; 4K 2160p@60/30fps; 8K 4320p@30fps',
      frontCam: '12 MP',
      screenTech: 'Dynamic AMOLED 2X',
      screenRes: '1080 x 2340 Pixels (FHD+)',
      screenSize: '6.2" - Tần số quét 120 Hz',
      brightness: '2600 nits',
      battery: '4000 mAh',
      charge: '25 W',
      magsafe: 'Sạc nhanh 25W; Sạc không dây 15W; Sạc ngược 4.5W',
      special: 'Galaxy AI; Circle to Search',
      security: 'Cảm biến vân tay dưới màn hình; Mở khoá bằng khuôn mặt',
      sim: '1 Nano SIM & 1 eSIM',
      wifi: 'Wi-Fi 6E',
      bluetooth: 'v5.3',
      port: 'Type-C',
      design: 'Nguyên khối',
      material: 'Khung nhôm & mặt lưng kính Gorilla Glass Victus 2',
      size: 'Dài 147 mm - Ngang 70.6 mm - Dày 7.6 mm - Nặng 167 g',
      releaseDate: '01/2024',
    }),
  },

  // ---------------------- Earbuds ----------------------
  'airpods-pro-2': {
    short_description: 'Chip H2 · Chống ồn chủ động ANC · Âm thanh không gian · USB-C',
    warranty: '12 tháng',
    origin: 'Chính hãng Apple',
    highlights: [
      'Chip Apple H2 cho âm thanh chi tiết, chống ồn vượt trội',
      'Chống ồn chủ động (ANC) tốt gấp 2 lần thế hệ trước',
      'Âm thanh không gian cá nhân hoá theo vành tai',
      'Pin lên đến 6 giờ nghe nhạc, tổng 30 giờ với hộp sạc',
      'Hộp sạc USB-C, chuẩn kháng nước IPX4',
      'Tích hợp loa tìm hộp sạc - không lo thất lạc',
    ],
    specifications: [
      {
        group: 'Âm thanh',
        items: [
          { label: 'Loại tai nghe', value: 'True Wireless In-ear' },
          { label: 'Driver', value: 'Apple-designed Driver tuỳ chỉnh' },
          { label: 'Công nghệ âm thanh', value: 'Adaptive Audio; Personalized Spatial Audio; Dolby Atmos' },
          { label: 'Microphone', value: 'Beamforming + cảm biến tiếng nói (voice accelerometer)' },
        ],
      },
      {
        group: 'Chống ồn',
        items: [
          { label: 'Chống ồn chủ động (ANC)', value: 'Có - hiệu quả gấp 2x AirPods Pro thế hệ 1' },
          { label: 'Chế độ xuyên âm', value: 'Adaptive Transparency - tự động điều chỉnh' },
          { label: 'Conversation Awareness', value: 'Tự giảm nhạc khi bạn nói chuyện' },
        ],
      },
      {
        group: 'Pin & Sạc',
        items: [
          { label: 'Thời lượng nghe nhạc', value: 'Lên đến 6 giờ (bật ANC)' },
          { label: 'Tổng thời gian với hộp sạc', value: 'Lên đến 30 giờ' },
          { label: 'Cổng sạc hộp', value: 'USB-C / Lightning (tuỳ phiên bản); MagSafe; Qi' },
          { label: 'Sạc nhanh', value: '5 phút sạc cho ~1 giờ nghe nhạc' },
        ],
      },
      {
        group: 'Kết nối & Tiện ích',
        items: [
          { label: 'Kết nối', value: 'Bluetooth 5.3' },
          { label: 'Cảm biến', value: 'Cảm biến lực; Quang học chuyên dụng; Cảm biến chuyển động; Da' },
          { label: 'Điều khiển', value: 'Cảm ứng vuốt + nhấn lực trên thân tai nghe' },
          { label: 'Tích hợp loa hộp', value: 'Có - tìm hộp qua Find My' },
        ],
      },
      {
        group: 'Thiết kế',
        items: [
          { label: 'Chuẩn kháng nước', value: 'IPX4 (cả tai nghe và hộp sạc)' },
          { label: 'Kích thước nút tai', value: '4 size: XS, S, M, L (silicon mềm)' },
          { label: 'Khối lượng', value: 'Tai nghe: 5.3g/chiếc · Hộp sạc: 50.8g' },
          { label: 'Thời điểm ra mắt', value: '09/2023 (bản USB-C)' },
        ],
      },
    ],
  },

  'samsung-buds2-pro': {
    short_description: 'ANC chủ động · Hi-Fi 24-bit · Bluetooth 5.3 · IPX7',
    warranty: '12 tháng',
    origin: 'Chính hãng',
    highlights: [
      'Chống ồn chủ động ANC mạnh mẽ - đắm chìm trong âm nhạc',
      'Âm thanh Hi-Fi 24bit chuẩn studio',
      'Driver kép coaxial cho âm trầm sâu, chi tiết cao',
      'Pin 5 giờ (ANC), tổng 18 giờ với hộp sạc',
      'Chống nước IPX7 - dùng được khi tập gym, mưa nhẹ',
      'Tự động chuyển thiết bị Galaxy Auto Switch',
    ],
    specifications: [
      {
        group: 'Âm thanh',
        items: [
          { label: 'Loại tai nghe', value: 'True Wireless In-ear' },
          { label: 'Driver', value: 'Coaxial 2-way (woofer 10mm + tweeter)' },
          { label: 'Codec', value: 'SSC Hi-Fi (24-bit), AAC, SBC' },
          { label: 'Âm thanh 360', value: 'Hỗ trợ 360 Audio with Direct Multi-Channel' },
        ],
      },
      {
        group: 'Chống ồn',
        items: [
          { label: 'Chống ồn chủ động (ANC)', value: 'Có' },
          { label: 'Chế độ xuyên âm', value: 'Có 3 mức (low/mid/high)' },
        ],
      },
      {
        group: 'Pin & Sạc',
        items: [
          { label: 'Thời lượng nghe nhạc', value: 'Lên đến 5 giờ (ANC)' },
          { label: 'Tổng thời gian với hộp sạc', value: 'Lên đến 18 giờ (ANC)' },
          { label: 'Cổng sạc hộp', value: 'USB-C, Sạc không dây Qi' },
        ],
      },
      {
        group: 'Kết nối',
        items: [
          { label: 'Bluetooth', value: 'v5.3' },
          { label: 'Tự động chuyển thiết bị', value: 'Galaxy Auto Switch' },
          { label: 'Microphone', value: '3 mic mỗi bên + voice pickup unit' },
        ],
      },
      {
        group: 'Thiết kế',
        items: [
          { label: 'Chuẩn kháng nước', value: 'IPX7' },
          { label: 'Khối lượng', value: 'Tai nghe: 5.5g/chiếc · Hộp sạc: 43.4g' },
          { label: 'Màu sắc', value: 'Graphite, White, Bora Purple' },
          { label: 'Thời điểm ra mắt', value: '08/2022' },
        ],
      },
    ],
  },

  // ---------------------- Smartwatch ----------------------
  'apple-watch-series-9-45mm': {
    short_description: 'Chip S9 SiP · Always-On Retina · ECG · SpO2 · Double Tap',
    warranty: '12 tháng',
    origin: 'Chính hãng VN/A',
    highlights: [
      'Chip S9 SiP nhanh hơn 30% - mượt mà mọi thao tác',
      'Màn hình Always-On Retina sáng tới 2000 nits, dễ xem ngoài nắng',
      'Cử chỉ Double Tap - điều khiển bằng cách chạm 2 ngón tay',
      'Đo nhịp tim, ECG, SpO2, nhiệt độ cổ tay',
      'Theo dõi giấc ngủ, chu kỳ kinh nguyệt, té ngã',
      'Pin sử dụng 18 giờ thường - lên đến 36 giờ chế độ Tiết kiệm năng lượng',
    ],
    specifications: [
      {
        group: 'Màn hình & Thiết kế',
        items: [
          { label: 'Loại màn hình', value: 'OLED LTPO Always-On Retina' },
          { label: 'Kích thước', value: '45 mm' },
          { label: 'Độ sáng tối đa', value: '2000 nits' },
          { label: 'Chất liệu khung', value: 'Nhôm hoặc Thép không gỉ' },
          { label: 'Mặt kính', value: 'Ion-X strengthened glass' },
          { label: 'Chuẩn kháng nước', value: '50m WR / IP6X' },
        ],
      },
      {
        group: 'Hiệu năng',
        items: [
          { label: 'Chip xử lý', value: 'Apple S9 SiP - 4 nhân Neural Engine' },
          { label: 'Bộ nhớ trong', value: '64 GB' },
          { label: 'Hệ điều hành', value: 'watchOS 10 (cập nhật watchOS 11)' },
        ],
      },
      {
        group: 'Cảm biến & Sức khoẻ',
        items: [
          { label: 'Đo nhịp tim', value: 'Có - liên tục, cảnh báo bất thường' },
          { label: 'Điện tâm đồ (ECG)', value: 'Có' },
          { label: 'Đo nồng độ oxy SpO2', value: 'Có (tuỳ thị trường)' },
          { label: 'Nhiệt độ cổ tay', value: 'Có' },
          { label: 'Cảm biến khác', value: 'Gia tốc 32G; Con quay; La bàn; Ánh sáng môi trường; Độ cao' },
        ],
      },
      {
        group: 'Pin & Sạc',
        items: [
          { label: 'Thời lượng pin', value: 'Lên đến 18 giờ - 36 giờ chế độ tiết kiệm' },
          { label: 'Sạc nhanh', value: 'Sạc đầy 80% trong 45 phút (sạc nhanh)' },
          { label: 'Loại sạc', value: 'Sạc không dây từ tính' },
        ],
      },
      {
        group: 'Kết nối',
        items: [
          { label: 'Wi-Fi', value: 'Wi-Fi 4 (802.11n) 2.4GHz & 5GHz' },
          { label: 'Bluetooth', value: 'v5.3' },
          { label: 'GPS', value: 'GPS L1 + L5 (bản GPS+Cellular)' },
          { label: 'Mạng di động', value: 'eSIM (tuỳ phiên bản GPS+Cellular)' },
        ],
      },
    ],
  },

  // ---------------------- Tablet ----------------------
  'ipad-air-m2-256gb-wifi': {
    short_description: 'Chip Apple M2 · Liquid Retina 11" · Hỗ trợ Apple Pencil Pro · Wi-Fi 6E',
    warranty: '12 tháng',
    origin: 'Chính hãng VN/A',
    highlights: [
      'Chip Apple M2 - hiệu năng laptop trong dáng tablet',
      'Màn hình Liquid Retina 11" P3 với True Tone, ProMotion 60Hz',
      'Hỗ trợ Apple Pencil Pro với cảm biến áp lực, lăn ngón',
      'Camera trước landscape 12MP - lý tưởng họp Zoom/FaceTime',
      'Wi-Fi 6E nhanh, lưu trữ 256GB rộng rãi',
      'Cổng USB-C tốc độ cao, kết nối phụ kiện phong phú',
    ],
    specifications: [
      {
        group: 'Cấu hình & Bộ nhớ',
        items: [
          { label: 'Hệ điều hành', value: 'iPadOS 17 (cập nhật iPadOS 18)' },
          { label: 'Chip xử lý', value: 'Apple M2 8 nhân CPU + 10 nhân GPU' },
          { label: 'RAM', value: '8 GB' },
          { label: 'Bộ nhớ trong', value: '256 GB' },
          { label: 'Bộ nhớ khả dụng', value: 'khoảng 240 GB' },
        ],
      },
      {
        group: 'Camera & Màn hình',
        items: [
          { label: 'Loại màn hình', value: 'Liquid Retina IPS LCD' },
          { label: 'Kích thước', value: '11 inch' },
          { label: 'Độ phân giải', value: '1640 x 2360 Pixels' },
          { label: 'Tần số quét', value: '60 Hz' },
          { label: 'Độ sáng tối đa', value: '500 nits' },
          { label: 'Camera sau', value: '12 MP' },
          { label: 'Camera trước', value: '12 MP Ultra Wide đặt ngang (Landscape)' },
          { label: 'Quay phim', value: '4K 2160p@60fps' },
        ],
      },
      {
        group: 'Pin & Sạc',
        items: [
          { label: 'Dung lượng pin', value: '7606 mAh (28.93 Wh)' },
          { label: 'Sạc nhanh', value: '20 W qua USB-C' },
          { label: 'Thời lượng dùng', value: 'Lên đến 10 giờ duyệt web/xem video qua Wi-Fi' },
        ],
      },
      {
        group: 'Kết nối',
        items: [
          { label: 'Wi-Fi', value: 'Wi-Fi 6E (802.11ax)' },
          { label: 'Bluetooth', value: 'v5.3' },
          { label: 'Cổng kết nối', value: 'Type-C (USB 3, 10Gbps)' },
          { label: 'Hỗ trợ bút', value: 'Apple Pencil Pro / Apple Pencil USB-C' },
          { label: 'Phím gắn rời', value: 'Magic Keyboard' },
        ],
      },
      {
        group: 'Thiết kế',
        items: [
          { label: 'Chất liệu', value: 'Nhôm tái chế 100%' },
          { label: 'Kích thước, khối lượng', value: 'Dài 247.6 mm - Ngang 178.5 mm - Dày 6.1 mm - Nặng 462 g' },
          { label: 'Màu sắc', value: 'Xám không gian, Xanh Blue, Tím Purple, Vàng Starlight' },
          { label: 'Thời điểm ra mắt', value: '05/2024' },
        ],
      },
    ],
  },

  // ---------------------- Accessory ----------------------
  'op-lung-iphone-15-pro-max': {
    short_description: 'Silicon cao cấp · Chống sốc 4 góc · Hỗ trợ MagSafe',
    warranty: '6 tháng',
    origin: 'Apple',
    highlights: [
      'Chất liệu silicon mềm mại, êm tay',
      'Chống sốc 4 góc, bảo vệ camera tốt',
      'Hỗ trợ sạc không dây MagSafe và Qi',
      'Vừa khít các nút bấm, dễ thao tác',
      'Lớp microfiber bên trong chống xước máy',
    ],
    specifications: [
      {
        group: 'Tương thích',
        items: [
          { label: 'Sản phẩm tương thích', value: 'iPhone 15 Pro Max' },
          { label: 'Vị trí cắt nút', value: 'Chuẩn Action Button' },
          { label: 'Hỗ trợ MagSafe', value: 'Có' },
        ],
      },
      {
        group: 'Thiết kế & Chất liệu',
        items: [
          { label: 'Chất liệu vỏ', value: 'Silicon cao cấp' },
          { label: 'Lớp lót', value: 'Vải sợi micro (microfiber)' },
          { label: 'Khả năng chống sốc', value: 'Có (gờ 4 góc nâng cao)' },
          { label: 'Bảo vệ camera', value: 'Có viền nhô cao bảo vệ ống kính' },
        ],
      },
      {
        group: 'Tính năng',
        items: [
          { label: 'Sạc không dây', value: 'Tương thích MagSafe & Qi' },
          { label: 'Trọng lượng', value: 'Khoảng 35 g' },
          { label: 'Màu sắc', value: 'Đen, Xanh dương, Hồng, Be' },
        ],
      },
    ],
  },
};

(async () => {
  try {
    let updated = 0;
    let skipped = 0;
    for (const [slug, data] of Object.entries(PRODUCTS)) {
      const [rows] = await db.query('SELECT id, name FROM products WHERE slug = ?', [slug]);
      if (!rows.length) {
        console.log(`⚠️  Bỏ qua (không tìm thấy slug): ${slug}`);
        skipped += 1;
        continue;
      }
      const target = rows[0];
      await db.query(
        `UPDATE products
         SET short_description = ?, warranty = ?, origin = ?,
             highlights = ?, specifications = ?
         WHERE id = ?`,
        [
          data.short_description,
          data.warranty,
          data.origin,
          JSON.stringify(data.highlights),
          JSON.stringify(data.specifications),
          target.id,
        ]
      );
      console.log(`✅ [${target.id}] ${target.name} — ${data.highlights.length} highlights, ${data.specifications.length} groups`);
      updated += 1;
    }

    console.log(`\nDONE. Đã cập nhật ${updated} sản phẩm, bỏ qua ${skipped}.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
