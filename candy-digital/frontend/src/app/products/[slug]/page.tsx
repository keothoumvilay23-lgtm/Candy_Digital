'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShoppingCart, ChevronRight, Minus, Plus, Shield, Truck, RotateCcw,
  Check, Star, ChevronDown,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import ProductCard from '@/components/product/ProductCard';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format';
import { resolveMediaUrl } from '@/lib/media';

type TabKey = 'description' | 'specs' | 'reviews';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [tab, setTab] = useState<TabKey>('description');
  const [openGroup, setOpenGroup] = useState<number | null>(0);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then(({ data }) => {
      setProduct(data.data);
      if (data.data.colors?.length) {
        setSelectedColor(data.data.colors[0].name);
      }
      if (data.data.storage_options?.length) {
        setSelectedStorage(data.data.storage_options[0].storage_label);
      }
      setLoading(false);
    }).catch(() => { setLoading(false); router.push('/products'); });
  }, [slug]);

  const imgBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

  const colorList: any[] = product?.colors || [];
  const storageList: any[] = product?.storage_options || [];
  const selectedColorItem = colorList.find((c) => c.name === selectedColor);
  const selectedStorageItem = storageList.find((s) => s.storage_label === selectedStorage) || storageList[0];
  const displayPrice = selectedStorageItem ? selectedStorageItem.price : product?.price;
  const displayListPrice = selectedStorageItem
    ? Number(selectedStorageItem.list_price ?? selectedStorageItem.price)
    : Number(product?.list_price ?? product?.price);
  const discountPercent = Number(
    selectedStorageItem?.discount_percent ?? product?.discount_percent ?? 0
  );
  const hasDiscount = discountPercent > 0 && Number(displayPrice) < displayListPrice;
  const activeCampaign = product?.campaign;
  const displayStock = selectedStorageItem ? selectedStorageItem.stock : product?.stock;
  const variantRequired = colorList.length > 0 || storageList.length > 0;
  const variantReady = (colorList.length === 0 || !!selectedColor) && (storageList.length === 0 || !!selectedStorageItem);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const tag = selectedColorItem?.name ? `Màu ${selectedColorItem.name}` : undefined;
    const fromColor = selectedColorItem?.image_gallery;
    if (Array.isArray(fromColor) && fromColor.length > 0) {
      return fromColor.filter(Boolean).map((url: string) => ({ url, tag }));
    }
    const list: { url: string; tag?: string }[] = [];
    if (selectedColorItem?.image_url) {
      list.push({ url: selectedColorItem.image_url, tag });
    }
    (product.images || []).forEach((img: any) => {
      if (!list.find((x) => x.url === img.image_url)) list.push({ url: img.image_url });
    });
    return list;
  }, [product, selectedColorItem]);

  useEffect(() => { setActiveImg(0); }, [selectedColor]);

  const handleAddToCart = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập'); router.push('/auth/login'); return; }
    if (variantRequired && !variantReady) { toast.error('Vui lòng chọn màu và dung lượng'); return; }
    await addToCart(product.id, qty, selectedStorageItem?.id, selectedColor || undefined);
  };

  const handleBuyNow = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập'); router.push('/auth/login'); return; }
    if (variantRequired && !variantReady) { toast.error('Vui lòng chọn màu và dung lượng'); return; }
    await addToCart(product.id, qty, selectedStorageItem?.id, selectedColor || undefined);
    router.push('/cart');
  };

  if (loading) return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-96 bg-gray-100 rounded-xl" />
      </div>
    </UserLayout>
  );
  if (!product) return null;

  const highlights: string[] = Array.isArray(product.highlights) ? product.highlights : [];
  const specifications: any[] = Array.isArray(product.specifications) ? product.specifications : [];

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link href="/products" className="hover:text-primary">Sản phẩm</Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* GALLERY */}
          <div className="lg:col-span-7">
            <div className="bg-gray-50 rounded-2xl h-[420px] flex items-center justify-center mb-3 border border-gray-100 relative">
              {galleryImages[activeImg]?.url ? (
                <img src={resolveMediaUrl(galleryImages[activeImg].url, imgBase)} alt={product.name} className="h-full object-contain p-8" />
              ) : (
                <div className="text-gray-300 text-7xl">📱</div>
              )}
              {galleryImages[activeImg]?.tag && (
                <span className="absolute top-3 left-3 bg-white/90 text-xs px-2.5 py-1 rounded-full text-gray-700 border border-gray-200">
                  {galleryImages[activeImg].tag}
                </span>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg border-2 overflow-hidden bg-gray-50 transition-colors ${i === activeImg ? 'border-primary' : 'border-gray-200'}`}>
                    <img src={resolveMediaUrl(img.url, imgBase)} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="lg:col-span-5">
            <p className="text-sm text-gray-400 mb-1">{product.brand}</p>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">{product.name}</h1>
            {product.short_description && (
              <p className="text-sm text-gray-500 mb-3">{product.short_description}</p>
            )}

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <span>4.9</span>
              <span className="text-gray-300">·</span>
              <span>Đã bán 1.2k</span>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 rounded-xl p-4 mb-4">
              {hasDiscount && activeCampaign && (
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold text-white">
                  <span>−{Math.round(discountPercent)}%</span>
                  <span className="opacity-90">·</span>
                  <span className="truncate max-w-[180px]">
                    {activeCampaign.banner_text || activeCampaign.name}
                  </span>
                </div>
              )}
              <div className="flex items-end gap-3">
                <div className="text-3xl font-bold text-primary">{formatCurrency(displayPrice)}</div>
                {hasDiscount && (
                  <div className="pb-1 text-sm text-gray-400 line-through">
                    {formatCurrency(displayListPrice)}
                  </div>
                )}
              </div>
              {hasDiscount && activeCampaign?.ends_at && (
                <p className="mt-1 text-[11px] text-rose-500">
                  Khuyến mãi áp dụng đến {new Date(activeCampaign.ends_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${displayStock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {displayStock > 0 ? `Còn ${displayStock} sản phẩm` : 'Hết hàng'}
                </span>
                {product.warranty && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700">Bảo hành {product.warranty}</span>
                )}
                {product.origin && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-orange-50 text-orange-700">{product.origin}</span>
                )}
              </div>
            </div>

            {/* HIGHLIGHTS */}
            {highlights.length > 0 && (
              <div className="border border-gray-100 rounded-xl p-4 mb-4 bg-white">
                <p className="text-sm font-medium text-gray-700 mb-2">Đặc điểm nổi bật</p>
                <ul className="space-y-1.5">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-4 h-4 rounded-full bg-primary-50 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={10} />
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* VARIANT PICKERS */}
            {(colorList.length > 0 || storageList.length > 0) && (
              <div className="mb-5 space-y-4">
                {storageList.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Dung lượng:</p>
                    <div className="flex flex-wrap gap-2">
                      {storageList.map((s: any) => {
                        const lp = Number(s.list_price ?? s.price);
                        const sp = Number(s.price);
                        const isDiscount = Number(s.discount_percent ?? 0) > 0 && sp < lp;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedStorage(s.storage_label)}
                            disabled={s.stock === 0}
                            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors text-left ${selectedStorage === s.storage_label ? 'border-primary text-primary bg-primary-50' : 'border-gray-200 text-gray-700 hover:border-primary'} ${s.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <div>{s.storage_label}</div>
                            <div className="mt-0.5 flex items-baseline gap-1.5">
                              <span className="text-[11px] opacity-80">{formatCurrency(sp)}</span>
                              {isDiscount && (
                                <span className="text-[10px] text-gray-400 line-through">{formatCurrency(lp)}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {colorList.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Màu sắc — chọn màu để xem ảnh:</p>
                    <div className="flex flex-wrap gap-2">
                      {colorList.map((c: any) => {
                        const active = selectedColor === c.name;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedColor(c.name)}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-sm transition-colors ${active ? 'border-primary text-primary bg-primary-50' : 'border-gray-200 text-gray-600 hover:border-primary'}`}
                          >
                            {c.image_url ? (
                              <span className="w-8 h-8 rounded-md overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                                <img src={resolveMediaUrl(c.image_url, imgBase)} alt={c.name} className="w-full h-full object-contain" />
                              </span>
                            ) : c.hex_code ? (
                              <span
                                className="w-5 h-5 rounded-full border border-gray-200"
                                style={{ backgroundColor: c.hex_code }}
                              />
                            ) : null}
                            <span className="pr-1">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QTY */}
            {displayStock > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm text-gray-600">Số lượng:</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors"><Minus size={14} /></button>
                  <span className="px-4 py-2 text-sm font-medium border-x border-gray-200">{qty}</span>
                  <button onClick={() => setQty(Math.min(displayStock, qty + 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors"><Plus size={14} /></button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <button onClick={handleAddToCart} disabled={displayStock === 0}
                className="flex-1 btn-outline flex items-center justify-center gap-2 py-3">
                <ShoppingCart size={18} /> Thêm vào giỏ
              </button>
              <button onClick={handleBuyNow} disabled={displayStock === 0}
                className="flex-1 btn-primary py-3">
                Mua ngay
              </button>
            </div>

            {/* POLICIES */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              {[
                { icon: Truck, text: 'Miễn phí vận chuyển toàn quốc' },
                { icon: Shield, text: `Bảo hành ${product.warranty || '12 tháng'} tại hãng` },
                { icon: RotateCcw, text: 'Đổi trả trong 7 ngày nếu lỗi' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
                  <Icon size={16} className="text-primary flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-10">
          <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'description', label: 'Mô tả sản phẩm' },
              { id: 'specs', label: 'Thông số kỹ thuật' },
              { id: 'reviews', label: 'Đánh giá' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as TabKey)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* DESCRIPTION TAB */}
          {tab === 'description' && (
            <div className="card p-6 mt-4">
              {product.description ? (
                <>
                  <div className={`text-gray-600 leading-relaxed text-sm whitespace-pre-line ${descExpanded ? '' : 'max-h-60 overflow-hidden relative'}`}>
                    {product.description}
                    {!descExpanded && (
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-3 text-sm text-primary font-medium hover:underline"
                  >
                    {descExpanded ? 'Thu gọn' : 'Xem thêm'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">Chưa có mô tả chi tiết.</p>
              )}
            </div>
          )}

          {/* SPECS TAB */}
          {tab === 'specs' && (
            <div className="mt-4">
              {specifications.length === 0 ? (
                <div className="card p-6 text-sm text-gray-400 italic">
                  Sản phẩm chưa được cập nhật thông số kỹ thuật.
                </div>
              ) : (
                <div className="space-y-3">
                  {specifications.map((group: any, gi: number) => {
                    const open = openGroup === gi;
                    return (
                      <div key={gi} className="card overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenGroup(open ? null : gi)}
                          className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-sm font-semibold text-gray-800">{group.group}</span>
                          <ChevronDown size={16} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                        {open && (
                          <table className="w-full text-sm">
                            <tbody>
                              {(group.items || []).map((it: any, ii: number) => (
                                <tr key={ii} className="border-t border-gray-100">
                                  <td className="px-5 py-2.5 w-1/3 text-gray-500 align-top bg-gray-50/50">{it.label}</td>
                                  <td className="px-5 py-2.5 text-gray-700">{it.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB (placeholder) */}
          {tab === 'reviews' && (
            <div className="card p-8 mt-4 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
              </div>
              <p className="text-2xl font-semibold text-gray-800">4.9 / 5</p>
              <p className="text-sm text-gray-500 mt-1">Dựa trên đánh giá của khách đã mua sản phẩm</p>
              <p className="text-xs text-gray-400 mt-3">Tính năng đánh giá chi tiết sẽ ra mắt trong bản tiếp theo.</p>
            </div>
          )}
        </div>

        {/* RELATED */}
        {product.related?.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.related.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
