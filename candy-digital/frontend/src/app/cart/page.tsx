'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/format';
import { resolveMediaUrl } from '@/lib/media';

export default function CartPage() {
  const { user, loadUser } = useAuthStore();
  const { items, total, fetchCart, updateItem, removeItem } = useCartStore();
  const router = useRouter();
  const imgBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) fetchCart();
    else router.push('/auth/login');
  }, [user]);

  if (!user) return null;

  return (
    <UserLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Giỏ hàng của tôi</h1>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag size={64} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-5">Giỏ hàng đang trống</p>
            <Link href="/products" className="btn-primary px-8 py-3">Tiếp tục mua sắm</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map(item => (
                <div key={item.id} className="card p-4 flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100">
                    {item.image ? (
                      <img src={resolveMediaUrl(item.image, imgBase)}
                        alt={item.name} className="w-full h-full object-contain p-1" />
                    ) : <div className="w-full h-full flex items-center justify-center text-2xl">📱</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{item.brand}</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    {(item.color_name || item.storage_label) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.color_name || '—'} · {item.storage_label || '—'}
                      </p>
                    )}
                    <p className="text-primary font-semibold mt-1">{formatCurrency(item.price)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateItem(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                          className="px-2 py-1 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="px-3 py-1 text-sm border-x border-gray-200">{item.quantity}</span>
                        <button onClick={() => updateItem(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}
                          className="px-2 py-1 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">= {formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="card p-5 h-fit sticky top-20">
              <h2 className="font-semibold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính ({items.length} sản phẩm)</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600 font-medium">Miễn phí</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 mb-5">
                <div className="flex justify-between font-semibold">
                  <span>Tổng cộng</span>
                  <span className="text-primary text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
              <Link href="/checkout" className="btn-primary w-full py-3 text-center block">
                Tiến hành đặt hàng
              </Link>
              <Link href="/products" className="btn-ghost w-full py-2.5 text-center block mt-2 text-sm">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
