import { getUserModel } from '@/app/lib/db/models';
import mongoose from 'mongoose';
import WorkOrderProgress from '@/app/models/workOrderProgress';
import Vehicle from '@/app/models/vehicle';
import { User } from '@/types/user';
import { WorkOrder } from '@/types/workOrder';

// 记录工单进度
export async function recordWorkOrderProgress(
  workOrderId: string,
  status: string,
  updatedById: string,
  notes?: string
): Promise<any> {
  try {
    const progressRecord = await WorkOrderProgress.create({
      workOrder: workOrderId,
      status,
      notes: notes || getDefaultStatusNote(status),
      updatedBy: updatedById,
      timestamp: new Date()
    });

    return await WorkOrderProgress.findById(progressRecord._id)
      .populate('updatedBy', 'username role');
  } catch (error) {
    console.error('记录工单进度失败:', error);
    throw error;
  }
}

// 获取状态变更的默认说明
function getDefaultStatusNote(status: string): string {
  const statusNotes: Record<string, string> = {
    pending: '工单已创建',
    assigned: '工单已分配',
    in_progress: '维修开始',
    pending_check: '等待验收',
    completed: '维修完成',
    cancelled: '工单已取消'
  };

  return statusNotes[status] || '状态已更新';
}

// 验证工单状态变更是否有效
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string,
  userRole: string
): boolean {
  // 定义不同角色允许的状态变更
  const allowedTransitions: Record<string, Record<string, string[]>> = {
    admin: {
      pending: ['assigned', 'in_progress', 'cancelled'],
      assigned: ['in_progress', 'cancelled', 'pending'],
      in_progress: ['pending_check', 'cancelled'],
      pending_check: ['completed', 'in_progress'],
      completed: ['in_progress', 'pending'],
      cancelled: ['pending']
    },
    technician: {
      pending: ['assigned', 'in_progress'],
      assigned: ['in_progress', 'pending'],
      in_progress: ['pending_check'],
      pending_check: ['in_progress'],
      completed: ['in_progress']
    },
    customer: {
      pending: ['cancelled'],
      assigned: ['cancelled'],
      in_progress: ['cancelled']
    }
  };

  // 客户只能把工单状态改为"已取消"
  if (userRole === 'customer') {
    return newStatus === 'cancelled';
  }

  // 获取当前用户角色允许的状态变更
  const transitions = allowedTransitions[userRole] || {};
  const allowed = transitions[currentStatus] || [];

  return allowed.includes(newStatus);
}

// 根据工单状态更新车辆状态
export async function updateVehicleStatusByWorkOrder(
  vehicleId: string,
  workOrderStatus: string
): Promise<void> {
  try {
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      console.error('无效的车辆ID:', vehicleId);
      return;
    }

    let vehicleStatus;
    switch (workOrderStatus) {
      case 'in_progress':
        vehicleStatus = 'in_maintenance';
        break;
      case 'completed':
        vehicleStatus = 'available';
        break;
      case 'cancelled':
        vehicleStatus = 'available';
        break;
      default:
        // 不需要更新车辆状态
        return;
    }

    await Vehicle.findByIdAndUpdate(vehicleId, { status: vehicleStatus });
  } catch (error) {
    console.error('更新车辆状态失败:', error);
    throw error;
  }
}

// 更新技师统计数据
export async function updateTechnicianStats(
  technicianId: string,
  changes: {
    totalOrders?: number;
    completedOrders?: number;
    rating?: number;
  }
): Promise<void> {
  try {
    const User = getUserModel();
    const updateData: any = {};

    if (typeof changes.totalOrders === 'number') {
      updateData.$inc = { ...updateData.$inc, totalOrders: changes.totalOrders };
    }
    
    if (typeof changes.completedOrders === 'number') {
      updateData.$inc = { ...updateData.$inc, completedOrders: changes.completedOrders };
    }

    if (typeof changes.rating === 'number') {
      // 获取当前技师信息以计算新的平均评分
      const technician = await User.findById(technicianId);
      if (technician) {
        const currentRating = technician.rating || 0;
        const currentRatedOrders = technician.completedOrders || 0;
        const newRating = (currentRating * currentRatedOrders + changes.rating) / (currentRatedOrders + 1);
        updateData.rating = newRating;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(technicianId, updateData);
    }
  } catch (error) {
    console.error('更新技师统计数据失败:', error);
    throw error;
  }
}

// 检查用户是否有权限操作工单
export async function checkWorkOrderPermission(
  workOrder: WorkOrder,
  userId: string,
  userRole: string
): Promise<boolean> {
  // 管理员有所有权限
  if (userRole === 'admin') {
    return true;
  }

  // 技师可以操作所有工单
  if (userRole === 'technician') {
    return true;
  }

  // 客户只能操作自己的工单
  if (userRole === 'customer') {
    return workOrder.customer === userId;
  }

  return false;
}

// 获取可分配的技师列表
export async function getAvailableTechnicians(): Promise<User[]> {
  const User = getUserModel();
  return await User.find({
    role: 'technician',
    status: 'active',
  }).select('_id username');
}

// 定义工单验证错误接口
interface WorkOrderValidationError {
  field: string;
  message: string | string[];
}

// 验证工单数据
export function validateWorkOrder(workOrderData: any): WorkOrderValidationError[] {
  const errors: WorkOrderValidationError[] = [];

  // 验证必填字段
  if (!workOrderData.vehicle) {
    errors.push({ field: 'vehicle', message: '请选择车辆' });
  }

  // 检查type字段（前端传递的服务类型字段名）
  if (!workOrderData.type) {
    errors.push({ field: 'type', message: '请选择服务类型' });
  }

  if (!workOrderData.description || workOrderData.description.trim() === '') {
    errors.push({ field: 'description', message: '请填写问题描述' });
  }

  // 验证日期（如果有）
  if (workOrderData.scheduledDate) {
    const scheduledDate = new Date(workOrderData.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(scheduledDate.getTime())) {
      errors.push({ field: 'scheduledDate', message: '请输入有效的日期' });
    } else if (scheduledDate < today) {
      errors.push({ field: 'scheduledDate', message: '预约日期不能早于今天' });
    }
  }

  // 验证预估金额（如果有）
  if (workOrderData.estimatedCost !== undefined && workOrderData.estimatedCost !== null) {
    if (isNaN(Number(workOrderData.estimatedCost)) || Number(workOrderData.estimatedCost) < 0) {
      errors.push({ field: 'estimatedCost', message: '请输入有效的预估金额' });
    }
  }

  return errors;
} 