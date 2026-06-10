'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Smartphone, Headphones, Watch, Tablet, Laptop, Package, Flame, Tag, Clock3 } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import ProductCard from '@/components/product/ProductCard';
import api from '@/lib/api';

interface Campaign {
  id: number;
  name: string;
  slug: string;
  banner_text: string | null;
  description: string | null;
  discount_percent: number;
  starts_at: string;
  ends_at: string;
  scope: 'all' | 'category' | 'product';
}

const formatCountdown = (sec: number) => {
  if (sec <= 0) return '00:00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
};

const CATEGORIES = [
  { name: 'Điện thoại', slug: 'dien-thoai', icon: Smartphone },
  { name: 'Laptop', slug: 'laptop', icon: Laptop },
  { name: 'Máy tính bảng', slug: 'may-tinh-bang', icon: Tablet },
  { name: 'Tai nghe', slug: 'tai-nghe', icon: Headphones },
  { name: 'Đồng hồ', slug: 'dong-ho-thong-minh', icon: Watch },
  { name: 'Phụ kiện', slug: 'phu-kien', icon: Package },
];

const HERO_SLIDES = [
  {
    eyebrow: 'Mới nhất 2024',
    title: 'iPhone 15 Pro Max',
    subtitle: 'Siêu phẩm năm nay',
    description: 'Chip A17 Pro · Camera 48MP · Khung Titan',
    href: '/products/iphone-15-pro-max-256gb',
    image: '/images/Screenshot%202026-05-02%20144328.jpg',
    imageAlt: 'iPhone 15 Pro Max',
  },
  {
    eyebrow: 'Android cao cấp',
    title: 'Galaxy S24 Ultra',
    subtitle: 'Camera 200MP',
    description: 'S Pen tích hợp · Màn hình AMOLED · Snapdragon 8 Gen 3',
    href: '/products/samsung-s24-ultra-256gb',
    image: '/images/Screenshot%202026-05-02%20144919.jpg',
    imageAlt: 'Samsung Galaxy S24 Ultra',
  },
  {
    eyebrow: 'Âm thanh nổi bật',
    title: 'AirPods Pro 2',
    subtitle: 'Chống ồn chủ động',
    description: 'Chip H2 · Âm thanh không gian · Pin bền bỉ',
    href: '/products/airpods-pro-2',
    image: '/images/Screenshot%202026-05-02%20145329.jpg',
    imageAlt: 'AirPods Pro 2',
  },
  {
    eyebrow: 'Phụ kiện thông minh',
    title: 'Apple Watch Series 9',
    subtitle: 'Theo dõi sức khỏe',
    description: 'Màn hình always-on · ECG · Chống nước',
    href: '/products/apple-watch-series-9-45mm',
    image: '/images/Screenshot%202026-05-02%20145454.jpg',
    imageAlt: 'Apple Watch Series 9',
  },
];

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const promoProducts = useMemo(
    () => products.filter((p) => Number(p.discount_percent) > 0),
    [products]
  );
  const flashProducts = (promoProducts.length > 0 ? promoProducts : products).slice(0, 4);

  const featuredCampaign = useMemo(() => {
    if (!campaigns.length) return null;
    return [...campaigns].sort(
      (a, b) => Number(b.discount_percent) - Number(a.discount_percent)
    )[0];
  }, [campaigns]);

  const featuredCountdownSec = useMemo(() => {
    if (!featuredCampaign) return 0;
    return Math.max(0, Math.floor((new Date(featuredCampaign.ends_at).getTime() - now) / 1000));
  }, [featuredCampaign, now]);

  const nextSlide = () => setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
  const prevSlide = () => setActiveSlide((current) => (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=8').then(({ data }) => data.data as any[]).catch(() => []),
      api.get('/promotions/active').then(({ data }) => data.data as Campaign[]).catch(() => []),
    ])
      .then(([prodData, campaignData]) => {
        setProducts(prodData);
        setCampaigns(campaignData);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(nextSlide, 4500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <UserLayout>
      {/* Hero Banner */}
      <div className="bg-white text-gray-900 border-b border-gray-100">
        <div className="relative max-w-7xl mx-auto px-12 md:px-16">
          <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {HERO_SLIDES.map((slide) => (
              <section key={slide.href} className="min-w-full py-14 md:py-16 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <p className="text-primary text-sm font-medium mb-2 uppercase tracking-wide">{slide.eyebrow}</p>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                    {slide.title}<br />
                    <span className="text-gray-700">{slide.subtitle}</span>
                  </h1>
                  <p className="text-gray-600 mb-6 text-lg">{slide.description}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={slide.href}
                      className="bg-gray-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-gray-700 transition-colors">
                      Xem ngay
                    </Link>
                    <Link href="/products"
                      className="border border-gray-300 text-gray-900 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors">
                      Tất cả sản phẩm
                    </Link>
                  </div>
                </div>
                <div className="flex-shrink-0 w-64 h-56 md:w-80 md:h-64 flex items-center justify-center">
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    className="h-full w-full object-contain"
                  />
                </div>
              </section>
            ))}
          </div>
          </div>

          <button
            type="button"
            onClick={prevSlide}
            aria-label="Slide trước"
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Slide tiếp theo"
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.href}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Chọn slide ${index + 1}`}
                className={`h-2 rounded-full transition-all ${activeSlide === index ? 'w-8 bg-gray-900' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Flash sale campaign */}
      <section className="bg-gradient-to-r from-[#0b1222] via-[#111827] to-[#2d0a12] text-white border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber-300 font-semibold">
                <Flame size={14} />
                {featuredCampaign ? 'Campaign đang chạy' : 'Chiến dịch khuyến mãi'}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">
                {featuredCampaign
                  ? featuredCampaign.banner_text || featuredCampaign.name
                  : '11.11 · 12.12 · Black Friday'}
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                {featuredCampaign
                  ? `Đang giảm ${Math.round(Number(featuredCampaign.discount_percent))}% — kết thúc ${new Date(featuredCampaign.ends_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}.`
                  : 'Admin chưa kích hoạt campaign nào — danh sách dưới đây hiển thị giá niêm yết hiện tại.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(campaigns.length > 0
                ? campaigns.slice(0, 3).map((c) => c.banner_text || c.name)
                : ['11.11', '12.12', 'BLACK FRIDAY']
              ).map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl bg-white/10 border border-white/15 p-4">
              <p className="text-xs text-gray-200 mb-1">Mức giảm tốt nhất</p>
              <p className="text-lg font-bold inline-flex items-center gap-2">
                <Tag size={18} />
                {featuredCampaign
                  ? `−${Math.round(Number(featuredCampaign.discount_percent))}% trên ${featuredCampaign.scope === 'all' ? 'toàn shop' : featuredCampaign.scope === 'category' ? 'danh mục chỉ định' : 'sản phẩm chỉ định'}`
                  : 'Chưa có campaign'}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 p-4">
              <p className="text-xs text-gray-200 mb-1">Thời gian còn lại</p>
              <p className="text-lg font-bold inline-flex items-center gap-2 font-mono tabular-nums">
                <Clock3 size={18} />
                {featuredCampaign ? formatCountdown(featuredCountdownSec) : '00:00:00'}
              </p>
            </div>
            <Link href="/promotions" className="rounded-xl bg-amber-400 text-gray-900 font-semibold p-4 flex items-center justify-center hover:bg-amber-300 transition-colors">
              Xem toàn bộ chiến dịch khuyến mãi
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-60 rounded-xl bg-white/10 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flashProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Danh mục sản phẩm</h2>
          <Link href="/products" className="text-primary text-sm flex items-center gap-1 hover:underline">
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map(({ name, slug, icon: Icon }) => (
            <Link key={slug} href={`/products?category=${slug}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon size={22} className="text-primary group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-medium text-gray-600 text-center">{name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Sản phẩm nổi bật</h2>
          <Link href="/products" className="text-primary text-sm flex items-center gap-1 hover:underline">
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-64 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      {/* Promo banner */}
      <div className="bg-primary-50 border-t border-primary-100">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { icon: '🚚', title: 'Miễn phí vận chuyển', desc: 'Cho đơn hàng từ 500.000đ' },
            { icon: '🔒', title: 'Bảo hành chính hãng', desc: 'Cam kết 12 tháng tại hãng' },
            { icon: '↩️', title: 'Đổi trả dễ dàng', desc: 'Trong vòng 7 ngày nếu lỗi' },
          ].map(item => (
            <div key={item.title}>
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </UserLayout>
  );
}
