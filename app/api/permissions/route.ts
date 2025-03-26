import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db-connect';
import Permission from '@/app/models/permission';
import User from '@/app/models/user';

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

// 获取所有权限规则
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const permissions = await Permission.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return ApiResponseUtil.success(permissions);
  } catch (error: any) {
    console.error('获取权限规则失败:', error);
    return ApiResponseUtil.error(500, `获取权限规则失败: ${error.message}`);
  }
}

// 创建新的权限规则
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { name, description, roles, users, permissions, isDefault } = body;
    
    if (!name || !permissions) {
      return ApiResponseUtil.error(400, '名称和权限设置不能为空');
    }
    
    // 检查权限名称是否已存在
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return ApiResponseUtil.error(400, '权限规则名称已存在');
    }
    
    const newPermission = await Permission.create({
      name,
      description,
      roles: roles || [],
      users: users || [],
      permissions,
      isDefault: isDefault || false
    });
    
    // 如果有指定用户，则更新用户的权限
    if (users && users.length > 0) {
      await User.updateMany(
        { _id: { $in: users } },
        { $set: { permissions } }
      );
    }
    
    return ApiResponseUtil.success(newPermission, '权限规则创建成功');
  } catch (error: any) {
    console.error('创建权限规则失败:', error);
    return ApiResponseUtil.error(500, `创建权限规则失败: ${error.message}`);
  }
} 