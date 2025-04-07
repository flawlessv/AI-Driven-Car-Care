import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { checkRole, authMiddleware } from '@/lib/auth';
import WorkOrder from '@/models/workOrder';
import WorkOrderProgress from '@/models/workOrderProgress';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api-response';

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
    // 验证用户身份和权限
    const authResult = await authMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    // 解析请求数据
    const { status, notes } = await request.json();
    if (!status) {
      return errorResponse('状态不能为空', 400);
    }

    // 验证状态值有效
    const validStatusValues = Object.values(WORK_ORDER_STATUS);
    if (!validStatusValues.includes(status)) {
      return errorResponse(`无效的状态值，有效值为: ${validStatusValues.join(', ')}`, 400);
    }

    // 获取工单信息
    const workOrderId = params.id;
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return notFoundResponse('工单不存在');
    }

    // 获取当前状态
    const currentStatus = workOrder.status;

    // 已完成和已取消的工单不能再变更状态
    if (currentStatus === WORK_ORDER_STATUS.COMPLETED || currentStatus === WORK_ORDER_STATUS.CANCELLED) {
      return errorResponse('已完成或已取消的工单状态不能再变更', 400);
    }

    // 验证状态变更是否有效
    if (!isValidStatusTransition(authResult.user.role, currentStatus, status)) {
      return errorResponse(`无权从 ${currentStatus} 变更为 ${status}`, 403);
    }

    // 更新工单状态
    workOrder.status = status;

    // 如果变更为已完成状态，记录完成日期
    if (status === WORK_ORDER_STATUS.COMPLETED && currentStatus !== WORK_ORDER_STATUS.COMPLETED) {
      workOrder.completionDate = new Date();
    }

    // 记录工单进度
    const progressRecord = new WorkOrderProgress({
      workOrder: workOrderId,
      status: status,
      notes: notes || getDefaultStatusChangeNote(status),
      updatedBy: authResult.user._id,
      createdAt: new Date()
    });
    
    // 保存工单进度记录
    await progressRecord.save();
    console.log('创建工单进度记录:', progressRecord);

    // 保存工单
    await workOrder.save();

    // 获取更新后的工单详细信息
    const updatedWorkOrder = await WorkOrder.findById(workOrderId)
      .populate('vehicle')
      .populate('customer')
      .populate('technician')
      .populate('createdBy');

    // 获取更新后的进度记录（所有记录，按时间倒序）
    const progress = await WorkOrderProgress.find({ workOrder: workOrderId })
      .populate('updatedBy', 'username role')
      .sort({ createdAt: -1 });

    // 返回响应，包含工单信息和进度记录
    return successResponse({
      message: '工单状态更新成功',
      data: {
        workOrder: {
          _id: workOrder._id,
          status: workOrder.status,
          completionDate: workOrder.completionDate
        }
      },
      progress: progress
    });
  } catch (error: any) {
    console.error('更新工单状态失败:', error);
    return errorResponse(error.message || '更新工单状态失败');
  }
}

// 验证状态变更是否有效
function isValidStatusTransition(userRole: string, currentStatus: string, newStatus: string): boolean {
  const statusFlow = {
    admin: ['pending', 'assigned', 'in_progress', 'pending_check', 'completed', 'cancelled'],
    staff: ['pending', 'assigned', 'in_progress', 'pending_check', 'completed', 'cancelled'],
    technician: ['assigned', 'in_progress', 'pending_check'],
    customer: ['pending', 'cancelled']
  };

  // 获取用户角色可操作的状态列表
  const allowedStatuses = statusFlow[userRole as keyof typeof statusFlow] || [];

  // 检查当前状态和目标状态是否在允许列表中
  return allowedStatuses.includes(currentStatus) && allowedStatuses.includes(newStatus);
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