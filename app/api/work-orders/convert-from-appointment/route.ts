import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware, checkRole } from '@/lib/auth';
import { getAppointmentModel } from '@/models/appointment';
import WorkOrder, { WORK_ORDER_STATUS, WORK_ORDER_TYPE, WORK_ORDER_PRIORITY } from '@/models/workOrder';
import { getVehicleModel } from '@/models/vehicle';
import { getServiceModel } from '@/models/service';
import User from '@/models/user';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const authResult = await checkRole(['admin', 'staff', 'technician'])(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    await connectDB();

    // 获取请求数据
    const data = await request.json();
    const { appointmentId } = data;

    if (!appointmentId) {
      return validationErrorResponse('预约ID为必填项');
    }

    // 获取预约信息
    const Appointment = getAppointmentModel();
    const appointment = await Appointment.findById(appointmentId)
      .populate('vehicle')
      .populate('service')
      .populate('timeSlot.technician');

    if (!appointment) {
      return errorResponse('预约不存在', 404);
    }

    // 检查预约状态是否为已处理
    if (appointment.status !== 'processed') {
      return errorResponse('只有已处理的预约才能转换为工单', 400);
    }

    // 生成工单编号
    const today = new Date();
    const yearMonth = format(today, 'yyyyMM');
    
    // 获取当月最后一个工单编号
    const lastOrder = await WorkOrder.findOne({
      orderNumber: new RegExp(`^WO${yearMonth}`)
    }).sort({ orderNumber: -1 });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    // 生成新的工单编号 (格式: WO2024030001)
    const orderNumber = `WO${yearMonth}${String(sequence).padStart(4, '0')}`;

    // 准备工单数据
    const workOrderData = {
      orderNumber,
      vehicle: appointment.vehicle._id,
      customer: appointment.vehicle.owner || null, // 从车辆获取客户ID
      technician: appointment.timeSlot.technician._id,
      type: mapServiceTypeToWorkOrderType(appointment.service.category),
      status: WORK_ORDER_STATUS.PENDING,
      priority: WORK_ORDER_PRIORITY.MEDIUM,
      description: appointment.service.description || '从预约自动创建的工单',
      estimatedHours: Math.ceil(appointment.estimatedDuration / 60), // 将分钟转换为小时
      startDate: appointment.timeSlot.date,
      progress: [{
        status: WORK_ORDER_STATUS.PENDING,
        notes: '从预约自动创建',
        timestamp: new Date(),
        user: authResult.user._id
      }]
    };

    // 创建工单
    const workOrder = new WorkOrder(workOrderData);
    await workOrder.save();

    // 更新预约状态，添加工单引用
    appointment.sourceWorkOrder = workOrder._id;
    await appointment.save();

    return createdResponse({
      message: '工单创建成功',
      workOrder: {
        _id: workOrder._id,
        orderNumber: workOrder.orderNumber
      }
    });
  } catch (error: any) {
    console.error('从预约转换工单失败:', error);
    return errorResponse(error.message || '转换工单失败');
  }
}

// 将服务类型映射到工单类型
function mapServiceTypeToWorkOrderType(serviceType: string): string {
  const typeMap: Record<string, string> = {
    '保养': WORK_ORDER_TYPE.MAINTENANCE,
    '维修': WORK_ORDER_TYPE.REPAIR,
    '检查': WORK_ORDER_TYPE.INSPECTION
  };
  
  return typeMap[serviceType] || WORK_ORDER_TYPE.MAINTENANCE;
} 