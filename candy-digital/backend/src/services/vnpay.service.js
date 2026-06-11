const crypto = require('crypto');

// =============================================================================
// VNPay Sandbox helper — tạo URL thanh toán + xác thực chữ ký HMAC-SHA512.
// Tài liệu: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
// Toàn bộ tiền gửi sang VNPay theo đơn vị "đồng × 100" và ký theo chuẩn 2.1.0.
// =============================================================================

const VNP_VERSION = '2.1.0';

// URL public của chính backend. Trên Render biến RENDER_EXTERNAL_URL được inject sẵn
// (vd: https://candy-digital-api.onrender.com) nên không cần hard-code host khi deploy.
function getPublicBaseUrl() {
  const base =
    process.env.PUBLIC_API_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || 5000}`;
  return base.replace(/\/+$/, '');
}

// Bật cổng giả lập (demo/đồ án — không cần tài khoản VNPay thật): đặt VNP_MOCK=1.
function mockEnabled() {
  return /^(1|true)$/i.test(process.env.VNP_MOCK || '');
}

function getConfig() {
  const base = getPublicBaseUrl();
  return {
    tmnCode: process.env.VNP_TMN_CODE || '',
    hashSecret: process.env.VNP_HASH_SECRET || '',
    payUrl:
      process.env.VNP_URL ||
      (mockEnabled()
        ? `${base}/api/orders/vnpay/mock-gateway`
        : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
    returnUrl: process.env.VNP_RETURN_URL || `${base}/api/orders/vnpay/return`,
  };
}

function isConfigured() {
  const { tmnCode, hashSecret } = getConfig();
  return Boolean(tmnCode && hashSecret);
}

// Chế độ giả lập: khi VNP_URL trỏ về chính server (endpoint mock-gateway) thay vì sandbox VNPay thật.
function isMockMode() {
  return /\/vnpay\/mock-gateway/.test(getConfig().payUrl);
}

// VNPay yêu cầu: encode key + value, thay %20 bằng "+", rồi sắp xếp key tăng dần.
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
    .map((k) => encodeURIComponent(k))
    .sort();
  for (const encodedKey of keys) {
    const originalKey = decodeURIComponent(encodedKey);
    sorted[encodedKey] = encodeURIComponent(String(obj[originalKey])).replace(/%20/g, '+');
  }
  return sorted;
}

// Nối thành chuỗi key=value&... (value đã được encode sẵn trong sortObject).
function buildQuery(sortedParams) {
  return Object.keys(sortedParams)
    .map((k) => `${k}=${sortedParams[k]}`)
    .join('&');
}

function signData(signString, hashSecret) {
  return crypto
    .createHmac('sha512', hashSecret)
    .update(Buffer.from(signString, 'utf-8'))
    .digest('hex');
}

// Ký 1 tập tham số và ghép thành URL hoàn chỉnh có vnp_SecureHash.
function buildSignedUrl(baseUrl, params) {
  const cfg = getConfig();
  const sorted = sortObject(params);
  const signString = buildQuery(sorted);
  const secureHash = signData(signString, cfg.hashSecret);
  return `${baseUrl}?${signString}&vnp_SecureHash=${secureHash}`;
}

// yyyyMMddHHmmss theo giờ Việt Nam (GMT+7).
function formatVnpDate(date) {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return (
    vn.getUTCFullYear().toString() +
    p(vn.getUTCMonth() + 1) +
    p(vn.getUTCDate()) +
    p(vn.getUTCHours()) +
    p(vn.getUTCMinutes()) +
    p(vn.getUTCSeconds())
  );
}

/**
 * Tạo URL chuyển hướng sang cổng VNPay.
 * @param {object} opts
 * @param {string} opts.txnRef  Mã giao dịch của shop (dùng mã đơn DHxxxxxx)
 * @param {number} opts.amount  Số tiền (VND, chưa nhân 100)
 * @param {string} opts.orderInfo Mô tả đơn hàng
 * @param {string} opts.ipAddr  IP khách hàng
 * @param {string} [opts.bankCode] Mã ngân hàng (để trống → VNPay hiển thị danh sách)
 * @param {string} [opts.locale] 'vn' | 'en'
 */
function createPaymentUrl(opts) {
  const cfg = getConfig();
  const now = new Date();

  const params = {
    vnp_Version: VNP_VERSION,
    vnp_Command: 'pay',
    vnp_TmnCode: cfg.tmnCode,
    vnp_Locale: opts.locale || 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: opts.txnRef,
    vnp_OrderInfo: opts.orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(Number(opts.amount) * 100),
    vnp_ReturnUrl: cfg.returnUrl,
    vnp_IpAddr: opts.ipAddr || '127.0.0.1',
    vnp_CreateDate: formatVnpDate(now),
    vnp_ExpireDate: formatVnpDate(new Date(now.getTime() + 15 * 60 * 1000)),
  };

  if (opts.bankCode) params.vnp_BankCode = opts.bankCode;

  return buildSignedUrl(cfg.payUrl, params);
}

/**
 * (Chế độ giả lập) Tạo URL trả về VNP_RETURN_URL đã ký hợp lệ,
 * mô phỏng kết quả VNPay redirect trình duyệt sau khi khách thanh toán.
 * @param {object} incoming  Query nhận ở trang mock-gateway (đã có vnp_Amount, vnp_TxnRef...)
 * @param {boolean} success  true = thanh toán thành công, false = huỷ
 */
function buildMockReturnUrl(incoming, success) {
  const cfg = getConfig();
  const params = {
    vnp_Amount: incoming.vnp_Amount,
    vnp_BankCode: 'NCB',
    vnp_BankTranNo: `VNP${Date.now()}`,
    vnp_CardType: 'ATM',
    vnp_OrderInfo: incoming.vnp_OrderInfo,
    vnp_PayDate: formatVnpDate(new Date()),
    vnp_ResponseCode: success ? '00' : '24',
    vnp_TmnCode: incoming.vnp_TmnCode || cfg.tmnCode,
    vnp_TransactionNo: String(Math.floor(Math.random() * 90000000) + 10000000),
    vnp_TransactionStatus: success ? '00' : '02',
    vnp_TxnRef: incoming.vnp_TxnRef,
  };
  return buildSignedUrl(cfg.returnUrl, params);
}

/**
 * Xác thực chữ ký trên dữ liệu VNPay trả về (return URL hoặc IPN).
 * @param {object} query Toàn bộ query params do VNPay gửi (đã decode bởi Express).
 * @returns {{ valid: boolean }}
 */
function verifyReturn(query) {
  const cfg = getConfig();
  const received = { ...query };
  const secureHash = received.vnp_SecureHash;
  delete received.vnp_SecureHash;
  delete received.vnp_SecureHashType;

  const sorted = sortObject(received);
  const signString = buildQuery(sorted);
  const computed = signData(signString, cfg.hashSecret);

  return { valid: Boolean(secureHash) && computed.toLowerCase() === String(secureHash).toLowerCase() };
}

module.exports = {
  isConfigured,
  isMockMode,
  createPaymentUrl,
  buildMockReturnUrl,
  verifyReturn,
  formatVnpDate,
};
