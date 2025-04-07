import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware, checkRole } from '@/lib/auth';
import { getAppointmentModel } from '@/models/appointment';
import WorkOrder from '@/models/workOrder';
import Vehicle from '@/models/vehicle';
import { getServiceModel } from '@/models/service';
import User from '@/models/user';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { format } from 'date-fns';

// 定义常量
const WORK_ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  PENDING_CHECK: 'pending_check',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const WORK_ORDER_TYPE = {
  MAINTENANCE: 'maintenance',
  REPAIR: 'repair',
  INSPECTION: 'inspection'
};

const WORK_ORDER_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export async function POST(request: NextRequest) {
  try {
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
      .populate('technician')
      .populate({ 
        path: 'timeSlot.technician', 
        select: 'name username',
        strictPopulate: false 
      });

    if (!appointment) {
      return errorResponse('预约不存在', 404);
    }

    // 检查预约状态是否为已处理
    if (appointment.status !== 'processed') {
      return errorResponse('只有已处理的预约才能转换为工单', 400);
    }

    // 查找或创建客户记录
    let customerId;
    
    // 首先检查预约中是否有客户信息
    if (appointment.customer && (appointment.customer.email || appointment.customer.phone)) {
      // 通过邮箱或电话查找已存在的客户
      let existingCustomer = null;
      if (appointment.customer.email) {
        existingCustomer = await User.findOne({ email: appointment.customer.email });
      }
      
      if (!existingCustomer && appointment.customer.phone) {
        existingCustomer = await User.findOne({ phone: appointment.customer.phone });
      }
      
      if (existingCustomer) {
        customerId = existingCustomer._id;
      } else {
        // 创建新客户
        const newCustomer = new User({
          username: `customer_${Date.now()}`,
          password: `temp${Date.now()}`, // 临时密码
          name: appointment.customer.name || 'Unknown Customer',
          email: appointment.customer.email || '',
          phone: appointment.customer.phone || '',
          role: 'customer',
          status: 'active'
        });
        
        const savedCustomer = await newCustomer.save();
        customerId = savedCustomer._id;
        
        // 更新车辆的拥有者
        if (appointment.vehicle && appointment.vehicle._id) {
          await Vehicle.findByIdAndUpdate(appointment.vehicle._id, {
            owner: customerId
          });
        }
      }
    } else {
      // 如果预约中没有客户信息，创建一个默认客户
      const defaultCustomer = new User({
        username: `customer_${Date.now()}`,
        password: `temp${Date.now()}`,
        name: 'Default Customer',
        role: 'customer',
        status: 'active'
      });
      
      const savedCustomer = await defaultCustomer.save();
      customerId = savedCustomer._id;
      
      // 更新车辆的拥有者
      if (appointment.vehicle && appointment.vehicle._id) {
        await Vehicle.findByIdAndUpdate(appointment.vehicle._id, {
          owner: customerId
        });
      }
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

    // 获取技师ID（支持扁平结构和嵌套结构）
    const technicianId = appointment.technician?._id || appointment.technician || 
                         appointment.timeSlot?.technician?._id || appointment.timeSlot?.technician;

    // 查找默认管理员作为创建者
    let createdBy;
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      createdBy = adminUser._id;
    } else {
      // 如果没有管理员，使用第一个找到的技师
      const anyTechnician = await User.findOne({ role: 'technician' });
      if (anyTechnician) {
        createdBy = anyTechnician._id;
      } else {
        // 最后使用刚创建的客户
        createdBy = customerId;
      }
    }

    // 准备工单数据
    const workOrderData = {
      orderNumber,
      vehicle: appointment.vehicle._id,
      customer: customerId, // 使用查找或创建的客户ID
      technician: technicianId, // 使用处理后的技师ID
      type: mapServiceTypeToWorkOrderType(appointment.service.category),
      status: WORK_ORDER_STATUS.PENDING,
      priority: WORK_ORDER_PRIORITY.MEDIUM,
      description: appointment.service.description || '从预约自动创建的工单',
      estimatedHours: Math.ceil(appointment.estimatedDuration / 60), // 将分钟转换为小时
      startDate: appointment.date || appointment.timeSlot?.date, // 支持扁平结构和嵌套结构
      createdBy: createdBy
    };

    // 创建工单
    const workOrder = new WorkOrder(workOrderData);
    await workOrder.save();

    // 更新预约状态，添加工单引用
    appointment.status = 'completed'; // 将预约标记为已完成
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