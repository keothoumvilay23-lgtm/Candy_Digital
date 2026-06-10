'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', password: '' };

export default function AdminAccountsPage() {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/admin/accounts');
      setAccounts(data.data);
    } catch { } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Vui lòng điền đầy đủ'); return; }
    setSaving(true);
    try {
      await api.post('/users/admin/accounts', form);
      toast.success('Tạo tài khoản admin thành công');
      setModal(false);
      setForm(EMPTY_FORM);
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thất bại');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa tài khoản admin này?')) return;
    try {
      await api.delete(`/users/admin/accounts/${id}`);
      toast.success('Đã xóa tài khoản');
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý tài khoản Admin</h1>
          <p className="text-sm text-gray-500">{accounts.length} tài khoản quản trị</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5">
          <Plus size={16} /> Thêm Admin
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Tài khoản', 'Email', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            ) : accounts.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {a.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{a.name}</p>
                      {a.id === user?.id && <span className="text-xs text-primary">(Bạn)</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{a.email}</td>
                <td className="px-4 py-3">
                  <span className={a.is_active ? 'badge-status-done' : 'badge-status-cancelled'}>
                    {a.is_active ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-3">
                  {a.id !== user?.id && (
                    <button onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Thêm tài khoản Admin</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Họ tên *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Tên admin" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="admin@example.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Mật khẩu *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="Tối thiểu 6 ký tự" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 py-2.5">Hủy</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 py-2.5">
                {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
