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
  category_name?: string;
  list_price?: number;
  sale_price?: number;
  discount_percent?: number;
  campaign?: ProductCampaign | null;
}

export default function ProductCard({ product }: { product: Product }) {
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

  return (
    <Link href={`/products/${product.slug}`} className="group card hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Image */}
      <div className="relative bg-gray-50 h-44 flex items-center justify-center overflow-hidden">
        {hasDiscount && (
          <span className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md bg-primary text-white text-[11px] font-semibold shadow-sm">
            -{Math.round(discountPercent)}%
          </span>
        )}
        {hasDiscount && product.campaign?.name && (
          <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-gray-900/80 text-white text-[10px] font-medium">
            {product.campaign.banner_text || product.campaign.name}
          </span>
        )}
        {product.image ? (
          <img
            src={resolveMediaUrl(
              product.image,
              process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''
            )}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-3xl">📱</span>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-medium text-sm bg-black/60 px-3 py-1 rounded-full">Hết hàng</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-0.5">{product.brand}</p>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">{product.name}</h3>
        <div className="flex items-center justify-between">
          <div>
            {hasDiscount && (
              <p className="text-[11px] text-gray-400 line-through">{formatCurrency(listPrice)}</p>
            )}
            <span className="text-primary font-semibold text-sm">{formatCurrency(salePrice)}</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
}
