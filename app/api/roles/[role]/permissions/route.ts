import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db-connect';
import User from '@/app/models/user';
import RolePermission from '@/app/models/rolePermission';

// API响应工具类
class ApiResponseUtil {
  static success(data: any, message = 'Success') {
    return NextResponse.json({
      success: true,
      message,
      data
    });
  }

  static error(status: number, message: string) {
    return NextResponse.json(
      {
        success: false,
        message
      },
      { status }
    );
  }
}

// 获取角色的权限设置
export async function GET(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  const { role } = params;
  
  // 验证角色参数
  const validRoles = ['admin', 'customer', 'technician'];
  if (!validRoles.includes(role)) {
    return ApiResponseUtil.error(400, `无效的角色: ${role}`);
  }

  try {
    await dbConnect();
    
    // 查询角色权限配置
    let rolePermission = await RolePermission.findOne({ role });
    
    // 如果没有找到配置，则使用默认配置
    if (!rolePermission) {
      // 对于每个角色，使用默认权限配置
      const defaultPermissions = getDefaultPermissionsForRole(role);
      
      if (defaultPermissions.length > 0) {
        rolePermission = {
          role,
          permissions: defaultPermissions,
          isDefault: true,
          description: `${role}的默认权限配置`
        };
      } else {
        // 如果是admin角色，给予所有权限
        if (role === 'admin') {
          rolePermission = {
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
            isDefault: true,
            description: '管理员的默认权限配置'
          };
        } else {
          return ApiResponseUtil.error(404, `未找到${role}角色的权限配置`);
        }
      }
    }
    
    return ApiResponseUtil.success(rolePermission);
  } catch (error: any) {
    console.error(`获取${role}角色权限失败:`, error);
    return ApiResponseUtil.error(500, `获取角色权限失败: ${error.message}`);
  }
}

// 更新角色的权限设置
export async function POST(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const { role } = params;
    
    // 验证角色是否有效
    if (!role || !['customer', 'technician', 'admin'].includes(role)) {
      return ApiResponseUtil.error(400, '无效的角色');
    }
    
    await dbConnect();
    
    const { permissions } = await req.json();
    
    if (!permissions || !Array.isArray(permissions)) {
      return ApiResponseUtil.error(400, '无效的权限数据');
    }
    
    console.log(`正在更新${role}角色的权限配置:`, permissions.length, '条权限设置');
    
    // 使用upsert确保一定会创建或更新记录
    const result = await RolePermission.findOneAndUpdate(
      { role },
      { 
        permissions,
        isDefault: false,
        description: `${role === 'customer' ? '客户' : '技师'}的自定义权限配置` 
      },
      { upsert: true, new: true }
    );
    
    console.log(`已更新${role}角色的权限配置, ID:`, result._id);
    
    // 同时更新所有该角色用户的权限
    const userUpdateResult = await User.updateMany(
      { role },
      { $set: { permissions } }
    );
    
    console.log(`已更新${userUpdateResult.modifiedCount}个${role}角色用户的权限`);
    
    return ApiResponseUtil.success(
      { 
        rolePermissionId: result._id,
        role,
        permissions,
        usersUpdated: userUpdateResult.modifiedCount
      },
      '角色权限更新成功'
    );
  } catch (error: any) {
    console.error('更新角色权限失败:', error);
    return ApiResponseUtil.error(500, `更新角色权限失败: ${error.message}`);
  }
}

// 获取角色的默认权限配置
function getDefaultPermissionsForRole(role: string): any[] {
  if (role === 'customer') {
    return [
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
    ];
  } else if (role === 'technician') {
    return [
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
    ];
  }
  
  return [];
} 