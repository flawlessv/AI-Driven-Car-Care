import { NextRequest } from 'next/server';
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
    // 验证用户权限（技师、员工和管理员可以更新状态）
    const authResult = await checkRole(['admin', 'staff', 'technician'])(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
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

    // 权限和状态流转验证
    const userRole = authResult.user.role;
    const currentStatus = workOrder.status;

    // 技师不能将工单直接设置为已完成或待审核，必须通过完成证明流程
    if (userRole === 'technician' && (status === WORK_ORDER_STATUS.COMPLETED || status === WORK_ORDER_STATUS.PENDING_CHECK)) {
      return errorResponse('技师不能直接将工单设置为已完成或待审核状态，请提交完成证明', 403);
    }

    // 只有管理员可以审核并将工单从待审核变更为已完成
    if (status === WORK_ORDER_STATUS.COMPLETED && currentStatus === WORK_ORDER_STATUS.PENDING_CHECK && userRole !== 'admin') {
      return errorResponse('只有管理员可以审核工单并将其标记为已完成', 403);
    }

    // 已完成和已取消的工单不能再变更状态
    if ((currentStatus === WORK_ORDER_STATUS.COMPLETED || currentStatus === WORK_ORDER_STATUS.CANCELLED) && 
        userRole !== 'admin') {
      return errorResponse('已完成或已取消的工单状态不能再变更', 400);
    }

    // 更新工单状态
    workOrder.status = status;

    // 如果变更为已完成状态，记录完成日期
    if (status === WORK_ORDER_STATUS.COMPLETED && currentStatus !== WORK_ORDER_STATUS.COMPLETED) {
      workOrder.completionDate = new Date();
    }

    // 添加进度记录
    workOrder.progress.push({
      status,
      notes: notes || `工单状态已更新为: ${status}`,
      timestamp: new Date(),
      user: authResult.user._id
    });

    // 保存工单
    await workOrder.save();

    return successResponse({
      message: '工单状态更新成功',
      workOrder: {
        _id: workOrder._id,
        status: workOrder.status,
        completionDate: workOrder.completionDate
      }
    });
  } catch (error: any) {
    console.error('更新工单状态失败:', error);
    return errorResponse(error.message || '更新工单状态失败');
  }
} 