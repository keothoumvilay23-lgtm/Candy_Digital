'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BadgePercent,
  Clock,
  Flame,
  Gift,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import PromotionalProductCard from '@/components/product/PromotionalProductCard';
import api from '@/lib/api';

interface CampaignTarget {
  target_type: 'category' | 'product';
  target_id: number;
  label: string;
}

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
  priority: number;
  status: 'running' | 'scheduled' | 'ended' | 'disabled';
  targets: CampaignTarget[];
}

const FALLBACK_TAGS = ["11.11 · Single's Day", '12.12 · Year-End Sale', 'BLACK FRIDAY', 'Cyber Week · Tech'];
const MARQUEE_ITEMS = ['BLACK FRIDAY', 'FLASH SALE', '11.11', '12.12', 'CAMPAIGN ACTIVE', 'TECH DEALS'];

function formatHms(sec: number) {
  if (sec <= 0) return '00:00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

export default function PromotionsClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagIdx, setTagIdx] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/products?limit=24&sort=newest').then(({ data }) => data.data as any[]).catch(() => []),
      api.get('/promotions/active').then(({ data }) => data.data as Campaign[]).catch(() => []),
    ])
      .then(([prodData, campaignData]) => {
        setProducts(prodData);
        setCampaigns(campaignData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Cycle các tag chiến dịch (lấy banner_text các campaign đang chạy nếu có).
  const rotatingTags = campaigns.length
    ? campaigns.map((c) => c.banner_text || c.name)
    : FALLBACK_TAGS;

  useEffect(() => {
    const t = window.setInterval(() => setTagIdx((i) => (i + 1) % rotatingTags.length), 4200);
    return () => window.clearInterval(t);
  }, [rotatingTags.length]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Campaign nổi bật: campaign giảm sâu nhất đang chạy + còn thời gian.
  const featuredCampaign = useMemo(() => {
    if (!campaigns.length) return null;
    return [...campaigns].sort(
      (a, b) => Number(b.discount_percent) - Number(a.discount_percent)
    )[0];
  }, [campaigns]);

  const featuredCountdownSec = useMemo(() => {
    if (!featuredCampaign) return 0;
    const ends = new Date(featuredCampaign.ends_at).getTime();
    return Math.max(0, Math.floor((ends - now) / 1000));
  }, [featuredCampaign, now]);

  const promoProducts = useMemo(
    () => products.filter((p) => Number(p.discount_percent) > 0),
    [products]
  );

  const displayProducts = promoProducts.length > 0 ? promoProducts : products;

  const marqueeSpans = useMemo(
    () => (
      <>
        <div className="flex shrink-0 items-center gap-10 px-6">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
            <span key={`a-${i}`} className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/95">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,197,66,0.9)]" />
              {t}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-10 px-6">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
            <span key={`b-${i}`} className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/95">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,197,66,0.9)]" />
              {t}
            </span>
          ))}
        </div>
      </>
    ),
    []
  );

  const headlinePercent = featuredCampaign
    ? Math.round(Number(featuredCampaign.discount_percent))
    : null;

  return (
    <UserLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#07070c] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 50h100M50 0v100' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill='url(%23g)' width='100%25' height='100%25'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-rose-600/25 blur-[100px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-[380px] w-[380px] rounded-full bg-amber-500/14 blur-[100px]" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-14 md:flex-row md:items-center md:justify-between md:py-20">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-200/90 backdrop-blur-sm">
              <Sparkles size={13} className="text-amber-400 animate-promo-pulse-soft" aria-hidden />
              <span>
                {featuredCampaign
                  ? `Đang diễn ra: ${featuredCampaign.banner_text || featuredCampaign.name}`
                  : 'Hiện chưa có chiến dịch nào đang chạy'}
              </span>
            </div>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight md:text-5xl lg:text-[3.35rem]">
              <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                CANDY DIGITAL{' '}
              </span>
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                CAMPAIGN
              </span>
            </h1>

            <p className="mt-2 min-h-[1.75rem] text-sm font-medium text-rose-400/95 transition-opacity duration-500 md:text-base">
              {rotatingTags[tagIdx]}
            </p>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-zinc-400">
              {featuredCampaign
                ? featuredCampaign.description ||
                  `Đợt khuyến mãi ${featuredCampaign.name} đang được áp dụng: giảm ${headlinePercent}% trên giá niêm yết. Giá hiển thị ở các thẻ sản phẩm bên dưới đã trừ khuyến mãi.`
                : 'Admin có thể tạo các chiến dịch 11.11, 12.12, Black Friday hoặc bất kỳ đợt giảm giá tuỳ chỉnh nào trong trang quản trị. Khi có chiến dịch đang chạy, % giảm và banner sẽ được hiển thị tự động ở đây.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 backdrop-blur-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Clock size={22} aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Kết thúc trong</p>
                  <p className="font-mono text-xl font-bold tabular-nums tracking-wide text-white md:text-2xl">
                    {formatHms(featuredCountdownSec)}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {featuredCampaign
                      ? new Date(featuredCampaign.ends_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                      : 'Chưa có campaign'}
                  </p>
                </div>
              </div>

              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white px-6 py-3.5 text-sm font-semibold text-gray-900 shadow-xl transition hover:bg-zinc-100"
              >
                <ShoppingBag size={18} />
                Xem tất cả sản phẩm
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-md flex-col gap-4 md:mx-0">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-[1px] shadow-2xl">
              <div className="rounded-[calc(1.5rem-1px)] bg-[#101018]/90 p-6 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">Mức giảm tốt nhất</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {headlinePercent ? `Đến −${headlinePercent}%` : 'Chưa có chiến dịch'}
                    </p>
                  </div>
                  <BadgePercent size={38} strokeWidth={1.75} className="text-rose-400" aria-hidden />
                </div>
                <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                  <li className="flex gap-3">
                    <Zap size={17} className="mt-0.5 shrink-0 text-amber-400" />
                    {featuredCampaign
                      ? `Áp dụng cho phạm vi: ${featuredCampaign.scope === 'all' ? 'toàn shop' : featuredCampaign.scope === 'category' ? 'danh mục chỉ định' : 'sản phẩm chỉ định'}.`
                      : 'Khi có chiến dịch đang chạy, danh sách sản phẩm sẽ tự động hiển thị giá đã giảm.'}
                  </li>
                  <li className="flex gap-3">
                    <Flame size={17} className="mt-0.5 shrink-0 text-orange-400" />
                    {campaigns.length > 1
                      ? `Đang có ${campaigns.length} chiến dịch song song. Hệ thống chọn campaign tốt nhất cho mỗi sản phẩm.`
                      : 'Mỗi sản phẩm chỉ áp đúng 1 campaign tốt nhất theo thứ tự ưu tiên.'}
                  </li>
                  <li className="flex gap-3">
                    <Gift size={17} className="mt-0.5 shrink-0 text-rose-400" />
                    Giá khuyến mãi sẽ được khoá tại thời điểm thêm giỏ hàng — không lo bị đổi giá lúc thanh toán.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-amber-500/25 bg-black">
        <div className="overflow-hidden py-3">
          <div className="flex w-max animate-promo-marquee">{marqueeSpans}</div>
        </div>
      </div>

      {/* Active campaigns */}
      <section className="relative border-b border-zinc-200 bg-[#faf9f7]">
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-14">
          <div className="mb-8 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">Campaign đang chạy</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              {campaigns.length} chiến dịch khuyến mãi đang áp dụng
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Mỗi card bên dưới là một đợt khuyến mãi do admin cấu hình từ database. Hệ thống tự động kiểm tra
              khoảng thời gian, % giảm và phạm vi áp dụng để hiển thị giá thực ở các trang sản phẩm.
            </p>
          </div>

          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
              <p className="text-base font-medium">Hiện không có chiến dịch nào đang chạy.</p>
              <p className="mt-1 text-sm">Admin có thể tạo chiến dịch mới trong trang quản trị.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => {
                const ends = new Date(c.ends_at).getTime();
                const sec = Math.max(0, Math.floor((ends - now) / 1000));
                return (
                  <div
                    key={c.id}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_40px_80px_-48px_rgba(0,0,0,0.35)] transition hover:border-gray-300"
                  >
                    <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 opacity-[0.12] blur-2xl" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-500">
                            {c.banner_text || c.name}
                          </p>
                          <p className="mt-1 text-lg font-black text-gray-900">{c.name}</p>
                        </div>
                        <span className="shrink-0 rounded-xl bg-gray-900 px-3 py-1.5 text-sm font-bold text-amber-300">
                          −{Math.round(Number(c.discount_percent))}%
                        </span>
                      </div>
                      {c.description && <p className="mt-3 text-sm text-gray-600">{c.description}</p>}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-[11px]">
                        <div>
                          <p className="uppercase tracking-wider text-gray-400">Phạm vi</p>
                          <p className="font-semibold text-gray-700">
                            {c.scope === 'all' ? 'Toàn shop' : c.scope === 'category' ? 'Theo danh mục' : 'Theo sản phẩm'}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase tracking-wider text-gray-400">Còn lại</p>
                          <p className="font-mono font-semibold text-gray-700 tabular-nums">{formatHms(sec)}</p>
                        </div>
                      </div>
                      {c.targets.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.targets.slice(0, 4).map((t) => (
                            <span key={`${t.target_type}-${t.target_id}`} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                              {t.label}
                            </span>
                          ))}
                          {c.targets.length > 4 && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                              +{c.targets.length - 4} mục khác
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Product grid */}
      <section className="bg-[#ebe8e4] pb-16 pt-14 md:pb-24 md:pt-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">Sản phẩm đang giảm</h2>
              <p className="mt-2 text-sm text-gray-600 md:text-[15px]">
                {promoProducts.length > 0
                  ? `Có ${promoProducts.length} sản phẩm đang được giảm giá theo các campaign hiện hành.`
                  : 'Hiện chưa có sản phẩm nào nằm trong campaign — danh sách dưới đây hiển thị giá niêm yết hiện tại.'}
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Về trang catalog
              <ShoppingBag size={16} />
            </Link>
          </div>

          <p className="mb-8 text-[11px] leading-relaxed text-gray-500">
            * Giá gạch ngang là giá niêm yết được lưu trong database. % giảm được lấy theo campaign do admin cấu
            hình, không phải hệ số quy ước. Giá thực thu áp dụng tại thời điểm thêm giỏ hàng.
          </p>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-[340px] rounded-2xl bg-zinc-300/55 animate-pulse" />
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-400/60 bg-white/60 py-24 text-center text-gray-500">
              <p className="text-lg font-medium">Chưa có sản phẩm — vui lòng thử lại sau.</p>
              <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-primary underline">
                Quay về cửa hàng
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {displayProducts.map((p) => (
                <PromotionalProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom stripe */}
      <section className="border-t border-amber-500/35 bg-[#09090e] px-4 py-10 text-center text-white md:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-500/95">Mega season</p>
        <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold md:text-xl">
          Black Friday · 11.11 · 12.12 — chỉ trong một trang Candy Digital của bạn
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-3 text-sm font-bold text-black shadow-lg transition hover:brightness-110"
        >
          Khám phá trang chủ
        </Link>
      </section>
    </UserLayout>
  );
}
