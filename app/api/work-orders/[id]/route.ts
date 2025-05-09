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
      .populate({ path: 'updatedBy', strictPopulate: false })
      .exec();

    if (!workOrder) {
      return NextResponse.json(
        { success: false, message: "工单不存在" },
        { status: 404 }
      );
    }

    // 准备返回数据
    const workOrderData = workOrder.toObject ? workOrder.toObject() : JSON.parse(JSON.stringify(workOrder));
    
    // 确保正确处理completionProof
    if (workOrderData.completionProof) {
      // 已经有completionProof数据，确保格式正确
      if (typeof workOrderData.completionProof === 'object' && workOrderData.completionProof !== null) {
        // 确保proofImages是数组
        if (!Array.isArray(workOrderData.completionProof.proofImages)) {
          workOrderData.completionProof.proofImages = workOrderData.completionProof.proofImages ? 
            [workOrderData.completionProof.proofImages] : [];
        }
      } else if (Array.isArray(workOrderData.completionProof)) {
        // 如果是数组，转换为对象格式
        workOrderData.completionProof = {
          proofImages: workOrderData.completionProof.filter((item: any) => typeof item === 'string'),
          submittedAt: new Date(),
          approved: false
        };
      } else if (typeof workOrderData.completionProof === 'string' && workOrderData.completionProof.length > 0) {
        // 如果是字符串，可能是单张图片
        workOrderData.completionProof = {
          proofImages: [workOrderData.completionProof],
          submittedAt: new Date(),
          approved: false
        };
      } else {
        // 如果格式无法识别，设置为空对象
        workOrderData.completionProof = {
          proofImages: [],
          submittedAt: new Date(),
          approved: false
        };
      }
    }

    // 单独查询工单进度记录
    let progress = [];
    try {
      progress = await WorkOrderProgress.find({ workOrder: params.id })
        .populate({ path: 'updatedBy', select: 'username role', strictPopulate: false })
        .sort({ createdAt: 1 })
        .exec();
        
      // 确保进度数据是数组
      if (!Array.isArray(progress)) {
        progress = [];
      }
      
      // 处理进度数据，确保每个记录都有username字段
      progress = progress.map(item => {
        const progressItem = item.toObject ? item.toObject() : JSON.parse(JSON.stringify(item));
        
        // 确保updatedBy字段包含username
        if (progressItem.updatedBy) {
          if (typeof progressItem.updatedBy === 'string') {
            // 如果updatedBy是ID字符串，添加一个username字段
            progressItem.username = '未知用户';
          } else if (typeof progressItem.updatedBy === 'object') {
            // 如果updatedBy是对象，确保有username字段
            progressItem.username = progressItem.updatedBy.username || '未知用户';
          }
        } else {
          progressItem.username = '系统';
        }
        
        return progressItem;
      });
    } catch (progressError) {
      console.error("获取工单进度失败:", progressError);
      progress = [];
    }
    
    // 获取评价信息
    let evaluation = null;
    try {
      evaluation = await WorkOrderEvaluation.findOne({ workOrder: params.id })
        .populate('createdBy', 'username')
        .exec();
    } catch (evalError) {
      console.error("获取工单评价失败:", evalError);
    }
    
    return NextResponse.json({
      success: true,
      message: "获取工单成功",
      data: workOrderData,
      progress: progress || [],
      evaluation: evaluation || null,
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
      // 检查用户是否有权限更改工单状态
      if (!canChangeStatus(authResult.user.role, workOrder.status, data.status)) {
        return errorResponse(`您的角色（${authResult.user.role}）没有权限将工单从 "${statusText[workOrder.status as keyof typeof statusText]}" 更改为 "${statusText[data.status as keyof typeof statusText]}"`, 403);
      }
      
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
      .populate({ path: 'createdBy', select: 'username', strictPopulate: false })
      .populate({ path: 'updatedBy', select: 'username', strictPopulate: false });

    // 获取更新后的进度记录
    const progress = await WorkOrderProgress.find({ workOrder: params.id })
      .populate({ path: 'updatedBy', select: 'username', strictPopulate: false })
      .sort({ timestamp: -1 });

    console.log('更新后的进度记录:', progress);
    
    // 处理进度数据，确保每个记录都有username字段
    const formattedProgress = progress.map(item => {
      const progressItem = item.toObject ? item.toObject() : JSON.parse(JSON.stringify(item));
      
      // 确保updatedBy字段包含username
      if (progressItem.updatedBy) {
        if (typeof progressItem.updatedBy === 'string') {
          // 如果updatedBy是ID字符串，添加一个username字段
          progressItem.username = '未知用户';
        } else if (typeof progressItem.updatedBy === 'object') {
          // 如果updatedBy是对象，确保有username字段
          progressItem.username = progressItem.updatedBy.username || '未知用户';
        }
      } else {
        progressItem.username = '系统';
      }
      
      return progressItem;
    });

    return successResponse({
      message: '工单更新成功',
      workOrder: updatedWorkOrder,
      progress: formattedProgress
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
    const authResult = await authMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    const user = authResult.user;
    await connectDB();

    const workOrder = await WorkOrder.findById(params.id);
    if (!workOrder) {
      return errorResponse('工单不存在', 404);
    }

    // 如果是客户，只能删除自己的工单
    if (user.role === 'customer') {
      // 获取工单的客户ID
      const workOrderCustomerId = workOrder.customer && typeof workOrder.customer === 'object' 
        ? workOrder.customer._id?.toString() 
        : workOrder.customer?.toString();
      
      // 检查是否是客户自己的工单
      const userId = user._id?.toString();
      if (workOrderCustomerId !== userId) {
        return errorResponse('您只能删除自己的工单', 403);
      }
      
      // 客户只能删除待处理或已取消的工单
      if (!['pending', 'cancelled'].includes(workOrder.status)) {
        return errorResponse('只能删除待处理或已取消的工单');
      }
    }
    // 如果是管理员，可以删除任何工单
    else if (user.role !== 'admin') {
      return errorResponse('无权删除工单', 403);
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
    customer: ['cancelled'] // 客户只能将工单取消
  };

  // 客户角色只能把特定状态的工单修改为取消状态
  if (userRole === 'customer') {
    // 客户只能取消待处理、已分配和进行中的工单
    const canCancelStatuses = ['pending', 'assigned', 'in_progress'];
    return newStatus === 'cancelled' && canCancelStatuses.includes(currentStatus);
  }

  // 获取用户角色可操作的状态列表
  const allowedStatuses = statusFlow[userRole as keyof typeof statusFlow] || [];

  // 其他角色按原有逻辑处理
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
      notes: notes,
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
      
    // 确保返回的进度记录中有username字段
    const progressData = populatedProgress.toObject ? populatedProgress.toObject() : JSON.parse(JSON.stringify(populatedProgress));
    
    // 添加username字段
    if (progressData.updatedBy) {
      if (typeof progressData.updatedBy === 'string') {
        progressData.username = '未知用户';
      } else if (typeof progressData.updatedBy === 'object') {
        progressData.username = progressData.updatedBy.username || '未知用户';
      }
    } else {
      progressData.username = user.username || '系统';
    }

    console.log('创建的进度记录:', progressData);

    return progressData;
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