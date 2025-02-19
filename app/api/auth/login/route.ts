import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '../../../lib/db/models';
import { successResponse, errorResponse } from '../../../lib/api-response';
import { generateToken } from '../../../lib/auth';
import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';
import User from '@/models/user';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 添加数据库连接日志
    console.log('正在连接数据库...');
    await connectDB();
    console.log('数据库连接成功');
    
    const { email, password } = await request.json();
    console.log('收到登录请求:', { email });

    // 查找用户
    const user = await User.findOne({ email }).select('+password');  // 确保选中password字段
    console.log('查询用户结果:', user ? '用户存在' : '用户不存在');

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 401 }
      );
    }

    // 验证密码
    console.log('正在验证密码...');
    const isMatch = await compare(password, user.password);
    console.log('密码验证结果:', isMatch ? '密码正确' : '密码错误');

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: '密码错误' },
        { status: 401 }
      );
    }

    // 生成 JWT token
    console.log('正在生成 token...');
    const token = await generateToken({
      _id: user._id,
      email: user.email,
      role: user.role
    });
    console.log('Token 生成成功');

    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      }
    });

    // 设置 cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60
    });

    return response;

  } catch (error: any) {
    // 改进错误日志
    console.error('登录失败，详细错误:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // 返回更具体的错误信息
    return NextResponse.json(
      { 
        success: false, 
        message: '登录失败: ' + (error.message || '未知错误'),
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 