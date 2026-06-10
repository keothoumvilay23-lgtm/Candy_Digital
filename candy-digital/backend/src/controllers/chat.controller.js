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

    // Get product context
    const [products] = await db.query(
      `SELECT p.name, p.price, p.brand, p.stock, c.name AS category
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1 ORDER BY p.created_at DESC LIMIT 30`
    );

    const productList = products.map((p) =>
      `- ${p.name} (${p.brand}) - Danh mục: ${p.category} - Giá: ${Number(p.price).toLocaleString('vi-VN')}đ - Tồn kho: ${p.stock}`
    ).join('\n');

    const systemPrompt = `Bạn là Candy AI, trợ lý tư vấn sản phẩm của cửa hàng Candy Digital - chuyên bán điện thoại và phụ kiện chính hãng.

Danh sách sản phẩm hiện có tại cửa hàng:
${productList}

Hướng dẫn:
- Tư vấn sản phẩm phù hợp với nhu cầu và ngân sách của khách
- Luôn đề xuất sản phẩm từ danh sách trên khi phù hợp
- Trả lời ngắn gọn, thân thiện, chuyên nghiệp bằng tiếng Việt
- Nếu khách hỏi ngoài phạm vi sản phẩm, hãy lịch sự chuyển hướng về tư vấn sản phẩm
- Không bịa thông tin sản phẩm không có trong danh sách`;

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
