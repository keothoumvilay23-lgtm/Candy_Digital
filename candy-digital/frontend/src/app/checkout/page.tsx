'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, MapPin, CreditCard, Banknote, Truck, Wallet,
  Copy, Loader2, Clock, AlertCircle,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/format';
import {
  formatOrderCode,
  resolveQrImageUrl,
  PAYMENT_METHOD_LABELS,
  type PaymentSetting,
} from '@/lib/payment';

// code = mã ngân hàng theo VietQR để lấy logo thật từ CDN cdn.vietqr.io
const VIETNAM_BANKS: { name: string; code: string }[] = [
  { name: 'Vietcombank', code: 'VCB' },
  { name: 'Techcombank', code: 'TCB' },
  { name: 'MB Bank', code: 'MB' },
  { name: 'BIDV', code: 'BIDV' },
  { name: 'Vietinbank', code: 'ICB' },
  { name: 'Agribank', code: 'VBA' },
  { name: 'ACB', code: 'ACB' },
  { name: 'VPBank', code: 'VPB' },
  { name: 'Sacombank', code: 'STB' },
  { name: 'TPBank', code: 'TPB' },
  { name: 'HDBank', code: 'HDB' },
  { name: 'OCB', code: 'OCB' },
  { name: 'MSB', code: 'MSB' },
  { name: 'SHB', code: 'SHB' },
  { name: 'Eximbank', code: 'EIB' },
  { name: 'VIB', code: 'VIB' },
  { name: 'SCB', code: 'SCB' },
  { name: 'Nam A Bank', code: 'NAB' },
  { name: 'Bac A Bank', code: 'BAB' },
  { name: 'PVcomBank', code: 'PVCB' },
];

const bankLogoUrl = (code: string) => `https://cdn.vietqr.io/img/${code}.png`;

const DEFAULT_METHODS: { method: string; label: string; desc: string; icon: typeof Truck }[] = [
  { method: 'cod', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi shipper giao hàng tới', icon: Truck },
  { method: 'vnpay', label: 'VNPay (ATM / QR / Thẻ quốc tế)', desc: 'Thanh toán qua cổng VNPay — tự động xác nhận ngay', icon: CreditCard },
  { method: 'bank_transfer', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản qua app ngân hàng — xác nhận qua webhook', icon: Banknote },
  { method: 'momo', label: 'Ví MoMo', desc: 'Quét QR MoMo shop — xác nhận qua webhook', icon: Wallet },
  { method: 'zalopay', label: 'ZaloPay', desc: 'Quét QR ZaloPay shop — xác nhận qua webhook', icon: Wallet },
];

interface DoneOrder {
  order_id: number;
  total_price: number;
  payment_method: string;
  payment_status: string;
  order_code: string;
}

const DEMO_PAYMENT = process.env.NEXT_PUBLIC_DEMO_SIMULATE_PAYMENT === '1';
const IMG_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

function copyText(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`Đã sao chép ${label}`),
    () => toast.error('Không sao chép được'),
  );
}

function OrderPaymentSuccess({ order: initialOrder }: { order: DoneOrder }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [paymentSetting, setPaymentSetting] = useState<PaymentSetting | undefined>();
  const [simulating, setSimulating] = useState(false);

  const isPrepaid = ['bank_transfer', 'momo', 'zalopay'].includes(order.payment_method);
  const isVnpay = order.payment_method === 'vnpay';
  const isPaid = order.payment_status === 'paid';
  const orderCode = order.order_code || formatOrderCode(order.order_id);
  const [vnpayLoading, setVnpayLoading] = useState(false);
  const [vnpayError, setVnpayError] = useState('');

  const goToVnpay = useCallback(async () => {
    setVnpayLoading(true);
    setVnpayError('');
    try {
      const { data } = await api.post(`/orders/my/${order.order_id}/vnpay/create-payment-url`);
      window.location.href = data.data.paymentUrl;
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setVnpayError(ax.response?.data?.message || 'Không tạo được liên kết thanh toán VNPay');
      setVnpayLoading(false);
    }
  }, [order.order_id]);

  useEffect(() => {
    if (isVnpay && !isPaid) goToVnpay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/my/${order.order_id}`);
      const o = data.data;
      setOrder(prev => ({
        ...prev,
        payment_status: o.payment_status,
      }));
    } catch { /* ignore polling errors */ }
  }, [order.order_id]);

  useEffect(() => {
    if (!isPrepaid) return;
    api.get('/payment-settings')
      .then(({ data }) => {
        const setting = (data.data as PaymentSetting[]).find(s => s.method === order.payment_method);
        setPaymentSetting(setting);
      })
      .catch(() => {});
  }, [isPrepaid, order.payment_method]);

  useEffect(() => {
    if (!isPrepaid || isPaid) return;
    const timer = setInterval(refreshOrder, 4000);
    return () => clearInterval(timer);
  }, [isPrepaid, isPaid, refreshOrder]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await api.post(`/orders/my/${order.order_id}/simulate-payment`);
      toast.success('Mô phỏng webhook thành công!');
      await refreshOrder();
      setOrder(prev => ({ ...prev, payment_status: 'paid' }));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Mô phỏng thất bại');
    } finally {
      setSimulating(false);
    }
  };

  const qrUrl = resolveQrImageUrl(paymentSetting, IMG_BASE, orderCode, order.total_price);

  if (isVnpay && !isPaid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <CreditCard size={56} className="text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Chuyển đến cổng thanh toán VNPay</h2>
        <p className="text-gray-500 text-sm mb-1">
          Mã đơn: <span className="font-semibold text-gray-800">{orderCode}</span>
        </p>
        <p className="text-gray-500 text-sm mb-6">Số tiền: <span className="font-semibold text-primary">{formatCurrency(order.total_price)}</span></p>

        {vnpayError ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-left">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p>{vnpayError}</p>
            </div>
            <button type="button" onClick={goToVnpay} disabled={vnpayLoading} className="btn-primary px-6 py-3">
              Thử lại
            </button>
            <button type="button" onClick={() => router.push('/orders')} className="btn-outline px-6 py-3 ml-2">
              Xem đơn hàng
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm text-gray-500">Đang tạo liên kết thanh toán an toàn...</p>
            <button type="button" onClick={goToVnpay} disabled={vnpayLoading}
              className="btn-primary px-6 py-3 mt-2">
              {vnpayLoading ? 'Đang chuyển...' : 'Thanh toán VNPay ngay'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!isPrepaid && !isVnpay) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-3" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-1">Đặt hàng thành công!</h2>
          <p className="text-gray-500 text-sm">
            Mã đơn hàng: <span className="font-semibold text-gray-800">{orderCode}</span>
          </p>
          <p className="text-gray-400 text-sm mt-2">Thanh toán khi nhận hàng (COD)</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={() => router.push('/orders')} className="btn-primary px-6 py-3">Xem đơn hàng</button>
          <button type="button" onClick={() => router.push('/')} className="btn-outline px-6 py-3">Tiếp tục mua sắm</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        {isPaid ? (
          <CheckCircle size={64} className="text-green-500 mx-auto mb-3" />
        ) : (
          <Clock size={64} className="text-amber-500 mx-auto mb-3" />
        )}
        <h2 className="text-2xl font-semibold text-gray-800 mb-1">
          {isPaid ? 'Thanh toán thành công!' : 'Đặt hàng thành công — chờ thanh toán'}
        </h2>
        <p className="text-gray-500 text-sm">
          Mã đơn: <span className="font-semibold text-gray-800">{orderCode}</span>
          {' · '}
          {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
        </p>
      </div>

      {!isPaid && (
        <div className="card p-5 mb-5 space-y-4">
          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p>
              Vui lòng chuyển <strong>đúng số tiền</strong> và ghi <strong>đúng nội dung</strong> bên dưới.
              Hệ thống sẽ <strong>tự xác nhận qua webhook</strong> khi nhận được giao dịch — không cần upload ảnh hay tự khai đã thanh toán.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Số tiền</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-bold text-primary">{formatCurrency(order.total_price)}</span>
                  <button type="button" onClick={() => copyText(String(Math.round(order.total_price)), 'số tiền')}
                    className="text-gray-400 hover:text-primary" title="Sao chép">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Nội dung chuyển khoản</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-semibold text-gray-800">{orderCode}</span>
                  <button type="button" onClick={() => copyText(orderCode, 'nội dung CK')}
                    className="text-gray-400 hover:text-primary" title="Sao chép">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              {paymentSetting?.bank_name && (
                <div>
                  <span className="text-gray-500">Ngân hàng</span>
                  <p className="font-medium text-gray-800">{paymentSetting.bank_name}</p>
                </div>
              )}
              {paymentSetting?.account_number && (
                <div>
                  <span className="text-gray-500">{order.payment_method === 'bank_transfer' ? 'Số tài khoản' : 'Số ví'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-gray-800">{paymentSetting.account_number}</span>
                    <button type="button" onClick={() => copyText(paymentSetting.account_number!, 'số TK')}
                      className="text-gray-400 hover:text-primary"><Copy size={14} /></button>
                  </div>
                </div>
              )}
              {paymentSetting?.account_name && (
                <div>
                  <span className="text-gray-500">Chủ tài khoản</span>
                  <p className="font-medium text-gray-800">{paymentSetting.account_name}</p>
                </div>
              )}
              {paymentSetting?.instruction && (
                <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">{paymentSetting.instruction}</p>
              )}
            </div>

            {qrUrl && (
              <div className="flex flex-col items-center justify-center">
                <img src={qrUrl} alt="QR thanh toán" className="w-44 h-44 object-contain border border-gray-200 rounded-xl p-2 bg-white" />
                <p className="text-xs text-gray-400 mt-2">Quét mã QR để chuyển khoản</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-100 pt-3">
            <Loader2 size={14} className="animate-spin text-primary" />
            Đang chờ xác nhận thanh toán tự động...
          </div>

          {DEMO_PAYMENT && (
            <div className="border border-dashed border-primary-200 bg-primary-50/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Chế độ demo:</strong> bấm nút bên dưới để mô phỏng webhook ngân hàng (không trừ tiền thật).
              </p>
              <button type="button" onClick={handleSimulate} disabled={simulating}
                className="btn-primary text-sm px-4 py-2 w-full sm:w-auto">
                {simulating ? 'Đang mô phỏng...' : 'Mô phỏng webhook thanh toán'}
              </button>
            </div>
          )}
        </div>
      )}

      {isPaid && (
        <div className="card p-4 mb-5 bg-emerald-50 border border-emerald-100 text-center text-sm text-emerald-700">
          Hệ thống đã xác nhận thanh toán. Shop sẽ chuẩn bị và giao hàng sớm nhất.
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button type="button" onClick={() => router.push('/orders')} className="btn-primary px-6 py-3">Xem đơn hàng</button>
        <button type="button" onClick={() => router.push('/')} className="btn-outline px-6 py-3">Tiếp tục mua sắm</button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { user, loadUser } = useAuthStore();
  const { items, total, fetchCart } = useCartStore();
  const router = useRouter();
  const [form, setForm] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    payment_method: 'cod',
    note: '',
    payer_bank_name: '',
    payer_account_number: '',
    payer_account_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [doneOrder, setDoneOrder] = useState<DoneOrder | null>(null);

  useEffect(() => { loadUser(); }, []);
  useEffect(() => {
    if (user) {
      fetchCart();
      setForm(f => ({ ...f, shipping_name: user.name || '' }));
    } else router.push('/auth/login');
  }, [user]);

  const requirePayerInfo = ['bank_transfer', 'momo', 'zalopay'].includes(form.payment_method);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Giỏ hàng trống'); return; }

    if (requirePayerInfo) {
      if (!form.payer_account_number || !form.payer_account_name) {
        toast.error(form.payment_method === 'bank_transfer'
          ? 'Vui lòng nhập số tài khoản và tên chủ tài khoản của bạn'
          : 'Vui lòng nhập số điện thoại ví và tên chủ ví của bạn');
        return;
      }
      if (form.payment_method === 'bank_transfer' && !form.payer_bank_name) {
        toast.error('Vui lòng chọn ngân hàng của bạn');
        return;
      }
    }

    setLoading(true);
    try {
      const { data } = await api.post('/orders', form);
      setDoneOrder(data.data);
      await fetchCart();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || 'Đặt hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (doneOrder) {
    return (
      <UserLayout>
        <OrderPaymentSuccess order={doneOrder} />
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Đặt hàng</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="card p-5">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <MapPin size={18} className="text-primary" /> Địa chỉ giao hàng
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Họ tên người nhận *</label>
                    <input required value={form.shipping_name} onChange={e => setForm({ ...form, shipping_name: e.target.value })}
                      className="input-field" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Số điện thoại *</label>
                    <input required value={form.shipping_phone} onChange={e => setForm({ ...form, shipping_phone: e.target.value })}
                      className="input-field" placeholder="0901 234 567" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1.5">Địa chỉ giao hàng *</label>
                    <input required value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })}
                      className="input-field" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1.5">Ghi chú (không bắt buộc)</label>
                    <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                      className="input-field resize-none" rows={2} placeholder="Ghi chú cho đơn hàng..." />
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <CreditCard size={18} className="text-primary" /> Phương thức thanh toán
                </h2>
                <div className="space-y-2">
                  {DEFAULT_METHODS.map(({ method, label, desc, icon: Icon }) => {
                    const checked = form.payment_method === method;
                    return (
                      <label key={method}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-primary bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="payment" value={method} checked={checked}
                          onChange={e => setForm({ ...form, payment_method: e.target.value })} className="accent-primary mt-1" />
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${checked ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {requirePayerInfo && (
                  <div className="mt-5 border border-primary-100 bg-primary-50/40 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-800 mb-1">Thông tin tài khoản của bạn (đối chiếu)</p>
                    <p className="text-xs text-gray-500 mb-4">
                      Shop lưu thông tin để đối chiếu khi cần — <strong>không</strong> dùng để xác nhận thanh toán.
                      Xác nhận TT chỉ qua webhook sao kê hoặc admin.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {form.payment_method === 'bank_transfer' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-600 mb-1.5">Ngân hàng của bạn *</label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                            {VIETNAM_BANKS.map((b) => {
                              const selected = form.payer_bank_name === b.name;
                              return (
                                <button
                                  type="button"
                                  key={b.code}
                                  onClick={() => setForm({ ...form, payer_bank_name: b.name })}
                                  aria-pressed={selected}
                                  className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2 h-20 transition-colors ${
                                    selected
                                      ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                                      : 'border-gray-200 hover:border-primary/50'
                                  }`}
                                >
                                  <img
                                    src={bankLogoUrl(b.code)}
                                    alt={b.name}
                                    loading="lazy"
                                    className="h-7 w-auto max-w-[80%] object-contain"
                                  />
                                  <span className="text-[11px] text-gray-600 text-center leading-tight line-clamp-1">{b.name}</span>
                                </button>
                              );
                            })}
                          </div>
                          {form.payer_bank_name && (
                            <p className="mt-1.5 text-xs text-gray-500">Đã chọn: <strong>{form.payer_bank_name}</strong></p>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">
                          {form.payment_method === 'bank_transfer' ? 'Số tài khoản *' : 'Số điện thoại ví *'}
                        </label>
                        <input
                          required
                          value={form.payer_account_number}
                          onChange={(e) => setForm({ ...form, payer_account_number: e.target.value })}
                          className="input-field"
                          placeholder={form.payment_method === 'bank_transfer' ? '12345678' : '0901234567'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">
                          {form.payment_method === 'bank_transfer' ? 'Tên chủ tài khoản *' : 'Tên chủ ví *'}
                        </label>
                        <input
                          required
                          value={form.payer_account_name}
                          onChange={(e) => setForm({ ...form, payer_account_name: e.target.value.toUpperCase() })}
                          className="input-field"
                          placeholder="NGUYEN VAN A"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5 h-fit sticky top-20">
              <h2 className="font-semibold text-gray-800 mb-4">Đơn hàng ({items.length})</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-2">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex-shrink-0 border border-gray-100 flex items-center justify-center text-base">📱</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 truncate">{item.name}</p>
                      {(item.color_name || item.storage_label) && (
                        <p className="text-[11px] text-gray-400">{item.color_name || ''}{item.color_name && item.storage_label ? ' · ' : ''}{item.storage_label || ''}</p>
                      )}
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                    <p className="text-xs font-medium text-gray-800 flex-shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm mb-4">
                <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{formatCurrency(total)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Vận chuyển</span><span className="text-green-600">Miễn phí</span></div>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 mb-5">
                <span>Tổng cộng</span>
                <span className="text-primary text-lg">{formatCurrency(total)}</span>
              </div>
              <button type="submit" disabled={loading || items.length === 0} className="btn-primary w-full py-3">
                {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </UserLayout>
  );
}
