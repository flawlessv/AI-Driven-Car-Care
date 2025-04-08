import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { verificationCodes } from '../send-verification/route';

export async function POST(request: NextRequest) {
  try {
    // 解析请求数据
    const { email, verificationCode } = await request.json();

    // 验证必填字段
    if (!email || !verificationCode) {
      return errorResponse('邮箱和验证码不能为空', 400);
    }

    // 检查验证码是否存在
    const storedData = verificationCodes[email];
    if (!storedData) {
      return errorResponse('验证码不存在或已过期，请重新获取', 400);
    }

    // 检查验证码是否过期
    if (Date.now() > storedData.expiry) {
      // 删除过期验证码
      delete verificationCodes[email];
      return errorResponse('验证码已过期，请重新获取', 400);
    }

    // 检查验证码是否正确
    if (storedData.code !== verificationCode) {
      return errorResponse('验证码错误', 400);
    }

    // 验证通过后不删除验证码，留给重置密码API使用
    // 但更新一下过期时间，给用户多一些时间完成重置密码
    verificationCodes[email].expiry = Date.now() + 5 * 60 * 1000; // 再延长5分钟

    // 返回成功响应
    return successResponse({ message: '验证成功' });

  } catch (error) {
    console.error('验证码验证失败:', error);
    return errorResponse('验证失败', 500);
  }
} 