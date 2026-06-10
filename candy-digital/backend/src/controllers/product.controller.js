const db = require('../config/db');
const {
  loadActiveCampaigns,
  pickCampaignForProduct,
  computeSalePrice,
  buildCampaignSummary,
} = require('../config/promotion.helper');

const optionalInt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
};

const optionalText = (value) => {
  if (value === undefined || value === '') return null;
  return value;
};

const parseColorsPayload = (value) => {
  if (!value) return [];
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (_) {
    return null;
  }

  if (!Array.isArray(parsed)) return null;

  const normalized = [];
  for (let i = 0; i < parsed.length; i += 1) {
    const item = parsed[i] || {};
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) continue;
    const hex = typeof item.hex_code === 'string' ? item.hex_code.trim() : null;
    const isActive = item.is_active === undefined ? 1 : Number(item.is_active) ? 1 : 0;
    const imageUrl = typeof item.image_url === 'string' && item.image_url.trim() ? item.image_url.trim() : null;
    const imageIndex = Number.isInteger(item.image_index) ? item.image_index : null;
    normalized.push({
      name,
      hexCode: hex || null,
      isActive,
      sortOrder: i,
      imageUrl,
      imageIndex,
    });
  }
  return normalized;
};

const parseHighlightsPayload = (value) => {
  if (!value) return [];
  let parsed;
  try { parsed = JSON.parse(value); } catch (_) { return null; }
  if (!Array.isArray(parsed)) return null;
  return parsed
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .slice(0, 20);
};

const parseSpecificationsPayload = (value) => {
  if (!value) return [];
  let parsed;
  try { parsed = JSON.parse(value); } catch (_) { return null; }
  if (!Array.isArray(parsed)) return null;

  const groups = [];
  for (const group of parsed) {
    if (!group || typeof group !== 'object') continue;
    const groupName = typeof group.group === 'string' ? group.group.trim() : '';
    if (!groupName) continue;
    const items = Array.isArray(group.items) ? group.items : [];
    const cleanItems = [];
    for (const it of items) {
      if (!it || typeof it !== 'object') continue;
      const label = typeof it.label === 'string' ? it.label.trim() : '';
      const val = typeof it.value === 'string' ? it.value.trim() : '';
      if (!label || !val) continue;
      cleanItems.push({ label, value: val });
    }
    if (cleanItems.length === 0) continue;
    groups.push({ group: groupName, items: cleanItems });
  }
  return groups;
};

const parseStorageOptionsPayload = (value) => {
  if (!value) return [];
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (_) {
    return null;
  }

  if (!Array.isArray(parsed)) return null;

  const normalized = [];
  for (let i = 0; i < parsed.length; i += 1) {
    const item = parsed[i] || {};
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    const price = Number(item.price);
    const stock = Number(item.stock);
    if (!label) continue;
    if (!Number.isFinite(price) || !Number.isInteger(stock) || stock < 0) {
      return null;
    }
    const isActive = item.is_active === undefined ? 1 : Number(item.is_active) ? 1 : 0;
    normalized.push({
      label,
      price,
      stock,
      isActive,
      sortOrder: i,
    });
  }
  return normalized;
};

const parseProductPayload = (body) => {
  const {
    category_id, name, description, short_description,
    price, stock, brand, warranty, origin, is_active,
    colors_json, storage_json, highlights_json, specifications_json,
  } = body;
  const categoryId = optionalInt(category_id);
  const priceValue = Number(price);
  const stockValue = Number(stock);
  const activeValue = is_active === undefined || is_active === '' ? 1 : Number(is_active);
  const colors = parseColorsPayload(colors_json);
  const storageOptions = parseStorageOptionsPayload(storage_json);
  const highlights = parseHighlightsPayload(highlights_json);
  const specifications = parseSpecificationsPayload(specifications_json);

  if (
    !name || !Number.isFinite(priceValue) || !Number.isInteger(stockValue) ||
    Number.isNaN(categoryId) || colors === null || storageOptions === null ||
    highlights === null || specifications === null
  ) {
    return { error: 'Du lieu san pham khong hop le' };
  }

  return {
    categoryId,
    name,
    description: optionalText(description),
    shortDescription: optionalText(short_description),
    price: priceValue,
    stock: stockValue,
    brand: optionalText(brand),
    warranty: optionalText(warranty),
    origin: optionalText(origin),
    isActive: activeValue ? 1 : 0,
    colors,
    storageOptions,
    highlights,
    specifications,
  };
};

const tryParseJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (_) { return null; }
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, brand, search, sort, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['p.is_active = 1'];
    let params = [];

    if (category) {
      where.push('(c.slug = ? OR parent_cat.slug = ?)');
      params.push(category, category);
    }
    if (brand) {
      where.push('p.brand = ?');
      params.push(brand);
    }
    if (search) {
      where.push('(p.name LIKE ? OR p.brand LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    if (sort === 'price_desc') orderBy = 'p.price DESC';
    if (sort === 'name_asc') orderBy = 'p.name ASC';

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT p.id, p.name, p.slug, p.category_id,
              COALESCE(
                (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1),
                p.price
              ) AS price,
              COALESCE(
                (SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1),
                p.stock
              ) AS stock,
              p.brand, p.is_active,
              (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1) AS storage_count,
              (SELECT COUNT(*) FROM product_colors pc WHERE pc.product_id = p.id AND pc.is_active = 1) AS color_count,
              c.name AS category_name, c.slug AS category_slug,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
       ${whereClause}`,
      params
    );

    // Áp campaign realtime: tính sale_price + discount_percent + thông tin campaign.
    const campaignData = await loadActiveCampaigns();
    const data = rows.map((p) => {
      const campaign = pickCampaignForProduct(campaignData, p);
      const listPrice = Number(p.price) || 0;
      const percent = campaign ? Number(campaign.discount_percent) : 0;
      const salePrice = computeSalePrice(listPrice, percent);
      return {
        ...p,
        list_price: listPrice,
        sale_price: salePrice,
        discount_percent: percent,
        campaign: buildCampaignSummary(campaign),
      };
    });

    res.json({
      success: true,
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// GET /api/products/:slug
const getProductBySlug = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.is_active = 1`,
      [req.params.slug]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const product = rows[0];
    const [images] = await db.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
      [product.id]
    );
    const [storageOptions] = await db.query(
      `SELECT id, storage_label, price, stock, is_active, sort_order
       FROM product_variants
       WHERE product_id = ? AND is_active = 1
       ORDER BY sort_order ASC, id ASC`,
      [product.id]
    );
    const [colors] = await db.query(
      `SELECT id, name, hex_code, image_url, gallery_json, sort_order, is_active
       FROM product_colors
       WHERE product_id = ? AND is_active = 1
       ORDER BY sort_order ASC, id ASC`,
      [product.id]
    );

    const [related] = await db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.category_id, p.brand,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
       FROM products p
       WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
       LIMIT 4`,
      [product.category_id, product.id]
    );

    const minStoragePrice = storageOptions.length ? Math.min(...storageOptions.map((item) => Number(item.price))) : null;
    const totalStorageStock = storageOptions.length ? storageOptions.reduce((sum, item) => sum + Number(item.stock || 0), 0) : null;

    // ===== Áp khuyến mãi realtime =====
    const campaignData = await loadActiveCampaigns();
    const productCampaign = pickCampaignForProduct(campaignData, product);
    const productPercent = productCampaign ? Number(productCampaign.discount_percent) : 0;

    const productListPrice = minStoragePrice ?? Number(product.price);
    const productSalePrice = computeSalePrice(productListPrice, productPercent);

    const storageOptionsWithPromo = storageOptions.map((opt) => {
      const lp = Number(opt.price);
      const sp = computeSalePrice(lp, productPercent);
      // price = giá thực thu (đã khuyến mãi) để các thành phần FE/cart cũ vẫn dùng được;
      // list_price là giá niêm yết gốc trước khuyến mãi.
      return {
        ...opt,
        price: sp,
        list_price: lp,
        sale_price: sp,
        discount_percent: productPercent,
      };
    });

    const relatedWithPromo = related.map((r) => {
      const c = pickCampaignForProduct(campaignData, r);
      const pct = c ? Number(c.discount_percent) : 0;
      const lp = Number(r.price);
      return {
        ...r,
        list_price: lp,
        sale_price: computeSalePrice(lp, pct),
        discount_percent: pct,
        campaign: buildCampaignSummary(c),
      };
    });

    res.json({
      success: true,
      data: {
        ...product,
        highlights: tryParseJson(product.highlights) || [],
        specifications: tryParseJson(product.specifications) || [],
        price: productSalePrice,
        list_price: productListPrice,
        sale_price: productSalePrice,
        discount_percent: productPercent,
        campaign: buildCampaignSummary(productCampaign),
        stock: totalStorageStock ?? product.stock,
        images,
        colors: colors.map((c) => {
          const raw = tryParseJson(c.gallery_json);
          const image_gallery = Array.isArray(raw)
            ? raw.filter((u) => typeof u === 'string' && u.trim())
            : null;
          return { ...c, image_gallery };
        }),
        storage_options: storageOptionsWithPromo,
        related: relatedWithPromo,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// --- ADMIN ---

const adminGetProducts = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];

    if (search) { where.push('p.name LIKE ?'); params.push(`%${search}%`); }
    if (category) { where.push('c.slug = ?'); params.push(category); }
    if (status === 'active') { where.push('p.is_active = 1'); }
    if (status === 'inactive') { where.push('p.is_active = 0'); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name,
              COALESCE(
                (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1),
                p.price
              ) AS display_price,
              COALESCE(
                (SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1),
                p.stock
              ) AS display_stock,
              (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1) AS storage_count,
              (SELECT COUNT(*) FROM product_colors pc WHERE pc.product_id = p.id AND pc.is_active = 1) AS color_count,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`,
      params
    );

    res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const insertColors = async (productId, colors, colorImageFiles = []) => {
  for (const color of colors) {
    let imageUrl = color.imageUrl;
    if (
      color.imageIndex !== null &&
      color.imageIndex !== undefined &&
      colorImageFiles[color.imageIndex]
    ) {
      imageUrl = `/uploads/products/${colorImageFiles[color.imageIndex].filename}`;
    }
    await db.query(
      `INSERT INTO product_colors (product_id, name, hex_code, image_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, color.name, color.hexCode, imageUrl, color.sortOrder, color.isActive]
    );
  }
};

const insertStorageOptions = async (productId, options) => {
  for (const option of options) {
    await db.query(
      `INSERT INTO product_variants (product_id, color, storage_label, price, stock, is_active, sort_order)
       VALUES (?, NULL, ?, ?, ?, ?, ?)`,
      [productId, option.label, option.price, option.stock, option.isActive, option.sortOrder]
    );
  }
};

const createProduct = async (req, res) => {
  try {
    const payload = parseProductPayload(req.body);
    if (payload.error) {
      return res.status(400).json({ success: false, message: payload.error });
    }

    const {
      categoryId, name, description, shortDescription,
      price, stock, brand, warranty, origin,
      colors, storageOptions, highlights, specifications,
    } = payload;
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

    const [result] = await db.query(
      `INSERT INTO products
        (category_id, name, slug, description, short_description, price, stock, brand,
         warranty, origin, highlights, specifications)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        categoryId, name, `${slug}-${Date.now()}`, description, shortDescription,
        price, stock, brand, warranty, origin,
        JSON.stringify(highlights), JSON.stringify(specifications),
      ]
    );

    const galleryFiles = req.files?.images || [];
    if (galleryFiles.length > 0) {
      for (let i = 0; i < galleryFiles.length; i++) {
        await db.query(
          'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
          [result.insertId, `/uploads/products/${galleryFiles[i].filename}`, i === 0 ? 1 : 0, i]
        );
      }
    }

    await insertColors(result.insertId, colors, req.files?.color_images || []);
    await insertStorageOptions(result.insertId, storageOptions);

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const payload = parseProductPayload(req.body);
    if (payload.error) {
      return res.status(400).json({ success: false, message: payload.error });
    }

    const {
      categoryId, name, description, shortDescription,
      price, stock, brand, warranty, origin, isActive,
      colors, storageOptions, highlights, specifications,
    } = payload;
    await db.query(
      `UPDATE products SET category_id=?, name=?, description=?, short_description=?,
         price=?, stock=?, brand=?, warranty=?, origin=?, is_active=?,
         highlights=?, specifications=?
       WHERE id=?`,
      [
        categoryId, name, description, shortDescription,
        price, stock, brand, warranty, origin, isActive,
        JSON.stringify(highlights), JSON.stringify(specifications),
        req.params.id,
      ]
    );

    const galleryFiles = req.files?.images || [];
    if (galleryFiles.length > 0) {
      await db.query(
        'UPDATE product_images SET is_primary = 0, sort_order = sort_order + ? WHERE product_id = ?',
        [galleryFiles.length, req.params.id]
      );

      for (let i = 0; i < galleryFiles.length; i++) {
        await db.query(
          'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
          [req.params.id, `/uploads/products/${galleryFiles[i].filename}`, i === 0 ? 1 : 0, i]
        );
      }
    }

    await db.query('DELETE FROM product_colors WHERE product_id = ?', [req.params.id]);
    await insertColors(req.params.id, colors, req.files?.color_images || []);

    await db.query('DELETE FROM product_variants WHERE product_id = ?', [req.params.id]);
    await insertStorageOptions(req.params.id, storageOptions);

    res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const adminGetProductById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    const product = rows[0];
    const [storageOptions] = await db.query(
      `SELECT id, storage_label, price, stock, is_active, sort_order
       FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [req.params.id]
    );
    const [colors] = await db.query(
      `SELECT id, name, hex_code, image_url, gallery_json, sort_order, is_active
       FROM product_colors WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [req.params.id]
    );
    const [images] = await db.query(
      'SELECT id, image_url, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
      [req.params.id]
    );
    return res.json({
      success: true,
      data: {
        ...product,
        highlights: tryParseJson(product.highlights) || [],
        specifications: tryParseJson(product.specifications) || [],
        colors: colors.map((c) => {
          const raw = tryParseJson(c.gallery_json);
          const image_gallery = Array.isArray(raw)
            ? raw.filter((u) => typeof u === 'string' && u.trim())
            : null;
          return { ...c, image_gallery };
        }),
        storage_options: storageOptions,
        images,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { getProducts, getProductBySlug, adminGetProducts, createProduct, updateProduct, deleteProduct, adminGetProductById };
