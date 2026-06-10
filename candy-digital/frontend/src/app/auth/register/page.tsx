'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const APP_MODE = (process.env.NEXT_PUBLIC_APP_MODE || 'customer').toLowerCase();
const isAdminApp = APP_MODE === 'admin';

export default function RegisterPage() {
  const { register, loading } = useAuthStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);

  // Trang admin không cho phép đăng ký tài khoản — chuyển hướng về login
  useEffect(() => {
    if (isAdminApp) router.replace('/auth/login');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    if (form.password.length < 6) { toast.error('Mật khẩu tối thiểu 6 ký tự'); return; }
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      toast.success('Đăng ký thành công!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Smartphone size={28} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Candy Digital</span>
          </Link>
          <p className="text-gray-500 mt-2">Tham gia cộng đồng Candy Digital</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="input-field" placeholder="0901 234 567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-10" placeholder="Tối thiểu 6 ký tự" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
              <input type="password" required value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                className="input-field" placeholder="Nhập lại mật khẩu" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
