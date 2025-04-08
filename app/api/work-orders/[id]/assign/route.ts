import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import WorkOrder from '@/models/workOrder';
import User from '@/models/user';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import {
  isValidStatusTransition,
  recordWorkOrderProgress,
} from '@/lib/work-order-utils';

// 分配工单
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    // 验证权限 - 允许管理员和员工分配工单
    if (!['admin'].includes(authResult.user.role)) {
      return errorResponse('无权分配工单', 403);
    }

    const workOrder = await WorkOrder.findById(params.id);
    if (!workOrder) {
      return errorResponse('工单不存在', 404);
    }

    // 只允许对待处理的工单进行分配
    if (workOrder.status !== 'pending') {
      return errorResponse('只能分配待处理的工单', 400);
    }

    const data = await request.json();
    const { technicianId, notes } = data;

    if (!technicianId) {
      return errorResponse('技师ID不能为空', 400);
    }

    // 验证技师是否存在
    const technician = await User.findOne({
      _id: technicianId,
      role: 'technician',
      status: 'active'
    });

    if (!technician) {
      return errorResponse('技师不存在或未激活', 404);
    }

    // 更新工单 - 使用findByIdAndUpdate替代save()方法
    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      params.id,
      {
        technician: technicianId,
        status: 'assigned',
        updatedBy: authResult.user._id
      },
      { new: true }
    );

    // 记录工单进度
    await recordWorkOrderProgress(
      workOrder._id,
      'assigned',
      authResult.user._id,
      notes || '工单已分配给技师'
    );

    return successResponse({
      message: '工单分配成功',
      workOrder: updatedWorkOrder
    });

  } catch (error: any) {
    console.error('分配工单失败:', error);
    return errorResponse(error.message || '分配工单失败');
  }
} 