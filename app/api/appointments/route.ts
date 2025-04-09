import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';

import { authMiddleware } from '@/app/lib/auth';
import { getAppointmentModel } from '@/app/models/appointment';
import Vehicle from '@/app/models/vehicle';
import { getServiceModel } from '@/app/models/service';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/lib/api-response';

// 服务类型映射
const SERVICE_CATEGORY_MAP = {
  'repair': '维修',
  'regular': '保养',
  'maintenance': '保养',
  'inspection': '检查'
} as const;

type ServiceCategory = '维修' | '保养' | '检查';
// 获取预约列表
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 获取当前用户信息
    const authResult = await authMiddleware(request);
    const isCustomer = authResult.success && authResult.user?.role === 'customer';
    const userId = authResult.success && authResult.user ? authResult.user._id.toString() : null;
    
    // 构建查询条件
    let query: any = {};
    
    // 如果是客户角色，只能查看自己的预约
    if (isCustomer && userId) {
      query.user = userId;
    }
    
    // 执行查询
    const Appointment = getAppointmentModel();
    const appointments = await Appointment.find(query)
      .populate('vehicle')
      .populate('service')
      .populate('technician')
      .sort({ createdAt: -1 });
    
    return successResponse(appointments);
  } catch (error: any) {
    console.error('获取预约列表失败:', error);
    return errorResponse(error.message || '获取预约列表失败');
  }
}

// 创建预约
export async function POST(request: NextRequest) {
  try {
    // 移除授权验证
    console.log('开始创建预约...');
    await connectDB();

    const data = await request.json();
    console.log('接收到的预约数据:', JSON.stringify(data, null, 2));
    
    // 提取字段，支持扁平结构和嵌套结构
    const vehicleId = data.vehicle;
    const serviceData = data.service;
    
    // 提取时间相关字段，支持timeSlot嵌套和顶层字段
    const timeSlotData = {
      date: data.timeSlot?.date || data.date,
      startTime: data.timeSlot?.startTime || data.startTime,
      endTime: data.timeSlot?.endTime || data.endTime,
      technician: data.timeSlot?.technician || data.technician
    };
    
    const customer = data.customer;
    const estimatedDuration = data.estimatedDuration;
    const estimatedCost = data.estimatedCost;
    const status = data.status || 'pending';
    const notes = data.notes;

    // 验证必填字段
    if (!vehicleId || !serviceData) {
      return validationErrorResponse('车辆和服务为必填项');
    }

    // 验证时间段
    if (!timeSlotData.date || !timeSlotData.startTime || !timeSlotData.technician) {
      return validationErrorResponse('预约日期、开始时间和技师为必填项');
    }

    // 验证客户信息
    if (!customer?.name || !customer?.phone) {
      return validationErrorResponse('客户姓名和联系电话为必填项');
    }

    // 验证预计时长和费用
    if (!estimatedDuration && estimatedDuration !== 0) {
      return validationErrorResponse('预计时长为必填项');
    }
    
    if (!estimatedCost && estimatedCost !== 0) {
      return validationErrorResponse('预计费用为必填项');
    }

    // 验证车辆
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return validationErrorResponse('车辆不存在');
    }

    // 如果传入的是服务对象，创建新的服务
    let serviceId = serviceData;
    if (typeof serviceData === 'object' && !serviceData._id) {
      // 转换服务类型为中文
      const inputCategory = serviceData.category?.toLowerCase() as keyof typeof SERVICE_CATEGORY_MAP;
      const category = SERVICE_CATEGORY_MAP[inputCategory] || serviceData.category;
      
      console.log('Service category mapping:', {
        originalCategory: serviceData.category,
        inputCategory,
        mappedCategory: category
      });

      const Service = getServiceModel();
      const service = new Service({
        name: serviceData.name,
        category,
        duration: serviceData.duration,
        basePrice: serviceData.basePrice,
        description: serviceData.description || ''
      });
      
      try {
        await service.save();
        serviceId = service._id;
        console.log('Created new service with ID:', serviceId);
      } catch (error: any) {
        console.error('Service validation error:', error);
        return errorResponse('创建服务失败: ' + error.message);
      }
    }

    // 创建预约对象 - 使用扁平结构适应数据库模型
    const appointmentData = {
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || ''
      },
      vehicle: vehicleId,
      service: serviceId,
      // 使用提取的时间字段
      date: timeSlotData.date,
      startTime: timeSlotData.startTime,
      endTime: timeSlotData.endTime,
      technician: timeSlotData.technician,
      // 其他字段
      status,
      estimatedDuration: Number(estimatedDuration),
      estimatedCost: Number(estimatedCost),
      notes: notes || ''
    };

    console.log('处理后的预约数据:', JSON.stringify(appointmentData, null, 2));
    
    // 创建预约
    const Appointment = getAppointmentModel();
    const appointment = new Appointment(appointmentData);

    // 保存预约
    await appointment.save();

    // 填充关联字段
    await appointment.populate([
      { path: 'vehicle', select: 'brand model licensePlate' },
      { path: 'service', select: 'name description category duration basePrice' },
      { path: 'technician', select: 'name username' }
    ]);

    return successResponse({
      data: appointment,
      message: '预约创建成功'
    });
  } catch (error: any) {
    console.error('创建预约失败:', error);
    if (error.name === 'ValidationError') {
      return validationErrorResponse(
        Object.values(error.errors)
          .map((err: any) => err.message)
          .join(', ')
      );
    }
    return errorResponse(error.message);
  }
} 