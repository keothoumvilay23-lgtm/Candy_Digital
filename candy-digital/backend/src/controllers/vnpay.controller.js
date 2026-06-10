const db = require('../config/db');
const vnpay = require('../services/vnpay.service');

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim();

function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    '127.0.0.1'
  );
}

// VNPay yêu cầu TxnRef duy nhất mỗi lần thanh toán → gắn timestamp, vẫn parse được orderId.
function buildTxnRef(orderId) {
  return `${orderId}${Date.now().toString().slice(-6)}`;
}
function parseOrderIdFromTxnRef(txnRef) {
  const s = String(txnRef || '');
  const id = parseInt(s.slice(0, s.length - 6), 10);
  return Number.isFinite(id) ? id : parseInt(s, 10);
}

// Xác nhận thanh toán cho 1 đơn VNPay (dùng chung cho IPN và return).
async function confirmVnpayOrder(orderId, vnpAmount, transactionNo) {
  const [rows] = await db.query(
    'SELECT id, total_price, payment_method, payment_status, status FROM orders WHERE id = ?',
    [orderId]
  );
  if (!rows.length) return { code: '01', message: 'Order not found' };
  const order = rows[0];

  if (order.payment_method !== 'vnpay') return { code: '02', message: 'Order is not a VNPay order' };

  const expected = Math.round(Number(order.total_price) * 100);
  if (Number.isFinite(vnpAmount) && vnpAmount !== expected) {
    return { code: '04', message: 'Invalid amount' };
  }

  if (order.payment_status === 'paid') return { code: '02', message: 'Order already confirmed' };
  if (order.payment_status !== 'pending') return { code: '02', message: 'Order not in pending state' };

  await db.query(
    `UPDATE orders SET
      payment_status = 'paid',
      payment_confirmed_at = NOW(),
      bank_in_amount = ?,
      bank_in_reference = ?,
      bank_in_at = NOW(),
      bank_in_account = 'VNPAY',
      bank_in_raw = ?,
      status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
     WHERE id = ? AND payment_status = 'pending'`,
    [
      Number.isFinite(vnpAmount) ? vnpAmount / 100 : order.total_price,
      transactionNo ? String(transactionNo).slice(0, 150) : null,
      JSON.stringify({ gateway: 'vnpay', transaction_no: transactionNo, confirmed_at: new Date().toISOString() }),
      orderId,
    ]
  );
  return { code: '00', message: 'Confirm Success' };
}

// POST /api/orders/my/:id/vnpay/create-payment-url  (auth)
const createVnpayPaymentUrl = async (req, res) => {
  try {
    if (!vnpay.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Cổng VNPay chưa được cấu hình (thiếu VNP_TMN_CODE / VNP_HASH_SECRET trong .env)',
      });
    }

    const orderId = parseInt(req.params.id, 10);
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }
    const order = rows[0];

    if (order.payment_method !== 'vnpay') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không thanh toán qua VNPay' });
    }
    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Đơn đã được thanh toán' });
    }

    const orderCode = `DH${String(orderId).padStart(6, '0')}`;
    const paymentUrl = vnpay.createPaymentUrl({
      txnRef: buildTxnRef(orderId),
      amount: Number(order.total_price),
      orderInfo: `Thanh toan don hang ${orderCode}`,
      ipAddr: getClientIp(req),
      bankCode: req.body?.bankCode || undefined,
      locale: 'vn',
    });

    res.json({ success: true, data: { paymentUrl } });
  } catch (err) {
    console.error('VNPay create payment url error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/orders/vnpay/ipn  — VNPay gọi server-to-server (nguồn xác nhận chuẩn nhất).
const vnpayIpn = async (req, res) => {
  try {
    const query = req.query || {};
    const { valid } = vnpay.verifyReturn(query);
    if (!valid) {
      return res.json({ RspCode: '97', Message: 'Invalid Checksum' });
    }

    const orderId = parseOrderIdFromTxnRef(query.vnp_TxnRef);
    const vnpAmount = parseInt(query.vnp_Amount, 10);
    const responseCode = query.vnp_ResponseCode;
    const transactionStatus = query.vnp_TransactionStatus;

    if (responseCode !== '00' || transactionStatus !== '00') {
      // Giao dịch thất bại/huỷ — đơn vẫn ở pending, không cần làm gì.
      return res.json({ RspCode: '00', Message: 'Confirm Success' });
    }

    const result = await confirmVnpayOrder(orderId, vnpAmount, query.vnp_TransactionNo);
    return res.json({ RspCode: result.code, Message: result.message });
  } catch (err) {
    console.error('VNPay IPN error:', err);
    return res.json({ RspCode: '99', Message: 'Unknown error' });
  }
};

// GET /api/orders/vnpay/return — VNPay redirect trình duyệt khách về đây sau khi thanh toán.
// Xác thực chữ ký rồi chuyển hướng về trang kết quả của frontend.
const vnpayReturn = async (req, res) => {
  const redirect = (params) => {
    const qs = new URLSearchParams(params).toString();
    res.redirect(`${CLIENT_URL}/checkout/vnpay-return?${qs}`);
  };

  try {
    const query = req.query || {};
    const { valid } = vnpay.verifyReturn(query);
    const orderId = parseOrderIdFromTxnRef(query.vnp_TxnRef);

    if (!valid) {
      return redirect({ orderId: orderId || '', status: 'invalid' });
    }

    const responseCode = query.vnp_ResponseCode;
    const transactionStatus = query.vnp_TransactionStatus;

    if (responseCode === '00' && transactionStatus === '00') {
      // Trên localhost VNPay không gọi được IPN → xác nhận luôn tại return (chữ ký đã hợp lệ).
      await confirmVnpayOrder(orderId, parseInt(query.vnp_Amount, 10), query.vnp_TransactionNo);
      return redirect({ orderId: orderId || '', status: 'success' });
    }

    return redirect({ orderId: orderId || '', status: 'failed', code: responseCode || '' });
  } catch (err) {
    console.error('VNPay return error:', err);
    return res.redirect(`${CLIENT_URL}/checkout/vnpay-return?status=error`);
  }
};

// GET /api/orders/vnpay/mock-gateway — TRANG THANH TOÁN GIẢ LẬP (chỉ bật khi VNP_URL trỏ về đây).
// Mô phỏng giao diện cổng VNPay: hiển thị số tiền + thẻ test, cho phép bấm "Thanh toán" / "Huỷ".
// Khi bấm, redirect về VNP_RETURN_URL với chữ ký HMAC-SHA512 hợp lệ → luồng verify thật chạy y như VNPay.
const vnpayMockGateway = (req, res) => {
  if (!vnpay.isMockMode()) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  const q = req.query || {};
  const amount = (Number(q.vnp_Amount || 0) / 100).toLocaleString('vi-VN');
  const orderInfo = String(q.vnp_OrderInfo || '').replace(/\+/g, ' ');
  const successUrl = vnpay.buildMockReturnUrl(q, true);
  const cancelUrl = vnpay.buildMockReturnUrl(q, false);
  const esc = (s) => String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');

  res.set('Content-Type', 'text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cổng thanh toán VNPAY — Candy Digital</title>
<style>
  *{box-sizing:border-box;font-family:'Segoe UI',Roboto,Arial,sans-serif}
  body{margin:0;background:#eef1f6;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
  .card{background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.12);width:100%;max-width:440px;overflow:hidden}
  .head{background:linear-gradient(135deg,#005baa,#0080d6);color:#fff;padding:16px 22px;display:flex;align-items:center;gap:10px}
  .head .logo{font-weight:800;font-size:20px;letter-spacing:.5px}
  .badge{margin-left:auto;font-size:11px;background:rgba(255,255,255,.2);padding:3px 8px;border-radius:999px}
  .bar{display:flex;justify-content:space-between;align-items:center;background:#f1f5fb;padding:10px 22px;font-size:13px;color:#555;border-bottom:1px solid #e6ebf2}
  .bar .amt{font-weight:800;color:#d81b60;font-size:16px}
  .timer{font-size:12px;color:#888}
  .timer b{color:#d97706}
  .body{padding:20px 22px 24px}
  .steps{display:flex;gap:6px;margin-bottom:18px}
  .steps .dot{flex:1;height:4px;border-radius:99px;background:#e3e8ef}
  .steps .dot.on{background:#0080d6}
  .h{font-size:15px;font-weight:700;color:#1f2937;margin:0 0 4px}
  .desc{font-size:12px;color:#8a94a6;margin:0 0 16px}
  .banks{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:230px;overflow:auto}
  .bank{border:1px solid #e3e8ef;border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer;transition:.15s;background:#fff}
  .bank:hover{border-color:#0080d6;background:#f0f8ff}
  .bank .ic{width:34px;height:34px;border-radius:8px;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px}
  .bank .nm{font-size:11px;color:#444;font-weight:600;line-height:1.2}
  .field{margin-bottom:14px}
  .field label{display:block;font-size:12px;color:#555;margin-bottom:5px;font-weight:600}
  .field input{width:100%;padding:11px 12px;border:1px solid #d8dee8;border-radius:9px;font-size:14px;outline:none;letter-spacing:.5px}
  .field input:focus{border-color:#0080d6}
  .twocol{display:flex;gap:10px}
  .twocol .field{flex:1}
  .selbank{display:flex;align-items:center;gap:10px;background:#f6f9fd;border:1px solid #e3e8ef;border-radius:10px;padding:10px 12px;margin-bottom:16px}
  .selbank .ic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px}
  .selbank .nm{font-size:13px;font-weight:700;color:#1f2937}
  .otpbox{text-align:center}
  .otpbox .phone{font-size:13px;color:#555;margin-bottom:14px}
  .otpbox .phone b{color:#111}
  .otp-input{letter-spacing:10px;text-align:center;font-size:22px;font-weight:700}
  .hint{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:9px;padding:9px 11px;font-size:12px;margin-bottom:14px;text-align:center}
  .err{color:#dc2626;font-size:12px;margin-top:6px;display:none}
  .btn{display:block;width:100%;text-align:center;padding:13px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;margin-top:6px;border:none;cursor:pointer}
  .pay{background:#0a8a3a;color:#fff}
  .pay:disabled{background:#9bd3ad;cursor:not-allowed}
  .ghost{background:#fff;color:#005baa;border:1px solid #cfe0f2;margin-top:10px}
  .cancel{background:transparent;color:#c0392b;border:none;font-size:13px;margin-top:12px}
  .note{margin-top:16px;font-size:11px;color:#aaa;text-align:center}
  .hidden{display:none}
</style></head>
<body>
  <div class="card">
    <div class="head"><span class="logo">VNPAY</span><span class="badge">Thanh toán an toàn</span></div>
    <div class="bar">
      <span>Số tiền thanh toán</span>
      <span class="amt">${amount} ₫</span>
    </div>
    <div class="bar" style="border-bottom:1px solid #e6ebf2">
      <span>Candy Digital · ${esc(q.vnp_TxnRef || '')}</span>
      <span class="timer">Thời gian: <b id="clock">15:00</b></span>
    </div>
    <div class="body">
      <div class="steps">
        <div class="dot on" id="d1"></div><div class="dot" id="d2"></div><div class="dot" id="d3"></div>
      </div>

      <!-- BƯỚC 1: chọn ngân hàng -->
      <div id="step1">
        <p class="h">Chọn ngân hàng thanh toán</p>
        <p class="desc">Quý khách vui lòng chọn ngân hàng phát hành thẻ ATM/nội địa.</p>
        <div class="banks" id="bankGrid"></div>
      </div>

      <!-- BƯỚC 2: nhập thẻ -->
      <div id="step2" class="hidden">
        <p class="h">Nhập thông tin thẻ</p>
        <p class="desc">Thông tin thẻ ATM nội địa của quý khách.</p>
        <div class="selbank"><div class="ic" id="selIc"></div><div class="nm" id="selNm"></div></div>
        <div class="hint">Dùng thẻ thử nghiệm: <b>9704 1985 2619 1432 198</b> · NGUYEN VAN A · 07/15</div>
        <div class="field">
          <label>Số thẻ</label>
          <input id="cardNo" inputmode="numeric" maxlength="23" placeholder="9704 xxxx xxxx xxxx xxx" value="9704 1985 2619 1432 198">
        </div>
        <div class="field">
          <label>Tên chủ thẻ</label>
          <input id="cardName" placeholder="NGUYEN VAN A" value="NGUYEN VAN A" style="text-transform:uppercase">
        </div>
        <div class="twocol">
          <div class="field"><label>Ngày phát hành</label><input id="cardDate" maxlength="5" placeholder="MM/YY" value="07/15"></div>
        </div>
        <div class="err" id="err2">Vui lòng nhập đầy đủ thông tin thẻ.</div>
        <button class="btn pay" id="toOtp">Tiếp tục</button>
        <button class="btn ghost" id="back1">Quay lại</button>
      </div>

      <!-- BƯỚC 3: OTP -->
      <div id="step3" class="hidden">
        <p class="h">Xác thực OTP</p>
        <p class="desc otpbox">
          <span class="phone">Mã OTP đã gửi tới số điện thoại <b>097****198</b></span>
        </p>
        <div class="hint">Mã OTP thử nghiệm: <b>123456</b></div>
        <div class="field">
          <input id="otp" class="otp-input" inputmode="numeric" maxlength="6" placeholder="------">
          <div class="err" id="err3">Mã OTP không đúng. Vui lòng thử lại.</div>
        </div>
        <button class="btn pay" id="confirm">Thanh toán</button>
        <button class="btn ghost" id="back2">Quay lại</button>
      </div>

      <button class="btn cancel" id="cancelBtn">Huỷ giao dịch</button>
      <div class="note">Giao dịch được mã hoá và bảo mật bởi VNPAY.</div>
    </div>
  </div>

<script>
(function(){
  var SUCCESS_URL = "${successUrl}";
  var CANCEL_URL = "${cancelUrl}";
  var BANKS = [
    {code:"NCB", name:"NCB", color:"#1f6fb2"},
    {code:"VCB", name:"Vietcombank", color:"#0a7d3e"},
    {code:"TCB", name:"Techcombank", color:"#e3001b"},
    {code:"MB", name:"MB Bank", color:"#1f3a93"},
    {code:"BIDV", name:"BIDV", color:"#0f6e3d"},
    {code:"VTB", name:"Vietinbank", color:"#1466a5"},
    {code:"AGR", name:"Agribank", color:"#a01b2e"},
    {code:"ACB", name:"ACB", color:"#0a4ea2"},
    {code:"VPB", name:"VPBank", color:"#00a35e"},
    {code:"TPB", name:"TPBank", color:"#5b2d8e"},
    {code:"SAC", name:"Sacombank", color:"#0072bc"},
    {code:"VIB", name:"VIB", color:"#0a3d91"}
  ];
  var $ = function(id){ return document.getElementById(id); };
  var selected = null;

  // render bank grid
  var grid = $("bankGrid");
  BANKS.forEach(function(b){
    var el = document.createElement("div");
    el.className = "bank";
    el.innerHTML = '<div class="ic" style="background:'+b.color+'">'+b.code.slice(0,3)+'</div><div class="nm">'+b.name+'</div>';
    el.onclick = function(){
      selected = b;
      $("selIc").style.background = b.color;
      $("selIc").textContent = b.code.slice(0,3);
      $("selNm").textContent = b.name;
      go(2);
    };
    grid.appendChild(el);
  });

  function go(n){
    $("step1").classList.toggle("hidden", n!==1);
    $("step2").classList.toggle("hidden", n!==2);
    $("step3").classList.toggle("hidden", n!==3);
    $("d1").classList.toggle("on", n>=1);
    $("d2").classList.toggle("on", n>=2);
    $("d3").classList.toggle("on", n>=3);
  }

  $("back1").onclick = function(){ go(1); };
  $("back2").onclick = function(){ go(2); };

  $("toOtp").onclick = function(){
    var no = $("cardNo").value.replace(/\\s/g,"");
    var nm = $("cardName").value.trim();
    var dt = $("cardDate").value.trim();
    if(no.length < 12 || !nm || dt.length < 4){ $("err2").style.display="block"; return; }
    $("err2").style.display="none";
    go(3);
    $("otp").focus();
  };

  $("confirm").onclick = function(){
    var otp = $("otp").value.trim();
    if(otp !== "123456"){ $("err3").style.display="block"; return; }
    $("err3").style.display="none";
    this.disabled = true; this.textContent = "Đang xử lý...";
    setTimeout(function(){ window.location.href = SUCCESS_URL; }, 700);
  };

  $("cancelBtn").onclick = function(){ window.location.href = CANCEL_URL; };

  // đồng hồ đếm ngược 15:00
  var left = 15*60;
  var t = setInterval(function(){
    left--;
    if(left<=0){ clearInterval(t); window.location.href = CANCEL_URL; return; }
    var m = Math.floor(left/60), s = left%60;
    $("clock").textContent = (m<10?"0":"")+m+":"+(s<10?"0":"")+s;
  }, 1000);
})();
</script>
</body></html>`);
};

module.exports = {
  createVnpayPaymentUrl,
  vnpayIpn,
  vnpayReturn,
  vnpayMockGateway,
};
