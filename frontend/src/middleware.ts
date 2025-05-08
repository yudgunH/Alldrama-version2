import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Định nghĩa các route cần bảo vệ (yêu cầu đăng nhập)
const PROTECTED_ROUTES = [
  '/favorites',
  '/profile',
  '/watch-history',
];

// Định nghĩa các route chỉ dành cho guest (không cho phép đã đăng nhập)
const GUEST_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// Định nghĩa các route chỉ dành cho admin
const ADMIN_ROUTES = [
  '/admin',
];

// Interface cho JWT payload
interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  exp: number;
  iat: number;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lấy access token từ cookie (được lưu bởi client)
  const accessToken = request.cookies.get('accessToken')?.value;
  
  // Lấy refresh token từ cookies (HTTP-only)
  const refreshToken = request.cookies.get('refreshToken')?.value;
  
  let isAuthenticated = false;
  let isAdmin = false;
  let tokenExpired = false;
  
  // Kiểm tra xem người dùng đã đăng nhập chưa và token có hợp lệ không
  if (accessToken) {
    try {
      // Giải mã token để kiểm tra
      const decodedToken = jwtDecode<JwtPayload>(accessToken);
      
      // Kiểm tra thời hạn của token
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp > currentTime) {
        isAuthenticated = true;
        // Kiểm tra quyền admin
        isAdmin = decodedToken.role === 'admin';
      } else {
        // Token đã hết hạn, nhưng vẫn có refresh token
        tokenExpired = true;
      }
    } catch (error) {
      // Token không hợp lệ, không xác thực
      console.error('Invalid token:', error);
    }
  }
  
  // Nếu token hết hạn nhưng có refresh token, đặt cookie để client xử lý refresh token
  if (tokenExpired && refreshToken && !pathname.includes('/api/auth/refresh')) {
    // Thay vì redirect, trả về response với thông tin token expired để client xử lý
    const response = NextResponse.next();
    
    // Đặt cookie để client-side code biết là cần refresh token
    response.cookies.set('needsTokenRefresh', 'true', { 
      maxAge: 60, // 1 phút
      path: '/',
      sameSite: 'strict'
    });
    
    // Lưu đường dẫn hiện tại để redirect sau khi refresh token
    response.cookies.set('redirectTo', pathname, { 
      httpOnly: true,
      maxAge: 60, // 1 phút
      path: '/',
      sameSite: 'strict'
    });
    
    return response;
  }
  
  // Redirect guest khỏi protected routes
  if (!isAuthenticated && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Lưu URL gốc để sau khi đăng nhập xong sẽ redirect lại
    response.cookies.set('redirectAfterLogin', pathname, {
      httpOnly: true,
      maxAge: 60 * 5, // 5 phút
      path: '/',
      sameSite: 'strict'
    });
    return response;
  }
  
  // Redirect logged-in users khỏi guest routes
  if (isAuthenticated && GUEST_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Redirect non-admin khỏi admin routes
  if (!isAdmin && ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except for:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. Các static files (fonts, images, etc.)
     */
    '/((?!api|_next|_static|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)',
  ],
}; 