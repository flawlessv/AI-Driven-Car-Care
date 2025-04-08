import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/db/models';
import { successResponse, errorResponse } from '@/lib/api-response';
import { hash, compare } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // 连接数据库
    await connectDB();

    // 解析请求数据
    const data = await request.json();
    const { email, oldPassword, newPassword } = data;

    console.log('修改密码请求:', { email, passwordLength: oldPassword?.length });

    // 验证必填字段
    if (!email || !oldPassword || !newPassword) {
      return errorResponse('邮箱、旧密码和新密码不能为空', 400);
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return errorResponse('新密码长度不能小于6位', 400);
    }

    // 查找用户
    const User = getUserModel();
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('用户不存在:', email);
      return errorResponse('用户不存在', 404);
    }

    console.log('找到用户:', { 
      userId: user._id, 
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    // 验证旧密码
    const isValid = await compare(oldPassword, user.password);
    console.log('旧密码验证结果:', isValid);
    
    if (!isValid) {
      return errorResponse('旧密码错误', 400);
    }

    // 加密新密码 - 使用10轮加密，这是行业标准
    const hashedPassword = await hash(newPassword, 10);
    console.log('新密码加密完成:', { passwordLength: hashedPassword?.length });

    // 重要: 直接调用updateOne而不是save方法，避免触发模型中的pre-save钩子
    // 这样可以避免密码被二次哈希
    const updateResult = await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log('密码更新结果:', { 
      success: updateResult.modifiedCount > 0,
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      updatedAt: new Date().toISOString()
    });

    if (updateResult.modifiedCount === 0) {
      return errorResponse('密码更新失败，请重试', 500);
    }

    // 返回成功响应
    return successResponse({ 
      message: '密码修改成功',
      // 仅在开发环境下返回这些调试信息
      debug: process.env.NODE_ENV === 'development' ? {
        userId: user._id,
        passwordUpdated: true,
        timestamp: new Date().toISOString()
      } : undefined
    });

  } catch (error) {
    console.error('修改密码失败，详细错误:', error);
    return errorResponse('修改密码失败', 500);
  }
} 