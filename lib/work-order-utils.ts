import { WorkOrder, WorkOrderStatus } from '@/types/workOrder';
import { ValidationError } from './api-types';
import WorkOrderProgress from '@/models/workOrderProgress';
import Vehicle from '@/models/vehicle';
import User from '@/models/user';

// 验证工单数据
export function validateWorkOrder(data: Partial<WorkOrder>): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证必填字段
  if (!data.vehicle) {
    errors.push({ field: 'vehicle', message: ['车辆是必需的'] });
  }

  if (!data.type) {
    errors.push({ field: 'type', message: ['维修类型是必需的'] });
  }

  if (!data.description) {
    errors.push({ field: 'description', message: ['问题描述是必需的'] });
  }

  if (!data.priority) {
    errors.push({ field: 'priority', message: ['优先级是必需的'] });
  }

  // 验证数值字段
  if (data.estimatedHours !== undefined && data.estimatedHours < 0) {
    errors.push({ field: 'estimatedHours', message: ['预计工时不能小于0'] });
  }

  if (data.actualHours !== undefined && data.actualHours < 0) {
    errors.push({ field: 'actualHours', message: ['实际工时不能小于0'] });
  }

  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    errors.push({ field: 'rating', message: ['评分必须在1-5之间'] });
  }

  return errors;
}

// 检查工单状态转换是否有效
export function isValidStatusTransition(
  currentStatus: WorkOrderStatus,
  newStatus: WorkOrderStatus,
  userRole: string
): boolean {
  const statusFlow = {
    pending: ['assigned', 'cancelled'],
    assigned: ['in_progress', 'cancelled'],
    in_progress: ['pending_check', 'cancelled'],
    pending_check: ['completed', 'in_progress', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  // 管理员可以进行任意状态转换
  if (userRole === 'admin') {
    return true;
  }

  // 检查状态转换是否在允许的流程中
  return statusFlow[currentStatus].includes(newStatus);
}

// 记录工单进度
export async function recordWorkOrderProgress(
  workOrderId: string,
  status: WorkOrderStatus,
  userId: string,
  notes?: string
): Promise<void> {
  const progress = new WorkOrderProgress({
    workOrder: workOrderId,
    status,
    notes,
    updatedBy: userId,
  });

  await progress.save();
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

  // 技师只能操作分配给自己的工单
  if (userRole === 'technician') {
    return workOrder.technician === userId;
  }

  // 客户只能操作自己的工单
  if (userRole === 'customer') {
    return workOrder.customer === userId;
  }

  return false;
}

// 更新车辆状态
export async function updateVehicleStatusByWorkOrder(
  vehicleId: string,
  status: WorkOrderStatus
): Promise<void> {
  const vehicleStatus = status === 'in_progress' ? 'maintenance' : 'active';
  await Vehicle.findByIdAndUpdate(vehicleId, { status: vehicleStatus });
}

// 获取可分配的技师列表
export async function getAvailableTechnicians(): Promise<User[]> {
  return await User.find({
    role: 'technician',
    status: 'active',
  }).select('_id username');
}

// 计算工单完成率
export function calculateWorkOrderCompletionRate(workOrders: WorkOrder[]): number {
  if (!workOrders.length) return 0;
  
  const completedCount = workOrders.filter(
    order => order.status === 'completed'
  ).length;
  
  return (completedCount / workOrders.length) * 100;
}

// 计算平均评分
export function calculateAverageRating(workOrders: WorkOrder[]): number {
  const ratedOrders = workOrders.filter(order => order.rating);
  if (!ratedOrders.length) return 0;
  
  const totalRating = ratedOrders.reduce(
    (sum, order) => sum + (order.rating || 0),
    0
  );
  
  return totalRating / ratedOrders.length;
} 