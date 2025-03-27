import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Permission from '@/app/models/permission';
import User from '@/app/models/user';
import dbConnect from '@/lib/db-connect';

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

// 获取单个权限规则
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponseUtil.error(400, '无效的权限ID');
    }
    
    const permission = await Permission.findById(id).lean();
    
    if (!permission) {
      return ApiResponseUtil.error(404, '权限规则不存在');
    }
    
    return ApiResponseUtil.success(permission);
  } catch (error: any) {
    console.error('获取权限规则失败:', error);
    return ApiResponseUtil.error(500, `获取权限规则失败: ${error.message}`);
  }
}

// 更新权限规则
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { name, description, roles, users, permissions, isDefault } = body;
    
    // 检查权限名称是否已存在（排除当前ID）
    const existingPermission = await Permission.findOne({ 
      name, 
      _id: { $ne: params.id } 
    });
    
    if (existingPermission) {
      return ApiResponseUtil.error(400, '权限规则名称已存在');
    }
    
    // 查找当前权限规则以获取之前的用户列表
    const currentPermission = await Permission.findById(params.id);
    if (!currentPermission) {
      return ApiResponseUtil.error(404, '权限规则不存在');
    }
    
    // 获取之前和现在的用户列表
    const previousUsers = currentPermission.users || [];
    const newUsers = users || [];
    
    // 计算需要移除权限的用户和需要添加权限的用户
    const usersToRemove = previousUsers.filter(id => !newUsers.includes(id.toString()));
    const usersToAdd = newUsers.filter(id => !previousUsers.includes(id));
    
    console.log('权限更新 - 用户变更:', {
      previousUsersCount: previousUsers.length,
      newUsersCount: newUsers.length,
      usersToRemoveCount: usersToRemove.length,
      usersToAddCount: usersToAdd.length
    });
    
    // 更新权限规则
    const updatedPermission = await Permission.findByIdAndUpdate(
      params.id,
      {
        name,
        description,
        roles: roles || [],
        users: users || [],
        permissions,
        isDefault: isDefault || false
      },
      { new: true }
    );
    
    if (!updatedPermission) {
      return ApiResponseUtil.error(404, '权限规则不存在');
    }
    
    // 更新用户的权限
    const updateOperations = [];
    
    // 将新用户的权限更新为当前规则的权限
    if (usersToAdd.length > 0) {
      updateOperations.push(
        User.updateMany(
          { _id: { $in: usersToAdd } },
          { $set: { permissions } }
        )
      );
      console.log(`更新 ${usersToAdd.length} 个用户的权限为新规则`);
    }
    
    // 清除不再属于该规则的用户的权限
    if (usersToRemove.length > 0) {
      // 对每个被移除的用户，检查他们是否属于其他权限规则
      for (const userId of usersToRemove) {
        // 查找该用户是否在其他权限规则中
        const otherRuleWithUser = await Permission.findOne({
          _id: { $ne: params.id },
          users: userId
        }).lean();
        
        if (otherRuleWithUser) {
          // 如果用户在其他规则中，更新为其他规则的权限
          updateOperations.push(
            User.findByIdAndUpdate(
              userId,
              { $set: { permissions: otherRuleWithUser.permissions } }
            )
          );
          console.log(`用户 ${userId} 属于其他规则，更新为其他规则的权限`);
        } else {
          // 如果用户不在其他规则中，则清空权限
          updateOperations.push(
            User.findByIdAndUpdate(
              userId,
              { $set: { permissions: [] } }
            )
          );
          console.log(`用户 ${userId} 不属于其他规则，清空权限`);
        }
      }
    }
    
    // 同步更新用户默认规则
    if (isDefault) {
      // 如果当前规则设为默认，查找哪些用户的角色与此规则匹配
      if (roles && roles.length > 0) {
        updateOperations.push(
          User.updateMany(
            { 
              role: { $in: roles },
              // 仅更新没有权限设置或者不在任何规则中的用户
              $or: [
                { permissions: { $exists: false } },
                { permissions: { $size: 0 } },
                { 
                  _id: { 
                    $nin: await Permission.distinct('users')
                  } 
                }
              ]
            },
            { $set: { permissions } }
          )
        );
        console.log(`更新角色为 ${roles.join(', ')} 且无其他权限规则的用户的默认权限`);
      }
    }
    
    // 执行所有更新操作
    if (updateOperations.length > 0) {
      await Promise.all(updateOperations);
      console.log(`成功执行了 ${updateOperations.length} 个用户权限更新操作`);
    }
    
    return ApiResponseUtil.success(updatedPermission, '权限规则更新成功');
  } catch (error: any) {
    console.error('更新权限规则失败:', error);
    return ApiResponseUtil.error(500, `更新权限规则失败: ${error.message}`);
  }
}

// 删除权限规则
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponseUtil.error(400, '无效的权限ID');
    }
    
    // 查找当前权限规则以获取用户列表
    const permission = await Permission.findById(id);
    if (!permission) {
      return ApiResponseUtil.error(404, '权限规则不存在');
    }
    
    // 获取当前规则关联的用户
    const affectedUsers = permission.users || [];
    
    // 删除权限规则
    await Permission.findByIdAndDelete(id);
    
    // 清除关联用户的权限
    if (affectedUsers.length > 0) {
      for (const userId of affectedUsers) {
        // 查找该用户是否在其他权限规则中
        const otherRuleWithUser = await Permission.findOne({
          users: userId
        }).lean();
        
        if (otherRuleWithUser) {
          // 如果用户在其他规则中，更新为其他规则的权限
          await User.findByIdAndUpdate(
            userId,
            { $set: { permissions: otherRuleWithUser.permissions } }
          );
          console.log(`用户 ${userId} 属于其他规则，更新为其他规则的权限`);
        } else {
          // 如果用户不在其他规则中，则清空权限
          await User.findByIdAndUpdate(
            userId,
            { $set: { permissions: [] } }
          );
          console.log(`用户 ${userId} 不属于其他规则，清空权限`);
        }
      }
    }
    
    return ApiResponseUtil.success(null, '权限规则删除成功');
  } catch (error: any) {
    console.error('删除权限规则失败:', error);
    return ApiResponseUtil.error(500, `删除权限规则失败: ${error.message}`);
  }
} 