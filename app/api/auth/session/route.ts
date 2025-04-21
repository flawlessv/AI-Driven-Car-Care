/**
 * 用户会话API接口文件
 * 
 * 这个文件处理获取当前用户会话信息的请求
 * 它验证用户的认证状态并返回当前登录用户的详细信息
 */
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/app/lib/auth';
import User from '@/app/models/user';
import dbConnect from '@/app/lib/db-connect';

/**
 * GET方法处理函数 - 获取当前用户的会话信息
 * 
 * 这个函数验证用户的认证状态，并返回当前登录用户的详细信息
 * 包括用户基本信息和权限数据
 * 
 * @param {NextRequest} request - HTTP请求对象
 * @returns {Promise<NextResponse>} 返回包含用户信息的HTTP响应
 */
export async function GET(request: NextRequest) {
  try {
    // 第一步：验证用户认证状态
    // 使用authMiddleware中间件验证请求中的认证令牌
    console.log('验证用户认证状态...');
    const authResult = await authMiddleware(request);
    
    // 如果认证失败，返回401未授权错误
    if (!authResult.success) {
      console.log('认证失败:', authResult.message);
      return NextResponse.json(
        { success: false, message: authResult.message || '未授权访问' },
        { status: 401 }  // 401状态码表示未授权
      );
    }
    
    // 确保authResult.user存在
    if (!authResult.user) {
      console.log('认证成功但用户信息缺失');
      return NextResponse.json(
        { success: false, message: '用户信息缺失' },
        { status: 401 }
      );
    }
    
    // 第二步：获取用户完整信息
    // 连接数据库
    console.log('认证成功，获取用户详细信息...');
    await dbConnect();
    
    // 根据用户ID查询完整的用户信息
    const user = await User.findById(authResult.user._id).lean();
    
    // 如果用户不存在，返回404错误
    if (!user) {
      console.log('用户不存在:', authResult.user._id);
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }  // 404状态码表示资源不存在
      );
    }
    
    // 第三步：准备返回的用户数据结构
    // 定义用户数据接口，包含必要的字段
    interface UserWithPermissions {
      _id: any;                 // 用户ID
      username: string;         // 用户名
      email: string;            // 邮箱
      role: string;             // 角色
      permissions?: Array<{ menuKey: string; permission: string }>;  // 权限列表
      name?: string;            // 姓名（可选）
      phone?: string;           // 电话（可选）
    }

    // 组装返回给客户端的用户数据对象
    // 只包含需要的字段，不包含敏感信息
    // 使用类型断言确保TypeScript不会报错
    const userObj = user as any;
    
    const userForClient: UserWithPermissions = {
      _id: userObj._id,            // 用户ID
      username: userObj.username,  // 用户名
      email: userObj.email,        // 邮箱
      role: userObj.role,          // 角色
      permissions: userObj.permissions || [],  // 权限列表，如果没有则为空数组
      name: userObj.name || '',    // 姓名，如果没有则为空字符串
      phone: userObj.phone || ''   // 电话，如果没有则为空字符串
    };
    
    // 记录权限信息，便于调试
    console.log('会话API - 用户权限数量:', userForClient.permissions?.length || 0);
    
    // 第四步：返回成功响应
    // 包含用户信息的成功响应
    return NextResponse.json({
      success: true,  // 成功标志
      data: {
        user: userForClient  // 用户信息
      }
    });
  } catch (error: any) {
    // 捕获并处理所有可能的错误
    console.error('获取用户会话失败:', error);
    
    // 返回500服务器错误响应
    return NextResponse.json(
      { success: false, message: `获取用户会话失败: ${error.message}` },
      { status: 500 }  // 500状态码表示服务器内部错误
    );
  }
} 