import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import MaintenanceRule from '../../../../../models/maintenanceRule';
import Vehicle from '../../../../../models/vehicle';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';

// 获取单个维修规则
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const rule = await MaintenanceRule.findById(params.id)
      .populate('vehicle', 'brand model licensePlate');

    if (!rule) {
      return errorResponse('维修规则不存在', 404);
    }

    // 检查权限
    if (authResult.user.role === 'customer') {
      const vehicle = await Vehicle.findById(rule.vehicle);
      if (!vehicle || vehicle.owner.toString() !== authResult.user._id.toString()) {
        return errorResponse('无权访问此维修规则', 403);
      }
    }

    return successResponse(rule);
  } catch (error: any) {
    console.error('获取维修规则失败:', error);
    return errorResponse(error.message);
  }
}

// 更新维修规则
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const data = await request.json();
    const rule = await MaintenanceRule.findById(params.id);

    if (!rule) {
      return errorResponse('维修规则不存在', 404);
    }

    // 验证访问权限
    if (user.role === 'customer') {
      const vehicle = await Vehicle.findById(rule.vehicle);
      if (!vehicle || vehicle.owner.toString() !== user._id.toString()) {
        return errorResponse('无权修改此维修规则', 403);
      }
    }

    // 验证提醒类型和对应的参数
    if ((data.type === 'mileage' || data.type === 'both') && !data.mileageInterval) {
      return validationErrorResponse('里程提醒需要设置里程间隔');
    }
    if ((data.type === 'time' || data.type === 'both') && !data.timeInterval) {
      return validationErrorResponse('时间提醒需要设置时间间隔');
    }

    // 更新规则
    Object.assign(rule, data);
    await rule.save();

    return successResponse({
      data: rule,
      message: '维修规则更新成功',
    });
  } catch (error: any) {
    console.error('更新维修规则失败:', error);
    if (error.name === 'ValidationError') {
      return validationErrorResponse(
        Object.values(error.errors)
          .map((err: any) => err.message)
          .join(', ')
      );
    }
    return errorResponse(error.message);
  }
}

// 删除维修规则
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const rule = await MaintenanceRule.findById(params.id);

    if (!rule) {
      return errorResponse('维修规则不存在', 404);
    }

    // 验证访问权限
    if (user.role === 'customer') {
      const vehicle = await Vehicle.findById(rule.vehicle);
      if (!vehicle || vehicle.owner.toString() !== user._id.toString()) {
        return errorResponse('无权删除此维修规则', 403);
      }
    }

    await rule.deleteOne();

    return successResponse({
      message: '维修规则删除成功',
    });
  } catch (error: any) {
    console.error('删除维修规则失败:', error);
    return errorResponse(error.message);
  }
} 