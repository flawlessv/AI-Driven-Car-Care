import { NextRequest } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { getUserModel } from '../../../lib/db/models';
import { hash } from 'bcryptjs';
import {
  successResponse,
  errorResponse,
} from '../../../lib/api-response';

// 定义有效的角色
const VALID_ROLES = ['admin', 'staff', 'technician', 'customer'];

export async function POST(request: NextRequest) {
  try {
    let { username, password, email, role } = await request.json();
    
    // 清理输入数据
    username = username?.trim();
    email = email?.trim();
    
    console.log('注册请求参数:', { 
      username, 
      email, 
      role,
      hasPassword: !!password
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

    // 创建新用户
    console.log('开始加密密码...');
    const hashedPassword = await hash(password, 10);
    console.log('密码加密完成，长度:', hashedPassword.length);

    const userData = {
      username,
      password: hashedPassword,
      email,
      role: role || 'customer',
      status: 'active'
    };

    console.log('创建用户数据:', { 
      ...userData, 
      password: password ? `长度: ${password.length}` : '未提供',
      passwordLength: hashedPassword.length 
    });

    const user = await User.create(userData);
    console.log('用户创建成功:', { 
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      passwordLength: user.password.length
    });

    // 验证创建的用户密码是否正确保存
    const savedUser = await User.findById(user._id).select('+password');
    console.log('验证保存的用户数据:', {
      _id: savedUser._id,
      username: savedUser.username,
      passwordLength: savedUser.password.length,
      passwordMatches: savedUser.password === hashedPassword
    });

    // 返回用户信息（不包含密码）
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return successResponse(userWithoutPassword);
  } catch (error: any) {
    console.error('注册失败:', error);
    return errorResponse(error.message || '注册失败');
  }
} 