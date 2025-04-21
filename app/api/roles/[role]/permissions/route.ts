/**
 * 角色权限管理API接口文件
 * 
 * 这个文件处理角色权限的查询和更新操作
 * 它允许管理员查看和修改不同角色的菜单权限设置
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db-connect';
import User from '@/app/models/user';
import RolePermission from '@/app/models/rolePermission';

/**
 * API响应工具类
 * 提供统一的响应格式和错误处理
 */
class ApiResponseUtil {
  /**
   * 创建成功响应
   * 
   * @param {any} data - 响应数据
   * @param {string} message - 成功消息
   * @returns {NextResponse} 格式化的成功响应
   */
  static success(data: any, message = 'Success') {
    return NextResponse.json({
      success: true,
      message,
      data
    });
  }

  /**
   * 创建错误响应
   * 
   * @param {number} status - HTTP状态码
   * @param {string} message - 错误消息
   * @returns {NextResponse} 格式化的错误响应
   */
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

/**
 * GET方法处理函数 - 获取指定角色的权限设置
 * 
 * 这个函数返回特定角色的权限配置，如果没有找到则返回默认配置
 * 
 * @param {NextRequest} req - HTTP请求对象
 * @param {object} params - 路由参数，包含角色名称
 * @returns {Promise<NextResponse>} 包含角色权限的HTTP响应
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  const { role } = params;
  
  // 验证角色参数是否有效
  const validRoles = ['admin', 'customer', 'technician'];
  if (!validRoles.includes(role)) {
    return ApiResponseUtil.error(400, `无效的角色: ${role}`);
  }

  try {
    // 连接数据库
    await dbConnect();
    
    // 查询数据库中该角色的权限配置
    let rolePermission = await RolePermission.findOne({ role });
    
    // 如果没有找到配置，则使用默认配置
    if (!rolePermission) {
      console.log(`未找到${role}角色的权限配置，使用默认配置`);
      
      // 获取该角色的默认权限设置
      const defaultPermissions = getDefaultPermissionsForRole(role);
      
      if (defaultPermissions.length > 0) {
        // 创建默认的权限配置对象
        rolePermission = {
          role,
          permissions: defaultPermissions,
          isDefault: true,
          description: `${role}的默认权限配置`
        };
      } else {
        // 管理员角色的特殊处理 - 拥有所有权限
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
          // 对于不支持的角色，返回错误
          return ApiResponseUtil.error(404, `未找到${role}角色的权限配置`);
        }
      }
    }
    
    // 返回角色权限配置
    return ApiResponseUtil.success(rolePermission);
  } catch (error: any) {
    // 捕获并处理错误
    console.error(`获取${role}角色权限失败:`, error);
    return ApiResponseUtil.error(500, `获取角色权限失败: ${error.message}`);
  }
}

/**
 * POST方法处理函数 - 更新指定角色的权限设置
 * 
 * 这个函数接收新的权限配置并更新数据库
 * 同时会更新所有属于该角色用户的权限设置
 * 
 * @param {NextRequest} req - HTTP请求对象
 * @param {object} params - 路由参数，包含角色名称
 * @returns {Promise<NextResponse>} 操作结果的HTTP响应
 */
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
    
    // 连接数据库
    await dbConnect();
    
    // 解析请求中的权限数据
    const { permissions } = await req.json();
    
    // 验证权限数据格式
    if (!permissions || !Array.isArray(permissions)) {
      return ApiResponseUtil.error(400, '无效的权限数据');
    }
    
    console.log(`正在更新${role}角色的权限配置:`, permissions.length, '条权限设置');
    
    // 使用upsert确保一定会创建或更新记录
    // 如果找到匹配的文档则更新，否则创建新文档
    const result = await RolePermission.findOneAndUpdate(
      { role },
      { 
        permissions,
        isDefault: false, // 标记为自定义配置，不是默认配置
        description: `${role === 'customer' ? '客户' : '技师'}的自定义权限配置` 
      },
      { upsert: true, new: true } // upsert=true表示如果不存在则创建，new=true表示返回更新后的文档
    );
    
    console.log(`已更新${role}角色的权限配置, ID:`, result._id);
    
    // 同时更新所有该角色用户的权限
    // 这确保了角色权限变更后，所有用户立即获得新权限
    const userUpdateResult = await User.updateMany(
      { role }, // 查询条件：匹配指定角色的所有用户
      { $set: { permissions } } // 更新操作：设置新的权限
    );
    
    console.log(`已更新${userUpdateResult.modifiedCount}个${role}角色用户的权限`);
    
    // 返回成功响应
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
    // 捕获并处理错误
    console.error('更新角色权限失败:', error);
    return ApiResponseUtil.error(500, `更新角色权限失败: ${error.message}`);
  }
}

/**
 * 获取角色的默认权限配置
 * 
 * 根据角色名称返回预定义的默认权限设置
 * 不同角色有不同的默认权限级别
 * 
 * @param {string} role - 角色名称
 * @returns {Array} 权限配置数组
 */
function getDefaultPermissionsForRole(role: string): any[] {
  if (role === 'customer') {
    // 客户角色的默认权限
    // 主要是"读取"权限，只有少量"写入"权限
    return [
      { menuKey: 'dashboard', permission: 'read' },      // 仪表盘：只读
      { menuKey: 'vehicles', permission: 'read' },       // 车辆管理：只读
      { menuKey: 'vehicle-list', permission: 'read' },   // 车辆列表：只读
      { menuKey: 'vehicle-files', permission: 'read' },  // 车辆档案：只读
      { menuKey: 'vehicle-health', permission: 'read' }, // 车辆健康状况：只读
      { menuKey: 'maintenance', permission: 'none' },    // 保养管理：无权限
      { menuKey: 'maintenance-records', permission: 'none' }, // 保养记录：无权限
      { menuKey: 'maintenance-rules', permission: 'none' },   // 保养规则：无权限
      { menuKey: 'work-orders', permission: 'read' },    // 工单管理：只读
      { menuKey: 'appointments', permission: 'write' },  // 预约管理：可写入
      { menuKey: 'technicians', permission: 'read' },    // 技师管理：只读
      { menuKey: 'users', permission: 'none' },          // 用户管理：无权限
      { menuKey: 'parts', permission: 'none' },          // 配件管理：无权限
      { menuKey: 'reviews', permission: 'write' },       // 评价管理：可写入
      { menuKey: 'permissions', permission: 'none' }     // 权限管理：无权限
    ];
  } else if (role === 'technician') {
    // 技师角色的默认权限
    // 主要是"读取"和部分"写入"权限
    return [
      { menuKey: 'dashboard', permission: 'read' },       // 仪表盘：只读
      { menuKey: 'vehicles', permission: 'read' },        // 车辆管理：只读
      { menuKey: 'vehicle-list', permission: 'read' },    // 车辆列表：只读
      { menuKey: 'vehicle-files', permission: 'read' },   // 车辆档案：只读
      { menuKey: 'vehicle-health', permission: 'read' },  // 车辆健康状况：只读
      { menuKey: 'maintenance', permission: 'write' },    // 保养管理：可写入
      { menuKey: 'maintenance-records', permission: 'write' }, // 保养记录：可写入
      { menuKey: 'maintenance-rules', permission: 'read' },    // 保养规则：只读
      { menuKey: 'work-orders', permission: 'read' },     // 工单管理：只读
      { menuKey: 'appointments', permission: 'read' },    // 预约管理：只读
      { menuKey: 'technicians', permission: 'read' },     // 技师管理：只读
      { menuKey: 'users', permission: 'none' },           // 用户管理：无权限
      { menuKey: 'parts', permission: 'write' },          // 配件管理：可写入
      { menuKey: 'reviews', permission: 'read' },         // 评价管理：只读
      { menuKey: 'permissions', permission: 'none' }      // 权限管理：无权限
    ];
  }
  
  // 对于其他角色，返回空数组
  return [];
} 