/** @type {import('next').NextConfig} */
// Khi chạy 2 process `next dev` (khách 3000 + admin 3001) trên máy, chúng không được
// dùng chung thư mục `.next` (cạnh tranh ghi file → bundle lỗi, 404 trên Windows).
// Nên CHỈ tách thư mục ở chế độ dev. Khi build production (vd trên Vercel) thì dùng
// `.next` mặc định để nền tảng deploy tìm đúng output.
const isDev = process.env.NODE_ENV !== 'production';
const appMode = (process.env.NEXT_PUBLIC_APP_MODE || 'customer').toLowerCase();
const distDir = isDev ? (appMode === 'admin' ? '.next-admin' : '.next-customer') : '.next';

const nextConfig = {
  distDir,
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
