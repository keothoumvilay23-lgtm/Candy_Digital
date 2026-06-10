const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  adminGetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adminGetProductById,
} = require('../controllers/product.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Public
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Admin
router.get('/admin/list', authMiddleware, adminMiddleware, adminGetProducts);
router.get('/admin/detail/:id', authMiddleware, adminMiddleware, adminGetProductById);
const productUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'color_images', maxCount: 20 },
]);
router.post('/admin/create', authMiddleware, adminMiddleware, productUpload, createProduct);
router.put('/admin/:id', authMiddleware, adminMiddleware, productUpload, updateProduct);
router.delete('/admin/:id', authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;
