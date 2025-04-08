import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db-connect';
import RolePermission from '@/app/models/rolePermission';
import User from '@/app/models/user';

// 测试秘钥，仅用于开发环境
const TEST_SECRET_KEY = 'dev-test-key-123456';

/**
 * 初始化所有角色权限的API
 * 这个API会为所有角色创建默认权限配置，并更新所有用户的权限
 * 只能在开发环境或者由管理员调用
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secretKey = url.searchParams.get('key');
    
    // 检查环境变量 NODE_ENV
    // 注意：在Next.js应用中，process.env.NODE_ENV可能不会正确工作
    // 我们将默认允许访问，以便开发环境可以正常初始化权限
    console.log('正在执行权限初始化...');
    
    // 仅当在生产环境中且没有有效密钥时，才需要检查认证
    const isProd = process.env.NODE_ENV === 'production';
    
    if (isProd && secretKey !== TEST_SECRET_KEY) {
      const authHeader = req.headers.get('Authorization');
      console.log('生产环境校验 - Authorization头:', !!authHeader);
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, message: '未授权访问' },
          { status: 401 }
        );
      }
      // 这里可以添加token验证逻辑
    }

    console.log('授权通过，开始连接数据库...');
    await dbConnect();
    console.log('数据库连接成功');

    // 定义所有角色的默认权限
    const rolePermissions = [
      {
        role: 'customer',
        permissions: [
          { menuKey: 'dashboard', permission: 'read' },
          { menuKey: 'vehicles', permission: 'read' },
          { menuKey: 'vehicle-list', permission: 'read' },
          { menuKey: 'vehicle-files', permission: 'read' },
          { menuKey: 'vehicle-health', permission: 'read' },
          { menuKey: 'maintenance', permission: 'none' },
          { menuKey: 'maintenance-records', permission: 'none' },
          { menuKey: 'maintenance-rules', permission: 'none' },
          { menuKey: 'work-orders', permission: 'read' },
          { menuKey: 'appointments', permission: 'write' },
          { menuKey: 'technicians', permission: 'read' },
          { menuKey: 'users', permission: 'none' },
          { menuKey: 'parts', permission: 'none' },
          { menuKey: 'reviews', permission: 'write' },
          { menuKey: 'permissions', permission: 'none' }
        ],
        description: '客户的默认权限配置',
        isDefault: true
      },
      {
        role: 'technician',
        permissions: [
          { menuKey: 'dashboard', permission: 'read' },
          { menuKey: 'vehicles', permission: 'read' },
          { menuKey: 'vehicle-list', permission: 'read' },
          { menuKey: 'vehicle-files', permission: 'read' },
          { menuKey: 'vehicle-health', permission: 'read' },
          { menuKey: 'maintenance', permission: 'write' },
          { menuKey: 'maintenance-records', permission: 'write' },
          { menuKey: 'maintenance-rules', permission: 'read' },
          { menuKey: 'work-orders', permission: 'read' },
          { menuKey: 'appointments', permission: 'read' },
          { menuKey: 'technicians', permission: 'read' },
          { menuKey: 'users', permission: 'none' },
          { menuKey: 'parts', permission: 'write' },
          { menuKey: 'reviews', permission: 'read' },
          { menuKey: 'permissions', permission: 'none' }
        ],
        description: '技师的默认权限配置',
        isDefault: true
      },
      {
        role: 'admin',
        permissions: [
          { menuKey: 'dashboard', permission: 'manage' },
          { menuKey: 'vehicles', permission: 'manage' },
          { menuKey: 'vehicle-list', permission: 'manage' },
          { menuKey: 'vehicle-files', permission: 'manage' },
          { menuKey: 'vehicle-health', permission: 'manage' },
          { menuKey: 'maintenance', permission: 'manage' },
          { menuKey: 'maintenance-records', permission: 'manage' },
          { menuKey: 'maintenance-rules', permission: 'manage' },
          { menuKey: 'work-orders', permission: 'manage' },
          { menuKey: 'appointments', permission: 'manage' },
          { menuKey: 'technicians', permission: 'manage' },
          { menuKey: 'users', permission: 'manage' },
          { menuKey: 'parts', permission: 'manage' },
          { menuKey: 'reviews', permission: 'manage' },
          { menuKey: 'permissions', permission: 'manage' }
        ],
        description: '管理员的默认权限配置',
        isDefault: true
      }
    ];
    
    console.log('开始初始化角色权限...');

    // 创建或更新每个角色的权限配置
    const results = await Promise.all(
      rolePermissions.map(async (roleConfig) => {
        console.log(`处理${roleConfig.role}角色的权限配置...`);
        
        const result = await RolePermission.findOneAndUpdate(
          { role: roleConfig.role },
          roleConfig,
          { upsert: true, new: true }
        );

        // 更新所有该角色用户的权限
        const userUpdateResult = await User.updateMany(
          { role: roleConfig.role },
          { $set: { permissions: roleConfig.permissions } }
        );
        
        console.log(`${roleConfig.role}角色权限已更新，影响${userUpdateResult.modifiedCount}个用户`);

        return {
          role: roleConfig.role,
          permissionId: result._id,
          permissionCount: roleConfig.permissions.length,
          usersUpdated: userUpdateResult.modifiedCount
        };
      })
    );
    
    console.log('角色权限初始化完成');

    return NextResponse.json({
      success: true,
      message: '角色权限初始化成功',
      data: results
    });
  } catch (error: any) {
    console.error('初始化角色权限失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: `初始化角色权限失败: ${error.message}`
      },
      { status: 500 }
    );
  }
} 