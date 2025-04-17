/**
 * 中间件文件
 * 
 * 这个文件处理所有进入应用的HTTP请求，进行认证检查和路由控制
 * 中间件相当于一个守卫，决定请求是否可以继续处理或需要重定向
 */

// 导入Next.js响应处理工具
import { NextResponse } from 'next/server';
// 导入Next.js请求类型定义
import type { NextRequest } from 'next/server';

/**
 * 中间件函数 - 处理所有经过配置的路由请求
 * 
 * @param {NextRequest} request - 传入的请求对象，包含URL、头信息、cookie等
 * @returns {NextResponse} 返回处理后的响应或放行指示
 */
export function middleware(request: NextRequest) {
  // 从请求URL中获取路径
  const { pathname } = request.nextUrl;
  
  /**
   * 对某些API路径直接放行，不需要进行认证检查
   * 包括：
   * - 认证相关API（登录、注册等）
   * - 预约相关API（公开可用）
   * - 特定的工单API（状态查询、完工证明、审批等）
   */
  if (
    pathname.startsWith('/api/auth/') || 
    pathname.startsWith('/api/appointments') ||
    pathname === '/api/work-orders/convert-from-appointment' ||
    pathname.includes('/api/work-orders/') && (
      pathname.includes('/status') || 
      pathname.includes('/completion-proof') ||
      pathname.includes('/approve')
    )
  ) {
    // 放行请求，不做任何处理
    return NextResponse.next();
  }

  // 从cookie中获取认证令牌
  const token = request.cookies.get('token')?.value;

  /**
   * 特殊情况处理：登出后重定向到登录页
   * 如果请求头中有x-from-logout标记，表示是登出后的重定向，直接放行
   */
  if (pathname === '/login' && request.headers.get('x-from-logout')) {
    return NextResponse.next();
  }

  /**
   * API请求的认证处理
   * 如果请求路径以'/api/'开头，表示这是一个API请求
   */
  if (pathname.startsWith('/api/')) {
    // 如果没有令牌，返回401未授权错误
    if (!token) {
      console.log('API请求未授权:', pathname);
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { 
          status: 401,  // HTTP状态码：401 Unauthorized
          headers: {
            'Content-Type': 'application/json',  // 内容类型
          }
        }
      );
    }
    // 有令牌，放行请求
    return NextResponse.next();
  }

  /**
   * 仪表盘页面的访问控制
   * 仪表盘及其子页面属于受保护路由，需要认证后才能访问
   */
  if (pathname.startsWith('/dashboard')) {
    // 如果没有令牌，重定向到登录页
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  /**
   * 登录页的访问控制
   * 防止已登录用户再次访问登录页
   */
  if (pathname === '/login') {
    // 如果有令牌（已登录），重定向到仪表盘
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  /**
   * 根路径的访问控制
   * 访问网站根目录时，根据登录状态重定向
   */
  if (pathname === '/') {
    // 根据是否有令牌决定重定向到仪表盘还是登录页
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', request.url));
  }

  // 其他情况，放行请求
  return NextResponse.next();
}

/**
 * 中间件配置
 * 
 * matcher数组定义了中间件会处理哪些路径的请求：
 * - '/'：网站根路径
 * - '/login'：登录页
 * - '/register'：注册页
 * - '/dashboard/:path*'：仪表盘及其所有子页面
 * - '/api/:path*'：所有API路径
 */
export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/api/:path*'
  ],
}; 