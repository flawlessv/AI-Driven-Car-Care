import { NextRequest } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { getUserModel } from '../../../lib/db/models';
import {
  successResponse,
  errorResponse,
} from '../../../lib/api-response';

// 定义有效的角色
const VALID_ROLES = ['admin', 'staff', 'technician', 'customer'];

export async function POST(request: NextRequest) {
  try {
    let { username, password, email, role, phone } = await request.json();
    
    // 清理输入数据
    username = username?.trim();
    email = email?.trim();
    
    console.log('注册请求参数:', { 
      username, 
      email,
      phone,
      role,
      passwordLength: password?.length
    });

    // 验证必填字段
    if (!username || !password || !email) {
      return errorResponse('用户名、密码和邮箱不能为空', 400);
    }

    // 验证角色
    if (role && !VALID_ROLES.includes(role)) {
      return errorResponse('无效的用户角色', 400);
    }

    await connectDB();
    const User = getUserModel();

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      $or: [
        { username },
        { email }
      ]
    });

    if (existingUser) {
      return errorResponse('用户名或邮箱已存在', 400);
    }

    // 创建新用户 - 直接使用原始密码，让 mongoose 中间件处理加密
    const userData = {
      username,
      password,  // 使用原始密码
      email,
      phone,
      role: role || 'customer',
      status: 'active'
    };

    const user = await User.create(userData);
    
    // 验证保存后的密码
    const savedUser = await User.findById(user._id).select('+password');
    console.log('保存后的用户数据:', {
      _id: savedUser._id,
      passwordLength: savedUser.password?.length
    });

    return successResponse({
      message: '注册成功',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('注册失败:', error);
    return errorResponse(error.message || '注册失败');
  }
} 