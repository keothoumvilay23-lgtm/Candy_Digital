'use client';
import { useEffect, useState } from 'react';
import { Save, Upload, Wallet, QrCode } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PaymentSetting {
  id: number;
  method: string;
  label: string;
  is_active: number;
  account_name: string | null;
  account_number: string | null;
  bank_code: string | null;
  bank_name: string | null;
  qr_image_url: string | null;
  instruction: string | null;
  sort_order: number;
}

const VIETNAM_BANKS: { code: string; name: string }[] = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'Vietinbank' },
  { code: 'AGB', name: 'Agribank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'OCB', name: 'OCB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'SCB', name: 'SCB' },
  { code: 'NAB', name: 'Nam A Bank' },
  { code: 'BAB', name: 'Bac A Bank' },
  { code: 'PVCB', name: 'PVcomBank' },
];

const buildVietQR = (bankCode: string, account: string, accountName?: string | null) => {
  if (!bankCode || !account) return '';
  const params = new URLSearchParams();
  if (accountName) params.set('accountName', accountName);
  return `https://img.vietqr.io/image/${bankCode}-${account}-qr_only.png?${params.toString()}`;
};

export default function AdminPaymentSettingsPage() {
  const [items, setItems] = useState<PaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const imgBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payment-settings/admin/list');
      setItems(data.data);
    } catch {
      toast.error('Không tải được cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (id: number, key: keyof PaymentSetting, value: any) => {
    setItems(items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  };

  const handleSave = async (item: PaymentSetting) => {
    setSavingId(item.id);
    try {
      await api.put(`/payment-settings/admin/${item.id}`, {
        label: item.label,
        is_active: item.is_active,
        account_name: item.account_name,
        account_number: item.account_number,
        bank_code: item.bank_code,
        bank_name: item.bank_name,
        qr_image_url: item.qr_image_url,
        instruction: item.instruction,
        sort_order: item.sort_order,
      });
      toast.success('Đã lưu cấu hình');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSavingId(null);
    }
  };

  const handleUploadQr = async (id: number, file: File) => {
    const fd = new FormData();
    fd.append('qr', file);
    try {
      const { data } = await api.post('/payment-settings/admin/upload-qr', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateField(id, 'qr_image_url', data.data.url);
      toast.success('Đã tải lên QR. Nhớ bấm Lưu để áp dụng.');
    } catch {
      toast.error('Tải QR thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Wallet size={20} className="text-primary" /> Cấu hình thanh toán
        </h1>
        <p className="text-sm text-gray-500">
          Cập nhật thông tin thanh toán hiển thị cho khách trong trang đặt hàng. QR ngân hàng sẽ tự sinh theo VietQR.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-100" />)}</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isBank = item.method === 'bank_transfer';
            const isWallet = item.method === 'momo' || item.method === 'zalopay';
            const livePreviewQr = isBank
              ? buildVietQR(item.bank_code || '', item.account_number || '', item.account_name)
              : null;

            return (
              <div key={item.id} className="card p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-1">
                    <input
                      value={item.label}
                      onChange={(e) => updateField(item.id, 'label', e.target.value)}
                      className="input-field font-semibold text-gray-800 mb-1"
                    />
                    <p className="text-xs text-gray-400">Mã hệ thống: {item.method}</p>
                  </div>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={!!item.is_active}
                      onChange={(e) => updateField(item.id, 'is_active', e.target.checked ? 1 : 0)}
                    />
                    <span className="text-sm text-gray-700">{item.is_active ? 'Đang bật' : 'Đang tắt'}</span>
                  </label>
                </div>

                {(isBank || isWallet) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {isBank && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Ngân hàng</label>
                        <select
                          value={item.bank_code || ''}
                          onChange={(e) => {
                            const code = e.target.value;
                            const bank = VIETNAM_BANKS.find((b) => b.code === code);
                            updateField(item.id, 'bank_code', code);
                            updateField(item.id, 'bank_name', bank?.name || '');
                          }}
                          className="input-field"
                        >
                          <option value="">Chọn ngân hàng</option>
                          {VIETNAM_BANKS.map((b) => (
                            <option key={b.code} value={b.code}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        {isBank ? 'Số tài khoản' : 'Số điện thoại / ID ví'}
                      </label>
                      <input
                        value={item.account_number || ''}
                        onChange={(e) => updateField(item.id, 'account_number', e.target.value)}
                        className="input-field"
                        placeholder={isBank ? 'Nhập số tài khoản' : '0901234567'}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1.5">Tên chủ tài khoản</label>
                      <input
                        value={item.account_name || ''}
                        onChange={(e) => updateField(item.id, 'account_name', e.target.value.toUpperCase())}
                        className="input-field"
                        placeholder="NGUYEN VAN A"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1.5">Hướng dẫn cho khách</label>
                  <textarea
                    value={item.instruction || ''}
                    onChange={(e) => updateField(item.id, 'instruction', e.target.value)}
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Nội dung hiển thị cho khách khi chọn phương thức này."
                  />
                </div>

                {(isBank || isWallet) && (
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <QrCode size={14} /> Ảnh QR {isBank ? '(tuỳ chọn — sẽ ưu tiên ảnh tải lên thay cho VietQR tự sinh)' : '(MoMo/ZaloPay tải QR riêng)'}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="btn-outline px-4 py-2 cursor-pointer text-sm flex items-center gap-2">
                        <Upload size={14} />
                        Tải lên QR
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadQr(item.id, file);
                          }}
                        />
                      </label>
                      {item.qr_image_url && (
                        <>
                          <img
                            src={item.qr_image_url.startsWith('http') ? item.qr_image_url : `${imgBase}${item.qr_image_url}`}
                            alt="QR"
                            className="w-20 h-20 object-contain border border-gray-200 rounded-lg p-1"
                          />
                          <button
                            type="button"
                            onClick={() => updateField(item.id, 'qr_image_url', null)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Xoá ảnh
                          </button>
                        </>
                      )}
                      {!item.qr_image_url && livePreviewQr && (
                        <div className="flex items-center gap-2">
                          <img src={livePreviewQr} alt="VietQR" className="w-20 h-20 object-contain border border-gray-200 rounded-lg p-1" />
                          <span className="text-xs text-gray-400">QR tự động (VietQR)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave(item)}
                    disabled={savingId === item.id}
                    className="btn-primary px-5 py-2 flex items-center gap-2"
                  >
                    <Save size={14} />
                    {savingId === item.id ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
