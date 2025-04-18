/**
 * 登录API接口文件
 * 
 * 这个文件处理用户的登录请求，验证用户身份并返回认证令牌
 * 它是整个系统的"入口大门"，负责检查"钥匙"（用户名和密码）是否正确
 */


// 导入数据库连接函数，用于连接到MongoDB数据库
import { connectDB } from '@/app/lib/mongodb';
// 导入获取用户模型的函数，用于操作用户数据
import { getUserModel } from '@/app/lib/db/models';

// 导入令牌生成函数，用于创建JWT认证令牌
import { generateToken } from '@/app/lib/auth';
// 导入密码比较函数，用于安全地验证密码
import { compare } from 'bcryptjs';
// 导入Next.js响应类型，用于返回HTTP响应
import { NextResponse } from 'next/server';

/**
 * POST方法处理函数 - 处理登录请求
 * 
 * 这个函数接收用户提交的邮箱和密码，验证身份并返回认证令牌
 * 
 * @param {Request} request - HTTP请求对象，包含用户提交的登录信息
 * @returns {Promise<NextResponse>} 返回登录结果的HTTP响应
 */
export async function POST(request: Request) {
  try {
    // 第一步：连接数据库
    // 添加日志，记录数据库连接过程，便于调试问题
    console.log('正在连接数据库...');
    await connectDB();  // 等待数据库连接完成
    console.log('数据库连接成功');
    
    // 第二步：解析用户提交的数据
    // 从请求中提取邮箱和密码
    const { email, password } = await request.json();
    // 记录收到的登录请求（不记录实际密码内容，只记录长度，保护隐私）
    console.log('收到登录请求:', { email, passwordLength: password?.length });

    // 第三步：查询用户是否存在
    // 获取用户数据模型
    const User = getUserModel();
    console.log('开始查询用户...');
    
    try {
      // 在数据库中查找匹配邮箱的用户，并包含密码字段
      // select('+password')表示显式请求密码字段，因为密码字段默认不返回
      const user = await User.findOne({ email }).select('+password');
      // 记录用户查询结果
      console.log('查询用户结果:', {
        found: !!user,  // 是否找到用户
        userId: user?._id,  // 用户ID（如果找到）
        hasPassword: !!user?.password  // 是否有密码（密码可能为空）
      });

      // 如果用户不存在，返回401错误
      if (!user) {
        return NextResponse.json(
          { success: false, message: '用户不存在' },
          { status: 401 }  // 401状态码表示未授权
        );
      }

      // 第四步：验证密码是否正确
      console.log('正在验证密码...', {
        inputPasswordLength: password?.length,  // 输入密码长度
        hashedPasswordLength: user.password?.length  // 数据库中存储的加密密码长度
      });
      
      // 使用bcryptjs库的compare函数安全地比较密码
      // 这个函数会自动处理加密密码的比较，不需要自己解密
      const isMatch = await compare(password, user.password);
      console.log('密码验证结果:', isMatch);  // 记录密码是否匹配

      // 如果密码不匹配，返回401错误
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: '密码错误' },
          { status: 401 }  // 401状态码表示未授权
        );
      }

      // 第五步：生成JWT认证令牌
      console.log('正在生成 token...');
      // 调用generateToken函数，传入用户核心信息
      const token = await generateToken({
        _id: user._id,  // 用户ID
        email: user.email,  // 用户邮箱
        role: user.role  // 用户角色
      });
      console.log('Token 生成成功');

      // 第六步：获取用户完整信息，包括权限
      // 根据用户ID重新查询，获取全部字段，并转换为普通对象（lean()方法）
      const userWithPermissions = await User.findById(user._id).lean();

      // 如果无法获取用户详细信息，返回500错误
      if (!userWithPermissions) {
        return NextResponse.json(
          { success: false, message: '获取用户详细信息失败' },
          { status: 500 }  // 500状态码表示服务器内部错误
        );
      }

      // 第七步：处理用户权限
      // 这段代码检查用户是否有自定义权限设置，如果没有则从权限规则中获取
      try {
        // 如果用户没有自定义权限设置或权限为空数组
        if (!(userWithPermissions as any).permissions || (userWithPermissions as any).permissions.length === 0) {
          console.log('用户无自定义权限，尝试获取权限规则...');
          
          // 动态导入Permission模型，用于查询权限规则
          const Permission = (await import('@/app/models/permission')).default;
          
          // 查找适用于该用户的权限规则：
          // 1. 直接分配给该用户的规则，或
          // 2. 分配给用户角色且标记为默认的规则
          const permissionRule = await Permission.findOne({
            $or: [
              { users: userWithPermissions._id },  // 特定分配给该用户的规则
              { roles: userWithPermissions.role, isDefault: true }  // 分配给角色的默认规则
            ]
          }).lean();  // 转换为普通对象
          
          // 如果找到适用的权限规则
          if (permissionRule) {
            console.log('找到适用的权限规则:', {
              ruleName: (permissionRule as any).name,  // 规则名称
              permissionsCount: (permissionRule as any).permissions?.length || 0  // 权限数量
            });
            
            // 将权限规则应用到用户对象
            (userWithPermissions as any).permissions = (permissionRule as any).permissions || [];
            
            // 可选步骤：将权限规则同步到用户记录
            // 这样下次登录就不需要再查询权限规则，提高效率
            await User.findByIdAndUpdate(userWithPermissions._id, {
              permissions: (permissionRule as any).permissions || []
            });
            
            console.log('已将权限规则同步到用户记录');
          } else {
            // 如果没有找到适用的权限规则，使用空权限数组
            console.log('未找到适用的权限规则，使用空权限');
            (userWithPermissions as any).permissions = [];
          }
        }
      } catch (permError) {
        // 如果获取权限过程中出错，记录错误但不中断登录流程
        console.error('获取权限规则失败:', permError);
        // 权限出错时不阻止登录，仅记录错误，用户仍可以登录但可能缺少某些权限
      }

      // 第八步：准备返回给客户端的用户信息
      // 定义一个接口，描述要返回的用户信息结构
      interface UserWithPermissions {
        _id: any;                // 用户ID
        username: string;        // 用户名
        email: string;           // 邮箱
        role: string;            // 角色
        permissions?: Array<{ menuKey: string; permission: string }>;  // 权限列表
        name?: string;           // 姓名（可选）
        phone?: string;          // 电话（可选）
      }

      // 创建要返回给客户端的用户信息对象
      // 只包含需要的字段，不包含敏感信息如密码
      const userForClient: UserWithPermissions = {
        _id: userWithPermissions._id,  // 用户ID
        username: userWithPermissions.username,  // 用户名
        email: userWithPermissions.email,  // 邮箱
        role: userWithPermissions.role,  // 角色
        permissions: (userWithPermissions as any).permissions || [],  // 权限列表，如果没有则为空数组
        name: (userWithPermissions as any).name || '',  // 姓名，如果没有则为空字符串
        phone: (userWithPermissions as any).phone || ''  // 电话，如果没有则为空字符串
      };

      // 记录重要的调试信息，显示用户权限详情
      console.log('登录成功 - 完整用户权限:', {
        role: userWithPermissions.role,  // 用户角色
        username: userWithPermissions.username,  // 用户名
        permissionsCount: userForClient.permissions?.length || 0,  // 权限数量
        permissionKeys: userForClient.permissions?.map(p => p.menuKey).join(', ') || '无'  // 权限菜单键列表
      });

      console.log('用户权限数量:', userForClient.permissions?.length || 0);

      // 第九步：创建成功响应对象
      const response = NextResponse.json({
        success: true,  // 成功标志
        message: '登录成功',  // 成功消息
        data: {
          user: userForClient,  // 用户信息
          token  // 认证令牌
        }
      });

      // 第十步：设置认证Cookie
      // 将令牌也存储在HTTP-only cookie中
      // 这样前端可以通过cookie自动发送令牌，增加安全性
      response.cookies.set({
        name: 'token',  // cookie名称
        value: token,  // cookie值为令牌
        httpOnly: true,  // httpOnly为true意味着客户端JavaScript无法读取此cookie，提高安全性
        secure: process.env.NODE_ENV === 'production',  // 在生产环境中只通过HTTPS发送
        sameSite: 'lax',  // 跨站发送策略为lax
        path: '/',  // 适用于所有路径
        maxAge: 24 * 60 * 60  // 有效期24小时（秒）
      });

      // 返回最终的响应对象
      return response;

    } catch (queryError) {
      // 捕获并处理用户查询过程中的错误
      console.error('查询用户时出错:', queryError);
      throw queryError;  // 重新抛出错误，由外层try-catch处理
    }

  } catch (error: any) {
    // 捕获并处理整个登录过程中的任何错误
    // 记录详细的错误信息，便于调试
    console.error('登录失败，详细错误:', {
      message: error.message,  // 错误消息
      stack: error.stack,  // 错误堆栈
      name: error.name  // 错误名称
    });
    
    // 创建错误响应
    return NextResponse.json(
      { 
        success: false,  // 失败标志
        message: '登录失败: ' + (error.message || '未知错误'),  // 错误消息
        error: process.env.NODE_ENV === 'development' ? error.message : undefined  // 在开发环境中包含详细错误信息
      },
      { status: 500 }  // 500状态码表示服务器内部错误
    );
  }
} 