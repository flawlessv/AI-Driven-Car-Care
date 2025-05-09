import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/app/lib/db-connect';
import User from '@/app/models/user';
import { authMiddleware } from '@/app/lib/auth';
import { getUserModel } from '@/app/lib/db/models';
import { hash } from 'bcryptjs';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/lib/api-response';

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

// 获取单个用户信息
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponseUtil.error(400, '无效的用户ID');
    }
    
    const user = await User.findById(id).lean();
    
    if (!user) {
      return ApiResponseUtil.error(404, '用户不存在');
    }
    
    // 不返回敏感信息
    delete user.password;
    
    return ApiResponseUtil.success(user);
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    return ApiResponseUtil.error(500, `获取用户信息失败: ${error.message}`);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const authResult = await authMiddleware(request);
    if (!authResult || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    await dbConnect();
    const User = getUserModel();

    const data = await request.json();
    console.log('接收到的更新数据:', data);

    // 构建更新对象，只包含请求中提供的字段
    const updateData: any = {};
    
    // 只修改请求中提供的字段
    if (data.name !== undefined) updateData.username = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.specialties !== undefined) updateData.specialties = Array.isArray(data.specialties) ? data.specialties : [];
    if (data.certifications !== undefined) updateData.certifications = Array.isArray(data.certifications) ? data.certifications : [];
    if (data.workExperience !== undefined) updateData.workExperience = Number(data.workExperience || 0);
    if (data.role !== undefined) updateData.role = data.role;
    if (data.totalOrders !== undefined) updateData.totalOrders = Number(data.totalOrders || 0);
    if (data.completedOrders !== undefined) updateData.completedOrders = Number(data.completedOrders || 0);
    if (data.rating !== undefined) updateData.rating = Number(data.rating || 0);
    
    // 状态字段特殊处理，如果只传了status字段，确保它能被正确处理
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    // 如果提供了新密码，则进行加密
    if (data.password) {
      updateData.password = await hash(data.password, 10);
    }

    console.log('准备更新的数据:', updateData);
    
    // 如果没有任何要更新的字段，返回错误
    if (Object.keys(updateData).length === 0) {
      return errorResponse('未提供有效的更新字段', 400);
    }

    // 检查用户是否存在
    const existingUser = await User.findById(params.id);
    if (!existingUser) {
      console.log('用户不存在:', params.id);
      return errorResponse('用户不存在', 404);
    }
    console.log('找到现有用户:', existingUser._id);

    try {
      // 更新用户并处理验证错误
      const updatedUser = await User.findByIdAndUpdate(
        params.id,
        { $set: updateData },
        { 
          new: true,
          runValidators: true,
          context: 'query'
        }
      ).select('-password');

      if (!updatedUser) {
        console.log('更新失败，未返回更新后的用户');
        return errorResponse('更新用户失败', 500);
      }

      console.log('用户更新成功，更新后的数据:', updatedUser);
      return successResponse(updatedUser);
    } catch (validationError: any) {
      console.error('验证错误:', validationError);
      if (validationError.name === 'ValidationError') {
        return validationErrorResponse(validationError.message);
      }
      throw validationError; // 重新抛出非验证错误
    }
  } catch (error: any) {
    console.error('更新用户信息失败:', error);
    return errorResponse(`更新用户信息失败: ${error.message}`, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {user} = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await dbConnect();
    const User = getUserModel();

    const deletedUser = await User.findByIdAndDelete(params.id);
    if (!deletedUser) {
      return errorResponse('用户不存在', 404);
    }

    return successResponse({ message: '用户删除成功' });
  } catch (error: any) {
    console.error('删除用户失败:', error);
    return errorResponse(error.message);
  }
} 