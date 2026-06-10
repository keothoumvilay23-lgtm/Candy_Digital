'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, Users, Package } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Chờ xử lý',   cls: 'badge-status-pending' },
  confirmed: { label: 'Xác nhận',    cls: 'badge-status-confirmed' },
  shipping:  { label: 'Đang giao',   cls: 'badge-status-shipping' },
  done:      { label: 'Hoàn thành',  cls: 'badge-status-done' },
  cancelled: { label: 'Đã hủy',      cls: 'badge-status-cancelled' },
};

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/admin/dashboard').then(({ data }) => {
      setData(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Doanh thu tháng', value: data ? `${(data.stats.revenue / 1e6).toFixed(1)}M` : '0M', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary-50' },
    { label: 'Đơn hàng tháng', value: data?.stats.orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Khách hàng', value: data?.stats.users, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Sản phẩm', value: data?.stats.products, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const maxRevenue = data?.revenueChart?.length
    ? Math.max(...data.revenueChart.map((r: any) => r.revenue))
    : 1;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tổng quan hoạt động cửa hàng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
              </div>
              <div className={`${bg} p-2.5 rounded-xl`}>
                <Icon size={20} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Bar chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-800 mb-5">Doanh thu 6 tháng gần nhất</h2>
          {loading ? (
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-end gap-3 h-32">
              {(data?.revenueChart || []).map((item: any, i: number) => {
                const pct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const isLast = i === (data?.revenueChart?.length - 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{(item.revenue / 1e6).toFixed(0)}M</span>
                    <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(pct, 5)}%`, background: isLast ? '#E24B4A' : '#FCEBEB' }} />
                    <span className="text-xs text-gray-400">T{item.month}</span>
                  </div>
                );
              })}
              {!data?.revenueChart?.length && (
                <p className="text-sm text-gray-400 mx-auto">Chưa có dữ liệu</p>
              )}
            </div>
          )}
        </div>

        {/* Donut chart placeholder */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Trạng thái đơn hàng</h2>
          <div className="space-y-2.5">
            {Object.entries(STATUS_MAP).map(([key, { label, cls }]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{label}</span>
                <span className={cls}>{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">Đơn hàng mới nhất</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Đang tải...</td></tr>
              ) : data?.recentOrders?.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Chưa có đơn hàng</td></tr>
              ) : (
                data?.recentOrders?.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">#{String(o.id).padStart(6, '0')}</td>
                    <td className="px-5 py-3 text-gray-600">{o.user_name}</td>
                    <td className="px-5 py-3 text-primary font-medium">{formatCurrency(o.total_price)}</td>
                    <td className="px-5 py-3"><span className={STATUS_MAP[o.status]?.cls}>{STATUS_MAP[o.status]?.label}</span></td>
                    <td className="px-5 py-3 text-gray-400">{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
