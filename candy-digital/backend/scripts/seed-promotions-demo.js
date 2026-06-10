// Seed demo promotion campaigns (run once with: node scripts/seed-promotions-demo.js)
//
// Tạo sẵn các đợt khuyến mãi mẫu, trong đó CÓ ÍT NHẤT 1 đợt đang chạy ngay
// hôm nay để demo thuyết minh khoá luận không phải chờ đến tháng 11/12.
//   1. "Mega Tech Sale"          – đang chạy (now → +7 ngày), giảm 20% toàn shop
//   2. "Sale 11.11"              – lên lịch 10–12/11, giảm 30% toàn shop
//   3. "Sale 12.12"              – lên lịch 11–13/12, giảm 25% toàn shop
//   4. "Black Friday · Cyber Week" – lên lịch 24–30/11, giảm 35% toàn shop
//   5. "Tuần lễ phụ kiện"        – đang chạy (now → +5 ngày), giảm 15% chỉ
//                                  riêng danh mục slug 'phu-kien' (nếu có).

require('dotenv').config();
const db = require('../src/config/db');
const { ensureSchema } = require('../src/config/schema-updater');

const pad = (n) => String(n).padStart(2, '0');
const toMysql = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
  `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const addDays = (date, days) => {
  const x = new Date(date);
  x.setDate(x.getDate() + days);
  return x;
};

(async () => {
  try {
    await ensureSchema();

    const now = new Date();
    const year = now.getFullYear();

    // Phụ kiện danh mục (nếu có) — cố gắng lấy id để demo scope=category.
    const [accessoryRows] = await db.query(
      "SELECT id FROM categories WHERE slug LIKE 'phu-kien%' OR slug = 'phu-kien' LIMIT 1"
    );
    const accessoryCatId = accessoryRows[0]?.id || null;

    const campaigns = [
      {
        name: 'Mega Tech Sale (Demo)',
        slug: 'mega-tech-sale-demo',
        banner_text: 'MEGA TECH SALE · Đang diễn ra',
        description:
          'Chiến dịch demo đang chạy — giảm 20% toàn shop, dùng cho mục đích thuyết minh hệ thống.',
        discount_percent: 20,
        starts_at: toMysql(addDays(now, -1)),
        ends_at: toMysql(addDays(now, 7)),
        scope: 'all',
        priority: 50,
        targets: [],
      },
      {
        name: `Sale 11.11 ${year}`,
        slug: `sale-11-11-${year}`,
        banner_text: '11.11 · Single Day Mega Sale',
        description: 'Đợt giảm giá toàn sàn nhân ngày 11.11.',
        discount_percent: 30,
        starts_at: `${year}-11-10 00:00:00`,
        ends_at: `${year}-11-12 23:59:59`,
        scope: 'all',
        priority: 110,
        targets: [],
      },
      {
        name: `Sale 12.12 ${year}`,
        slug: `sale-12-12-${year}`,
        banner_text: '12.12 · Year-End Sale',
        description: 'Tổng kết năm — giảm sâu toàn ngành hàng.',
        discount_percent: 25,
        starts_at: `${year}-12-11 00:00:00`,
        ends_at: `${year}-12-13 23:59:59`,
        scope: 'all',
        priority: 120,
        targets: [],
      },
      {
        name: `Black Friday ${year}`,
        slug: `black-friday-${year}`,
        banner_text: 'BLACK FRIDAY · Cyber Week',
        description: 'Tuần lễ vàng của ngành công nghệ.',
        discount_percent: 35,
        starts_at: `${year}-11-24 00:00:00`,
        ends_at: `${year}-11-30 23:59:59`,
        scope: 'all',
        priority: 99,
        targets: [],
      },
    ];

    if (accessoryCatId) {
      campaigns.push({
        name: 'Tuần lễ phụ kiện (Demo)',
        slug: 'tuan-le-phu-kien-demo',
        banner_text: 'PHỤ KIỆN HOT · −15%',
        description:
          'Demo chiến dịch theo danh mục: chỉ áp cho danh mục Phụ kiện trong 5 ngày tới.',
        discount_percent: 15,
        starts_at: toMysql(now),
        ends_at: toMysql(addDays(now, 5)),
        scope: 'category',
        priority: 80,
        targets: [{ target_type: 'category', target_id: accessoryCatId }],
      });
    }

    let inserted = 0;
    let updated = 0;

    for (const c of campaigns) {
      const [rows] = await db.query('SELECT id FROM promotion_campaigns WHERE slug = ?', [c.slug]);
      let campaignId;
      if (rows.length) {
        campaignId = rows[0].id;
        await db.query(
          `UPDATE promotion_campaigns
              SET name = ?, banner_text = ?, description = ?, discount_percent = ?,
                  starts_at = ?, ends_at = ?, scope = ?, priority = ?, is_active = 1
            WHERE id = ?`,
          [
            c.name, c.banner_text, c.description, c.discount_percent,
            c.starts_at, c.ends_at, c.scope, c.priority, campaignId,
          ]
        );
        updated += 1;
      } else {
        const [result] = await db.query(
          `INSERT INTO promotion_campaigns
            (name, slug, banner_text, description, discount_percent,
             starts_at, ends_at, scope, priority, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            c.name, c.slug, c.banner_text, c.description, c.discount_percent,
            c.starts_at, c.ends_at, c.scope, c.priority,
          ]
        );
        campaignId = result.insertId;
        inserted += 1;
      }

      await db.query('DELETE FROM promotion_campaign_targets WHERE campaign_id = ?', [campaignId]);
      if (c.targets.length) {
        const values = c.targets.map((t) => [campaignId, t.target_type, t.target_id]);
        await db.query(
          'INSERT INTO promotion_campaign_targets (campaign_id, target_type, target_id) VALUES ?',
          [values]
        );
      }

      const status =
        new Date(c.starts_at) > now ? 'lên lịch' :
        new Date(c.ends_at) < now ? 'đã kết thúc' : '🔥 đang chạy';
      console.log(`✅ ${c.name.padEnd(30)} (${status}) – ${c.discount_percent}% – scope: ${c.scope}`);
    }

    console.log(`\nDONE. Tạo mới ${inserted}, cập nhật ${updated} chiến dịch.`);
    console.log('Mở /promotions hoặc /admin/promotions để kiểm tra.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed lỗi:', err.message);
    process.exit(1);
  }
})();
