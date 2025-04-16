import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import WorkOrder from '@/app/models/workOrder';
import WorkOrderProgress from '@/app/models/workOrderProgress';
import WorkOrderEvaluation from '@/app/models/workOrderEvaluation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/lib/api-response';

// 获取工单详情
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // 验证身份
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }

    const workOrder = await WorkOrder.findById(params.id)
      .populate('vehicle')
      .populate('customer')
      .populate('technician')
      .populate({ path: 'createdBy', strictPopulate: false })
      .exec();

    if (!workOrder) {
      return NextResponse.json(
        { success: false, message: "工单不存在" },
        { status: 404 }
      );
    }

    // 准备返回数据
    const workOrderData = workOrder.toObject();
    
    // 确保正确处理completionProof
    if (workOrder.completionProof) {
      // 已经有completionProof数据，确保格式正确
      if (typeof workOrder.completionProof === 'object' && workOrder.completionProof !== null) {
        // 确保proofImages是数组
        if (!Array.isArray(workOrder.completionProof.proofImages)) {
          workOrderData.completionProof.proofImages = [];
        }
      } else if (Array.isArray(workOrder.completionProof)) {
        // 如果是数组，转换为对象格式
        workOrderData.completionProof = {
          proofImages: workOrder.completionProof.filter((item: any) => typeof item === 'string'),
          submittedAt: new Date(),
          approved: false
        };
      } else if (typeof workOrder.completionProof === 'string' && workOrder.completionProof.length > 0) {
        // 如果是字符串，可能是单张图片
        workOrderData.completionProof = {
          proofImages: [workOrder.completionProof],
          submittedAt: new Date(),
          approved: false
        };
      }
    }

    // 单独查询工单进度记录
    const progress = await WorkOrderProgress.find({ workOrder: params.id })
      .populate('updatedBy', 'username role')
      .sort({ createdAt: -1 })
      .exec();
    const evaluation = await WorkOrderEvaluation.findOne({ workOrder: params.id })
      .populate('createdBy', 'username')
      .exec();
    return NextResponse.json({
      success: true,
      message: "获取工单成功",
      data: workOrderData,
      progress,
      evaluation,
    });
  } catch (error: any) {
    console.error("获取工单失败:", error);
    return NextResponse.json(
      { success: false, message: `获取工单失败: ${error.message}` },
      { status: 500 }
    );
  }
}

// 工单状态常量
const WORK_ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  PENDING_CHECK: 'pending_check',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

// 处理数组中的字符串项
function filterStringItems(arr: any[]): string[] {
  return arr.filter((item: unknown) => typeof item === 'string') as string[];
}

// 更新工单
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }

    const workOrder = await WorkOrder.findById(params.id);
    if (!workOrder) {
      return errorResponse('工单不存在', 404);
    }

    const data = await req.json();
    console.log('收到的更新数据:', data);
    
    if (data.status) {
      // 使用 handleStatusChange 函数创建进度记录
      await handleStatusChange(
        params.id,
        data.status,
        authResult.user,
        data.progressNotes
      );

      // 更新工单状态，使用findByIdAndUpdate而不是直接修改保存，以避免验证问题
      await WorkOrder.findByIdAndUpdate(params.id, { 
        status: data.status,
        updatedBy: authResult.user._id  // 添加更新者信息
      });
    } else {
      // 处理完整工单更新
      // 确保保留创建者信息
      if (!data.createdBy) {
        data.createdBy = workOrder.createdBy;
      }
      
      // 添加更新者信息
      data.updatedBy = authResult.user._id;
      
      // 使用findByIdAndUpdate避免验证问题
      await WorkOrder.findByIdAndUpdate(params.id, data, { 
        runValidators: true  // 仍然运行验证但跳过required验证
      });
    }

    // 重新获取更新后的工单
    const updatedWorkOrder = await WorkOrder.findById(params.id)
      .populate('vehicle', 'brand model licensePlate')
      .populate('customer', 'username email phone')
      .populate('technician', 'username email phone')
      .populate({ path: 'createdBy', select: 'username', strictPopulate: false });

    // 获取更新后的进度记录
    const progress = await WorkOrderProgress.find({ workOrder: params.id })
      .populate('updatedBy', 'username')
      .sort({ timestamp: -1 });

    console.log('更新后的进度记录:', progress);

    return successResponse({
      message: '工单更新成功',
      workOrder: updatedWorkOrder,
      progress
    });

  } catch (error: any) {
    console.error('更新工单失败:', error);
    return errorResponse(error.message || '更新工单失败');
  }
}

// 删除工单
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {user} = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    // 只有管理员可以删除工单
    if (user.role !== 'admin') {
      return errorResponse('无权删除工单', 403);
    }

    await connectDB();

    const workOrder = await WorkOrder.findById(params.id);
    if (!workOrder) {
      return errorResponse('工单不存在', 404);
    }

    // 如果工单状态不是 pending 或 cancelled，不允许删除
    if (!['pending', 'cancelled'].includes(workOrder.status)) {
      return errorResponse('只能删除待处理或已取消的工单');
    }

    await workOrder.deleteOne();

    // 删除相关的进度记录
    await WorkOrderProgress.deleteMany({ workOrder: params.id });

    return successResponse({
      message: '工单删除成功',
    });
  } catch (error: any) {
    console.error('删除工单失败:', error);
    return errorResponse(error.message);
  }
}

// 检查是否可以变更状态
function canChangeStatus(userRole: string, currentStatus: string, newStatus: string): boolean {
  const statusFlow = {
    admin: ['pending', 'assigned', 'in_progress', 'pending_check', 'completed', 'cancelled'],
    technician: ['pending', 'assigned', 'in_progress', 'pending_check', 'completed'], // 技师可以操作除了取消外的所有状态
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

// 修改 handleStatusChange 函数
const handleStatusChange = async (workOrderId: string, status: string, user: any, notes?: string) => {
  try {
    console.log('创建进度记录:', {
      workOrder: workOrderId,
      status,
      note: notes,
      updatedBy: user._id,
      timestamp: new Date()
    });

    // 创建状态历史记录
    const progress = await WorkOrderProgress.create({
      workOrder: workOrderId,
      status,
      notes: notes,
      updatedBy: user._id,
      timestamp: new Date()
    });

    // 获取包含用户信息的进度记录
    const populatedProgress = await WorkOrderProgress.findById(progress._id)
      .populate('updatedBy', 'username');

    console.log('创建的进度记录:', populatedProgress);

    return populatedProgress;
  } catch (error) {
    console.error('创建进度记录失败:', error);
    throw error;
  }
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