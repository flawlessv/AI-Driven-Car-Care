import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import Maintenance from '@/app/models/maintenance';
import Vehicle from '@/app/models/vehicle';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/lib/api-response';
import mongoose from 'mongoose';

// 维修状态变更记录
interface StatusHistory {
  status: string;
  note: string;
  timestamp: Date;
  updatedBy: mongoose.Types.ObjectId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authMiddleware(req);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    if (user.role === 'customer') {
      return errorResponse('无权执行此操作', 403);
    }

    await connectDB();

    const maintenanceId = params.id;
    if (!mongoose.Types.ObjectId.isValid(maintenanceId)) {
      return errorResponse('无效的维修记录ID', 400);
    }

    const data = await req.json();
    const { status, note } = data;

    // 验证状态值
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return validationErrorResponse('无效的状态值');
    }

    // 查找维修记录
    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance) {
      return errorResponse('维修记录不存在', 404);
    }

    // 验证状态流转
    const currentStatus = maintenance.status;
    if (!isValidStatusTransition(currentStatus, status)) {
      return errorResponse('无效的状态变更', 400);
    }

    // 创建状态变更记录
    const statusHistory: StatusHistory = {
      status,
      note: note || '',
      timestamp: new Date(),
      updatedBy: user._id,
    };

    // 更新维修记录状态
    const updatedMaintenance = await Maintenance.findByIdAndUpdate(
      maintenanceId,
      {
        status,
        $push: { statusHistory: statusHistory },
        ...(status === 'completed' ? { completionDate: new Date() } : {}),
        updatedBy: user._id,
        updatedAt: new Date(),
      },
      { new: true }
    );

    // 更新车辆状态
    if (status === 'completed' || status === 'cancelled') {
      await Vehicle.findByIdAndUpdate(maintenance.vehicle, {
        status: 'available',
      });
    } else if (status === 'in_progress') {
      await Vehicle.findByIdAndUpdate(maintenance.vehicle, {
        status: 'maintenance',
      });
    }

    return successResponse(updatedMaintenance);
  } catch (error: any) {
    console.error('更新维修状态失败:', error);
    return errorResponse(error.message);
  }
}

// 验证状态流转是否合法
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const transitions: { [key: string]: string[] } = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  return transitions[currentStatus]?.includes(newStatus) || false;
} 