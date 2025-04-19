import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { checkRole, authMiddleware } from '@/app/lib/auth';
import WorkOrder from '@/app/models/workOrder';
import WorkOrderProgress from '@/app/models/workOrderProgress';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/app/lib/api-response';
import {
  isValidStatusTransition,
  recordWorkOrderProgress,
  updateVehicleStatusByWorkOrder,
} from '@/app/lib/work-order-utils';

// 定义工单状态常量
const WORK_ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  PENDING_CHECK: 'pending_check',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// 状态显示文本
const statusText = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  pending_check: '待审核',
  completed: '已完成',
  cancelled: '已取消'
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 使用authMiddleware替代checkRole，因为对于客户我们需要单独处理取消状态的权限
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    await connectDB();

    const { id } = params;
    const { status, notes } = await request.json();

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    // 客户只能将工单状态修改为"已取消"
    if (authResult.user.role === 'customer' && status !== 'cancelled') {
      return errorResponse('客户只能取消工单', 403);
    }

    // 查找工单
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return errorResponse('工单不存在', 404);
    }

    // 如果是客户，还需要检查是否是自己的工单
    if (authResult.user.role === 'customer') {
      const workOrderCustomerId = workOrder.customer && typeof workOrder.customer === 'object' 
        ? workOrder.customer._id?.toString() 
        : workOrder.customer?.toString();
      
      const userId = authResult.user._id?.toString();
      if (workOrderCustomerId !== userId) {
        return errorResponse('您只能取消自己的工单', 403);
      }

      // 客户只能取消特定状态的工单
      const canCancelStatuses = ['pending', 'assigned', 'in_progress'];
      if (!canCancelStatuses.includes(workOrder.status)) {
        return errorResponse('只能取消待处理、已分配或进行中的工单', 400);
      }
    } 
    // 对于管理员和技师，使用标准的状态转换检查
    else if (!isValidStatusTransition(workOrder.status, status, authResult.user.role)) {
      return errorResponse(`无法将工单状态从 "${workOrder.status}" 更改为 "${status}"`, 400);
    }

    // 更新工单状态
    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      id,
      { 
        status,
        ...(status === 'completed' ? { completionDate: new Date() } : {})
      },
      { new: true }
    )
    .populate('vehicle')
    .populate('customer')
    .populate('technician')
    .populate({ path: 'updatedBy', select: 'username role', strictPopulate: false });

    if (!updatedWorkOrder) {
      return errorResponse('更新工单状态失败', 500);
    }

    // 使用当前时间记录工单进度
    await recordWorkOrderProgress(
      id,
      status,
      String(authResult.user._id),
      notes || `状态更新为 ${statusText[status as keyof typeof statusText] || status}`
    );

    // 如果状态变更为已完成，更新车辆状态
    if (status === 'completed' && updatedWorkOrder.vehicle) {
      const vehicleId = typeof updatedWorkOrder.vehicle === 'string' 
        ? updatedWorkOrder.vehicle 
        : updatedWorkOrder.vehicle._id;
      
      await updateVehicleStatusByWorkOrder(vehicleId.toString(), status);
    }

    // 获取最新的进度记录
    const progressRecords = await WorkOrderProgress.find({ workOrder: id })
      .populate('updatedBy', 'username role')
      .sort({ createdAt: -1 });

    // 返回直接的结构，而不是嵌套在data属性下
    return successResponse({
      workOrder: updatedWorkOrder,
      progress: progressRecords
    });
    
  } catch (error: any) {
    console.error('更新工单状态失败:', error);
    return errorResponse(error.message || '更新工单状态失败');
  }
}

// 获取状态变更默认说明
function getDefaultStatusChangeNote(status: string): string {
  const statusNotes = {
    pending: '工单已创建',
    assigned: '工单已分配',
    in_progress: '维修开始',
    pending_check: '等待验收',
    completed: '维修完成',
    cancelled: '工单已取消'
  };

  return statusNotes[status as keyof typeof statusNotes] || '状态已更新';
} 