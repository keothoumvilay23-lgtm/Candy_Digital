# 🍬 Candy Digital — Hướng dẫn cài đặt

## Yêu cầu hệ thống
- Node.js >= 18.x
- MySQL >= 8.0
- npm hoặc yarn

---

## 1. Cài đặt Database

```bash
# Đăng nhập MySQL
mysql -u root -p

# Chạy file schema
SOURCE /path/to/candy-digital/database/schema.sql;
```

---

## 2. Cài đặt Backend

```bash
cd backend

# Cài dependencies
npm install

# Tạo file .env
cp .env.example .env

# Sửa file .env với thông tin của bạn:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=YOUR_MYSQL_PASSWORD
# DB_NAME=candy_digital
# JWT_SECRET=your_very_long_secret_key
# GEMINI_API_KEY=xxxxxxxxxxxxx          ← Lấy tại Google AI Studio
# GEMINI_MODEL=gemini-2.5-flash
# CLIENT_URL=http://localhost:3000
# DEMO_SIMULATE_PREPAID_PAYMENT=0    ← demo TT: đặt 1
# BANK_WEBHOOK_SECRET=               ← sao kê ngân hàng
# BANK_WEBHOOK_AUTO_CONFIRM=1

# Chạy development
npm run dev

# Hoặc production
npm start
```

Backend chạy tại: http://localhost:5000

### Thanh toán (tóm tắt)

| Mục | Mặc định |
|-----|----------|
| Chuyển khoản / ví | Sau đặt hàng: **QR + STK shop** + mã `DHxxxxxx`. Trạng thái TT: **`pending`** → webhook hoặc admin xác nhận → **`paid`**. |
| Webhook sao kê | `POST /api/orders/webhook/bank-incoming` — khớp nội dung CK + số tiền. Cấu hình `BANK_WEBHOOK_SECRET`. |
| `BANK_WEBHOOK_AUTO_CONFIRM` | `1`: tự xác nhận khi webhook khớp (cần `BANK_WEBHOOK_SECRET`). |
| Mô phỏng demo | Bật `DEMO_SIMULATE_PREPAID_PAYMENT=1` (backend) + `NEXT_PUBLIC_DEMO_SIMULATE_PAYMENT=1` (frontend): nút **Mô phỏng webhook** trên trang checkout. Hoặc chạy `node scripts/simulate-webhook.js <order_id>`. |

---

## 3. Cài đặt Frontend

Hệ thống chạy thành **2 trang riêng biệt** trên 2 cổng khác nhau (cùng codebase):

| Trang | URL | Dành cho |
|-------|-----|----------|
| Trang khách hàng | http://localhost:3000 | Khách hàng mua sắm |
| Trang quản trị | http://localhost:3001/admin | Admin quản lý hệ thống |

> Vì hai trang ở 2 origin khác nhau nên `localStorage` (token đăng nhập) **được lưu riêng** —
> đăng nhập vào trang admin không ảnh hưởng tới khách hàng và ngược lại.

```bash
cd frontend

# Cài dependencies
npm install

# Tạo file .env.local
cp .env.local.example .env.local

# Sửa nếu cần (mặc định đã đúng):
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
# NEXT_PUBLIC_CUSTOMER_URL=http://localhost:3000
# NEXT_PUBLIC_ADMIN_URL=http://localhost:3001/admin
# NEXT_PUBLIC_DEMO_SIMULATE_PAYMENT=0   ← đặt 1 chỉ khi cần mô phỏng TT (kèm backend DEMO_SIMULATE_PREPAID_PAYMENT=1)
```

### Cách chạy

```bash
# Chạy CẢ HAI trang cùng lúc (mở 1 terminal)
npm run dev

# Hoặc chạy riêng từng trang
npm run dev:customer    # khách hàng → http://localhost:3000
npm run dev:admin       # quản trị   → http://localhost:3001/admin

# Production
npm run build
npm run start:customer
npm run start:admin
```

> `npm run dev` dùng `npm-run-all` để chạy song song hai cổng (xem `package.json`).

---

## 4. Tài khoản mặc định

| Role  | Email                    | Mật khẩu  |
|-------|--------------------------|-----------|
| Admin | admin@candydigital.vn    | Admin@123 |

> ⚠️ Hãy đổi mật khẩu sau khi đăng nhập lần đầu!

---

## 5. Cấu trúc thư mục

```
candy-digital/
├── database/
│   └── schema.sql          ← Tạo DB và dữ liệu mẫu
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/    ← Xử lý logic
│   │   ├── routes/         ← Định nghĩa API
│   │   ├── middlewares/    ← Auth, Upload
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/            ← Pages (Next.js App Router)
    │   ├── components/     ← UI Components
    │   ├── store/          ← Zustand state
    │   └── lib/api.ts      ← Axios instance
    ├── .env.local.example
    └── package.json
```

---

## 6. API Endpoints chính

### Auth
| Method | URL                     | Mô tả            |
|--------|-------------------------|------------------|
| POST   | /api/auth/register      | Đăng ký          |
| POST   | /api/auth/login         | Đăng nhập        |
| GET    | /api/auth/me            | Thông tin cá nhân|
| PUT    | /api/auth/profile       | Cập nhật hồ sơ   |
| PUT    | /api/auth/change-password| Đổi mật khẩu    |

### Products
| Method | URL                     | Mô tả              |
|--------|-------------------------|--------------------|
| GET    | /api/products           | Danh sách SP       |
| GET    | /api/products/:slug     | Chi tiết SP        |
| POST   | /api/products/admin/create | Tạo SP (admin)  |
| PUT    | /api/products/admin/:id | Sửa SP (admin)     |
| DELETE | /api/products/admin/:id | Xóa SP (admin)     |

### Cart
| Method | URL          | Mô tả        |
|--------|--------------|--------------|
| GET    | /api/cart    | Xem giỏ hàng |
| POST   | /api/cart    | Thêm vào giỏ |
| PUT    | /api/cart/:id| Sửa số lượng |
| DELETE | /api/cart/:id| Xóa khỏi giỏ|

### Orders
| Method | URL                           | Mô tả              |
|--------|-------------------------------|--------------------|
| POST   | /api/orders/webhook/bank-incoming | Webhook sao kê ngân hàng |
| POST   | /api/orders                   | Đặt hàng           |
| POST   | /api/orders/my/:id/simulate-payment | Mô phỏng TT (demo, cần bật env) |
| GET    | /api/orders/my                | Đơn hàng của tôi   |
| GET    | /api/orders/my/:id            | Chi tiết đơn       |
| PUT    | /api/orders/my/:id/cancel     | Hủy đơn            |
| GET    | /api/orders/admin/list        | Tất cả đơn (admin) |
| PUT    | /api/orders/admin/:id/status  | Cập nhật trạng thái|

### Chat AI
| Method | URL                  | Mô tả           |
|--------|----------------------|-----------------|
| GET    | /api/chat/session    | Lấy/tạo session |
| POST   | /api/chat/message    | Gửi tin nhắn    |

### Promotions (Khuyến mãi theo chiến dịch)
| Method | URL                                  | Mô tả                                  |
|--------|--------------------------------------|----------------------------------------|
| GET    | /api/promotions/active               | Lấy các chiến dịch đang chạy (public)  |
| GET    | /api/promotions/admin/list           | Danh sách toàn bộ chiến dịch (admin)   |
| GET    | /api/promotions/admin/:id            | Chi tiết chiến dịch (admin)            |
| POST   | /api/promotions/admin                | Tạo chiến dịch (admin)                 |
| PUT    | /api/promotions/admin/:id            | Cập nhật chiến dịch (admin)            |
| PUT    | /api/promotions/admin/:id/toggle     | Bật/tắt nhanh (admin)                  |
| DELETE | /api/promotions/admin/:id            | Xoá chiến dịch (admin)                 |

> Mỗi sản phẩm trong response của `/api/products` và `/api/products/:slug` đã đính kèm
> `list_price`, `sale_price`, `discount_percent`, `campaign` (object hoặc `null`).
> Backend chỉ áp dụng campaign khi: `is_active = 1`, `NOW()` nằm giữa `starts_at`–`ends_at`,
> và sản phẩm thuộc phạm vi (toàn shop / theo danh mục / theo sản phẩm). Nếu cùng lúc có nhiều
> campaign khớp, hệ thống chọn theo thứ tự: phạm vi `product` → `category` → `all`,
> sau đó so sánh `priority` (lớn hơn ưu tiên hơn).

---

## 7. Quản trị chiến dịch khuyến mãi (11.11 / 12.12 / Black Friday)

Trang `/admin/promotions` cho phép admin tạo và lập lịch các đợt khuyến mãi.
Mỗi chiến dịch lưu trong bảng `promotion_campaigns` (giá trị `discount_percent` lấy
từ database — KHÔNG phải tỷ lệ giả tính ngược từ giá hiện tại).

Các trường chính:
- `name`, `slug`, `banner_text`, `description`
- `discount_percent` (0 – 100)
- `starts_at`, `ends_at` (datetime)
- `scope`: `all` (toàn shop) | `category` | `product`
- `priority` (số càng lớn càng ưu tiên)
- `is_active` (bật/tắt)
- Bảng phụ `promotion_campaign_targets` lưu danh sách category_id / product_id
  khi `scope ≠ all`.

Mẫu nhanh có sẵn trong UI: **11.11 Single Day**, **12.12 Year-End**, **Black Friday**.
Admin có thể đổi % giảm, ngày bắt đầu/kết thúc, phạm vi áp dụng cho từng đợt.

Khi khách thêm sản phẩm vào giỏ, backend tự khoá giá khuyến mãi tại thời điểm đó
(`carts.unit_price`) — đảm bảo giá không thay đổi nếu campaign hết hạn giữa lúc
khách đang thanh toán.

---

## 8. Lưu ý quan trọng

1. **Gemini API Key**: Tạo API key tại https://aistudio.google.com/app/apikey để dùng chatbot AI
2. **Upload ảnh**: Thư mục `backend/uploads/` phải có quyền write
3. **CORS**: Mặc định chỉ cho phép `http://localhost:3000` — sửa `CLIENT_URL` trong `.env` nếu deploy

---

Mọi thắc mắc liên hệ: support@candydigital.vn
