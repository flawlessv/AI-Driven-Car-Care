import { compare, hash } from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getUserModel } from './db/models';
import { connectDB } from './mongodb';
import { errorResponse } from './api-response';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const TOKEN_EXPIRES_IN = '7d';

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10);
}

// 密码验证
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword);
}

// 生成JWT token
export async function generateToken(user: any) {
  const token = await new SignJWT({ 
    sub: user._id,
    username: user.username,
    role: user.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRES_IN)
    .sign(JWT_SECRET);

  return token;
}

// 验证token中间件
export async function authMiddleware(request: NextRequest) {
  try {
    // 从cookie中获取token
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { success: false, message: '未登录' };
    }

    // 验证token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub) {
      return { success: false, message: 'token无效' };
    }

    // 获取用户信息
    const User = getUserModel();
    const user = await User.findById(payload.sub).select('-password');
    
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    return { 
      success: true, 
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    };

  } catch (error) {
    console.error('验证token失败:', error);
    return { success: false, message: 'token验证失败' };
  }
}

// 检查用户角色
export function checkRole(roles: string[]) {
  return async (request: NextRequest) => {
    const authResult = await authMiddleware(request);
    
    if (!authResult) {
      return errorResponse('未授权访问', 401);
    }

    if (!roles.includes(authResult.user.role)) {
      return errorResponse('无权访问', 403);
    }

    return authResult;
  };
}

export function setAuthCookie(token: string) {
  cookies().set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

export function clearAuthCookie() {
  cookies().delete('token');
} 