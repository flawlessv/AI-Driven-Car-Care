import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '../../../lib/db/models';
import { successResponse, errorResponse } from '../../../lib/api-response';
import { generateToken } from '../../../lib/auth';
import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 添加数据库连接日志
    console.log('正在连接数据库...');
    await connectDB();
    console.log('数据库连接成功');
    
    const { email, password } = await request.json();
    console.log('收到登录请求:', { email, passwordLength: password?.length });

    // 查找用户
    const User = getUserModel();
    console.log('开始查询用户...');
    
    try {
      const user = await User.findOne({ email }).select('+password');
      console.log('查询用户结果:', {
        found: !!user,
        userId: user?._id,
        hasPassword: !!user?.password
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: '用户不存在' },
          { status: 401 }
        );
      }

      // 验证密码
      console.log('正在验证密码...', {
        inputPasswordLength: password?.length,
        hashedPasswordLength: user.password?.length
      });
      
      const isMatch = await compare(password, user.password);
      console.log('密码验证结果:', isMatch);

      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: '密码错误' },
          { status: 401 }
        );
      }

      // 生成 JWT token
      console.log('正在生成 token...');
      const token = await generateToken({
        _id: user._id,
        email: user.email,
        role: user.role
      });
      console.log('Token 生成成功');

      // 获取用户完整信息，包括权限
      const userWithPermissions = await User.findById(user._id).lean();

      if (!userWithPermissions) {
        return NextResponse.json(
          { success: false, message: '获取用户详细信息失败' },
          { status: 500 }
        );
      }

      // 判断是否需要为用户获取权限规则
      try {
        // 如果用户没有自定义权限设置，尝试从权限规则中查找
        if (!(userWithPermissions as any).permissions || (userWithPermissions as any).permissions.length === 0) {
          console.log('用户无自定义权限，尝试获取权限规则...');
          
          // 导入Permission模型
          const Permission = (await import('../../../models/permission')).default;
          
          // 查找适用于该用户的权限规则
          const permissionRule = await Permission.findOne({
            $or: [
              { users: userWithPermissions._id },
              { roles: userWithPermissions.role, isDefault: true }
            ]
          }).lean();
          
          if (permissionRule) {
            console.log('找到适用的权限规则:', {
              ruleName: (permissionRule as any).name,
              permissionsCount: (permissionRule as any).permissions?.length || 0
            });
            
            // 将权限规则应用到用户对象
            (userWithPermissions as any).permissions = (permissionRule as any).permissions || [];
            
            // 可选：将权限规则同步到用户记录（这样下次登录就不需要再查询）
            await User.findByIdAndUpdate(userWithPermissions._id, {
              permissions: (permissionRule as any).permissions || []
            });
            
            console.log('已将权限规则同步到用户记录');
          } else {
            console.log('未找到适用的权限规则，使用空权限');
            (userWithPermissions as any).permissions = [];
          }
        }
      } catch (permError) {
        console.error('获取权限规则失败:', permError);
        // 出错时不阻止登录，仅记录错误
      }

      // 使用类型断言来避免TypeScript错误
      interface UserWithPermissions {
        _id: any;
        username: string;
        email: string;
        role: string;
        permissions?: Array<{ menuKey: string; permission: string }>;
        name?: string;
      }

      const userForClient: UserWithPermissions = {
        _id: userWithPermissions._id,
        username: userWithPermissions.username,
        email: userWithPermissions.email,
        role: userWithPermissions.role,
        permissions: (userWithPermissions as any).permissions || [],
        name: (userWithPermissions as any).name || ''
      };

      // 重要调试信息
      console.log('登录成功 - 完整用户权限:', {
        role: userWithPermissions.role,
        username: userWithPermissions.username,
        permissionsCount: userForClient.permissions?.length || 0,
        permissionKeys: userForClient.permissions?.map(p => p.menuKey).join(', ') || '无'
      });

      console.log('用户权限数量:', userForClient.permissions?.length || 0);

      const response = NextResponse.json({
        success: true,
        message: '登录成功',
        data: {
          user: userForClient,
          token
        }
      });

      // 设置 cookie
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60
      });

      return response;

    } catch (queryError) {
      console.error('查询用户时出错:', queryError);
      throw queryError;
    }

  } catch (error: any) {
    console.error('登录失败，详细错误:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: '登录失败: ' + (error.message || '未知错误'),
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 