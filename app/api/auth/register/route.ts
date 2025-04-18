import { NextRequest } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { getUserModel } from '../../../lib/db/models';
import {
  successResponse,
  errorResponse,
} from '../../../lib/api-response';
import { USER_ROLES } from '@/types/user';

/**
 * 有效的用户角色列表
 * 
 * 这里定义了系统支持的所有用户角色类型。
 * 比如普通客户、技师、管理员等不同类型的用户。
 */
const VALID_ROLES = Object.values(USER_ROLES);

/**
 * 用户注册功能
 * 
 * 这个函数处理新用户的注册请求，创建新的用户账号。
 * 就像填写表格注册一个新的会员账号一样。
 */
export async function POST(request: NextRequest) {
  try {
    // 获取用户提交的注册信息
    let { username, password, email, role, phone } = await request.json();
    
    // 去除用户名和邮箱两端的空格，保证数据干净
    username = username?.trim();
    email = email?.trim();
    
    // 记录注册请求的信息，但不记录实际密码内容（保护隐私）
    console.log('注册请求参数:', { 
      username, 
      email,
      phone,
      role,
      passwordLength: password?.length
    });

    // 检查必填信息是否都已提供
    if (!username || !password || !email) {
      // 如果缺少必填信息，返回错误提示
      return errorResponse('用户名、密码和邮箱不能为空', 400);
    }

    // 检查用户角色是否有效
    if (role && !VALID_ROLES.includes(role)) {
      // 如果提供了角色但不是系统支持的角色，返回错误
      return errorResponse('无效的用户角色', 400);
    }

    // 连接到数据库
    await connectDB();
    const User = getUserModel();

    // 检查用户名或邮箱是否已被其他人使用
    const existingUser = await User.findOne({
      $or: [
        { username },  // 查找是否有相同用户名的用户
        { email }      // 查找是否有相同邮箱的用户
      ]
    });

    // 如果用户名或邮箱已存在，返回错误提示
    if (existingUser) {
      return errorResponse('用户名或邮箱已存在', 400);
    }

    // 如果提供了手机号，检查手机号是否已被使用
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        // 如果手机号已被其他用户使用，返回错误提示
        return errorResponse('手机号已被使用', 400);
      }
    }

    // 准备新用户的数据
    const userData = {
      username,   // 用户名
      password,   // 密码（将在保存时自动加密）
      email,      // 电子邮箱
      phone,      // 手机号码
      role: role || USER_ROLES.CUSTOMER,  // 用户角色，如果没有指定则默认为普通客户
      status: 'active'  // 账号状态，默认为激活状态
    };

    // 创建新用户记录到数据库
    const user = await User.create(userData);
    
    // 验证用户是否成功保存，特别是检查密码是否已正确加密
    const savedUser = await User.findById(user._id).select('+password');
    console.log('保存后的用户数据:', {
      _id: savedUser?._id,
      passwordLength: savedUser?.password?.length
    });

    // 返回注册成功的响应，包含基本用户信息（不包含密码）
    return successResponse({
      message: '注册成功',
      data: {
        _id: user._id,        // 用户ID
        username: user.username,  // 用户名
        email: user.email,    // 电子邮箱
        role: user.role       // 用户角色
      }
    });
  } catch (error: any) {
    // 如果注册过程中出现任何错误，记录错误并返回错误响应
    console.error('注册失败:', error);
    return errorResponse(error.message || '注册失败');
  }
} 