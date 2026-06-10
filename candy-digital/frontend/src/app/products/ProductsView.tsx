'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import ProductCard from '@/components/product/ProductCard';
import api from '@/lib/api';

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc' },
  { label: 'Tên A-Z', value: 'name_asc' },
];

export default function ProductsView() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '12', page: String(page), sort });
    if (category) params.set('category', category);
    if (search) params.set('search', search);

    api.get(`/products?${params}`).then(({ data }) => {
      setProducts(data.data);
      setPagination(data.pagination);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category, search, sort, page]);

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {search ? `Kết quả tìm kiếm: "${search}"` : category ? 'Danh mục sản phẩm' : 'Tất cả sản phẩm'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{pagination.total} sản phẩm</p>
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gray-500" />
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filter */}
          <aside className="w-52 flex-shrink-0 hidden md:block">
            <div className="card p-4 sticky top-20">
              <h3 className="font-medium text-gray-800 mb-3">Danh mục</h3>
              <ul className="space-y-1">
                <li>
                  <a href="/products" className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!category ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Tất cả
                  </a>
                </li>
                {categories.map((cat: any) => (
                  <li key={cat.id}>
                    <a href={`/products?category=${cat.slug}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${category === cat.slug ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {cat.name}
                    </a>
                    {cat.children?.map((child: any) => (
                      <a key={child.id} href={`/products?category=${child.slug}`}
                        className={`block pl-6 pr-3 py-1.5 rounded-lg text-xs transition-colors ${category === child.slug ? 'text-primary font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
                        — {child.name}
                      </a>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => <div key={i} className="card h-64 animate-pulse bg-gray-100" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-5xl mb-4">😕</p>
                <p className="text-lg">Không tìm thấy sản phẩm nào</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button key={i} onClick={() => setPage(i + 1)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
