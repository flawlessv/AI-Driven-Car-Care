import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import User from '@/app/models/user';
import dbConnect from '@/lib/db-connect';

// 获取当前用户会话信息
export async function GET(request: NextRequest) {
  try {
    // 验证用户 token
    const authResult = await authMiddleware(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message || '未授权访问' },
        { status: 401 }
      );
    }
    
    // 获取用户完整信息，包括权限
    await dbConnect();
    const user = await User.findById(authResult.user._id).lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 使用类型断言
    interface UserWithPermissions {
      _id: any;
      username: string;
      email: string;
      role: string;
      permissions?: Array<{ menuKey: string; permission: string }>;
      name?: string;
    }

    // 组装返回数据，包括权限信息
    const userForClient: UserWithPermissions = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: (user as any).permissions || [],
      name: (user as any).name || ''
    };
    
    console.log('会话API - 用户权限数量:', userForClient.permissions?.length || 0);
    
    return NextResponse.json({
      success: true,
      data: {
        user: userForClient
      }
    });
  } catch (error: any) {
    console.error('获取用户会话失败:', error);
    return NextResponse.json(
      { success: false, message: `获取用户会话失败: ${error.message}` },
      { status: 500 }
    );
  }
} 