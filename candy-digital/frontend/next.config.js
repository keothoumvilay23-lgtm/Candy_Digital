/** @type {import('next').NextConfig} */
// Hai process `next dev` (khách 3000 + admin 3001) không được dùng chung một thư mục `.next`:
// cạnh tranh ghi file → bundle lỗi, 404, lỗi cache webpack (Windows).
const appMode = (process.env.NEXT_PUBLIC_APP_MODE || 'customer').toLowerCase();
const distDir = appMode === 'admin' ? '.next-admin' : '.next-customer';

const nextConfig = {
  distDir,
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
