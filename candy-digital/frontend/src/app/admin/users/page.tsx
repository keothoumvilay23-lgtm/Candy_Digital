'use client';
import { useEffect, useState } from 'react';
import { LockOpen, Lock } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchUsers(); }, [search, status]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);
      const { data } = await api.get(`/users/admin/users?${params}`);
      setUsers(data.data);
      setTotal(data.pagination.total);
    } catch { } finally { setLoading(false); }
  };

  const toggleStatus = async (id: number, name: string) => {
    if (!confirm(`Thay đổi trạng thái tài khoản của ${name}?`)) return;
    try {
      await api.put(`/users/admin/users/${id}/toggle-status`);
      toast.success('Cập nhật thành công');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500">Tổng {total} tài khoản</p>
        </div>
      </div>

      <div className="card p-3 mb-4 flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm tên, email..." className="input-field flex-1" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="input-field w-40">
          <option value="all">Tất cả</option>
          <option value="active">Hoạt động</option>
          <option value="blocked">Đã khóa</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Người dùng', 'Email', 'Số điện thoại', 'Số đơn', 'Ngày đăng ký', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">Không có người dùng</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800 text-sm">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{u.order_count}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-3">
                  <span className={u.is_active ? 'badge-status-done' : 'badge-status-cancelled'}>
                    {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(u.id, u.name)}
                    className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                    title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}>
                    {u.is_active ? <Lock size={14} /> : <LockOpen size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
