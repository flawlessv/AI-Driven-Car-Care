import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
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

// PUT 方法：管理员批准工单完成
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

    // 只有管理员可以审批工单
    if (authResult.user.role !== 'admin') {
      return errorResponse('只有管理员可以审批工单', 403);
    }

    await connectDB();

    // 获取工单信息
    const workOrderId = params.id;
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return notFoundResponse('工单不存在');
    }

    // 只有 pending_check 状态的工单可以审批
    if (workOrder.status !== WORK_ORDER_STATUS.PENDING_CHECK) {
      return errorResponse('只有待审核状态的工单可以审批', 400);
    }

    // 更新工单状态为已完成
    workOrder.status = WORK_ORDER_STATUS.COMPLETED;
    workOrder.completionDate = new Date();
    
    // 如果工单有完成证明，更新完成证明的审批信息
    if (workOrder.completionProof) {
      workOrder.completionProof.approved = true;
      workOrder.completionProof.approvedBy = authResult.user._id;
      workOrder.completionProof.approvedAt = new Date();
    }

    // 记录工单进度
    const progressRecord = new WorkOrderProgress({
      workOrder: workOrderId,
      status: WORK_ORDER_STATUS.COMPLETED,
      notes: '工单已审核通过，维修完成',
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

    // 获取所有进度记录，按时间倒序
    const progress = await WorkOrderProgress.find({ workOrder: workOrderId })
      .populate('updatedBy', 'username role')
      .sort({ createdAt: -1 });

    return successResponse({
      message: '工单审批成功',
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
    console.error('审批工单失败:', error);
    return errorResponse(error.message || '审批工单失败');
  }
} 