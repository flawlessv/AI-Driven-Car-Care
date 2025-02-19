import { NextRequest } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { getUserModel } from '../../../lib/db/models';
import { successResponse, errorResponse } from '../../../lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const User = getUserModel();
    
    // 获取所有用户（包括密码字段）
    const users = await User.find({}).select('+password');
    
    // 打印用户信息到控制台（包括密码哈希）
    users.forEach(user => {
      console.log('用户详细信息:', {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status || 'status未设置',
        hasPassword: !!user.password,
        passwordLength: user.password?.length || 0,
        passwordHash: user.password || '无密码',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    });

    // 返回用户信息（包括密码长度信息但不包含实际密码）
    const usersInfo = users.map(user => {
      const userObj = user.toObject();
      return {
        ...userObj,
        hasPassword: !!userObj.password,
        passwordLength: userObj.password?.length || 0,
        password: undefined
      };
    });

    return successResponse({
      users: usersInfo,
      total: users.length
    });
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    return errorResponse(error.message || '获取用户列表失败');
  }
} 