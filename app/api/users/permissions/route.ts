import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/app/models/user';
import dbConnect from '@/app/lib/db-connect';

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

// 更新用户权限
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { userId, permissions } = body;
    
    if (!userId || !permissions) {
      return ApiResponseUtil.error(400, '用户ID和权限设置不能为空');
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return ApiResponseUtil.error(400, '无效的用户ID');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return ApiResponseUtil.error(404, '用户不存在');
    }
    
    // 更新用户权限
    user.permissions = permissions;
    await user.save();
    
    return ApiResponseUtil.success(
      { userId, permissions }, 
      '用户权限更新成功'
    );
  } catch (error: any) {
    console.error('更新用户权限失败:', error);
    return ApiResponseUtil.error(500, `更新用户权限失败: ${error.message}`);
  }
}

// 批量更新用户权限
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { userIds, permissions } = body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !permissions) {
      return ApiResponseUtil.error(400, '用户ID列表和权限设置不能为空');
    }
    
    // 检查用户ID的有效性
    const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return ApiResponseUtil.error(400, `存在无效的用户ID: ${invalidIds.join(', ')}`);
    }
    
    // 批量更新用户权限
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { permissions } }
    );
    
    return ApiResponseUtil.success(
      { 
        modifiedCount: result.modifiedCount,
        userIds, 
        permissions 
      }, 
      '用户权限批量更新成功'
    );
  } catch (error: any) {
    console.error('批量更新用户权限失败:', error);
    return ApiResponseUtil.error(500, `批量更新用户权限失败: ${error.message}`);
  }
} 