'use client';
import { useEffect, useState } from 'react';
import { Eye, X, FileSpreadsheet, Calendar } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/format';

const STATUS_OPTS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'done', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Chờ xử lý',   cls: 'badge-status-pending' },
  confirmed: { label: 'Xác nhận',    cls: 'badge-status-confirmed' },
  shipping:  { label: 'Đang giao',   cls: 'badge-status-shipping' },
  done:      { label: 'Hoàn thành',  cls: 'badge-status-done' },
  cancelled: { label: 'Đã hủy',      cls: 'badge-status-cancelled' },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  na:      { label: '—',                    cls: 'text-gray-400' },
  pending: { label: 'Chưa xác nhận TT',     cls: 'text-amber-700' },
  paid:    { label: 'Đã thanh toán',        cls: 'text-emerald-700' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [confirmPayId, setConfirmPayId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchOrders(); }, [statusFilter, search, fromDate, toDate, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const { data } = await api.get(`/orders/admin/list?${params}`);
      setOrders(data.data);
      setTotal(data.pagination.total);
    } catch { } finally { setLoading(false); }
  };

  const exportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    const toastId = toast.loading('Đang tạo file Excel...');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const response = await api.get(`/orders/admin/export?${params}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      const fname = `bao-cao-don-hang_${fromDate || 'all'}_den_${toDate || today}.xlsx`;
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Xuất Excel thành công!', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xuất Excel thất bại', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const viewDetail = async (order: any) => {
    try {
      const { data } = await api.get(`/orders/admin/${order.id}`);
      setDetail({ ...order, ...data.data });
    } catch {
      setDetail(order);
    }
  };

  const confirmPayment = async (id: number) => {
    if (!window.confirm('Xác nhận đã nhận đủ tiền? Đơn đang ở trạng thái "Chờ xử lý" sẽ chuyển sang "Xác nhận".')) return;
    setConfirmPayId(id);
    try {
      await api.put(`/orders/admin/${id}/confirm-payment`, {});
      toast.success('Đã xác nhận thanh toán');
      fetchOrders();
      if (detail?.id === id) {
        const { data } = await api.get(`/orders/admin/${id}`);
        setDetail({ ...detail, ...data.data });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thất bại');
    } finally {
      setConfirmPayId(null);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await api.put(`/orders/admin/${id}/status`, { status });
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
      if (detail?.id === id) setDetail((prev: any) => ({ ...prev, status }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thất bại');
    } finally { setUpdatingId(null); }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-500">Tổng {total} đơn hàng</p>
        </div>
        <button
          onClick={exportExcel}
          disabled={exporting || total === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium shadow-sm transition-colors"
          title="Xuất danh sách đơn hàng ra file Excel"
        >
          <FileSpreadsheet size={16} />
          {exporting ? 'Đang xuất...' : 'Xuất Excel'}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Tìm kiếm</label>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Mã đơn, tên khách, email..."
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field w-full"
            >
              {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
              <Calendar size={12} /> Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1); }}
              max={toDate || undefined}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
              <Calendar size={12} /> Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1); }}
              min={fromDate || undefined}
              className="input-field w-full"
            />
          </div>
        </div>

        {(search || statusFilter !== 'all' || fromDate || toDate) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-gray-500">Bộ lọc đang áp dụng:</span>
            <button
              onClick={resetFilters}
              className="text-primary hover:underline font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Thanh toán', 'TT tiền', 'Trạng thái', 'Ngày đặt', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Không có đơn hàng</td></tr>
              ) : orders.map(o => {
                const rawPs = o.payment_status;
                let effPs = rawPs || 'na';
                if (
                  o.payment_method !== 'cod' && o.payment_method
                  && o.status === 'pending'
                  && (effPs === 'na' || effPs === '')
                ) {
                  effPs = 'pending';
                }
                return (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">#{String(o.id).padStart(6, '0')}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800 text-sm">{o.user_name}</p>
                    <p className="text-gray-400 text-xs">{o.user_email}</p>
                  </td>
                  <td className="px-4 py-3 text-primary font-medium whitespace-nowrap">{formatCurrency(o.total_price)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs uppercase">{o.payment_method}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={PAYMENT_STATUS_MAP[effPs]?.cls || 'text-gray-500'}>
                      {PAYMENT_STATUS_MAP[effPs]?.label ?? effPs}
                    </span>
                    {effPs === 'pending' && (o.bank_in_reference || o.bank_in_at) && (
                      <span className="block text-[10px] text-blue-600 mt-0.5">Có thông báo CK</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      disabled={updatingId === o.id}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary">
                      {STATUS_OPTS.filter(s => s.value !== 'all').map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => viewDetail(o)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"><Eye size={14} /></button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(Math.ceil(total / 15))].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${page === i + 1 ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Chi tiết đơn #{String(detail.id).padStart(6, '0')}</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">Khách hàng:</span><p className="font-medium">{detail.user_name}</p></div>
                <div><span className="text-gray-400">Trạng thái:</span><p><span className={STATUS_MAP[detail.status]?.cls}>{STATUS_MAP[detail.status]?.label}</span></p></div>
                <div><span className="text-gray-400">Người nhận:</span><p>{detail.shipping_name}</p></div>
                <div><span className="text-gray-400">Điện thoại:</span><p>{detail.shipping_phone}</p></div>
                <div className="col-span-2"><span className="text-gray-400">Địa chỉ:</span><p>{detail.shipping_address}</p></div>
                <div><span className="text-gray-400">Thanh toán:</span><p className="uppercase">{detail.payment_method}</p></div>
                <div><span className="text-gray-400">TT tiền:</span>
                  <p className={PAYMENT_STATUS_MAP[detail.payment_status]?.cls}>{PAYMENT_STATUS_MAP[detail.payment_status]?.label ?? detail.payment_status}</p>
                </div>
                <div><span className="text-gray-400">Ngày đặt:</span><p>{new Date(detail.created_at).toLocaleString('vi-VN')}</p></div>
              </div>

              {detail.payment_status === 'pending' && detail.payment_method !== 'cod' && (
                <button
                  type="button"
                  disabled={confirmPayId === detail.id}
                  onClick={() => confirmPayment(detail.id)}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {confirmPayId === detail.id ? 'Đang xử lý...' : 'Xác nhận đã nhận tiền'}
                </button>
              )}

              {(detail.bank_in_reference || detail.bank_in_at || detail.bank_in_amount != null) && detail.payment_method !== 'cod' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm space-y-1.5">
                  <p className="font-medium text-emerald-900">Thông báo giao dịch (webhook / biến động CK)</p>
                  {detail.bank_in_amount != null && Number(detail.bank_in_amount) > 0 && (
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="text-emerald-700">Số tiền:</span>
                      <span className="font-medium text-emerald-900">{formatCurrency(Number(detail.bank_in_amount))}</span>
                    </div>
                  )}
                  {detail.bank_in_amount != null
                    && Math.abs(Number(detail.bank_in_amount) - Number(detail.total_price)) > 1 && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                      Số tiền giao dịch khác tổng đơn — vui lòng kiểm tra lại trước khi xác nhận.
                    </p>
                  )}
                  {detail.bank_in_at && (
                    <div className="text-xs text-emerald-800">Thời gian: {new Date(detail.bank_in_at).toLocaleString('vi-VN')}</div>
                  )}
                  {detail.bank_in_reference && (
                    <div className="text-xs text-emerald-800 break-all">Mã tham chiếu: {detail.bank_in_reference}</div>
                  )}
                  {detail.bank_in_account && (
                    <div className="text-xs text-emerald-800">Từ TK: {detail.bank_in_account}</div>
                  )}
                  {detail.bank_in_content && (
                    <div className="text-xs text-emerald-800 break-all">Nội dung: {detail.bank_in_content}</div>
                  )}
                </div>
              )}

              {detail.payment_confirmed_at && (
                <p className="text-xs text-gray-500">Xác nhận thanh toán lúc: {new Date(detail.payment_confirmed_at).toLocaleString('vi-VN')}</p>
              )}
              {(detail.payer_account_number || detail.payer_bank_name) && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-900 mb-1">Thông tin chuyển khoản của khách</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-blue-800">
                    {detail.payer_bank_name && <div><span className="text-blue-600">Ngân hàng/Ví:</span> {detail.payer_bank_name}</div>}
                    {detail.payer_account_number && <div><span className="text-blue-600">Số TK/SĐT:</span> {detail.payer_account_number}</div>}
                    {detail.payer_account_name && <div className="col-span-2"><span className="text-blue-600">Chủ tài khoản:</span> {detail.payer_account_name}</div>}
                  </div>
                </div>
              )}

              {detail.note && (
                <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
                  <span className="font-medium">Ghi chú:</span> {detail.note}
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Sản phẩm</h3>
                <div className="space-y-2">
                  {(detail.items || []).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <div>
                        <p className="text-sm text-gray-800">{item.product_name}</p>
                        <p className="text-xs text-gray-400">x{item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{formatCurrency(item.quantity * item.unit_price)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-3 font-semibold">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatCurrency(detail.total_price)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
