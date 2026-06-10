import { NextRequest, NextResponse } from 'next/server';

// Mode được set bởi npm script (dev:customer / dev:admin) qua biến NEXT_PUBLIC_APP_MODE.
// Mặc định là 'customer' nếu không có (chạy `npm run dev:customer` ở port 3000).
const APP_MODE = (process.env.NEXT_PUBLIC_APP_MODE || 'customer').toLowerCase();

// Các tiền tố luôn được phép trên cả 2 mode (auth, tài nguyên Next, file tĩnh)
const ALWAYS_ALLOWED_PREFIXES = ['/auth', '/_next', '/favicon', '/logo', '/uploads'];

const isAlwaysAllowed = (pathname: string) =>
  ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== Admin app (port 3001) =====
  // Chỉ cho phép /admin/* và /auth/*. Mọi route khác → redirect /admin
  if (APP_MODE === 'admin') {
    if (pathname.startsWith('/admin') || isAlwaysAllowed(pathname)) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  // ===== Customer app (port 3000) =====
  // Chặn /admin/* trên app khách hàng → redirect về trang chủ
  if (pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Bỏ qua các tài nguyên tĩnh để middleware không chạy thừa
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp|js|css|woff|woff2|map)$).*)'],
};
