import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import WorkOrder from '@/models/workOrder';
import WorkOrderProgress from '@/models/workOrderProgress';

// 管理员审批工单完成
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    // 验证权限 - 只允许管理员和员工审批工单
    if (!['admin', 'staff'].includes(authResult.user.role)) {
      return errorResponse('无权审批工单', 403);
    }

    await connectDB();

    const workOrder = await WorkOrder.findById(params.id);
    if (!workOrder) {
      return errorResponse('工单不存在', 404);
    }

    // 验证工单状态
    if (workOrder.status !== 'pending_check') {
      return errorResponse('只有待验收的工单可以进行审批', 400);
    }

    const data = await request.json();
    const { approved, notes } = data;

    if (approved === undefined) {
      return errorResponse('请指定是否通过审批', 400);
    }

    // 根据审批结果更新工单状态
    const newStatus = approved ? 'completed' : 'in_progress';
    const statusMessage = approved 
      ? '工单已完成并通过审核' 
      : '工单未通过审核，需要返工';

    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      params.id,
      {
        status: newStatus,
        ...(approved ? { completionDate: new Date() } : {}),
        updatedBy: authResult.user._id
      },
      { new: true }
    );

    // 记录工单进度
    const progress = new WorkOrderProgress({
      workOrder: params.id,
      status: newStatus,
      notes: notes || statusMessage,
      updatedBy: authResult.user._id,
    });

    await progress.save();

    return successResponse({
      message: approved ? '工单已完成并通过审核' : '工单已退回返工',
      workOrder: updatedWorkOrder
    });
  } catch (error: any) {
    console.error('审批工单失败:', error);
    return errorResponse(error.message || '审批工单失败');
  }
} 