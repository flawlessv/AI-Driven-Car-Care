import { NextRequest } from 'next/server';
import { connectDB } from '../../lib/mongodb';
import { authMiddleware } from '../../lib/auth';
import { getUserModel } from '../../lib/db/models';
import {
  successResponse,
  errorResponse,

} from '../../lib/api-response';
import { USER_ROLES } from '@/types/user';

/**
 * 获取用户列表的函数
 * 
 * 这个函数用来获取系统中的所有用户信息。
 * 当有人访问用户列表页面时，系统会调用这个函数来获取数据。
 */
export async function GET(request: NextRequest) {
  try {
    // 记录日志，表示开始获取用户列表
    console.log('获取用户列表...');

    // 从网址中获取筛选条件
    // 例如：?role=admin 会筛选出管理员用户
    // 例如：?search=张三 会搜索用户名中包含"张三"的用户
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');        // 获取用户角色筛选条件
    const search = searchParams.get('search');    // 获取搜索关键词

    // 连接到数据库，这样才能查询数据
    await connectDB();
    const User = getUserModel();

    // 准备查询条件
    let query: any = {};
    
    if (role) {
      // 如果指定了角色，只查找该角色的用户
      // 例如：只查找管理员用户
      query.role = role;
    } else {
      // 如果没有指定角色，则查找所有有效角色的用户
      query.role = { $in: Object.values(USER_ROLES) };
    }

    // 如果提供了搜索关键词，添加搜索条件
    if (search) {
      // 使用模糊搜索，匹配用户名、邮箱或姓名中包含搜索词的用户
      // 例如：搜索"张"，会找出所有名字中包含"张"的用户
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { username: searchRegex },   // 搜索用户名
        { email: searchRegex },      // 搜索邮箱
        { name: searchRegex }        // 搜索姓名
      ];
    }

    // 记录查询条件，方便调试
    console.log('查询条件:', query);

    // 从数据库查询用户列表，不返回密码字段（保护隐私）
    const users = await User.find(query).select('-password');
    console.log('查询到用户数量:', users.length);

    // 返回成功响应，包含用户列表数据
    return successResponse(users);
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('获取用户列表失败:', error);
    return errorResponse(error.message || '获取用户列表失败');
  }
}

/**
 * 创建新用户的函数
 * 
 * 这个函数用来添加新用户到系统中。
 * 只有管理员才能创建新用户。
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户是否有权限操作
    // 这一步检查是谁在尝试创建用户，以及他们是否有权限
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      // 如果验证失败，返回未授权错误
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 获取当前登录用户的信息
    const { user } = authResult;
    console.log('当前用户角色:', user.role);

    // 检查用户是否是管理员，只有管理员才能创建用户
    if (user.role !== 'admin') {
      console.log('用户角色无权限');
      return errorResponse('无权访问', 403);
    }

    // 获取提交的用户数据
    const data = await request.json();
    console.log('创建用户请求数据:', {
      ...data,
      password: data.password ? '已提供' : '未提供'
    });

    // 检查是否提供了必要的信息
    if (!data.username || !data.password) {
      // 如果缺少用户名或密码，返回错误提示
      return errorResponse('用户名和密码不能为空', 400);
    }

    // 如果创建的是技师角色，处理技师特有的数据
    if (data.role === 'technician') {
      // 如果没有提供姓名，就用用户名代替
      if (!data.name) {
        data.name = data.username;
      }
      
      // 如果没有提供技师级别，默认设为"初级技师"
      if (!data.level) {
        data.level = '初级技师';
      }
      
      // 确保工作经验是数字格式
      if (data.workExperience) {
        data.workExperience = Number(data.workExperience);
      }
    }

    // 连接到数据库
    await connectDB();
    const User = getUserModel();

    // 检查用户名是否已被使用
    const existingUser = await User.findOne({ username: data.username });
    if (existingUser) {
      // 如果用户名已存在，返回错误提示
      return errorResponse('用户名已存在', 400);
    }

    // 创建新用户记录
    const newUser = await User.create({
      ...data,
      status: 'active', // 默认状态为激活
    });
    console.log('用户创建成功:', {
      _id: newUser._id,
      username: newUser.username,
      role: newUser.role
    });

    // 返回用户信息（不包含密码，保护隐私）
    const userWithoutPassword = newUser.toObject();
    delete userWithoutPassword.password;

    // 返回成功响应，包含新创建的用户信息
    return successResponse(userWithoutPassword);
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('创建用户失败:', error);
    return errorResponse(error.message || '创建用户失败');
  }
} 