'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const APP_MODE = (process.env.NEXT_PUBLIC_APP_MODE || 'customer').toLowerCase();
const isAdminApp = APP_MODE === 'admin';

export default function LoginPage() {
  const { login, logout, loading } = useAuthStore();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);

      // Đọc role từ localStorage vì zustand state có thể chưa cập nhật ngay
      const stored = localStorage.getItem('user');
      const role = stored ? (JSON.parse(stored).role as string) : 'user';

      if (isAdminApp) {
        // App admin chỉ chấp nhận tài khoản admin
        if (role !== 'admin') {
          logout();
          toast.error('Tài khoản này không phải Admin. Vui lòng dùng trang khách hàng.');
          return;
        }
        toast.success('Đăng nhập admin thành công!');
        router.push('/admin');
      } else {
        toast.success('Đăng nhập thành công!');
        router.push('/');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-1" aria-label="Candy Digital - Trang chủ">
            <img
              src="/logo-candy-digital.png"
              alt=""
              className="h-14 w-auto max-w-[12rem] object-contain drop-shadow-sm"
              aria-hidden
            />
            <span className="text-2xl font-bold text-gray-900">Candy Digital</span>
          </Link>
          <p className="text-gray-500 mt-2">
            {isAdminApp ? 'Đăng nhập Hệ thống Quản trị' : 'Đăng nhập để tiếp tục mua sắm'}
          </p>
        </div>

        {isAdminApp && (
          <div className="mb-4 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Shield size={14} className="flex-shrink-0" />
            <span>Khu vực dành riêng cho quản trị viên. Khách hàng vui lòng truy cập trang chính.</span>
          </div>
        )}

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-right mt-1">
                <a href="#" className="text-xs text-primary hover:underline">Quên mật khẩu?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-base mt-2 rounded-lg font-medium text-white transition-colors ${
                isAdminApp
                  ? 'bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400'
                  : 'btn-primary'
              }`}
            >
              {loading ? 'Đang đăng nhập...' : isAdminApp ? 'Đăng nhập Admin' : 'Đăng nhập'}
            </button>
          </form>

          {!isAdminApp && (
            <p className="text-center text-sm text-gray-500 mt-5">
              Chưa có tài khoản?{' '}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">Đăng ký ngay</Link>
            </p>
          )}

          {isAdminApp && (
            <p className="text-center text-xs text-gray-400 mt-5">
              Bạn là khách hàng?{' '}
              <a
                href={process.env.NEXT_PUBLIC_CUSTOMER_URL || 'http://localhost:3000'}
                className="text-primary font-medium hover:underline"
              >
                Sang trang mua sắm ↗
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
