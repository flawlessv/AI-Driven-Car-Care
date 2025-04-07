import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { checkRole } from '@/lib/auth';
import WorkOrder, { WORK_ORDER_STATUS } from '@/models/workOrder';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api-response';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户权限（仅管理员可以审核工单）
    const authResult = await checkRole(['admin'])(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    const workOrderId = params.id;

    await connectDB();

    // 获取工单信息
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return notFoundResponse('工单不存在');
    }

    // 验证工单状态，只有待审核的工单才能被审批
    if (workOrder.status !== WORK_ORDER_STATUS.PENDING_CHECK) {
      return errorResponse('只有待审核的工单才能被审批', 400);
    }

    // 检查是否有完成证明
    if (!workOrder.completionProof || !workOrder.completionProof.proofImages || workOrder.completionProof.proofImages.length === 0) {
      return errorResponse('该工单没有完成证明，无法审批', 400);
    }

    // 更新工单状态为已完成
    workOrder.status = WORK_ORDER_STATUS.COMPLETED;
    workOrder.completionDate = new Date();

    // 更新完成证明的审批状态
    if (workOrder.completionProof) {
      workOrder.completionProof.approved = true;
      workOrder.completionProof.approvedBy = authResult.user._id;
      workOrder.completionProof.approvedAt = new Date();
    }

    // 添加进度记录
    workOrder.progress.push({
      status: WORK_ORDER_STATUS.COMPLETED,
      notes: '管理员已审核通过完成证明',
      timestamp: new Date(),
      user: authResult.user._id
    });

    await workOrder.save();

    return successResponse({
      message: '工单已审核通过，状态已更新为已完成',
      workOrder: {
        _id: workOrder._id,
        status: workOrder.status,
        completionDate: workOrder.completionDate
      }
    });
  } catch (error: any) {
    console.error('审核工单失败:', error);
    return errorResponse(error.message || '审核工单失败');
  }
} 