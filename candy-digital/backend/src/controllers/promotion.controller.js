const db = require('../config/db');
const { loadActiveCampaigns } = require('../config/promotion.helper');

const ALLOWED_SCOPES = new Set(['all', 'category', 'product']);
const ALLOWED_TARGET_TYPES = new Set(['category', 'product']);

const slugify = (input) =>
  String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

const sanitizeTargets = (targets, scope) => {
  if (scope === 'all') return [];
  if (!Array.isArray(targets)) return [];
  const seen = new Set();
  const cleaned = [];
  for (const t of targets) {
    if (!t || typeof t !== 'object') continue;
    const type = String(t.target_type || '').trim();
    const id = Number(t.target_id);
    if (!ALLOWED_TARGET_TYPES.has(type)) continue;
    if (!Number.isInteger(id) || id <= 0) continue;
    if (scope === 'category' && type !== 'category') continue;
    if (scope === 'product' && type !== 'product') continue;
    const key = `${type}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push({ target_type: type, target_id: id });
  }
  return cleaned;
};

const parsePayload = (body) => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const bannerText =
    typeof body.banner_text === 'string' && body.banner_text.trim()
      ? body.banner_text.trim().slice(0, 255)
      : null;
  const description =
    typeof body.description === 'string' && body.description.trim()
      ? body.description.trim()
      : null;
  const discountPercent = Number(body.discount_percent);
  const startsAt = parseDate(body.starts_at);
  const endsAt = parseDate(body.ends_at);
  const scope = ALLOWED_SCOPES.has(body.scope) ? body.scope : 'all';
  const priority = Number.isFinite(Number(body.priority)) ? Math.trunc(Number(body.priority)) : 0;
  const isActive = body.is_active === undefined ? 1 : Number(body.is_active) ? 1 : 0;
  const slug =
    typeof body.slug === 'string' && body.slug.trim()
      ? slugify(body.slug)
      : slugify(name);

  if (!name) return { error: 'Tên chiến dịch không được để trống' };
  if (!slug) return { error: 'Slug không hợp lệ' };
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return { error: '% giảm giá phải nằm trong khoảng 0 – 100' };
  }
  if (!startsAt || !endsAt) return { error: 'Vui lòng nhập đủ thời gian bắt đầu/kết thúc' };
  if (new Date(endsAt) <= new Date(startsAt)) {
    return { error: 'Thời gian kết thúc phải sau thời gian bắt đầu' };
  }

  const targets = sanitizeTargets(body.targets, scope);
  if (scope !== 'all' && targets.length === 0) {
    return { error: 'Hãy chọn ít nhất 1 mục tiêu (sản phẩm/danh mục) cho chiến dịch' };
  }

  return {
    name: name.slice(0, 150),
    slug: slug.slice(0, 150),
    bannerText,
    description,
    discountPercent: Math.round(discountPercent * 100) / 100,
    startsAt,
    endsAt,
    scope,
    priority,
    isActive,
    targets,
  };
};

const computeStatus = (row, now = new Date()) => {
  if (!row.is_active) return 'disabled';
  const start = new Date(row.starts_at);
  const end = new Date(row.ends_at);
  if (now < start) return 'scheduled';
  if (now > end) return 'ended';
  return 'running';
};

const fetchTargetsByCampaign = async (campaignIds) => {
  if (!campaignIds.length) return new Map();
  const [rows] = await db.query(
    `SELECT campaign_id, target_type, target_id
     FROM promotion_campaign_targets
     WHERE campaign_id IN (?)`,
    [campaignIds]
  );
  const byId = new Map();
  campaignIds.forEach((id) => byId.set(id, []));
  rows.forEach((r) => {
    const list = byId.get(r.campaign_id);
    if (list) list.push({ target_type: r.target_type, target_id: r.target_id });
  });
  return byId;
};

const enrichTargets = async (campaigns) => {
  const ids = campaigns.map((c) => c.id);
  const targetsMap = await fetchTargetsByCampaign(ids);

  const productIds = new Set();
  const categoryIds = new Set();
  targetsMap.forEach((arr) => {
    arr.forEach((t) => {
      if (t.target_type === 'product') productIds.add(t.target_id);
      else if (t.target_type === 'category') categoryIds.add(t.target_id);
    });
  });

  let productNames = new Map();
  if (productIds.size) {
    const [rows] = await db.query(
      'SELECT id, name FROM products WHERE id IN (?)',
      [[...productIds]]
    );
    rows.forEach((r) => productNames.set(r.id, r.name));
  }
  let categoryNames = new Map();
  if (categoryIds.size) {
    const [rows] = await db.query(
      'SELECT id, name FROM categories WHERE id IN (?)',
      [[...categoryIds]]
    );
    rows.forEach((r) => categoryNames.set(r.id, r.name));
  }

  return campaigns.map((c) => {
    const targets = (targetsMap.get(c.id) || []).map((t) => ({
      target_type: t.target_type,
      target_id: t.target_id,
      label:
        t.target_type === 'product'
          ? productNames.get(t.target_id) || `Sản phẩm #${t.target_id}`
          : categoryNames.get(t.target_id) || `Danh mục #${t.target_id}`,
    }));
    return {
      ...c,
      discount_percent: Number(c.discount_percent),
      status: computeStatus(c),
      targets,
    };
  });
};

// =====================================================
// PUBLIC: Khách hàng xem các campaign đang chạy.
// =====================================================
const getActivePromotions = async (req, res) => {
  try {
    const { campaigns } = await loadActiveCampaigns();
    const enriched = await enrichTargets(campaigns);
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// =====================================================
// ADMIN
// =====================================================
const adminListPromotions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM promotion_campaigns ORDER BY priority DESC, starts_at DESC, id DESC`
    );
    const enriched = await enrichTargets(rows);
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const adminGetPromotion = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM promotion_campaigns WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Chiến dịch không tồn tại' });
    }
    const [enriched] = await enrichTargets(rows);
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const insertTargets = async (conn, campaignId, targets) => {
  if (!targets.length) return;
  const values = targets.map((t) => [campaignId, t.target_type, t.target_id]);
  await conn.query(
    'INSERT INTO promotion_campaign_targets (campaign_id, target_type, target_id) VALUES ?',
    [values]
  );
};

const ensureUniqueSlug = async (slug, excludeId = null) => {
  const [rows] = await db.query(
    excludeId
      ? 'SELECT id FROM promotion_campaigns WHERE slug = ? AND id <> ?'
      : 'SELECT id FROM promotion_campaigns WHERE slug = ?',
    excludeId ? [slug, excludeId] : [slug]
  );
  if (!rows.length) return slug;
  return `${slug}-${Date.now()}`;
};

const adminCreatePromotion = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const payload = parsePayload(req.body);
    if (payload.error) {
      conn.release();
      return res.status(400).json({ success: false, message: payload.error });
    }
    const slug = await ensureUniqueSlug(payload.slug);

    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO promotion_campaigns
        (name, slug, banner_text, description, discount_percent,
         starts_at, ends_at, scope, priority, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.name, slug, payload.bannerText, payload.description,
        payload.discountPercent, payload.startsAt, payload.endsAt,
        payload.scope, payload.priority, payload.isActive,
      ]
    );
    await insertTargets(conn, result.insertId, payload.targets);
    await conn.commit();
    res.status(201).json({
      success: true,
      message: 'Tạo chiến dịch khuyến mãi thành công',
      data: { id: result.insertId },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  } finally {
    conn.release();
  }
};

const adminUpdatePromotion = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const payload = parsePayload(req.body);
    if (payload.error) {
      conn.release();
      return res.status(400).json({ success: false, message: payload.error });
    }
    const slug = await ensureUniqueSlug(payload.slug, req.params.id);

    await conn.beginTransaction();
    const [result] = await conn.query(
      `UPDATE promotion_campaigns
         SET name = ?, slug = ?, banner_text = ?, description = ?,
             discount_percent = ?, starts_at = ?, ends_at = ?,
             scope = ?, priority = ?, is_active = ?
       WHERE id = ?`,
      [
        payload.name, slug, payload.bannerText, payload.description,
        payload.discountPercent, payload.startsAt, payload.endsAt,
        payload.scope, payload.priority, payload.isActive,
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Chiến dịch không tồn tại' });
    }
    await conn.query('DELETE FROM promotion_campaign_targets WHERE campaign_id = ?', [
      req.params.id,
    ]);
    await insertTargets(conn, req.params.id, payload.targets);
    await conn.commit();
    res.json({ success: true, message: 'Cập nhật chiến dịch thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  } finally {
    conn.release();
  }
};

const adminDeletePromotion = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM promotion_campaigns WHERE id = ?', [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Chiến dịch không tồn tại' });
    }
    res.json({ success: true, message: 'Đã xoá chiến dịch' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const adminTogglePromotion = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, is_active FROM promotion_campaigns WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Chiến dịch không tồn tại' });
    }
    const next = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE promotion_campaigns SET is_active = ? WHERE id = ?', [
      next,
      req.params.id,
    ]);
    res.json({ success: true, message: next ? 'Đã bật chiến dịch' : 'Đã tắt chiến dịch' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getActivePromotions,
  adminListPromotions,
  adminGetPromotion,
  adminCreatePromotion,
  adminUpdatePromotion,
  adminDeletePromotion,
  adminTogglePromotion,
};
