import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { User } from '../types/user';
import { ApiError } from './api-types';
import { errorResponse, unauthorizedResponse } from './api-response';
import { getUserModel } from './db/models';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// JWT载荷接口
interface JwtPayload {
  _id: string;
  email: string;
  role: User['role'];
  iat?: number;
  exp?: number;
}

// 生成JWT token
export async function generateToken(user: Partial<User>): Promise<string> {
  return new SignJWT({
    _id: user._id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// 认证中间件
export async function authMiddleware(request: NextRequest) {
  try {
    // 从cookie中获取token
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      console.log('Token不存在');
      return { success: false, message: '未授权访问' };
    }

    // 验证token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub) {
      console.log('Token无效: 缺少sub字段');
      return { success: false, message: '无效的token' };
    }

    // 获取用户信息
    const User = getUserModel();
    const user = await User.findById(payload.sub).select('-password');
    
    if (!user) {
      console.log('用户不存在');
      return { success: false, message: '用户不存在' };
    }

    if (user.status !== 'active') {
      console.log('用户状态非活动');
      return { success: false, message: '账号已禁用' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('认证失败:', error);
    return { success: false, message: '认证失败' };
  }
}

// 角色验证中间件
export function checkRole(roles: User['role'][]) {
  return async (request: NextRequest) => {
    try {
      const authResult = await authMiddleware(request);
      if (!authResult.success) {
        throw new Error(authResult.message);
      }
      if (!roles.includes(authResult.user.role)) {
        throw new Error('无权访问此资源');
      }
      return authResult;
    } catch (error: any) {
      console.error('权限检查错误:', error);
      throw error;
    }
  };
}

// 工具函数：从请求中获取当前用户ID
export async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  const authResult = await authMiddleware(request);
  return authResult.success ? authResult.user._id : null;
}

// 工具函数：从请求中获取当前用户角色
export async function getCurrentUserRole(request: NextRequest): Promise<User['role'] | null> {
  const authResult = await authMiddleware(request);
  return authResult.success ? authResult.user.role : null;
} 