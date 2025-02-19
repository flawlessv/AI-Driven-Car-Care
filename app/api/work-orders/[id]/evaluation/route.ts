import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import WorkOrder from '@/models/workOrder';
import WorkOrderEvaluation from '@/models/workOrderEvaluation';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { updateTechnicianStats } from '@/lib/work-order-utils';

// 获取工单评价
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const evaluation = await WorkOrderEvaluation.findOne({
      workOrder: params.id,
    })
      .populate('customer', 'username')
      .populate('technician', 'username');

    if (!evaluation) {
      return errorResponse('工单评价不存在', 404);
    }

    return successResponse(evaluation);
  } catch (error: any) {
    console.error('获取工单评价失败:', error);
    return errorResponse('获取工单评价失败', 500);
  }
}

// 提交工单评价
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

    const workOrder = await WorkOrder.findById(params.id);
    if (!workOrder) {
      return errorResponse('工单不存在', 404);
    }

    if (authResult.user.role !== 'customer' || workOrder.customer.toString() !== authResult.user._id.toString()) {
      return errorResponse('无权评价此工单', 403);
    }

    if (workOrder.status !== 'completed') {
      return errorResponse('工单未完成，不能评价', 400);
    }

    const existingEvaluation = await WorkOrderEvaluation.findOne({ workOrder: params.id });
    if (existingEvaluation) {
      return errorResponse('工单已评价', 400);
    }

    const data = await request.json();
    const { rating, feedback } = data;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse('评分必须在1-5之间', 400);
    }

    const evaluation = new WorkOrderEvaluation({
      workOrder: params.id,
      customer: authResult.user._id,
      technician: workOrder.technician,
      rating,
      feedback: feedback || ''
    });

    await evaluation.save();

    workOrder.rating = rating;
    await workOrder.save();

    await updateTechnicianStats(workOrder.technician, {
      rating: rating
    });

    return successResponse(evaluation);
  } catch (error: any) {
    console.error('创建工单评价失败:', error);
    return errorResponse('创建工单评价失败', 500);
  }
} 