const db = require('../config/db');
const ExcelJS = require('exceljs');

// POST /api/orders
const createOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      shipping_name, shipping_phone, shipping_address, payment_method, note,
      payer_bank_name, payer_account_number, payer_account_name,
    } = req.body;

    if (!shipping_name || !shipping_phone || !shipping_address) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin giao hàng' });
    }

    const requirePayerInfo = ['bank_transfer', 'momo', 'zalopay'].includes(payment_method);
    if (requirePayerInfo) {
      if (!payer_account_number || !payer_account_name) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: payment_method === 'bank_transfer'
            ? 'Vui lòng nhập số tài khoản và tên chủ tài khoản của bạn'
            : 'Vui lòng nhập số điện thoại ví và tên chủ ví của bạn',
        });
      }
      if (payment_method === 'bank_transfer' && !payer_bank_name) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ngân hàng của bạn' });
      }
    }

    // Get cart items
    const [cartItems] = await conn.query(
      `SELECT c.quantity, c.variant_id, c.color_name, c.storage_label,
              p.id AS product_id, p.name, COALESCE(c.unit_price, p.price) AS price, p.stock, v.stock AS variant_stock,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
       FROM carts c
       JOIN products p ON c.product_id = p.id
       LEFT JOIN product_variants v ON c.variant_id = v.id
       WHERE c.user_id = ? AND p.is_active = 1`,
      [req.user.id]
    );

    if (!cartItems.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }

    // Check stock
    for (const item of cartItems) {
      const stock = item.variant_id ? item.variant_stock : item.stock;
      if (item.quantity > stock) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Sản phẩm "${item.name}" không đủ số lượng tồn kho` });
      }
    }

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const pm = payment_method || 'cod';
    // vnpay cũng là trả trước (pending → xác nhận qua IPN/return) nhưng không cần khai báo TK người chuyển.
    const isPrepaid = ['bank_transfer', 'momo', 'zalopay', 'vnpay'].includes(pm);
    // Trả trước: chờ webhook sao kê / admin xác nhận — không tin khai báo của khách
    const paymentStatus = isPrepaid ? 'pending' : 'na';
    const paymentConfirmedAt = null;

    // Create order
    const [orderResult] = await conn.query(
      `INSERT INTO orders
        (user_id, total_price, shipping_name, shipping_phone, shipping_address,
         payment_method, payment_status, payment_confirmed_at, payer_bank_name, payer_account_number, payer_account_name, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, totalPrice, shipping_name, shipping_phone, shipping_address,
        pm,
        paymentStatus,
        paymentConfirmedAt,
        requirePayerInfo ? (payer_bank_name || null) : null,
        requirePayerInfo ? (payer_account_number || null) : null,
        requirePayerInfo ? (payer_account_name || null) : null,
        note || null,
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items & reduce stock
    for (const item of cartItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, color_name, storage_label, product_image, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.variant_id || null, item.name, item.color_name, item.storage_label, item.image, item.quantity, item.price]
      );
      if (item.variant_id) {
        await conn.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [item.quantity, item.variant_id]);
      } else {
        await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    // Clear cart
    await conn.query('DELETE FROM carts WHERE user_id = ?', [req.user.id]);

    await conn.commit();

    const orderCode = `DH${String(orderId).padStart(6, '0')}`;
    res.status(201).json({
      success: true,
      message: isPrepaid
        ? 'Đặt hàng thành công. Vui lòng chuyển khoản theo hướng dẫn — hệ thống sẽ xác nhận qua webhook.'
        : 'Đặt hàng thành công',
      data: {
        order_id: orderId,
        total_price: totalPrice,
        payment_method: pm,
        payment_status: paymentStatus,
        order_code: orderCode,
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  } finally {
    conn.release();
  }
};

// GET /api/orders  (user's own orders)
const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['o.user_id = ?'];
    let params = [req.user.id];

    if (status && status !== 'all') {
      where.push('o.status = ?');
      params.push(status);
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    const [orders] = await db.query(
      `SELECT o.id, o.total_price, o.status, o.payment_method, o.payment_status, o.bank_in_amount, o.bank_in_at,
              o.bank_in_reference, o.payment_confirmed_at, o.created_at
       FROM orders o ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Attach items to each order
    for (const order of orders) {
      const [items] = await db.query(
        'SELECT * FROM order_items WHERE order_id = ?', [order.id]
      );
      order.items = items;
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`, params
    );

    res.json({ success: true, data: orders, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }

    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...rows[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }
    if (!['pending', 'confirmed'].includes(rows[0].status)) {
      return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng ở trạng thái này' });
    }

    // Restore stock
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    for (const item of items) {
      if (item.product_id) {
        if (item.variant_id) {
          await db.query('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [item.quantity, item.variant_id]);
        } else {
          await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
      }
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    res.json({ success: true, message: 'Hủy đơn hàng thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// --- ADMIN ---

// GET /api/admin/orders
const adminGetOrders = async (req, res) => {
  try {
    const { status, search, from, to, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];

    if (status && status !== 'all') { where.push('o.status = ?'); params.push(status); }
    if (search) { where.push('(u.name LIKE ? OR u.email LIKE ? OR o.id = ?)'); params.push(`%${search}%`, `%${search}%`, parseInt(search) || 0); }
    if (from) { where.push('DATE(o.created_at) >= ?'); params.push(from); }
    if (to)   { where.push('DATE(o.created_at) <= ?'); params.push(to); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id = u.id ${whereClause}`, params
    );

    res.json({ success: true, data: orders, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/orders/admin/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status=&search=
// Xuất báo cáo đơn hàng ra file Excel (.xlsx) chuyên nghiệp,
// nhóm theo Tháng/Năm và kèm sheet chi tiết sản phẩm.
const adminExportOrders = async (req, res) => {
  try {
    const { status, search, from, to } = req.query;
    const where = [];
    const params = [];

    if (status && status !== 'all') { where.push('o.status = ?'); params.push(status); }
    if (search) {
      where.push('(u.name LIKE ? OR u.email LIKE ? OR o.id = ?)');
      params.push(`%${search}%`, `%${search}%`, parseInt(search) || 0);
    }
    if (from) { where.push('DATE(o.created_at) >= ?'); params.push(from); }
    if (to)   { where.push('DATE(o.created_at) <= ?'); params.push(to); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC`,
      params
    );

    // Lấy items kèm theo cho từng đơn (1 truy vấn duy nhất)
    let itemsByOrder = {};
    if (orders.length) {
      const ids = orders.map((o) => o.id);
      const placeholders = ids.map(() => '?').join(',');
      const [items] = await db.query(
        `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
        ids
      );
      itemsByOrder = items.reduce((acc, it) => {
        (acc[it.order_id] = acc[it.order_id] || []).push(it);
        return acc;
      }, {});
    }

    // ===== Tạo workbook =====
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Candy Digital';
    wb.created = new Date();

    const STATUS_LABEL = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      done: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    const STATUS_COLOR = {
      pending: 'FFFFF3CD',
      confirmed: 'FFCCE5FF',
      shipping: 'FFD1ECF1',
      done: 'FFD4EDDA',
      cancelled: 'FFF8D7DA',
    };
    const STATUS_FONT = {
      pending: 'FF856404',
      confirmed: 'FF004085',
      shipping: 'FF0C5460',
      done: 'FF155724',
      cancelled: 'FF721C24',
    };
    const PAYMENT_LABEL = {
      cod: 'COD - Tiền mặt',
      bank_transfer: 'Chuyển khoản',
      momo: 'Ví MoMo',
      zalopay: 'ZaloPay',
      vnpay: 'VNPay',
    };

    const formatVND = (n) =>
      Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' ₫';
    const pad = (n) => String(n).padStart(2, '0');
    const fmtDate = (d) => {
      const x = new Date(d);
      return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
    };

    // ============ SHEET 1: Tổng hợp đơn hàng ============
    const ws = wb.addWorksheet('Tổng hợp đơn hàng', {
      views: [{ state: 'frozen', ySplit: 6 }],
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });

    ws.columns = [
      { key: 'idx',       width: 6 },
      { key: 'code',      width: 12 },
      { key: 'date',      width: 18 },
      { key: 'customer',  width: 22 },
      { key: 'email',     width: 26 },
      { key: 'phone',     width: 14 },
      { key: 'address',   width: 36 },
      { key: 'payment',   width: 18 },
      { key: 'items_qty', width: 8 },
      { key: 'total',     width: 16 },
      { key: 'status',    width: 14 },
      { key: 'note',      width: 24 },
    ];

    // --- Tiêu đề chính ---
    ws.mergeCells('A1:L1');
    const title = ws.getCell('A1');
    title.value = 'BÁO CÁO ĐƠN HÀNG - CANDY DIGITAL';
    title.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE91E63' } };
    ws.getRow(1).height = 32;

    // --- Tiêu đề phụ: khoảng thời gian ---
    ws.mergeCells('A2:L2');
    const sub = ws.getCell('A2');
    const periodText = (from || to)
      ? `Từ ngày ${from || '...'} đến ngày ${to || '...'}`
      : 'Toàn bộ thời gian';
    sub.value = `Kỳ báo cáo: ${periodText}`;
    sub.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF555555' } };
    sub.alignment = { horizontal: 'center' };

    // --- Ngày xuất ---
    ws.mergeCells('A3:L3');
    const exportedAt = ws.getCell('A3');
    exportedAt.value = `Ngày xuất: ${fmtDate(new Date())}     |     Tổng số đơn: ${orders.length}`;
    exportedAt.font = { name: 'Calibri', size: 10, color: { argb: 'FF777777' } };
    exportedAt.alignment = { horizontal: 'center' };

    // dòng trống
    ws.addRow([]);

    // --- Header bảng (dòng 5) ---
    const headerRow = ws.addRow([
      'STT', 'Mã đơn', 'Ngày đặt', 'Khách hàng', 'Email',
      'Số điện thoại', 'Địa chỉ giao hàng', 'Phương thức TT',
      'SL SP', 'Tổng tiền', 'Trạng thái', 'Ghi chú',
    ]);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF424242' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // --- Nhóm theo Tháng/Năm ---
    const groups = orders.reduce((acc, o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      (acc[key] = acc[key] || []).push(o);
      return acc;
    }, {});
    const groupKeys = Object.keys(groups).sort().reverse(); // mới nhất trước

    let stt = 0;
    let grandTotal = 0;
    const statusCount = { pending: 0, confirmed: 0, shipping: 0, done: 0, cancelled: 0 };

    for (const key of groupKeys) {
      const list = groups[key];
      const [year, month] = key.split('-');
      const monthTotal = list.reduce((s, o) => s + Number(o.total_price || 0), 0);

      // Dòng tiêu đề nhóm tháng
      const groupRow = ws.addRow([
        `▸ THÁNG ${month}/${year}  •  ${list.length} đơn  •  ${formatVND(monthTotal)}`,
      ]);
      ws.mergeCells(`A${groupRow.number}:L${groupRow.number}`);
      const gc = ws.getCell(`A${groupRow.number}`);
      gc.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1A237E' } };
      gc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      gc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
      groupRow.height = 22;

      // Các đơn trong tháng
      for (const o of list) {
        stt++;
        grandTotal += Number(o.total_price || 0);
        statusCount[o.status] = (statusCount[o.status] || 0) + 1;
        const items = itemsByOrder[o.id] || [];
        const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);

        const row = ws.addRow({
          idx: stt,
          code: '#' + String(o.id).padStart(6, '0'),
          date: fmtDate(o.created_at),
          customer: o.user_name || '',
          email: o.user_email || '',
          phone: o.shipping_phone || '',
          address: o.shipping_address || '',
          payment: PAYMENT_LABEL[o.payment_method] || (o.payment_method || '').toUpperCase(),
          items_qty: totalQty,
          total: Number(o.total_price || 0),
          status: STATUS_LABEL[o.status] || o.status,
          note: o.note || '',
        });

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { vertical: 'middle', wrapText: true };
          cell.border = {
            top:    { style: 'hair', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
            left:   { style: 'hair', color: { argb: 'FFE0E0E0' } },
            right:  { style: 'hair', color: { argb: 'FFE0E0E0' } },
          };
          // Căn giữa cho các cột số
          if ([1, 2, 9, 11].includes(colNumber)) {
            cell.alignment = { ...cell.alignment, horizontal: 'center' };
          }
          if (colNumber === 10) {
            cell.alignment = { ...cell.alignment, horizontal: 'right' };
          }
        });

        // Định dạng tiền tệ cột Tổng tiền
        row.getCell('total').numFmt = '#,##0 "₫"';
        row.getCell('total').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFD81B60' } };

        // Tô màu trạng thái
        const statusCell = row.getCell('status');
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_COLOR[o.status] || 'FFEEEEEE' } };
        statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: STATUS_FONT[o.status] || 'FF333333' } };
        statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Mã đơn in đậm
        row.getCell('code').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1976D2' } };
      }
    }

    // --- Dòng tổng cộng ---
    if (orders.length) {
      ws.addRow([]);
      const totalRow = ws.addRow([
        '', '', '', '', '', '', '', 'TỔNG CỘNG:', '', grandTotal, '', ''
      ]);
      totalRow.height = 26;
      const totalLabelCell = totalRow.getCell(8);
      totalLabelCell.font = { name: 'Calibri', size: 12, bold: true };
      totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
      const totalValCell = totalRow.getCell(10);
      totalValCell.numFmt = '#,##0 "₫"';
      totalValCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFD81B60' } };
      totalValCell.alignment = { horizontal: 'right', vertical: 'middle' };
      totalValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };

      // --- Khu vực thống kê trạng thái ---
      ws.addRow([]);
      const statHeader = ws.addRow(['THỐNG KÊ THEO TRẠNG THÁI']);
      ws.mergeCells(`A${statHeader.number}:L${statHeader.number}`);
      const sh = ws.getCell(`A${statHeader.number}`);
      sh.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      sh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF424242' } };
      sh.alignment = { horizontal: 'center', vertical: 'middle' };
      statHeader.height = 22;

      const labelHead = ws.addRow(['Trạng thái', 'Số đơn', '', '', '', '', '', '', '', '', '', '']);
      labelHead.getCell(1).font = { bold: true };
      labelHead.getCell(2).font = { bold: true };
      labelHead.getCell(1).alignment = { horizontal: 'center' };
      labelHead.getCell(2).alignment = { horizontal: 'center' };

      Object.entries(STATUS_LABEL).forEach(([key, label]) => {
        const r = ws.addRow([label, statusCount[key] || 0]);
        r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_COLOR[key] } };
        r.getCell(1).font = { bold: true, color: { argb: STATUS_FONT[key] } };
        r.getCell(1).alignment = { horizontal: 'center' };
        r.getCell(2).alignment = { horizontal: 'center' };
      });
    } else {
      ws.addRow([]);
      const empty = ws.addRow(['Không có đơn hàng nào trong khoảng thời gian được chọn']);
      ws.mergeCells(`A${empty.number}:L${empty.number}`);
      empty.getCell(1).alignment = { horizontal: 'center' };
      empty.getCell(1).font = { italic: true, color: { argb: 'FF999999' } };
    }

    // ============ SHEET 2: Chi tiết sản phẩm ============
    const ws2 = wb.addWorksheet('Chi tiết sản phẩm', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });
    ws2.columns = [
      { key: 'idx',     width: 6 },
      { key: 'code',    width: 12 },
      { key: 'date',    width: 18 },
      { key: 'customer',width: 22 },
      { key: 'product', width: 36 },
      { key: 'variant', width: 20 },
      { key: 'qty',     width: 8 },
      { key: 'price',   width: 16 },
      { key: 'subtotal',width: 16 },
    ];

    ws2.mergeCells('A1:I1');
    const title2 = ws2.getCell('A1');
    title2.value = 'CHI TIẾT SẢN PHẨM TRONG ĐƠN HÀNG';
    title2.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    title2.alignment = { horizontal: 'center', vertical: 'middle' };
    title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE91E63' } };
    ws2.getRow(1).height = 28;

    ws2.addRow([]);
    const head2 = ws2.addRow(['STT', 'Mã đơn', 'Ngày đặt', 'Khách hàng', 'Sản phẩm', 'Phân loại', 'SL', 'Đơn giá', 'Thành tiền']);
    head2.height = 22;
    head2.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF424242' } };
    });

    let idx2 = 0;
    for (const o of orders) {
      const items = itemsByOrder[o.id] || [];
      for (const it of items) {
        idx2++;
        const subtotal = Number(it.unit_price || 0) * Number(it.quantity || 0);
        const variant = [it.color_name, it.storage_label].filter(Boolean).join(' - ');
        const r = ws2.addRow({
          idx: idx2,
          code: '#' + String(o.id).padStart(6, '0'),
          date: fmtDate(o.created_at),
          customer: o.user_name || '',
          product: it.product_name || '',
          variant: variant || '-',
          qty: Number(it.quantity || 0),
          price: Number(it.unit_price || 0),
          subtotal,
        });
        r.eachCell({ includeEmpty: true }, (cell) => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { vertical: 'middle', wrapText: true };
          cell.border = {
            top:    { style: 'hair', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
            left:   { style: 'hair', color: { argb: 'FFE0E0E0' } },
            right:  { style: 'hair', color: { argb: 'FFE0E0E0' } },
          };
        });
        r.getCell('idx').alignment = { horizontal: 'center', vertical: 'middle' };
        r.getCell('code').alignment = { horizontal: 'center', vertical: 'middle' };
        r.getCell('code').font = { bold: true, color: { argb: 'FF1976D2' } };
        r.getCell('date').alignment = { horizontal: 'center', vertical: 'middle' };
        r.getCell('qty').alignment = { horizontal: 'center', vertical: 'middle' };
        r.getCell('price').numFmt = '#,##0 "₫"';
        r.getCell('price').alignment = { horizontal: 'right', vertical: 'middle' };
        r.getCell('subtotal').numFmt = '#,##0 "₫"';
        r.getCell('subtotal').alignment = { horizontal: 'right', vertical: 'middle' };
        r.getCell('subtotal').font = { bold: true, color: { argb: 'FFD81B60' } };
      }
    }

    // ===== Trả file về client =====
    const fname = `bao-cao-don-hang_${from || 'all'}_den_${to || 'all'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export orders error:', err);
    res.status(500).json({ success: false, message: 'Lỗi xuất Excel', error: err.message });
  }
};

// GET /api/orders/admin/:id
const adminGetOrderById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...rows[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/orders/my/:id/simulate-payment — mô phỏng webhook (chỉ khi DEMO_SIMULATE_PREPAID_PAYMENT=1)
const simulateMyPayment = async (req, res) => {
  const demoOn = ['1', 'true'].includes(String(process.env.DEMO_SIMULATE_PREPAID_PAYMENT || '').toLowerCase());
  if (!demoOn) {
    return res.status(403).json({ success: false, message: 'Chế độ mô phỏng thanh toán chưa được bật' });
  }

  try {
    const orderId = parseInt(req.params.id, 10);
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }
    const order = rows[0];
    if (order.payment_method === 'cod') {
      return res.status(400).json({ success: false, message: 'Đơn COD không cần mô phỏng thanh toán' });
    }
    if (order.payment_status === 'paid') {
      return res.json({ success: true, message: 'Đơn đã được thanh toán', data: { payment_status: 'paid' } });
    }
    if (order.payment_status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Trạng thái thanh toán không hợp lệ' });
    }

    const orderCode = `DH${String(orderId).padStart(6, '0')}`;
    const ref = `DEMO-${Date.now()}`;
    await db.query(
      `UPDATE orders SET
        bank_in_amount = ?,
        bank_in_content = ?,
        bank_in_reference = ?,
        bank_in_at = NOW(),
        bank_in_account = 'DEMO-WEBHOOK',
        bank_in_raw = ?,
        payment_status = 'paid',
        payment_confirmed_at = NOW(),
        status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
       WHERE id = ? AND payment_status = 'pending'`,
      [
        order.total_price,
        orderCode,
        ref,
        JSON.stringify({ demo: true, simulated_at: new Date().toISOString(), order_code: orderCode }),
        orderId,
      ]
    );

    res.json({
      success: true,
      message: 'Mô phỏng webhook thành công — thanh toán đã được xác nhận',
      data: { payment_status: 'paid', order_id: orderId },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/orders/admin/:id/confirm-payment — xác nhận đã nhận tiền (sau khi có thông báo CK hoặc kiểm tra tay)
const adminConfirmPayment = async (req, res) => {
  try {
    const orderId = req.params.id;
    const advanceOrderStatus = req.body.advance_order_status !== false;

    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }
    const o = rows[0];
    if (o.payment_method === 'cod') {
      return res.status(400).json({ success: false, message: 'Đơn COD không cần xác nhận chuyển khoản' });
    }
    if (o.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Đơn đã được đánh dấu đã thanh toán' });
    }
    if (o.payment_status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Trạng thái thanh toán không hợp lệ (chỉ có thể xác nhận khi đang chờ thanh toán)' });
    }

    let setStatus = '';
    if (advanceOrderStatus && o.status === 'pending') {
      setStatus = ", status = 'confirmed'";
    }

    await db.query(
      `UPDATE orders SET payment_status = 'paid', payment_confirmed_at = NOW()${setStatus} WHERE id = ?`,
      [orderId]
    );

    res.json({ success: true, message: 'Đã xác nhận thanh toán' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/admin/orders/:id/status
const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipping', 'done', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [[revenue]] = await db.query(
      `SELECT COALESCE(SUM(total_price),0) AS total FROM orders WHERE status = 'done' AND MONTH(created_at) = MONTH(NOW())`
    );
    const [[orders]] = await db.query(
      `SELECT COUNT(*) AS total FROM orders WHERE MONTH(created_at) = MONTH(NOW())`
    );
    const [[users]] = await db.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'user'`);
    const [[products]] = await db.query(`SELECT COUNT(*) AS total FROM products WHERE is_active = 1`);

    const [revenueChart] = await db.query(
      `SELECT MONTH(created_at) AS month, COALESCE(SUM(total_price),0) AS revenue
       FROM orders WHERE status = 'done' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY MONTH(created_at) ORDER BY month ASC`
    );

    const [recentOrders] = await db.query(
      `SELECT o.id, o.total_price, o.status, o.created_at, u.name AS user_name
       FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        stats: { revenue: revenue.total, orders: orders.total, users: users.total, products: products.total },
        revenueChart,
        recentOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
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
};
