const db = require('../config/db');
const fetch = require('node-fetch');
const crypto = require('crypto');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const toGeminiContents = (history) =>
  history.map((item) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }],
  }));

const extractGeminiReply = (data) => {
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Gemini API did not return a text response');
  }

  return text;
};

const getGreetingMessage = () =>
  'Xin chào! Tôi là Candy AI. Tôi có thể giúp bạn tư vấn điện thoại, tai nghe và phụ kiện. Bạn cần tư vấn gì?';

// GET /api/chat/session  — get or create a session
const getOrCreateSession = async (req, res) => {
  try {
    let sessionToken = req.headers['x-session-token'];
    const userId = req.user ? req.user.id : null;

    if (sessionToken) {
      const [rows] = await db.query('SELECT * FROM chat_sessions WHERE session_token = ?', [sessionToken]);
      if (rows.length) {
        const [messages] = await db.query(
          'SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
          [rows[0].id]
        );
        return res.json({ success: true, data: { session_token: sessionToken, messages } });
      }
    }

    // Create new session
    sessionToken = crypto.randomBytes(32).toString('hex');
    const [result] = await db.query(
      'INSERT INTO chat_sessions (user_id, session_token) VALUES (?, ?)',
      [userId, sessionToken]
    );

    res.json({ success: true, data: { session_token: sessionToken, messages: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/chat/message
const sendMessage = async (req, res) => {
  try {
    const { session_token, message } = req.body;

    if (!session_token || !message) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    }

    const [sessions] = await db.query('SELECT * FROM chat_sessions WHERE session_token = ?', [session_token]);
    if (!sessions.length) {
      return res.status(404).json({ success: false, message: 'Phiên chat không tồn tại' });
    }

    const sessionId = sessions[0].id;

    // Save user message
    await db.query('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)', [sessionId, 'user', message]);

    // Get chat history
    const [history] = await db.query(
      'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );

    // Get product context (kèm mô tả ngắn để AI tư vấn đúng tính năng)
    const [products] = await db.query(
      `SELECT p.id, p.name, p.price, p.brand, p.stock, p.description, c.name AS category
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1 ORDER BY p.created_at DESC LIMIT 30`
    );

    // Màu sắc + dung lượng để AI tư vấn. Schema có thể khác nhau giữa các môi trường:
    //  - Kiểu A: màu ở bảng riêng product_colors(name); dung lượng ở product_variants(storage_label)
    //  - Kiểu B: cả màu lẫn dung lượng ở product_variants(color, storage_label)
    // Mỗi query bọc try/catch riêng để bảng/cột thiếu KHÔNG làm hỏng cả chatbot.
    let colorsByProduct = {};
    let storagesByProduct = {};
    if (products.length) {
      const productIds = products.map((p) => p.id);
      const placeholders = productIds.map(() => '?').join(',');

      const pushTo = (map, key, val) => {
        if (val === undefined || val === null || val === '') return;
        (map[key] = map[key] || []).push(val);
      };

      // 1) Màu sắc từ bảng product_colors (nếu có)
      try {
        const [colorRows] = await db.query(
          `SELECT product_id, name
           FROM product_colors
           WHERE is_active = 1 AND product_id IN (${placeholders})
           ORDER BY sort_order ASC, id ASC`,
          productIds
        );
        colorRows.forEach((c) => pushTo(colorsByProduct, c.product_id, c.name));
      } catch (e) {
        console.warn('Chat context: bỏ qua product_colors —', e.code || e.message);
      }

      // 2) Dung lượng (+ giá) và màu dự phòng từ product_variants
      const variantColorsByProduct = {};
      try {
        const [variantRows] = await db.query(
          `SELECT product_id, color, storage_label, price, stock
           FROM product_variants
           WHERE is_active = 1 AND product_id IN (${placeholders})
           ORDER BY sort_order ASC, id ASC`,
          productIds
        );
        variantRows.forEach((v) => {
          pushTo(storagesByProduct, v.product_id, v);
          pushTo(variantColorsByProduct, v.product_id, v.color);
        });
      } catch (e) {
        console.warn('Chat context: bỏ qua product_variants —', e.code || e.message);
      }

      // Dùng màu từ product_variants làm dự phòng cho sản phẩm chưa có màu ở product_colors
      for (const pid of Object.keys(variantColorsByProduct)) {
        if (!colorsByProduct[pid]?.length) colorsByProduct[pid] = variantColorsByProduct[pid];
      }
    }

    const formatVnd = (n) => `${Number(n).toLocaleString('vi-VN')}đ`;
    const uniq = (arr) => [...new Set(arr.filter(Boolean))];

    const productList = products.map((p) => {
      const colors = uniq(colorsByProduct[p.id] || []);
      const storageVariants = storagesByProduct[p.id] || [];
      const storages = uniq(storageVariants.map((v) => v.storage_label));

      // Giá: nếu có biến thể dung lượng thì hiển thị khoảng giá thực tế của các biến thể còn hàng
      const variantPrices = storageVariants
        .filter((v) => Number(v.stock) > 0)
        .map((v) => Number(v.price))
        .filter((n) => Number.isFinite(n) && n > 0);
      let priceText = formatVnd(p.price);
      if (variantPrices.length) {
        const min = Math.min(...variantPrices);
        const max = Math.max(...variantPrices);
        priceText = min === max ? formatVnd(min) : `${formatVnd(min)} - ${formatVnd(max)}`;
      }

      const lines = [
        `- ${p.name} (${p.brand}) — Danh mục: ${p.category}`,
        `  Giá: ${priceText} | Tồn kho: ${p.stock}`,
      ];
      if (colors.length) lines.push(`  Màu sắc: ${colors.join(', ')}`);
      if (storages.length) lines.push(`  Dung lượng: ${storages.join(', ')}`);
      if (p.description) {
        const desc = String(p.description).replace(/\s+/g, ' ').trim().slice(0, 180);
        lines.push(`  Mô tả: ${desc}`);
      }
      return lines.join('\n');
    }).join('\n\n');

    const systemPrompt = `Bạn là Candy AI, trợ lý tư vấn sản phẩm của cửa hàng Candy Digital - chuyên bán điện thoại và phụ kiện chính hãng.

Danh sách sản phẩm hiện có tại cửa hàng (mỗi sản phẩm kèm Màu sắc và Dung lượng nếu có):
${productList}

Hướng dẫn:
- Tư vấn sản phẩm phù hợp với nhu cầu và ngân sách của khách
- Luôn đề xuất sản phẩm từ danh sách trên khi phù hợp
- Khi khách hỏi về MÀU SẮC hoặc DUNG LƯỢNG, hãy dựa vào dòng "Màu sắc" và "Dung lượng" của sản phẩm trong danh sách để trả lời chính xác. Liệt kê đầy đủ các màu/dung lượng đang có.
- Nếu một sản phẩm có ghi màu sắc trong danh sách thì TUYỆT ĐỐI không nói "không có thông tin về màu sắc".
- Khi giá hiển thị dạng khoảng (vd "22.000.000đ - 33.000.000đ") nghĩa là giá thay đổi theo dung lượng/biến thể; hãy giải thích cho khách rõ.
- Trả lời ngắn gọn, thân thiện, chuyên nghiệp bằng tiếng Việt
- Nếu khách hỏi ngoài phạm vi sản phẩm, hãy lịch sự chuyển hướng về tư vấn sản phẩm
- Không bịa thông tin sản phẩm không có trong danh sách. Nếu một sản phẩm KHÔNG có dòng Màu sắc/Dung lượng thì nói rằng hiện chưa có thông tin biến thể cho sản phẩm đó và mời khách xem trang chi tiết.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    const contents = toGeminiContents(history);

    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      throw new Error(`Gemini API error: ${geminiRes.status} ${errorText}`);
    }

    const geminiData = await geminiRes.json();
    const aiReply = extractGeminiReply(geminiData);

    // Save assistant message
    await db.query('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)', [sessionId, 'assistant', aiReply]);

    res.json({ success: true, data: { reply: aiReply } });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi khi xử lý tin nhắn', error: err.message });
  }
};

// DELETE /api/chat/session/:sessionToken/messages
const clearSessionMessages = async (req, res) => {
  try {
    const { sessionToken } = req.params;

    const [sessions] = await db.query('SELECT id FROM chat_sessions WHERE session_token = ?', [sessionToken]);
    if (!sessions.length) {
      return res.status(404).json({ success: false, message: 'Phiên chat không tồn tại' });
    }

    await db.query('DELETE FROM chat_messages WHERE session_id = ?', [sessions[0].id]);

    res.json({
      success: true,
      message: 'Đã xóa lịch sử chat',
      data: { messages: [{ role: 'assistant', content: getGreetingMessage() }] },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

module.exports = { getOrCreateSession, sendMessage, clearSessionMessages };
