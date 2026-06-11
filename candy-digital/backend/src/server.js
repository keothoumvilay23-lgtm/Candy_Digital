require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { ensureSchema } = require('./config/schema-updater');
const { ensureVariantSeed } = require('./config/seed-variants');
const db = require('./config/db');

const app = express();

// Middleware
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const {
  categoryRouter,
  cartRouter,
  orderRouter,
  userRouter,
  chatRouter,
  paymentRouter,
  promotionRouter,
} = require('./routes/index.routes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/users', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/payment-settings', paymentRouter);
app.use('/api/promotions', promotionRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Candy Digital API running' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route không tồn tại' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
});

const PORT = process.env.PORT || 5000;
ensureSchema()
  .then(async () => {
    console.log('✅ Database schema is up to date');
    // Tự seed màu/dung lượng khi DB còn trống (giúp bản online có dữ liệu màu mà không cần thao tác tay).
    // Bọc try/catch để lỗi seed KHÔNG chặn server khởi động.
    try {
      await ensureVariantSeed(db);
    } catch (e) {
      console.warn('⚠️  Bỏ qua auto-seed màu/dung lượng:', e.message);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to update schema:', err.message);
    process.exit(1);
  });
