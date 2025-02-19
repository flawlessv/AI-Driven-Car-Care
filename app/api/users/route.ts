import { NextRequest } from 'next/server';
import { connectDB } from '../../lib/mongodb';
import { authMiddleware } from '../../lib/auth';
import { getUserModel } from '../../lib/db/models';
import { hash } from 'bcryptjs';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  forbiddenResponse,
} from '../../lib/api-response';

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    const { user } = authResult;
    console.log('当前用户角色:', user.role);

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');

    // 连接数据库
    await connectDB();
    const User = getUserModel();

    // 构建查询条件
    const query: any = {};
    if (role) {
      query.role = role;
    }

    console.log('查询条件:', query);

    // 查询用户列表
    const users = await User.find(query).select('-password');
    console.log('查询到用户数量:', users.length);

    return successResponse(users);
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    return errorResponse(error.message || '获取用户列表失败');
  }
}

// 创建新用户
export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    const { user } = authResult;
    console.log('当前用户角色:', user.role);

    // 只允许admin创建用户
    if (user.role !== 'admin') {
      console.log('用户角色无权限');
      return errorResponse('无权访问', 403);
    }

    // 解析请求数据
    const data = await request.json();
    console.log('创建用户请求数据:', {
      ...data,
      password: data.password ? '已提供' : '未提供'
    });

    // 验证必填字段
    if (!data.username || !data.password) {
      return errorResponse('用户名和密码不能为空', 400);
    }

    // 连接数据库
    await connectDB();
    const User = getUserModel();

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username: data.username });
    if (existingUser) {
      return errorResponse('用户名已存在', 400);
    }

    // 创建新用户
    const newUser = await User.create({
      ...data,
      status: 'active', // 默认状态为激活
    });
    console.log('用户创建成功:', {
      _id: newUser._id,
      username: newUser.username,
      role: newUser.role
    });

    // 返回用户信息（不包含密码）
    const userWithoutPassword = newUser.toObject();
    delete userWithoutPassword.password;

    return successResponse(userWithoutPassword);
  } catch (error: any) {
    console.error('创建用户失败:', error);
    return errorResponse(error.message || '创建用户失败');
  }
} 