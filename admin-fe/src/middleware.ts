import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Kiểm tra token từ cookie
  const token = request.cookies.get("token")?.value
  const isLoggedIn = !!token

  // Nếu đang truy cập trang đăng nhập và đã đăng nhập, chuyển hướng về trang chủ
  if (request.nextUrl.pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Nếu đang truy cập các trang khác và chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (request.nextUrl.pathname !== "/login" && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

// Chỉ áp dụng middleware cho các đường dẫn sau
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

