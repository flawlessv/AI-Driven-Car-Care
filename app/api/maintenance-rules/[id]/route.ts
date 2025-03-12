import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import MaintenanceRule from '@/models/maintenanceRule';
import Vehicle from '@/models/vehicle';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/lib/api-response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {user} = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const rule = await MaintenanceRule.findById(params.id)
      .populate('vehicle', 'brand model licensePlate mileage lastMaintenanceDate')
      .populate('createdBy', 'username');

    if (!rule) {
      return notFoundResponse('保养规则不存在');
    }

    return successResponse(rule);
  } catch (error: any) {
    console.error('获取保养规则详情失败:', error);
    return errorResponse(error.message || '获取保养规则详情失败');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {user} = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const data = await request.json();
    const { type, mileageInterval, timeInterval, enabled } = data;

    // 验证必填字段
    if (!type) {
      return validationErrorResponse('缺少必需的字段');
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

    const rule = await MaintenanceRule.findByIdAndUpdate(
      params.id,
      {
        type,
        mileageInterval,
        timeInterval,
        enabled,
      },
      { new: true }
    ).populate('vehicle', 'brand model licensePlate');

    if (!rule) {
      return notFoundResponse('保养规则不存在');
    }

    return successResponse({
      data: rule,
      message: '保养规则更新成功'
    });
  } catch (error: any) {
    console.error('更新保养规则失败:', error);
    if (error.name === 'ValidationError') {
      return validationErrorResponse(error.message);
    }
    return errorResponse(error.message || '更新保养规则失败');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {user} = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const rule = await MaintenanceRule.findByIdAndDelete(params.id);
    if (!rule) {
      return notFoundResponse('保养规则不存在');
    }

    return successResponse({ message: '保养规则已删除' });
  } catch (error: any) {
    console.error('删除保养规则失败:', error);
    return errorResponse(error.message || '删除保养规则失败');
  }
} 