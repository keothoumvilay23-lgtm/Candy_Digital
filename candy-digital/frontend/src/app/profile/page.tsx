'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Save } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<'info' | 'password'>('info');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadUser(); }, []);
  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    api.get('/auth/me').then(({ data }) => {
      setForm({ name: data.data.name || '', phone: data.data.phone || '', address: data.data.address || '' });
    });
  }, [user]);

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/profile', form);
      toast.success('Cập nhật thành công!');
    } catch { toast.error('Cập nhật thất bại'); } finally { setLoading(false); }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Mật khẩu mới không khớp'); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Thất bại'); } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Hồ sơ cá nhân</h1>

        {/* Avatar banner */}
        <div className="card p-5 flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${user.role === 'admin' ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-gray-500'}`}>
              {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          <button onClick={() => setTab('info')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'info' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
            <User size={15} /> Thông tin
          </button>
          <button onClick={() => setTab('password')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'password' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
            <Lock size={15} /> Đổi mật khẩu
          </button>
        </div>

        {tab === 'info' ? (
          <div className="card p-6">
            <form onSubmit={handleProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input value={user.email} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="0901 234 567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="input-field resize-none" rows={2} placeholder="Địa chỉ giao hàng mặc định" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-2.5">
                <Save size={16} /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card p-6">
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
                <input type="password" required value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
                <input type="password" required value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="input-field" placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
                <input type="password" required value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} className="input-field" placeholder="Nhập lại mật khẩu mới" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-2.5">
                <Lock size={16} /> {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </form>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
