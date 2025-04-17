/**
 * 认证工具函数库
 * 
 * 这个文件包含了处理用户认证、密码加密和权限验证的各种工具函数
 * 它是整个系统安全机制的核心部分，保护用户数据和系统功能不被非法访问
 */

// 导入密码加密和比较函数，用于安全地处理密码
import { compare, hash } from 'bcryptjs';
// 导入JWT（JSON Web Token）相关函数，用于生成和验证认证令牌
import { jwtVerify, SignJWT } from 'jose';
// 导入cookies功能，用于操作浏览器cookie
import { cookies } from 'next/headers';
// 导入Next.js请求类型，用于处理HTTP请求
import { NextRequest } from 'next/server';
// 导入获取用户模型的函数，用于数据库操作
import { getUserModel } from './db/models';
// 导入数据库连接函数
import { connectDB } from './mongodb';
// 导入错误响应生成函数
import { errorResponse } from './api-response';

/**
 * JWT密钥
 * 使用环境变量中的JWT_SECRET或默认值创建一个密钥
 * 这个密钥用于签名和验证JWT令牌，保证令牌不被篡改
 */
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * 令牌过期时间
 * 设置为7天，表示令牌在生成后7天内有效
 */
const TOKEN_EXPIRES_IN = '7d';

/**
 * 密码加密函数
 * 
 * 将用户的明文密码转换为安全的哈希值，防止密码泄露
 * 
 * @param {string} password - 用户的明文密码
 * @returns {Promise<string>} 返回加密后的密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  // 使用bcryptjs库的hash函数加密密码，10是"盐"的复杂度，越高越安全但也越耗费资源
  return await hash(password, 10);
}

/**
 * 密码验证函数
 * 
 * 比较用户输入的密码和数据库中存储的加密密码是否匹配
 * 
 * @param {string} password - 用户输入的明文密码
 * @param {string} hashedPassword - 数据库中存储的加密密码
 * @returns {Promise<boolean>} 如果密码匹配返回true，否则返回false
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // 使用bcryptjs库的compare函数安全地比较密码
  return await compare(password, hashedPassword);
}

/**
 * 生成JWT令牌函数
 * 
 * 为用户创建一个包含其身份信息的认证令牌，用于后续请求的身份验证
 * 
 * @param {any} user - 用户对象，包含用户ID、用户名和角色等信息
 * @returns {Promise<string>} 返回生成的JWT令牌
 */
export async function generateToken(user: any) {
  // 使用SignJWT创建一个新的JWT
  const token = await new SignJWT({ 
    sub: user._id,           // 令牌主题，设置为用户ID
    username: user.username, // 用户名
    role: user.role          // 用户角色
  })
    .setProtectedHeader({ alg: 'HS256' })  // 设置加密算法为HS256
    .setIssuedAt()                        // 设置令牌的签发时间为当前时间
    .setExpirationTime(TOKEN_EXPIRES_IN)  // 设置令牌的过期时间
    .sign(JWT_SECRET);                    // 使用密钥签名令牌

  // 返回生成的令牌
  return token;
}

/**
 * 验证令牌中间件
 * 
 * 检查请求中的令牌是否有效，并获取对应的用户信息
 * 
 * @param {NextRequest} request - Next.js请求对象
 * @returns {Promise<{success: boolean, message?: string, user?: any}>} 返回验证结果，包含成功标志和可能的用户信息
 */
export async function authMiddleware(request: NextRequest) {
  try {
    // 从cookie中获取认证令牌
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    // 如果没有令牌，返回未登录错误
    if (!token) {
      return { success: false, message: '未登录' };
    }

    // 验证令牌的有效性
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // 如果令牌中没有用户ID，返回无效令牌错误
    if (!payload.sub) {
      return { success: false, message: 'token无效' };
    }

    // 从数据库中获取用户信息
    const User = getUserModel();
    // 根据令牌中的用户ID查找用户，不返回密码字段
    const user = await User.findById(payload.sub).select('-password');
    
    // 如果找不到用户，返回用户不存在错误
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    // 返回验证成功结果和用户信息
    return { 
      success: true, 
      user: {
        _id: user._id,            // 用户ID
        username: user.username,  // 用户名
        role: user.role,          // 用户角色
        email: user.email         // 用户邮箱
      }
    };

  } catch (error) {
    // 捕获并处理验证过程中的任何错误
    console.error('验证token失败:', error);
    return { success: false, message: 'token验证失败' };
  }
}

/**
 * 检查用户角色函数
 * 
 * 创建一个中间件，用于检查用户是否具有特定角色的访问权限
 * 
 * @param {string[]} roles - 允许访问的角色数组
 * @returns {Function} 返回一个中间件函数，用于在请求处理前验证用户角色
 */
export function checkRole(roles: string[]) {
  // 返回一个接收请求的函数
  return async (request: NextRequest) => {
    // 先使用authMiddleware验证用户身份
    const authResult = await authMiddleware(request);
    
    // 如果验证失败，返回未授权错误
    if (!authResult) {
      return errorResponse('未授权访问', 401);
    }

    // 如果用户角色不在允许的角色列表中，返回无权访问错误
    if (!roles.includes(authResult.user.role)) {
      return errorResponse('无权访问', 403);
    }

    // 验证通过，返回验证结果
    return authResult;
  };
}

/**
 * 设置认证Cookie函数
 * 
 * 将认证令牌存储在HTTP-only cookie中，增加安全性
 * 
 * @param {string} token - 要存储的认证令牌
 */
export function setAuthCookie(token: string) {
  // 设置名为'token'的cookie
  cookies().set('token', token, {
    httpOnly: true,                               // 只允许服务器访问此cookie，防止客户端JavaScript读取
    secure: process.env.NODE_ENV === 'production', // 在生产环境中只通过HTTPS发送
    sameSite: 'lax',                              // 跨站请求时的发送策略
    maxAge: 7 * 24 * 60 * 60,                     // cookie的有效期为7天（秒）
    path: '/'                                     // 适用于所有路径
  });
}

/**
 * 清除认证Cookie函数
 * 
 * 删除存储认证令牌的cookie，用于用户登出
 */
export function clearAuthCookie() {
  // 删除名为'token'的cookie
  cookies().delete('token');
} 