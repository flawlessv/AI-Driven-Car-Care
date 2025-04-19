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

/**
 * 服务类型中英文对照表
 * 
 * 这个表格用于将英文的服务类型转换为中文，方便中国用户理解。
 * 例如：'repair' 转换为 '维修'
 */
const SERVICE_CATEGORY_MAP = {
  'repair': '维修',
  'regular': '保养',
  'maintenance': '保养',
  'inspection': '检查'
} as const;

/**
 * 获取预约列表的函数
 * 
 * 这个函数用来获取系统中的预约信息。
 * 如果是普通客户登录，只能看到自己的预约；如果是管理员或技师登录，可以看到所有预约。
 */
export async function GET(request: NextRequest) {
  try {
    // 连接到数据库
    await connectDB();
    
    // 验证当前用户身份，看看是谁在查询预约信息
    const authResult = await authMiddleware(request);
    // 检查是否是客户角色
    const isCustomer = authResult.success && authResult.user?.role === 'customer';
    // 获取用户ID
    const userId = authResult.success && authResult.user && authResult.user._id ? authResult.user._id.toString() : null;
    
    // 准备查询条件
    let query: any = {};
    
    // 如果是客户角色，只能查看自己的预约（保护隐私）
    if (isCustomer && userId) {
      query.user = userId;
      console.log('客户角色查询条件:', query);
      console.log('当前用户ID:', userId);
      
      // 从数据库查询预约信息
      const Appointment = getAppointmentModel();
      // 同时获取关联的车辆、服务和技师信息，让数据更完整
      const appointments = await Appointment.find(query)
        .populate('vehicle')   // 填充车辆信息
        .populate('service')   // 填充服务信息
        .populate({ 
          path: 'technician',  // 填充技师信息
          strictPopulate: false 
        })
        .sort({ createdAt: -1 });  // 按创建时间倒序排列，最新的预约排在前面
      
      console.log('查询结果数量:', appointments.length);
      if (appointments.length > 0) {
        console.log('第一个预约的user字段:', appointments[0].user);
        console.log('第一个预约ID:', appointments[0]._id);
      }
      
      // 返回查询结果
      return successResponse(appointments);
    }
    
    // 从数据库查询预约信息
    const Appointment = getAppointmentModel();
    // 同时获取关联的车辆、服务和技师信息，让数据更完整
    const appointments = await Appointment.find(query)
      .populate('vehicle')   // 填充车辆信息
      .populate('service')   // 填充服务信息
      .populate({ 
        path: 'technician',  // 填充技师信息
        strictPopulate: false 
      })
      .sort({ createdAt: -1 });  // 按创建时间倒序排列，最新的预约排在前面
    
    // 返回查询结果
    return successResponse(appointments);
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('获取预约列表失败:', error);
    return errorResponse(error.message || '获取预约列表失败');
  }
}

/**
 * 创建新预约的函数
 * 
 * 这个函数用来在系统中创建新的预约记录。
 * 需要提供车辆信息、预约服务、时间、客户信息等。
 */
export async function POST(request: NextRequest) {
  try {
    // 记录日志，表示开始创建预约
    console.log('开始创建预约...');
    // 连接到数据库
    await connectDB();

    // 获取提交的预约数据
    const data = await request.json();
    console.log('接收到的预约数据:', JSON.stringify(data, null, 2));
    
    // 提取各个字段，支持不同格式的提交数据
    const vehicleId = data.vehicle;  // 车辆ID
    const serviceData = data.service; // 服务信息
    
    // 提取时间相关字段，支持不同格式的提交数据
    const timeSlotData = {
      date: data.timeSlot?.date || data.date,  // 预约日期
      startTime: data.timeSlot?.startTime || data.startTime,  // 开始时间
      endTime: data.timeSlot?.endTime || data.endTime,  // 结束时间
      technician: data.timeSlot?.technician || data.technician  // 预约的技师
    };
    
    const customer = data.customer;  // 客户信息
    const estimatedDuration = data.estimatedDuration;  // 预计维修时长
    const estimatedCost = data.estimatedCost;  // 预计费用
    const status = data.status || 'pending';  // 预约状态，默认为"待处理"
    const notes = data.notes;  // 备注信息

    // 检查必填字段：车辆和服务
    if (!vehicleId || !serviceData) {
      return validationErrorResponse('车辆和服务为必填项');
    }

    // 检查必填字段：预约时间和技师
    if (!timeSlotData.date || !timeSlotData.startTime || !timeSlotData.technician) {
      return validationErrorResponse('预约日期、开始时间和技师为必填项');
    }

    // 检查必填字段：客户信息
    if (!customer?.name || !customer?.phone) {
      return validationErrorResponse('客户姓名和联系电话为必填项');
    }

    // 检查必填字段：预计时长和费用
    if (!estimatedDuration && estimatedDuration !== 0) {
      return validationErrorResponse('预计时长为必填项');
    }
    
    if (!estimatedCost && estimatedCost !== 0) {
      return validationErrorResponse('预计费用为必填项');
    }

    // 检查车辆是否存在于系统中
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return validationErrorResponse('车辆不存在');
    }

    // 处理服务信息
    // 如果提交的是服务对象而不是ID，需要先创建新的服务
    let serviceId = serviceData;
    if (typeof serviceData === 'object' && !serviceData._id) {
      // 将英文服务类型转换为中文，方便中国用户理解
      const inputCategory = serviceData.category?.toLowerCase() as keyof typeof SERVICE_CATEGORY_MAP;
      const category = SERVICE_CATEGORY_MAP[inputCategory] || serviceData.category;
      
      // 记录服务类型转换过程，方便调试
      console.log('Service category mapping:', {
        originalCategory: serviceData.category,
        inputCategory,
        mappedCategory: category
      });

      // 创建新的服务记录
      const Service = getServiceModel();
      const service = new Service({
        name: serviceData.name,  // 服务名称
        category,  // 服务类型（已转为中文）
        duration: serviceData.duration,  // 服务时长
        basePrice: serviceData.basePrice,  // 基础价格
        description: serviceData.description || ''  // 服务描述
      });
      
      try {
        // 保存新服务到数据库
        await service.save();
        serviceId = service._id;
        console.log('Created new service with ID:', serviceId);
      } catch (error: any) {
        // 如果创建服务失败，返回错误
        console.error('Service validation error:', error);
        return errorResponse('创建服务失败: ' + error.message);
      }
    }

    // 准备预约数据，整理成数据库需要的格式
    const appointmentData = {
      // 客户信息
      customer: {
        name: customer.name,  // 客户姓名
        phone: customer.phone,  // 联系电话
        email: customer.email || ''  // 电子邮箱（可选）
      },
      vehicle: vehicleId,  // 车辆ID
      service: serviceId,  // 服务ID
      // 预约时间相关信息
      date: timeSlotData.date,  // 预约日期
      startTime: timeSlotData.startTime,  // 开始时间
      endTime: timeSlotData.endTime,  // 结束时间
      technician: timeSlotData.technician,  // 技师ID
      // 其他信息
      status,  // 预约状态
      estimatedDuration: Number(estimatedDuration),  // 预计时长（小时）
      estimatedCost: Number(estimatedCost),  // 预计费用（元）
      notes: notes || ''  // 备注信息
    };

    // 记录处理后的预约数据，方便调试
    console.log('处理后的预约数据:', JSON.stringify(appointmentData, null, 2));
    
    // 创建新的预约记录
    const Appointment = getAppointmentModel();
    const appointment = new Appointment(appointmentData);

    // 保存预约到数据库
    await appointment.save();

    // 填充关联信息，让返回的数据更完整
    await appointment.populate([
      { path: 'vehicle', select: 'brand model licensePlate' },  // 车辆品牌、型号、车牌
      { path: 'service', select: 'name description category duration basePrice' },  // 服务详情
      { path: 'technician', select: 'name username', strictPopulate: false }  // 技师信息
    ]);

    // 返回成功响应，包含新创建的预约信息
    return successResponse({
      data: appointment,
      message: '预约创建成功'
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('创建预约失败:', error);
    if (error.name === 'ValidationError') {
      // 如果是数据验证错误，返回具体的错误信息
      return validationErrorResponse(
        Object.values(error.errors)
          .map((err: any) => err.message)
          .join(', ')
      );
    }
    return errorResponse(error.message);
  }
} 