import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { getUserModel } from '@/app/lib/db/models';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { hash } from 'bcryptjs';
import { verificationCodes } from '../send-verification/route';

export async function POST(request: NextRequest) {
  try {
    // 连接数据库
    await connectDB();

    // 解析请求数据
    const data = await request.json();
    const { email, verificationCode, newPassword } = data;

    // 验证必填字段
    if (!email || !verificationCode || !newPassword) {
      return errorResponse('邮箱、验证码和新密码不能为空', 400);
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return errorResponse('新密码长度不能小于6位', 400);
    }

    // 验证验证码
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

    // 获取用户信息
    const User = getUserModel();
    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    // 加密新密码
    const hashedPassword = await hash(newPassword, 10);

    // 更新密码
    user.password = hashedPassword;
    await user.save();

    // 删除已使用的验证码
    delete verificationCodes[email];

    // 返回成功响应
    return successResponse({ message: '密码重置成功' });

  } catch (error) {
    console.error('重置密码失败:', error);
    return errorResponse('重置密码失败', 500);
  }
} 