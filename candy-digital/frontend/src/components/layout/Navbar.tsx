'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingCart, User, Search, LogOut, Package, MapPin, Phone } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, loadUser, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const [dropOpen, setDropOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search)}`);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    setDropOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 shadow-md">
      <div className="bg-gradient-to-r from-rose-50 via-white to-rose-50 text-gray-700 border-b border-rose-100">
        <div className="max-w-7xl mx-auto h-9 px-4 flex items-center justify-between text-xs">
          <div className="hidden md:flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Phone size={12} className="text-primary" />
              Hotline: 1800 1234
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <MapPin size={12} className="text-primary" />
              123 Duong ABC, Quan 3, TP.Ha Long
            </span>
          </div>
          <p className="md:hidden truncate font-medium text-gray-700">Hotline 1800 1234 · 123 Duong ABC, Quan 3</p>
          <span className="hidden md:inline text-primary font-bold">Freeship don tu 500.000d</span>
        </div>
      </div>

      <div className="bg-primary">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 min-w-0" aria-label="Candy Digital - Trang chủ">
          <img
            src="/logo-candy-digital.png"
            alt=""
            className="h-9 sm:h-10 w-auto max-h-11 object-contain object-left shrink-0 drop-shadow-[0_1px_8px_rgba(0,0,0,.25)]"
            aria-hidden
          />
          <span className="text-white font-semibold text-lg sm:text-xl tracking-wide truncate">Candy Digital</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 hidden md:flex">
          <div className="flex w-full bg-white/20 rounded-full overflow-hidden">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="flex-1 bg-transparent text-white placeholder-white/70 px-4 py-2 text-sm outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="px-3 text-white/80 hover:text-white">
              <Search size={18} />
            </button>
          </div>
        </form>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/products" className="text-white/85 hover:text-white font-medium transition-colors">Sản phẩm</Link>
          <Link href="/about" className="text-white/85 hover:text-white font-medium transition-colors">Về chúng tôi</Link>
          <Link href="/promotions" className="text-white/85 hover:text-white font-medium transition-colors">Khuyến mãi</Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <Link href="/cart" className="relative p-2 text-white hover:bg-white/20 rounded-full transition-colors">
                <ShoppingCart size={20} />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-1.5 text-white hover:bg-white/20 rounded-full px-3 py-1.5 transition-colors text-sm"
                >
                  <User size={18} />
                  <span className="hidden md:inline">{user.name.split(' ').slice(-1)[0]}</span>
                </button>
                {dropOpen && (
                  <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 w-52 py-1 z-50">
                    {user.role === 'admin' && (
                      <a
                        href={process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001/admin'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Package size={15} /> Trang quản trị ↗
                      </a>
                    )}
                    <Link href="/profile" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={15} /> Hồ sơ
                    </Link>
                    <Link href="/orders" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Package size={15} /> Đơn hàng
                    </Link>
                    <hr className="my-1" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut size={15} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-white text-sm font-medium hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
                Đăng nhập
              </Link>
              <Link href="/auth/register" className="bg-white text-primary text-sm font-medium px-3 py-1.5 rounded-full hover:bg-primary-50 transition-colors">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
      </div>
      <div className="bg-primary">
        {/* Điều hướng nhanh trên mobile — đồng bộ với desktop */}
        <div className="md:hidden flex items-center justify-center gap-6 px-4 py-2.5 border-t border-white/15 text-xs font-medium">
          <Link href="/products" className="text-white/90 hover:text-white whitespace-nowrap">Sản phẩm</Link>
          <Link href="/about" className="text-white/90 hover:text-white whitespace-nowrap">Về chúng tôi</Link>
          <Link href="/promotions" className="text-white/90 hover:text-white whitespace-nowrap">Khuyến mãi</Link>
        </div>
      </div>
    </nav>
  );
}
