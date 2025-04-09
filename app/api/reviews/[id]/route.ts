import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/app/lib/db-connect';
import Review from '@/app/models/review';
import { authMiddleware } from '@/app/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const review = await Review.findById(params.id)
      .populate('author', 'username name email phone')
      // .populate('maintenanceRecord', 'date type cost')
      // 先获取review，再根据targetType决定如何填充targetId
      .then(async (foundReview) => {
        if (!foundReview) return null;
        
        // 只有当targetType为technician时才填充User模型
        if (foundReview.targetType === 'technician') {
          return foundReview.populate({
            path: 'targetId',
            model: 'User',
            select: 'username name'
          });
        }
        return foundReview;
      });

    if (!review) {
      return NextResponse.json(
        { success: false, message: '评价不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error('获取评价详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '获取评价详情失败',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 鉴权：确保用户已登录
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: '未授权操作' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: '无法获取用户信息' },
        { status: 401 }
      );
    }
    
    // 查找评价
    await dbConnect();
    const existingReview = await Review.findById(params.id);
    
    if (!existingReview) {
      return NextResponse.json(
        { success: false, message: '评价不存在' },
        { status: 404 }
      );
    }
    
    // 权限检查：只有管理员或评价作者可以修改
    const isAuthor = existingReview.author && 
      existingReview.author.toString() === currentUser._id.toString();
    
    if (currentUser.role !== 'admin' && !isAuthor) {
      return NextResponse.json(
        { success: false, message: '无权操作此评价' },
        { status: 403 }
      );
    }

    const data = await request.json();

    const review = await Review.findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('author', 'username name email phone')
      .then(async (updatedReview) => {
        if (updatedReview && updatedReview.targetType === 'technician') {
          return updatedReview.populate({
            path: 'targetId',
            model: 'User',
            select: 'username name'
          });
        }
        return updatedReview;
      });
      
    // 如果评价状态变为隐藏，同时更新对应工单中的评价字段
    if (data.status === 'hidden' && review.workOrder) {
      try {
        const WorkOrder = require('@/app/models/workOrder');
        const WorkOrderEvaluation = require('@/app/models/workOrderEvaluation');
        
        // 首先更新专门的评价模型状态
        await WorkOrderEvaluation.findOneAndUpdate(
          { workOrder: review.workOrder },
          { status: 'hidden' }
        );
        
        // 然后更新工单中的评价字段
        await WorkOrder.findByIdAndUpdate(review.workOrder, {
          feedback: '已隐藏'  // 保持向后兼容的旧方式
        });
        
        console.log(`已更新工单${review.workOrder}的评价为隐藏状态`);
      } catch (workOrderError) {
        console.error('更新工单评价状态失败:', workOrderError);
        // 不影响主流程
      }
    }

    return NextResponse.json({
      success: true,
      message: '评价更新成功',
      data: review,
    });
  } catch (error: any) {
    console.error('更新评价失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '更新评价失败',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 鉴权：确保用户已登录
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: '未授权操作' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: '无法获取用户信息' },
        { status: 401 }
      );
    }
    
    // 查找评价
    await dbConnect();
    const existingReview = await Review.findById(params.id);
    
    if (!existingReview) {
      return NextResponse.json(
        { success: false, message: '评价不存在' },
        { status: 404 }
      );
    }
    
    // 权限检查：只有管理员或评价作者可以删除
    const isAuthor = existingReview.author && 
      existingReview.author.toString() === currentUser._id.toString();
    
    if (currentUser.role !== 'admin' && !isAuthor) {
      return NextResponse.json(
        { success: false, message: '无权删除此评价' },
        { status: 403 }
      );
    }

    const review = await Review.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: '评价删除成功',
    });
  } catch (error: any) {
    console.error('删除评价失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '删除评价失败',
      },
      { status: 500 }
    );
  }
} 