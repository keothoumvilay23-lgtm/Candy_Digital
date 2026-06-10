'use client';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/format';
import { resolveMediaUrl } from '@/lib/media';

interface ProductCampaign {
  id: number;
  name: string;
  slug: string;
  banner_text?: string | null;
  ends_at?: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  brand: string;
  image?: string;
  stock: number;
  variant_count?: number;
  storage_count?: number;
  color_count?: number;
  list_price?: number;
  sale_price?: number;
  discount_percent?: number;
  campaign?: ProductCampaign | null;
}

export default function PromotionalProductCard({ product }: { product: Product }) {
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const router = useRouter();

  const listPrice = Number(product.list_price ?? product.price);
  const salePrice = Number(product.sale_price ?? product.price);
  const discountPercent = Number(product.discount_percent ?? 0);
  const hasDiscount = discountPercent > 0 && salePrice < listPrice;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      router.push('/auth/login');
      return;
    }
    if ((product.storage_count || product.color_count || product.variant_count || 0) > 0) {
      toast('Vui lòng chọn màu và dung lượng');
      router.push(`/products/${product.slug}`);
      return;
    }
    await addToCart(product.id);
  };

  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1a22] to-[#121219] shadow-[0_0_0_1px_rgba(245,197,66,0.12),0_24px_50px_-30px_rgba(0,0,0,0.85)] transition-all hover:shadow-[0_0_0_1px_rgba(245,197,66,0.35),0_28px_60px_-28px_rgba(245,197,66,0.08)] hover:-translate-y-0.5"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      {hasDiscount && (
        <div className="absolute left-2 top-2 z-10 rounded-md bg-gradient-to-r from-rose-600 to-orange-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg">
          −{Math.round(discountPercent)}%
        </div>
      )}

      <div className="relative flex h-44 items-center justify-center bg-[#0d0d12] px-4 pt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,197,66,0.06),transparent_55%)]" />
        {hasDiscount && (
          <div className="absolute bottom-3 right-3 max-w-[60%] truncate rounded-full bg-rose-600/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
            {product.campaign?.banner_text || product.campaign?.name || 'Flash deal'}
          </div>
        )}
        {product.image ? (
          <img
            src={resolveMediaUrl(product.image, base)}
            alt={product.name}
            className="relative z-[1] h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="text-5xl opacity-40">📱</span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/70">
            <span className="rounded-full bg-black/80 px-3 py-1.5 text-sm font-medium text-white">Hết hàng</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-500/80">{product.brand}</p>
          <h3 className="mt-1 line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-white">
            {product.name}
          </h3>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/5 pt-3">
          <div>
            {hasDiscount ? (
              <>
                <p className="text-[11px] text-zinc-500 line-through">{formatCurrency(listPrice)}</p>
                <p className="text-lg font-bold tabular-nums text-amber-400">{formatCurrency(salePrice)}</p>
                <p className="text-[10px] text-zinc-500">Đang giảm {Math.round(discountPercent)}%</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold tabular-nums text-amber-400">{formatCurrency(salePrice)}</p>
                <p className="text-[10px] text-zinc-500">Giá niêm yết</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart size={17} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </Link>
  );
}
