import {  NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // 清除所有相关的 cookies
    const cookieStore = cookies();
    cookieStore.delete('token');
    cookieStore.delete('refresh_token');
    // 可以添加其他需要清除的 cookies

    return NextResponse.json({ 
      success: true,
      message: '退出登录成功' 
    });
  } catch (error) {
    console.error('退出登录失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '退出登录失败' 
      },
      { status: 500 }
    );
  }
} 