'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, Settings,
  LogOut, Menu, X, ChevronRight, Wallet, BadgePercent
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Sản phẩm', icon: Package },
  { href: '/admin/categories', label: 'Danh mục', icon: Tag },
  { href: '/admin/promotions', label: 'Khuyến mãi', icon: BadgePercent },
  { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/payment-settings', label: 'Thanh toán', icon: Wallet },
  { href: '/admin/accounts', label: 'Tài khoản', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loadUser, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { loadUser(); }, []);
  useEffect(() => {
    // User đã đăng nhập nhưng không phải admin → kick về trang login
    // (KHÔNG redirect về '/' vì middleware admin sẽ redirect ngược về /admin → loop)
    if (user && user.role !== 'admin') {
      logout();
      router.push('/auth/login');
    }
    if (!user) {
      const stored = localStorage.getItem('user');
      if (!stored) router.push('/auth/login');
    }
  }, [user]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => { logout(); router.push('/auth/login'); };

  const customerUrl = process.env.NEXT_PUBLIC_CUSTOMER_URL || 'http://localhost:3000';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-gray-900 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors" aria-label="Candy Digital Admin">
          <img
            src="/logo-candy-digital.png"
            alt=""
            className="h-9 w-auto max-h-10 object-contain object-left opacity-95 shrink-0"
            aria-hidden
          />
          <span className="text-white font-semibold text-sm truncate">Candy Digital</span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href, exact)
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <Icon size={17} />
              {label}
              {isActive(href, exact) && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-800 p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-8 h-8 bg-primary-800 rounded-full flex items-center justify-center text-primary-200 text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <LogOut size={15} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <a href={customerUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-primary transition-colors">
            Xem trang web khách hàng ↗
          </a>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
