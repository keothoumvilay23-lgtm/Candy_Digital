// ===== category.routes.js =====
const express = require('express');
const categoryRouter = express.Router();
const { getCategories, adminGetCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

categoryRouter.get('/', getCategories);
categoryRouter.get('/admin/list', authMiddleware, adminMiddleware, adminGetCategories);
categoryRouter.post('/admin/create', authMiddleware, adminMiddleware, upload.single('image'), createCategory);
categoryRouter.put('/admin/:id', authMiddleware, adminMiddleware, updateCategory);
categoryRouter.delete('/admin/:id', authMiddleware, adminMiddleware, deleteCategory);

// ===== cart.routes.js =====
const cartRouter = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cart.controller');

cartRouter.get('/', authMiddleware, getCart);
cartRouter.post('/', authMiddleware, addToCart);
cartRouter.put('/:id', authMiddleware, updateCartItem);
cartRouter.delete('/clear', authMiddleware, clearCart);
cartRouter.delete('/:id', authMiddleware, removeFromCart);

// ===== order.routes.js =====
const orderRouter = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  simulateMyPayment,
  adminGetOrders,
  adminGetOrderById,
  adminConfirmPayment,
  adminUpdateOrderStatus,
  adminExportOrders,
  getDashboard,
} = require('../controllers/order.controller');
const { handleBankIncomingWebhook } = require('../controllers/bank-webhook.controller');
const { createVnpayPaymentUrl, vnpayIpn, vnpayReturn, vnpayMockGateway } = require('../controllers/vnpay.controller');

orderRouter.post('/webhook/bank-incoming', handleBankIncomingWebhook);
// VNPay (sandbox): IPN + return là public (VNPay gọi/đẩy về, không kèm JWT)
orderRouter.get('/vnpay/ipn', vnpayIpn);
orderRouter.get('/vnpay/return', vnpayReturn);
// Cổng thanh toán GIẢ LẬP (chỉ hoạt động khi VNP_URL trỏ về endpoint này)
orderRouter.get('/vnpay/mock-gateway', vnpayMockGateway);
orderRouter.post('/', authMiddleware, createOrder);
orderRouter.get('/my', authMiddleware, getMyOrders);
orderRouter.get('/my/:id', authMiddleware, getOrderById);
orderRouter.post('/my/:id/vnpay/create-payment-url', authMiddleware, createVnpayPaymentUrl);
orderRouter.post('/my/:id/simulate-payment', authMiddleware, simulateMyPayment);
orderRouter.put('/my/:id/cancel', authMiddleware, cancelOrder);

// Admin order routes
orderRouter.get('/admin/list', authMiddleware, adminMiddleware, adminGetOrders);
orderRouter.get('/admin/export', authMiddleware, adminMiddleware, adminExportOrders);
orderRouter.get('/admin/dashboard', authMiddleware, adminMiddleware, getDashboard);
orderRouter.get('/admin/:id', authMiddleware, adminMiddleware, adminGetOrderById);
orderRouter.put('/admin/:id/confirm-payment', authMiddleware, adminMiddleware, adminConfirmPayment);
orderRouter.put('/admin/:id/status', authMiddleware, adminMiddleware, adminUpdateOrderStatus);

// ===== user.routes.js =====
const userRouter = express.Router();
const { getUsers, toggleUserStatus, getAdminAccounts, createAdminAccount, deleteAdminAccount } = require('../controllers/user.controller');

userRouter.get('/admin/users', authMiddleware, adminMiddleware, getUsers);
userRouter.put('/admin/users/:id/toggle-status', authMiddleware, adminMiddleware, toggleUserStatus);
userRouter.get('/admin/accounts', authMiddleware, adminMiddleware, getAdminAccounts);
userRouter.post('/admin/accounts', authMiddleware, adminMiddleware, createAdminAccount);
userRouter.delete('/admin/accounts/:id', authMiddleware, adminMiddleware, deleteAdminAccount);

// ===== chat.routes.js =====
const chatRouter = express.Router();
const { getOrCreateSession, sendMessage, clearSessionMessages } = require('../controllers/chat.controller');

chatRouter.get('/session', getOrCreateSession);
chatRouter.post('/message', sendMessage);
chatRouter.delete('/session/:sessionToken/messages', clearSessionMessages);

// ===== payment.routes.js =====
const paymentRouter = express.Router();
const {
  getActivePaymentSettings,
  adminGetPaymentSettings,
  adminUpdatePaymentSetting,
  adminUploadQrImage,
} = require('../controllers/payment.controller');

paymentRouter.get('/', getActivePaymentSettings);
paymentRouter.get('/admin/list', authMiddleware, adminMiddleware, adminGetPaymentSettings);
paymentRouter.put('/admin/:id', authMiddleware, adminMiddleware, adminUpdatePaymentSetting);
paymentRouter.post('/admin/upload-qr', authMiddleware, adminMiddleware, upload.single('qr'), adminUploadQrImage);

// ===== promotion.routes.js =====
const promotionRouter = express.Router();
const {
  getActivePromotions,
  adminListPromotions,
  adminGetPromotion,
  adminCreatePromotion,
  adminUpdatePromotion,
  adminDeletePromotion,
  adminTogglePromotion,
} = require('../controllers/promotion.controller');

promotionRouter.get('/active', getActivePromotions);
promotionRouter.get('/admin/list', authMiddleware, adminMiddleware, adminListPromotions);
promotionRouter.get('/admin/:id', authMiddleware, adminMiddleware, adminGetPromotion);
promotionRouter.post('/admin', authMiddleware, adminMiddleware, adminCreatePromotion);
promotionRouter.put('/admin/:id', authMiddleware, adminMiddleware, adminUpdatePromotion);
promotionRouter.put('/admin/:id/toggle', authMiddleware, adminMiddleware, adminTogglePromotion);
promotionRouter.delete('/admin/:id', authMiddleware, adminMiddleware, adminDeletePromotion);

module.exports = {
  categoryRouter,
  cartRouter,
  orderRouter,
  userRouter,
  chatRouter,
  paymentRouter,
  promotionRouter,
};
