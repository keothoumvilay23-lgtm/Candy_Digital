/**
 * Bổ sung ~10 ảnh/góc cho từng màu (gallery_json) + ảnh tổng quan (product_images).
 * Chạy từ thư mục backend: node scripts/seed-rich-galleries.js
 *
 * Một phần URL tham khảo CDN Thế Giới Di Động; tai nghe/đồng hồ/tablet/ốp dùng ảnh minh họa Unsplash (demo).
 */
require('dotenv').config();
const db = require('../src/config/db');
const { ensureSchema } = require('../src/config/schema-updater');

const fill10 = (photoIds) => {
  const out = [];
  for (let i = 0; i < 10; i += 1) {
    const id = photoIds[i % photoIds.length];
    out.push(`https://images.unsplash.com/photo-${id}?w=900&auto=format&fit=max&q=80`);
  }
  return out;
};

const B = 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329151/';
const IP16_SA_MAC_10 = [
  `${B}iphone-16-pro-max-titan-sa-mac-1-638638962113364601.jpg`,
  `${B}iphone-16-pro-max-titan-sa-mac-2-638638962119882098.jpg`,
  `${B}iphone-16-pro-max-titan-sa-mac-3-638638962127018798.jpg`,
  `${B}iphone-16-pro-max-titan-sa-mac-4-638638962141944782.jpg`,
  `${B}iphone-16-pro-max-titan-sa-mac-5-638638962165404928.jpg`,
  `${B}iphone-16-pro-max-titan-sa-mac-6-638638962173099641.jpg`,
  `${B}iphone-16-pro-max-titan-sa-mac-7-638638962179108514.jpg`,
  `${B}iphone-16-pro-max-titan-sa-mac-8-638638962185507639.jpg`,
  `${B}iphone-16-pro-max-titan-sa-mac-9-638638962191273120.jpg`,
  `${B}iphone-16-pro-max-tem-99-638645211293752080.jpg`,
];

const P15PM = 'https://cdn.tgdd.vn/Products/Images/42/305660/';
const IP16_DEN_10 = [
  `${P15PM}iphone-15-pro-max-black-1.jpg`,
  `${P15PM}iphone-15-pro-max-black-2.jpg`,
  `${P15PM}iphone-15-pro-max-black-3.jpg`,
  `${P15PM}iphone-15-pro-max-den-2.jpg`,
  `${P15PM}iphone-15-pro-max-den-3.jpg`,
  `${P15PM}iphone-15-pro-max-trang-2.jpg`,
  `${P15PM}iphone-15-pro-max-tu-nhien-1.jpg`,
  `${P15PM}iphone-15-pro-max-tu-nhien-3.jpg`,
  `${P15PM}iphone-15-pro-max-blue-2.jpg`,
  `${P15PM}iphone-15-pro-max-blue-4.jpg`,
];

const I14 = 'https://cdn.tgdd.vn/Products/Images/42/240259/';
const IP16_HONG_10 = [
  `${I14}iphone-14-tim-1.jpg`,
  `${I14}iphone-14-tim-2.jpg`,
  `${I14}iphone-14-tim-3.jpg`,
  `${I14}iphone-14-do-1.jpg`,
  `${I14}iphone-14-do-2.jpg`,
  `${I14}iphone-14-do-3.jpg`,
  `${I14}iphone-14-xanh-4.jpg`,
  `${I14}iphone-14-xanh-5.jpg`,
  `${I14}iphone-14-xanh-6.jpg`,
  `${I14}iphone-14-xanh-7.jpg`,
];

const S24U = 'https://cdn.tgdd.vn/Products/Images/42/307174/';
const IP16_XAM_10 = Array.from({ length: 10 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-xam-${i + 1}.jpg`);

const S24 = 'https://cdn.tgdd.vn/Products/Images/42/307171/';
const a56Graphite = [
  `${S24}samsung-galaxy-s24-den-1.jpg`,
  `${S24}samsung-galaxy-s24-den-2.jpg`,
  `${S24}samsung-galaxy-s24-den-3.jpg`,
  `${S24}samsung-galaxy-s24-xam-1.jpg`,
  `${S24}samsung-galaxy-s24-xam-2.jpg`,
  `${S24}samsung-galaxy-s24-xam-3.jpg`,
  `${S24}samsung-galaxy-s24-tim-1.jpg`,
  `${S24}samsung-galaxy-s24-tim-2.jpg`,
  `${S24}samsung-galaxy-s24-vang-1.jpg`,
  `${S24U}samsung-galaxy-s24-ultra-den-1.jpg`,
];
const a56Olive = [
  `${S24}samsung-galaxy-s24-vang-1.jpg`,
  `${S24}samsung-galaxy-s24-xam-1.jpg`,
  `${S24}samsung-galaxy-s24-xam-2.jpg`,
  `${S24}samsung-galaxy-s24-den-1.jpg`,
  `${S24}samsung-galaxy-s24-tim-1.jpg`,
  `${S24U}samsung-galaxy-s24-ultra-xam-3.jpg`,
  `${S24U}samsung-galaxy-s24-ultra-xam-4.jpg`,
  `${S24U}samsung-galaxy-s24-ultra-den-2.jpg`,
  `${S24U}samsung-galaxy-s24-ultra-tim-2.jpg`,
  `${S24U}samsung-galaxy-s24-ultra-vang-1.jpg`,
];
const a56Pink = [
  `${S24}samsung-galaxy-s24-tim-1.jpg`,
  `${S24}samsung-galaxy-s24-tim-2.jpg`,
  `${S24}samsung-galaxy-s24-tim-3.jpg`,
  `${S24U}samsung-galaxy-s24-ultra-tim-1.jpg`,
  `${S24U}samsung-galaxy-s24-ultra-tim-3.jpg`,
  `${S24U}samsung-galaxy-s24-ultra-tim-4.jpg`,
  `${S24}samsung-galaxy-s24-vang-1.jpg`,
  `${S24}samsung-galaxy-s24-xam-2.jpg`,
  `${I14}iphone-14-tim-1.jpg`,
  `${I14}iphone-14-tim-2.jpg`,
];
const a56Gray = Array.from({ length: 10 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-xam-${i + 1}.jpg`);

const P15P = 'https://cdn.tgdd.vn/Products/Images/42/303831/';
const P15P_DEN2 = 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/303831/iphone-15-pro-titan-den-2-638629422334738686.jpg';

const PM_MAX_TN = [
  `${P15PM}iphone-15-pro-max-tu-nhien-1.jpg`,
  'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/305660/iphone-15-pro-max-titan-tu-nhien-2-638629415139750508.jpg',
  `${P15PM}iphone-15-pro-max-tu-nhien-3.jpg`,
  `${P15PM}iphone-15-pro-max-tu-nhien-4.jpg`,
  `${P15PM}iphone-15-pro-max-tu-nhien-tem-99.jpg`,
  `${P15PM}iphone-15-pro-max-blue-1.jpg`,
  `${P15PM}iphone-15-pro-max-blue-2.jpg`,
  `${P15PM}iphone-15-pro-max-black-1.jpg`,
  `${P15PM}iphone-15-pro-max-trang-1.jpg`,
  `${P15PM}iphone-15-pro-max-den-2.jpg`,
];
const PM_MAX_TRANG = [
  `${P15PM}iphone-15-pro-max-trang-1.jpg`,
  `${P15PM}iphone-15-pro-max-trang-2.jpg`,
  `${P15PM}iphone-15-pro-max-trang-3.jpg`,
  `${P15PM}iphone-15-pro-max-trang-4.jpg`,
  `${P15PM}iphone-15-pro-max-white-1.jpg`,
  `${P15PM}iphone-15-pro-max-tu-nhien-4.jpg`,
  `${P15PM}iphone-15-pro-max-blue-1.jpg`,
  `${P15PM}iphone-15-pro-max-black-1.jpg`,
  `${P15PM}iphone-15-pro-max-den-2.jpg`,
  `${P15PM}iphone-15-pro-max-tem-99.jpg`,
];
const PM_MAX_BLUE = [
  `${P15PM}iphone-15-pro-max-blue-1.jpg`,
  `${P15PM}iphone-15-pro-max-blue-2.jpg`,
  `${P15PM}iphone-15-pro-max-blue-3.jpg`,
  `${P15PM}iphone-15-pro-max-blue-4.jpg`,
  `${P15PM}iphone-15-pro-max-tu-nhien-3.jpg`,
  `${P15PM}iphone-15-pro-max-tu-nhien-4.jpg`,
  `${P15PM}iphone-15-pro-max-black-1.jpg`,
  `${P15PM}iphone-15-pro-max-trang-2.jpg`,
  `${P15PM}iphone-15-pro-max-den-2.jpg`,
  `${P15PM}iphone-15-pro-max-tem-99.jpg`,
];
const PM_MAX_DEN = IP16_DEN_10;

const G15P_TN = [
  `${P15P}iphone-15-pro-titan-tu-nhien-1.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-2.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-3.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-4.jpg`,
  `${P15P}iphone-15-pro-blue-1.jpg`,
  `${P15P}iphone-15-pro-blue-2.jpg`,
  `${P15P}iphone-15-pro-black-1.jpg`,
  `${P15P}iphone-15-pro-black-2.jpg`,
  `${P15P}iphone-15-pro-black-3.jpg`,
  `${P15P}iphone-15-pro-black-4.jpg`,
];
const G15P_TRANG = [
  `${P15P}iphone-15-pro-titan-tu-nhien-1.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-2.jpg`,
  `${P15P}iphone-15-pro-blue-1.jpg`,
  `${P15P}iphone-15-pro-blue-2.jpg`,
  `${P15P}iphone-15-pro-black-1.jpg`,
  P15P_DEN2,
  `${P15P}iphone-15-pro-titan-tu-nhien-3.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-4.jpg`,
  `${P15P}iphone-15-pro-tem-20-3.jpg`,
  `${P15P}iphone-15-pro-black-4.jpg`,
];
const G15P_XANH = [
  `${P15P}iphone-15-pro-blue-1.jpg`,
  `${P15P}iphone-15-pro-blue-2.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-1.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-2.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-3.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-4.jpg`,
  `${P15P}iphone-15-pro-black-1.jpg`,
  `${P15P}iphone-15-pro-black-2.jpg`,
  P15P_DEN2,
  `${P15P}iphone-15-pro-black-3.jpg`,
];
const G15P_DEN = [
  `${P15P}iphone-15-pro-black-1.jpg`,
  P15P_DEN2,
  `${P15P}iphone-15-pro-black-3.jpg`,
  `${P15P}iphone-15-pro-black-4.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-1.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-2.jpg`,
  `${P15P}iphone-15-pro-blue-1.jpg`,
  `${P15P}iphone-15-pro-tem-20-3.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-3.jpg`,
  `${P15P}iphone-15-pro-titan-tu-nhien-4.jpg`,
];

const ix = (pre, nums) => nums.map((n) => `${I14}iphone-14-${pre}-${n}.jpg`);
const I14MID = (a, b) => [...ix('den', a), ...ix('xanh', b)];
const I14_GALLERY = {
  'Đen Midnight': I14MID([1, 2, 3], [1, 2, 3, 4, 5, 6, 7]),
  'Trắng Starlight': [...ix('trang', [1, 2, 3]), ...ix('xanh', [4, 5, 6, 7, 8, 9, 10])],
  'Xanh dương': ix('xanh', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  Tím: [...ix('tim', [1, 2, 3]), ...ix('xanh', [4, 5, 6, 7, 8, 9, 10, 11])],
  Đỏ: [...ix('do', [1, 2, 3]), ...ix('xanh', [4, 5, 6, 7, 8, 9, 10, 11])],
};

const S24U_GALLERY = {
  'Titan Xám': Array.from({ length: 10 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-xam-${i + 1}.jpg`),
  'Titan Đen': [...Array.from({ length: 5 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-den-${i + 1}.jpg`), ...Array.from({ length: 5 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-xam-${i + 1}.jpg`)],
  'Titan Tím': [...Array.from({ length: 5 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-tim-${i + 1}.jpg`), ...Array.from({ length: 5 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-xam-${i + 1}.jpg`)],
  'Titan Vàng': Array.from({ length: 10 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-vang-${i + 1}.jpg`),
};

const S24_GALLERY = {
  'Onyx Black': [...Array.from({ length: 3 }, (_, i) => `${S24}samsung-galaxy-s24-den-${i + 1}.jpg`), ...Array.from({ length: 3 }, (_, i) => `${S24}samsung-galaxy-s24-tim-${i + 1}.jpg`), ...Array.from({ length: 4 }, (_, i) => `${S24}samsung-galaxy-s24-xam-${i + 1}.jpg`)],
  'Marble Gray': Array.from({ length: 10 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-xam-${i + 1}.jpg`),
  'Cobalt Violet': [...Array.from({ length: 3 }, (_, i) => `${S24}samsung-galaxy-s24-tim-${i + 1}.jpg`), ...Array.from({ length: 7 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-tim-${i + 1}.jpg`)],
  'Amber Yellow': [`${S24}samsung-galaxy-s24-vang-1.jpg`, ...Array.from({ length: 9 }, (_, i) => `${S24U}samsung-galaxy-s24-ultra-vang-${i + 2}.jpg`)],
};

const AIR = 'https://cdn.tgdd.vn/Products/Images/54/289781/';
const AIRPODS_10 = [
  `${AIR}airpods-pro-2nd-generation-0.jpg`,
  `${AIR}airpods-pro-2nd-generation-1.jpg`,
  `${AIR}airpods-pro-2nd-generation-2.jpg`,
  `${AIR}airpods-pro-2nd-generation-3.jpg`,
  `${AIR}airpods-pro-2nd-generation-4.jpg`,
  `${AIR}airpods-pro-2-2.jpg`,
  `${AIR}airpods-pro-2-3.jpg`,
  `${AIR}airpods-pro-2-4.jpg`,
  `${AIR}airpods-pro-2-5.jpg`,
  `${AIR}airpods-pro-2-6.jpg`,
];

const BUDS_GRAPHITE = fill10([
  '1618366712010-f4ae9c647dcb',
  '1579586337278-3befd40fd17a',
  '1544117519-31a4b719223d',
]);
const BUDS_WHITE = fill10([
  '1544244015-0df4b3ffc6b0',
  '1561154464-82e9adf32764',
  '1618366712010-f4ae9c647dcb',
]);
const BUDS_PURPLE = fill10([
  '1508685096489-7aacd43bd3b1',
  '1618366712010-f4ae9c647dcb',
  '1579586337278-3befd40fd17a',
]);

const WATCH_MIDNIGHT = fill10(['1579586337278-3befd40fd17a', '1544117519-31a4b719223d']);
const WATCH_STARLIGHT = fill10(['1561154464-82e9adf32764', '1544244015-0df4b3ffc6b0']);
const WATCH_SILVER = fill10(['1611186871348-b1ce696e52c9', '1579586337278-3befd40fd17a']);
const WATCH_RED = fill10(['1544117519-31a4b719223d', '1511707171634-5f897ff02aa9']);
const WATCH_PINK = fill10(['1508685096489-7aacd43bd3b1', '1511707171634-5f897ff02aa9']);

const IPAD_GRAY = fill10(['1544244015-0df4b3ffc6b0', '1561154464-82e9adf32764']);
const IPAD_BLUE = fill10(['1561154464-82e9adf32764', '1611186871348-b1ce696e52c9']);
const IPAD_PURPLE = fill10(['1508685096489-7aacd43bd3b1', '1561154464-82e9adf32764']);
const IPAD_STAR = fill10(['1544244015-0df4b3ffc6b0', '1611186871348-b1ce696e52c9']);

const CASE_BLACK = fill10(['1511707171634-5f897ff02aa9', '1579586337278-3befd40fd17a']);
const CASE_BLUE = fill10(['1561154464-82e9adf32764', '1511707171634-5f897ff02aa9']);
const CASE_PINK = fill10(['1508685096489-7aacd43bd3b1', '1511707171634-5f897ff02aa9']);
const CASE_BE = fill10(['1544244015-0df4b3ffc6b0', '1511707171634-5f897ff02aa9']);

async function replaceProductImages(productId, urls) {
  await db.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
  for (let i = 0; i < urls.length; i += 1) {
    await db.query(
      'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
      [productId, urls[i], i === 0 ? 1 : 0, i]
    );
  }
}

async function updateColorGallery(productId, name, { image_url, hex_code, gallery }) {
  await db.query(
    `UPDATE product_colors SET gallery_json = ?, image_url = COALESCE(?, image_url), hex_code = COALESCE(?, hex_code)
     WHERE product_id = ? AND name = ?`,
    [JSON.stringify(gallery), image_url || null, hex_code || null, productId, name]
  );
}

(async () => {
  try {
    await ensureSchema();

    await updateColorGallery(1, 'Titan Tự Nhiên', { image_url: PM_MAX_TN[0], gallery: PM_MAX_TN });
    await updateColorGallery(1, 'Titan Trắng', { image_url: PM_MAX_TRANG[0], gallery: PM_MAX_TRANG });
    await updateColorGallery(1, 'Titan Xanh', { image_url: PM_MAX_BLUE[0], gallery: PM_MAX_BLUE });
    await updateColorGallery(1, 'Titan Đen', { image_url: PM_MAX_DEN[0], gallery: PM_MAX_DEN });

    await updateColorGallery(2, 'Titan Tự Nhiên', { image_url: G15P_TN[0], gallery: G15P_TN });
    await updateColorGallery(2, 'Titan Trắng', { image_url: G15P_TRANG[0], gallery: G15P_TRANG });
    await updateColorGallery(2, 'Titan Xanh', { image_url: G15P_XANH[0], gallery: G15P_XANH });
    await updateColorGallery(2, 'Titan Đen', { image_url: G15P_DEN[0], gallery: G15P_DEN });

    for (const name of Object.keys(I14_GALLERY)) {
      const g = I14_GALLERY[name];
      await updateColorGallery(3, name, { image_url: g[0], gallery: g });
    }
    for (const name of Object.keys(S24U_GALLERY)) {
      const g = S24U_GALLERY[name];
      await updateColorGallery(4, name, { image_url: g[0], gallery: g });
    }
    for (const name of Object.keys(S24_GALLERY)) {
      const g = S24_GALLERY[name];
      await updateColorGallery(5, name, { image_url: g[0], gallery: g });
    }

    const pid11 = 11;
    await replaceProductImages(pid11, IP16_SA_MAC_10);
    await updateColorGallery(pid11, 'đen', { hex_code: '#1c1c1e', image_url: IP16_DEN_10[0], gallery: IP16_DEN_10 });
    await updateColorGallery(pid11, 'hồng', { hex_code: '#e391cd', image_url: IP16_HONG_10[0], gallery: IP16_HONG_10 });
    await updateColorGallery(pid11, 'xám', { hex_code: '#7f8490', image_url: IP16_XAM_10[0], gallery: IP16_XAM_10 });

    const pid12 = 12;
    await replaceProductImages(pid12, a56Gray);
    await updateColorGallery(pid12, 'Graphite', { image_url: a56Graphite[0], gallery: a56Graphite });
    await updateColorGallery(pid12, 'Olive', { image_url: a56Olive[0], gallery: a56Olive });
    await updateColorGallery(pid12, 'Pink', { image_url: a56Pink[0], gallery: a56Pink });
    await updateColorGallery(pid12, 'Gray', { image_url: a56Gray[0], gallery: a56Gray });

    const pid6 = 6;
    await replaceProductImages(pid6, AIRPODS_10);
    const [[ac]] = await db.query('SELECT COUNT(*) AS n FROM product_colors WHERE product_id = ?', [pid6]);
    if (Number(ac.n) === 0) {
      await db.query(
        `INSERT INTO product_colors (product_id, name, hex_code, image_url, gallery_json, sort_order, is_active)
         VALUES (?, 'Trắng', '#f5f5f7', ?, ?, 0, 1)`,
        [pid6, AIRPODS_10[0], JSON.stringify(AIRPODS_10)]
      );
    } else {
      await db.query(
        'UPDATE product_colors SET image_url = ?, gallery_json = ? WHERE product_id = ?',
        [AIRPODS_10[0], JSON.stringify(AIRPODS_10), pid6]
      );
    }

    const pid7 = 7;
    await replaceProductImages(pid7, BUDS_GRAPHITE);
    await updateColorGallery(pid7, 'Graphite', { image_url: BUDS_GRAPHITE[0], gallery: BUDS_GRAPHITE });
    await updateColorGallery(pid7, 'Trắng', { image_url: BUDS_WHITE[0], gallery: BUDS_WHITE });
    await updateColorGallery(pid7, 'Bora Purple', { image_url: BUDS_PURPLE[0], gallery: BUDS_PURPLE });

    const pid8 = 8;
    await replaceProductImages(pid8, WATCH_MIDNIGHT);
    await updateColorGallery(pid8, 'Midnight', { image_url: WATCH_MIDNIGHT[0], gallery: WATCH_MIDNIGHT });
    await updateColorGallery(pid8, 'Starlight', { image_url: WATCH_STARLIGHT[0], gallery: WATCH_STARLIGHT });
    await updateColorGallery(pid8, 'Silver', { image_url: WATCH_SILVER[0], gallery: WATCH_SILVER });
    await updateColorGallery(pid8, '(PRODUCT)RED', { image_url: WATCH_RED[0], gallery: WATCH_RED });
    await updateColorGallery(pid8, 'Pink', { image_url: WATCH_PINK[0], gallery: WATCH_PINK });

    const pid9 = 9;
    await replaceProductImages(pid9, IPAD_GRAY);
    await updateColorGallery(pid9, 'Xám không gian', { image_url: IPAD_GRAY[0], gallery: IPAD_GRAY });
    await updateColorGallery(pid9, 'Xanh Blue', { image_url: IPAD_BLUE[0], gallery: IPAD_BLUE });
    await updateColorGallery(pid9, 'Tím Purple', { image_url: IPAD_PURPLE[0], gallery: IPAD_PURPLE });
    await updateColorGallery(pid9, 'Vàng Starlight', { image_url: IPAD_STAR[0], gallery: IPAD_STAR });

    const pid10 = 10;
    await replaceProductImages(pid10, CASE_BLACK);
    await updateColorGallery(pid10, 'Đen', { image_url: CASE_BLACK[0], gallery: CASE_BLACK });
    await updateColorGallery(pid10, 'Xanh dương', { image_url: CASE_BLUE[0], gallery: CASE_BLUE });
    await updateColorGallery(pid10, 'Hồng', { image_url: CASE_PINK[0], gallery: CASE_PINK });
    await updateColorGallery(pid10, 'Be', { image_url: CASE_BE[0], gallery: CASE_BE });

    console.log('✅ Đã seed gallery_json (theo màu) + product_images cho sản phẩm 1–12.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
