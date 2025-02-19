import { NextRequest } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { getUserModel } from '../../../lib/db/models';
import { successResponse, errorResponse } from '../../../lib/api-response';
import { authMiddleware } from '../../../lib/auth';
import { hash, compare } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }

    // 连接数据库
    await connectDB();

    // 解析请求数据
    const data = await request.json();
    const { oldPassword, newPassword } = data;

    // 验证必填字段
    if (!oldPassword || !newPassword) {
      return errorResponse('旧密码和新密码不能为空', 400);
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return errorResponse('新密码长度不能小于6位', 400);
    }

    // 获取用户信息(包含密码字段)
    const User = getUserModel();
    const user = await User.findById(authResult.user._id).select('+password');

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    // 验证旧密码
    const isValid = await compare(oldPassword, user.password);
    if (!isValid) {
      return errorResponse('旧密码错误', 400);
    }

    // 加密新密码
    const hashedPassword = await hash(newPassword, 10);

    // 更新密码
    user.password = hashedPassword;
    await user.save();

    // 返回成功响应
    return successResponse({ message: '密码修改成功' });

  } catch (error) {
    console.error('修改密码失败:', error);
    return errorResponse('修改密码失败', 500);
  }
} 