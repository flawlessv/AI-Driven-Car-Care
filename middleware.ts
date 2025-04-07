import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 允许登录和注册API以及特定公开API
  if (
    pathname.startsWith('/api/auth/') || 
    pathname.startsWith('/api/appointments')
  ) {
    return NextResponse.next();
  }

  // 获取 token
  const token = request.cookies.get('token')?.value;

  // 如果是登出后的重定向，直接放行
  if (pathname === '/login' && request.headers.get('x-from-logout')) {
    return NextResponse.next();
  }

  // 处理API请求的认证
  if (pathname.startsWith('/api/')) {
    if (!token) {
      console.log('API请求未授权:', pathname);
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    return NextResponse.next();
  }

  // 处理受保护路由
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 处理登录页
  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 处理根路径
  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/api/:path*'
  ],
}; 