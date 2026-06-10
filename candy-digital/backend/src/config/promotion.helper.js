const db = require('./db');

/**
 * Lấy toàn bộ campaign đang chạy tại thời điểm hiện tại
 * (is_active = 1 và NOW() nằm trong khoảng [starts_at, ends_at])
 * cùng với danh sách target mở rộng (category / product).
 *
 * Trả về:
 *   {
 *     campaigns: [...],
 *     targetsByCampaign: Map<campaignId, { categories: Set, products: Set }>
 *   }
 */
const loadActiveCampaigns = async () => {
  const [campaigns] = await db.query(
    `SELECT id, name, slug, banner_text, description, discount_percent,
            starts_at, ends_at, scope, priority, is_active
     FROM promotion_campaigns
     WHERE is_active = 1 AND NOW() BETWEEN starts_at AND ends_at
     ORDER BY priority DESC, discount_percent DESC, id DESC`
  );

  const targetsByCampaign = new Map();
  campaigns.forEach((c) => {
    targetsByCampaign.set(c.id, { categories: new Set(), products: new Set() });
  });

  if (campaigns.length) {
    const ids = campaigns.map((c) => c.id);
    const [targets] = await db.query(
      `SELECT campaign_id, target_type, target_id
       FROM promotion_campaign_targets
       WHERE campaign_id IN (?)`,
      [ids]
    );
    targets.forEach((t) => {
      const bucket = targetsByCampaign.get(t.campaign_id);
      if (!bucket) return;
      if (t.target_type === 'category') bucket.categories.add(Number(t.target_id));
      else if (t.target_type === 'product') bucket.products.add(Number(t.target_id));
    });
  }

  return { campaigns, targetsByCampaign };
};

/**
 * Trong nhóm campaign đang chạy, chọn campaign tốt nhất phù hợp với
 * sản phẩm cho trước. Ưu tiên xét theo thứ tự đã sort sẵn (priority desc,
 * discount desc) và theo phạm vi (product > category > all).
 */
const pickCampaignForProduct = ({ campaigns, targetsByCampaign }, product) => {
  if (!campaigns || !campaigns.length) return null;
  const productId = Number(product.id);
  const categoryId = product.category_id == null ? null : Number(product.category_id);

  // Pass 1: scope 'product' — campaign target trực tiếp tới sản phẩm này.
  for (const c of campaigns) {
    if (c.scope !== 'product') continue;
    const t = targetsByCampaign.get(c.id);
    if (t && t.products.has(productId)) return c;
  }
  // Pass 2: scope 'category' — campaign áp lên danh mục của sản phẩm.
  for (const c of campaigns) {
    if (c.scope !== 'category') continue;
    if (categoryId == null) continue;
    const t = targetsByCampaign.get(c.id);
    if (t && t.categories.has(categoryId)) return c;
  }
  // Pass 3: scope 'all' — campaign áp toàn shop.
  for (const c of campaigns) {
    if (c.scope === 'all') return c;
  }
  return null;
};

const computeSalePrice = (price, percent) => {
  const base = Number(price);
  const pct = Number(percent) || 0;
  if (!Number.isFinite(base) || base <= 0 || pct <= 0) return base;
  return Math.round(base * (1 - pct / 100));
};

const buildCampaignSummary = (campaign) => {
  if (!campaign) return null;
  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    banner_text: campaign.banner_text,
    discount_percent: Number(campaign.discount_percent),
    starts_at: campaign.starts_at,
    ends_at: campaign.ends_at,
    scope: campaign.scope,
  };
};

/**
 * Gắn list_price / sale_price / discount_percent / campaign vào mỗi sản phẩm
 * trong danh sách. Nếu không có campaign áp dụng -> sale_price = list_price,
 * discount_percent = 0, campaign = null.
 *
 * Sản phẩm bắt buộc đi kèm `id`, `category_id` và `price`.
 */
const attachCampaignsToProducts = async (products) => {
  if (!products || !products.length) return products;
  const data = await loadActiveCampaigns();
  return products.map((p) => {
    const campaign = pickCampaignForProduct(data, p);
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
};

module.exports = {
  loadActiveCampaigns,
  pickCampaignForProduct,
  computeSalePrice,
  buildCampaignSummary,
  attachCampaignsToProducts,
};
