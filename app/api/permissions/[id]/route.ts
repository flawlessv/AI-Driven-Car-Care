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
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponseUtil.error(400, '无效的权限ID');
    }
    
    const body = await req.json();
    const { name, description, roles, users, permissions, isDefault } = body;
    
    if (!name || !permissions) {
      return ApiResponseUtil.error(400, '名称和权限设置不能为空');
    }
    
    // 检查权限名称是否已被其他规则使用
    const existingPermission = await Permission.findOne({ 
      name, 
      _id: { $ne: id } 
    });
    
    if (existingPermission) {
      return ApiResponseUtil.error(400, '权限规则名称已存在');
    }
    
    const updatedPermission = await Permission.findByIdAndUpdate(
      id,
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
    
    // 如果有指定用户，则更新用户的权限
    if (users && users.length > 0) {
      await User.updateMany(
        { _id: { $in: users } },
        { $set: { permissions } }
      );
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
    
    const permission = await Permission.findById(id);
    
    if (!permission) {
      return ApiResponseUtil.error(404, '权限规则不存在');
    }
    
    // 如果有用户使用此权限规则，则清除这些用户的权限
    if (permission.users && permission.users.length > 0) {
      await User.updateMany(
        { _id: { $in: permission.users } },
        { $set: { permissions: [] } }
      );
    }
    
    await Permission.findByIdAndDelete(id);
    
    return ApiResponseUtil.success(null, '权限规则删除成功');
  } catch (error: any) {
    console.error('删除权限规则失败:', error);
    return ApiResponseUtil.error(500, `删除权限规则失败: ${error.message}`);
  }
} 