-- Ảnh bộ sưu tập điện thoại (nhiều góc, tham khảo CDN Thế Giới Di Động).
-- Chạy sau khi DB đã có sản phẩm id 1–5 (iPhone 15 Pro Max, 15 Pro, 14, S24 Ultra, S24).
-- Cảnh báo: URL là tài nguyên của bên thứ ba; dùng demo / tham khảo; production nên tự host ảnh.

DELETE FROM product_images WHERE product_id IN (1, 2, 3, 4, 5);

INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
-- iPhone 15 Pro Max 256GB (id 1) — pid TGDD 305660
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-tu-nhien-1.jpg', 1, 0),
(1, 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/305660/iphone-15-pro-max-titan-tu-nhien-2-638629415139750508.jpg', 0, 1),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-tu-nhien-3.jpg', 0, 2),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-tu-nhien-4.jpg', 0, 3),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-tu-nhien-tem-99.jpg', 0, 4),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-black-1.jpg', 0, 5),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-black-2.jpg', 0, 6),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-black-3.jpg', 0, 7),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-den-2.jpg', 0, 8),
(1, 'https://cdn.tgdd.vn/Products/Images/42/305660/iphone-15-pro-max-trang-2.jpg', 0, 9),

-- iPhone 15 Pro 128GB (id 2) — pid TGDD 303831
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-black-1.jpg', 1, 0),
(2, 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/303831/iphone-15-pro-titan-den-2-638629422334738686.jpg', 0, 1),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-black-3.jpg', 0, 2),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-black-4.jpg', 0, 3),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-titan-tu-nhien-1.jpg', 0, 4),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-titan-tu-nhien-2.jpg', 0, 5),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-titan-tu-nhien-3.jpg', 0, 6),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-titan-tu-nhien-4.jpg', 0, 7),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-blue-1.jpg', 0, 8),
(2, 'https://cdn.tgdd.vn/Products/Images/42/303831/iphone-15-pro-blue-2.jpg', 0, 9),

-- iPhone 14 128GB (id 3) — pid TGDD 240259
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-1.jpg', 1, 0),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-2.jpg', 0, 1),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-3.jpg', 0, 2),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-4.jpg', 0, 3),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-5.jpg', 0, 4),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-6.jpg', 0, 5),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-7.jpg', 0, 6),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-8.jpg', 0, 7),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-9.jpg', 0, 8),
(3, 'https://cdn.tgdd.vn/Products/Images/42/240259/iphone-14-xanh-10.jpg', 0, 9),

-- Samsung Galaxy S24 Ultra 256GB (id 4) — pid TGDD 307174
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-1.jpg', 1, 0),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-2.jpg', 0, 1),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-3.jpg', 0, 2),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-4.jpg', 0, 3),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-5.jpg', 0, 4),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-6.jpg', 0, 5),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-7.jpg', 0, 6),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-8.jpg', 0, 7),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-9.jpg', 0, 8),
(4, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-xam-10.jpg', 0, 9),

-- Samsung Galaxy S24 128GB (id 5) — pid TGDD 307171
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-xam-1.jpg', 1, 0),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-xam-2.jpg', 0, 1),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-xam-3.jpg', 0, 2),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-den-1.jpg', 0, 3),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-den-2.jpg', 0, 4),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-den-3.jpg', 0, 5),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-tim-1.jpg', 0, 6),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-tim-2.jpg', 0, 7),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-tim-3.jpg', 0, 8),
(5, 'https://cdn.tgdd.vn/Products/Images/42/307171/samsung-galaxy-s24-vang-1.jpg', 0, 9);
