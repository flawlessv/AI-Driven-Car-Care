import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import WorkOrder from '@/models/workOrder';
import WorkOrderEvaluation from '@/models/workOrderEvaluation';
import Review from '@/models/review';
import User from '@/models/user';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';

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

    // 确保有用户信息
    if (!authResult.user) {
      return errorResponse('用户信息不完整', 401);
    }

    console.log('授权用户信息:', authResult.user);

    await connectDB();

    const workOrder = await WorkOrder.findById(params.id)
      .populate('vehicle')
      .populate('technician');
      
    if (!workOrder) {
      return errorResponse('工单不存在', 404);
    }

    console.log('找到工单:', workOrder);
    
    // 检查technician是否存在
    if (!workOrder.technician) {
      return errorResponse('工单没有分配技师，无法评价', 400);
    }

    if (workOrder.status !== 'completed') {
      return errorResponse('工单未完成，不能评价', 400);
    }

    const existingEvaluation = await WorkOrderEvaluation.findOne({ workOrder: params.id });
    if (existingEvaluation) {
      return errorResponse('工单已评价', 400);
    }

    const data = await request.json();
    console.log('接收到的评价数据:', data);
    
    const { rating, feedback, targetType } = data;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse('评分必须在1-5之间', 400);
    }

    // 安全地获取技师ID
    const technicianId = workOrder.technician?._id;
    if (!technicianId) {
      return errorResponse('无法获取技师信息', 400);
    }

    // 创建工单评价
    const evaluation = new WorkOrderEvaluation({
      workOrder: params.id,
      customer: authResult.user._id,
      technician: technicianId, // 已检查非空
      rating,
      feedback: feedback || '',
      createdBy: authResult.user._id
    });

    const savedEvaluation = await evaluation.save();
    console.log('工单评价已保存:', savedEvaluation);

    // 更新工单评分
    await WorkOrder.findByIdAndUpdate(params.id, {
      rating: rating,
      feedback: feedback,
      updatedBy: authResult.user._id
    });
    console.log('工单已更新评分');

    // 更新技师统计数据 - 手动实现简单的技师评分统计更新
    try {
      // 技师ID已在前面验证非空
      const technician = await User.findById(technicianId);
      if (technician) {
        // 获取技师已完成的工单数和总评分
        const completedOrders = await WorkOrder.countDocuments({
          technician: technicianId,
          status: 'completed'
        });
        
        const ratedOrders = await WorkOrder.find({
          technician: technicianId,
          status: 'completed',
          rating: { $exists: true, $ne: null }
        });
        
        let totalRating = 0;
        ratedOrders.forEach(order => {
          if (order.rating) totalRating += order.rating;
        });
        
        const averageRating = ratedOrders.length > 0 ? totalRating / ratedOrders.length : 0;
        
        // 更新技师统计
        await User.findByIdAndUpdate(technicianId, {
          completedOrders: completedOrders,
          rating: averageRating.toFixed(1)
        });
        
        console.log(`更新技师(${technicianId})统计: 完成订单=${completedOrders}, 平均评分=${averageRating}`);
      }
    } catch (statsError) {
      console.error('更新技师统计失败:', statsError);
      // 不影响主流程继续
    }

    // 同时创建评价系统中的记录，保持两个系统同步
    try {
      console.log('开始创建评价系统记录...');
      
      // 技师信息在前面已验证非空
      const userId = authResult.user._id;
      
      // 创建评价管理系统的记录
      const reviewData = {
        author: userId, // 使用用户ID作为作者
        targetType: 'technician',
        targetId: technicianId, // 使用已验证的技师ID
        maintenanceRecord: workOrder.maintenanceRecord || workOrder._id, // 使用关联的维修记录或工单ID
        rating: rating,
        content: feedback || '无评价内容',
        status: 'published'
      };
      
      console.log('准备创建的评价数据:', reviewData);
      
      const review = new Review(reviewData);
      const savedReview = await review.save();
      
      console.log('成功创建评价系统记录:', savedReview._id);
    } catch (reviewError: any) {
      console.error('创建评价系统记录失败:', reviewError);
      console.error('错误详情:', reviewError.message);
      // 不影响主流程，只记录错误
    }

    return successResponse(evaluation);
  } catch (error: any) {
    console.error('创建工单评价失败:', error);
    return errorResponse('创建工单评价失败:' + (error.message || '未知错误'), 500);
  }
} 