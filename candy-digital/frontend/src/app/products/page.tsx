import { Suspense } from 'react';
import UserLayout from '@/components/layout/UserLayout';
import ProductsView from './ProductsView';

function ProductsLoadingFallback() {
  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-100 rounded-lg animate-pulse hidden sm:block" />
        </div>
        <div className="flex gap-6">
          <aside className="w-52 flex-shrink-0 hidden md:block">
            <div className="card p-4 space-y-3">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </aside>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="card h-64 animate-pulse bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoadingFallback />}>
      <ProductsView />
    </Suspense>
  );
}
