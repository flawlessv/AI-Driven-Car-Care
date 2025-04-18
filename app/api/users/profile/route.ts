import { NextRequest } from 'next/server';
import { authMiddleware } from '@/app/lib/auth';
import dbConnect from '@/app/lib/db-connect';
import { getUserModel } from '@/app/lib/db/models';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/lib/api-response';

/**
 * 获取当前登录用户的个人资料
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    return successResponse(authResult.user);
  } catch (error: any) {
    console.error('获取个人资料失败:', error);
    return errorResponse(`获取个人资料失败: ${error.message}`);
  }
}

/**
 * 更新当前登录用户的个人资料
 */
export async function PUT(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    // 获取当前登录用户ID
    const currentUserId = authResult.user._id;

    await dbConnect();
    const User = getUserModel();

    const data = await req.json();
    console.log('接收到的个人资料更新数据:', data);

    // 构建更新对象，只包含允许用户自己修改的字段
    const updateData: any = {};
    
    // 只修改请求中提供的字段
    if (data.username !== undefined) updateData.username = data.username;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;

    console.log('准备更新的数据:', updateData);
    
    // 如果没有任何要更新的字段，返回错误
    if (Object.keys(updateData).length === 0) {
      return errorResponse('未提供有效的更新字段', 400);
    }

    try {
      // 更新用户并处理验证错误
      const updatedUser = await User.findByIdAndUpdate(
        currentUserId,
        { $set: updateData },
        { 
          new: true,
          runValidators: true,
          context: 'query' 
        }
      ).select('-password');

      if (!updatedUser) {
        console.log('更新失败，未返回更新后的用户');
        return errorResponse('更新个人资料失败', 500);
      }

      console.log('个人资料更新成功，更新后的数据:', updatedUser);
      return successResponse(updatedUser);
    } catch (validationError: any) {
      console.error('验证错误:', validationError);
      if (validationError.name === 'ValidationError') {
        return validationErrorResponse(validationError.message);
      }
      throw validationError; // 重新抛出非验证错误
    }
  } catch (error: any) {
    console.error('更新个人资料失败:', error);
    return errorResponse(`更新个人资料失败: ${error.message}`);
  }
} 