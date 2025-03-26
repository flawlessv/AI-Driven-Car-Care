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
  try {
    const { role } = params;
    
    // 验证角色是否有效
    if (!role || !['customer', 'technician', 'admin', 'staff'].includes(role)) {
      return ApiResponseUtil.error(400, '无效的角色');
    }
    
    await dbConnect();
    
    // 使用专门的角色权限模型查询
    let rolePermission = await RolePermission.findOne({ role }).lean();
    
    // 如果没有找到权限配置，创建默认配置
    if (!rolePermission) {
      rolePermission = {
        role,
        permissions: getDefaultPermissionsForRole(role),
        isDefault: true,
        description: `${role === 'customer' ? '客户' : '技师'}的默认权限配置`
      };
      
      // 保存默认配置
      await RolePermission.create(rolePermission);
      console.log(`已创建${role}角色的默认权限配置`);
    }
    
    console.log(`获取到${role}角色的权限配置:`, rolePermission.permissions?.length || 0, '条权限设置');
    
    return ApiResponseUtil.success(rolePermission.permissions || []);
  } catch (error: any) {
    console.error('获取角色权限失败:', error);
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
    if (!role || !['customer', 'technician', 'admin', 'staff'].includes(role)) {
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
      { menuKey: 'maintenance', permission: 'read' },
      { menuKey: 'maintenance-records', permission: 'read' },
      { menuKey: 'maintenance-rules', permission: 'none' },
      { menuKey: 'appointments', permission: 'write' },
      { menuKey: 'technicians', permission: 'read' },
      { menuKey: 'users', permission: 'none' },
      { menuKey: 'parts', permission: 'none' },
      { menuKey: 'reports', permission: 'none' },
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
      { menuKey: 'appointments', permission: 'read' },
      { menuKey: 'technicians', permission: 'read' },
      { menuKey: 'users', permission: 'none' },
      { menuKey: 'parts', permission: 'read' },
      { menuKey: 'reports', permission: 'none' },
      { menuKey: 'reviews', permission: 'read' },
      { menuKey: 'permissions', permission: 'none' }
    ];
  }
  
  return [];
} 