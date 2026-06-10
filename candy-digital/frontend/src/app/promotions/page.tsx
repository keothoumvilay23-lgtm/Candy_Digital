import type { Metadata } from 'next';
import PromotionsClient from './PromotionsClient';

export const metadata: Metadata = {
  title: 'Khuyến mãi · Flash Sale | Candy Digital',
  description:
    'Black Friday · 11.11 · 12.12 — ưu đãi đến 30%, deal nóng điện thoại và phụ kiện chính hãng tại Candy Digital.',
};

export default function PromotionsPage() {
  return <PromotionsClient />;
}
