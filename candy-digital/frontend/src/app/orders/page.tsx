'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/format';

const STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Chuẩn bị hàng' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'done', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Chờ thanh toán / xử lý',  cls: 'badge-status-pending' },
  confirmed: { label: 'Shop đang chuẩn bị hàng', cls: 'badge-status-confirmed' },
  shipping:  { label: 'Shipper đang giao hàng',   cls: 'badge-status-shipping' },
  done:      { label: 'Đã giao hàng',             cls: 'badge-status-done' },
  cancelled: { label: 'Đã hủy',                   cls: 'badge-status-cancelled' },
};

function paymentMoneyLine(order: any): { text: string; cls: string } | null {
  if (order.payment_method === 'cod') return null;
  if (order.payment_status === 'paid') return { text: 'Thanh toán: đã nhận đủ tiền — shop sẽ xử lý đơn', cls: 'text-emerald-600 text-xs' };
  if (order.bank_in_reference || order.bank_in_at) {
    return { text: 'Thanh toán: đã có giao dịch về — shop đang đối soát', cls: 'text-amber-600 text-xs' };
  }
  return { text: 'Thanh toán: vui lòng chuyển khoản theo hướng dẫn lúc đặt hàng', cls: 'text-gray-500 text-xs' };
}

export default function OrdersPage() {
  const { user, loadUser } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);
  useEffect(() => {
    if (user) fetchOrders();
    else router.push('/auth/login');
  }, [user, activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? `?status=${activeTab}` : '';
      const { data } = await api.get(`/orders/my${params}`);
      setOrders(data.data);
    } catch { } finally { setLoading(false); }
  };

  const cancelOrder = async (id: number) => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    try {
      await api.put(`/orders/my/${id}/cancel`);
      toast.success('Hủy đơn hàng thành công');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Hủy thất bại');
    }
  };

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Đơn hàng của tôi</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.value ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={56} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Không có đơn hàng nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const payLine = paymentMoneyLine(order);
              return (
              <div key={order.id} className="card overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-50">
                  <div>
                    <span className="font-semibold text-gray-800">#{String(order.id).padStart(6, '0')}</span>
                    <span className="text-gray-400 text-sm ml-2">{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <span className={STATUS_MAP[order.status]?.cls}>{STATUS_MAP[order.status]?.label}</span>
                </div>
                {payLine && (
                  <div className="px-4 pt-2 pb-0">
                    <p className={payLine.cls}>{payLine.text}</p>
                  </div>
                )}

                <div className="p-4">
                  {order.items?.slice(0, 2).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-base flex-shrink-0">📱</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{item.product_name}</p>
                        {(item.color_name || item.storage_label) && (
                          <p className="text-xs text-gray-400">{item.color_name || '—'} · {item.storage_label || '—'}</p>
                        )}
                        <p className="text-xs text-gray-400">x{item.quantity} · {formatCurrency(item.unit_price)}</p>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 2 && <p className="text-xs text-gray-400 mt-1">+{order.items.length - 2} sản phẩm khác</p>}
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-100">
                  <div>
                    <span className="text-sm text-gray-500">Tổng tiền: </span>
                    <span className="text-primary font-semibold">{formatCurrency(order.total_price)}</span>
                  </div>
                  <div className="flex gap-2">
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button onClick={() => cancelOrder(order.id)}
                        className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        Hủy đơn
                      </button>
                    )}
                    {order.status === 'done' && (
                      <button className="text-sm text-primary border border-primary px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
                        Mua lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
