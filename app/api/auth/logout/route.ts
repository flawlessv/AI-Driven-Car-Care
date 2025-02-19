import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '../../../lib/auth';
import { successResponse } from '../../../lib/api-response';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // 创建基本响应
    const response = NextResponse.json({
      success: true,
      message: '退出登录成功'
    });

    // 清除所有 cookies
    allCookies.forEach(cookie => {
      cookieStore.delete(cookie.name);
    });

    // 使用多种方式清除 token
    const cookieOptions = {
      maxAge: 0,
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };

    response.cookies.set('token', '', cookieOptions);

    // 添加多个 Set-Cookie 头以确保清除
    const clearCookieHeaders = [
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      'token=; Path=/; Max-Age=0; HttpOnly',
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=localhost; HttpOnly',
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=.localhost; HttpOnly'
    ];

    clearCookieHeaders.forEach(header => {
      response.headers.append('Set-Cookie', header);
    });

    // 设置缓存控制头
    response.headers.set('Clear-Site-Data', '"cookies", "storage", "cache", "executionContexts"');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: '退出登录失败' },
      { status: 500 }
    );
  }
} 