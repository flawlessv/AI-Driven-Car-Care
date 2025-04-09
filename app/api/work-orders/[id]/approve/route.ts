import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import WorkOrder from '@/app/models/workOrder';
import WorkOrderProgress from '@/app/models/workOrderProgress';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/app/lib/api-response';
import { checkRole } from '@/app/lib/auth';
import { updateVehicleStatusByWorkOrder } from '@/app/lib/work-order-utils';

// 定义工单状态常量
const WORK_ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  PENDING_CHECK: 'pending_check',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// PUT 方法：管理员批准工单完成
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份和权限
    const authResult = await checkRole(['admin'])(request);
    if (!authResult.success || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const workOrderId = params.id;
    
    // 获取工单信息
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return notFoundResponse('工单不存在');
    }

    // 验证工单状态
    if (workOrder.status !== 'pending_check') {
      return errorResponse('只有处于待审核状态的工单才能通过审批', 400);
    }

    // 更新工单状态为已完成
    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      workOrderId,
      { 
        status: 'completed',
        completionDate: new Date()
      },
      { new: true }
    )
    .populate('vehicle')
    .populate('customer')
    .populate('technician');

    if (!updatedWorkOrder) {
      return errorResponse('更新工单状态失败', 500);
    }

    // 创建工单进度记录
    const progressRecord = new WorkOrderProgress({
      workOrder: workOrderId,
      status: 'completed',
      notes: '管理员已审批完成',
      updatedBy: authResult.user._id,
      createdAt: new Date() // 确保使用当前时间
    });

    await progressRecord.save();
    console.log('创建工单进度记录:', progressRecord);

    // 如果工单有关联车辆，更新车辆状态
    if (workOrder.vehicle) {
      await updateVehicleStatusByWorkOrder(workOrder.vehicle.toString(), 'completed');
    }

    // 获取最新的进度记录
    const progress = await WorkOrderProgress.find({ workOrder: workOrderId })
      .populate('updatedBy', 'username role')
      .sort({ createdAt: -1 });

    // 返回统一的响应结构
    return successResponse({
      workOrder: updatedWorkOrder,
      progress: progress
    });
    
  } catch (error: any) {
    console.error('审批工单失败:', error);
    return errorResponse(error.message || '审批工单失败');
  }
} 