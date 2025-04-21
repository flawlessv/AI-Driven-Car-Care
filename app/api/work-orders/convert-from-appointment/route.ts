import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import { getAppointmentModel } from '@/app/models/appointment';
import WorkOrder from '@/app/models/workOrder';
import User from '@/app/models/user';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/lib/api-response';
import { format } from 'date-fns';
import mongoose from 'mongoose';

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
    // 验证用户权限
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
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
      .populate({ 
        path: 'technician',
        strictPopulate: false 
      })
      .populate({ path: 'user', strictPopulate: false })
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
    
    // 优先使用预约中的customer信息查找或创建客户
    if (appointment.customer) {
      
      // 通过邮箱或电话查找已存在的客户
      let existingCustomer = null;
      const query: Record<string, string> = {};
      
      if (appointment.customer.email) {
        query.email = appointment.customer.email;
      }
      
      if (appointment.customer.phone) {
        query.phone = appointment.customer.phone;
      }
      
      // 只有当有查询条件时才执行查询
      if (Object.keys(query).length > 0) {
        existingCustomer = await User.findOne(query);
        console.log('通过客户联系方式查找到现有客户:', existingCustomer ? existingCustomer._id : '未找到');
      }
      
      if (existingCustomer) {
        customerId = existingCustomer._id;
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
      type: mapServiceTypeToWorkOrderType(
        typeof appointment.service === 'object' ? appointment.service.category : 'maintenance'
      ),
      status: WORK_ORDER_STATUS.PENDING,
      priority: WORK_ORDER_PRIORITY.MEDIUM,
      description: typeof appointment.service === 'object' 
        ? appointment.service.description || '从预约自动创建的工单' 
        : '从预约自动创建的工单',
      estimatedHours: Math.ceil(appointment.estimatedDuration / 60), // 将分钟转换为小时
      startDate: appointment.timeSlot?.date || new Date(), // 支持扁平结构和嵌套结构
      createdBy: createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 创建工单 - 注意：这里使用两种方式创建，以便比较结果
    let workOrder;
    
    try {
      // 方式1: 使用Mongoose模型创建
      workOrder = new WorkOrder(workOrderData);
      workOrder.customer = customerId; // 再次确认客户ID设置正确
      console.log('Mongoose创建前的客户ID:', workOrder.customer);
      await workOrder.save();
      console.log('Mongoose创建后的客户ID:', workOrder.customer);
    } catch (error) {
      console.error('使用Mongoose创建工单失败:', error);
      
      // 方式2: 直接使用MongoDB驱动创建
      console.log('尝试使用原生MongoDB创建工单...');
      const workOrderCollection = mongoose.connection.collection('workorders');
      const result = await workOrderCollection.insertOne({
        ...workOrderData,
        customer: new mongoose.Types.ObjectId(customerId),
        vehicle: new mongoose.Types.ObjectId(appointment.vehicle._id),
        technician: technicianId ? new mongoose.Types.ObjectId(technicianId) : null,
        createdBy: new mongoose.Types.ObjectId(createdBy)
      });
      
      if (!result.insertedId) {
        throw new Error('创建工单失败');
      }
      
      workOrder = await WorkOrder.findById(result.insertedId);
      console.log('MongoDB原生创建后的客户ID:', workOrder.customer);
    }

    // 更新预约状态，添加工单引用
    appointment.status = 'completed'; // 将预约标记为已完成
    appointment.sourceWorkOrder = workOrder._id;
    await appointment.save();

    // 填充关联字段并返回响应
    await workOrder.populate([
      { path: 'vehicle', select: 'brand model licensePlate' },
      { path: 'customer', select: 'name username email phone' },
      { path: 'technician', select: 'name username' }
    ]);
    

    return createdResponse({
      message: '工单创建成功',
      workOrder: {
        _id: workOrder._id,
        orderNumber: workOrder.orderNumber,
        customer: workOrder.customer
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