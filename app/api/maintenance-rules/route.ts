import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import MaintenanceRule from '@/models/maintenanceRule';
import Vehicle from '@/models/vehicle';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const {user} = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const data = await request.json();
    const { vehicleId, type, mileageInterval, timeInterval } = data;

    // 验证必填字段
    if (!vehicleId || !type) {
      return validationErrorResponse('缺少必需的字段');
    }

    // 验证车辆是否存在
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return validationErrorResponse('车辆不存在');
    }

    // 验证规则类型和对应的参数
    if (type === 'mileage' && !mileageInterval) {
      return validationErrorResponse('里程类型的规则必须设置里程间隔');
    }
    if (type === 'time' && !timeInterval) {
      return validationErrorResponse('时间类型的规则必须设置时间间隔');
    }
    if (type === 'both' && (!mileageInterval || !timeInterval)) {
      return validationErrorResponse('复合类型的规则必须同时设置里程和时间间隔');
    }

    // 创建新的保养规则
    const rule = new MaintenanceRule({
      vehicle: vehicleId,
      type,
      mileageInterval,
      timeInterval,
      enabled: true,
      createdBy: user._id,
    });

    await rule.save();

    // 填充关联字段
    await rule.populate('vehicle', 'brand model licensePlate');
    await rule.populate('createdBy', 'username');

    return successResponse({
      data: rule,
      message: '保养规则创建成功'
    });
  } catch (error: any) {
    console.error('创建保养规则失败:', error);
    if (error.name === 'ValidationError') {
      return validationErrorResponse(error.message);
    }
    return errorResponse(error.message || '创建保养规则失败');
  }
} 