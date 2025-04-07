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

// 获取维修规则列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    const user = authResult.user;
    await connectDB();

    // 根据用户角色过滤
    let query = {};
    if (user.role === 'customer') {
      // 普通用户只能查看自己的车辆的规则
      const vehicles = await Vehicle.find({ owner: user._id }).select('_id');
      query = { vehicle: { $in: vehicles.map(v => v._id) } };
    }

    const rules = await MaintenanceRule.find(query)
      .populate('vehicle', 'brand model licensePlate')
      .sort({ createdAt: -1 });

    return successResponse(rules);
  } catch (error: any) {
    console.error('获取维修规则失败:', error);
    return errorResponse(error.message);
  }
}

// 创建维修规则
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    const user = authResult.user;
    await connectDB();

    const data = await request.json();
    const { vehicle: vehicleId, type, mileageInterval, timeInterval } = data;

    // 验证必填字段
    if (!vehicleId || !type) {
      return validationErrorResponse('车辆和提醒类型为必填项');
    }

    // 验证提醒类型和对应的参数
    if ((type === 'mileage' || type === 'both') && !mileageInterval) {
      return validationErrorResponse('里程提醒需要设置里程间隔');
    }
    if ((type === 'time' || type === 'both') && !timeInterval) {
      return validationErrorResponse('时间提醒需要设置时间间隔');
    }

    // 验证车辆所有权
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return validationErrorResponse('车辆不存在');
    }
    if (user.role === 'customer' && vehicle.owner.toString() !== user._id.toString()) {
      return errorResponse('无权为此车辆设置维修规则', 403);
    }

    // 检查是否已存在规则
    const existingRule = await MaintenanceRule.findOne({ vehicle: vehicleId });
    if (existingRule) {
      return validationErrorResponse('该车辆已存在维修规则');
    }

    // 创建规则
    const rule = new MaintenanceRule({
      vehicle: vehicleId,
      type,
      mileageInterval,
      timeInterval,
      enabled: true,
      createdBy: user._id
    });

    await rule.save();
    await rule.populate('vehicle', 'brand model licensePlate');

    return successResponse({
      data: rule,
      message: '维修规则创建成功'
    });
  } catch (error: any) {
    console.error('创建维修规则失败:', error);
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