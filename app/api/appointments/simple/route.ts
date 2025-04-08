import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAppointmentModel } from '@/models/appointment';
import Vehicle from '@/models/vehicle';
import { getServiceModel } from '@/models/service';
import mongoose from 'mongoose';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const data = await request.json();
    const { 
      customer, 
      vehicleBrand, 
      vehicleModel, 
      licensePlate, 
      serviceType, 
      serviceDescription, 
      date, 
      startTime,
      userId // 获取可选的用户ID
    } = data;

    console.log('收到简易预约数据:', JSON.stringify(data, null, 2));

    // 验证必填字段
    if (!customer?.name || !customer?.phone) {
      return validationErrorResponse('客户姓名和联系电话为必填项');
    }

    if (!vehicleBrand || !vehicleModel || !licensePlate) {
      return validationErrorResponse('车辆品牌、车型和车牌号为必填项');
    }

    if (!serviceType || !serviceDescription) {
      return validationErrorResponse('服务类型和问题描述为必填项');
    }

    if (!date || !startTime) {
      return validationErrorResponse('预约日期和时间为必填项');
    }

    // 1. 创建或获取车辆信息
    let vehicle;
    const vehicleQuery = { licensePlate };
    
    vehicle = await Vehicle.findOne(vehicleQuery);

    if (!vehicle) {
      // 创建新车辆，如果有userId则关联到用户
      vehicle = new Vehicle({
        brand: vehicleBrand,
        model: vehicleModel,
        licensePlate,
        registrationDate: new Date(),
        owner: userId || null // 如果有用户ID，关联车辆和用户
      });
      await vehicle.save();
    } else if (userId && !vehicle.owner) {
      // 如果找到了车辆但没有关联用户，且提供了用户ID，则更新车辆所有者
      vehicle.owner = userId;
      await vehicle.save();
    }

    // 2. 创建服务
    const Service = getServiceModel();
    const service = new Service({
      name: `${serviceType === 'maintenance' ? '保养' : (serviceType === 'repair' ? '维修' : '检查')}服务`,
      category: serviceType === 'maintenance' ? '保养' : (serviceType === 'repair' ? '维修' : '检查'),
      description: serviceDescription,
      duration: 60, // 默认60分钟
      basePrice: 300 // 默认300元
    });
    await service.save();

    // 3. 创建预约
    const Appointment = getAppointmentModel();
    
    // 使用原生MongoDB方式直接插入文档
    const endTime = calculateEndTime(startTime, 60);
    
    const rawAppointment = {
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || ''
      },
      vehicle: vehicle._id,
      service: service._id,
      // 使用扁平结构，增强兼容性
      date: new Date(date),
      startTime: startTime,
      endTime: endTime,
      technician: data.technician || null, // 允许前端传入技师ID，否则为null
      status: 'pending',
      estimatedDuration: 60,
      estimatedCost: 300,
      notes: data.notes || '',
      // 保留timeSlot结构以兼容现有代码，但不创建假的技师ID
      timeSlot: {
        date: new Date(date),
        startTime: startTime,
        endTime: endTime,
        technician: data.technician || null // 如果没有技师ID，则为null，等待后台分配
      },
      // 如果提供了用户ID，存储用户ID关联
      user: userId || null
    };
    
    console.log('创建预约数据:', JSON.stringify(rawAppointment, null, 2));
    
    // 使用直接插入文档的方式，而不是通过模型验证
    const appointmentCollection = mongoose.connection.collection('appointments');
    const result = await appointmentCollection.insertOne(rawAppointment);
    const appointment = await Appointment.findById(result.insertedId);

    return successResponse({
      message: '预约创建成功，我们将尽快与您联系确认详细信息',
      appointment: {
        _id: appointment._id,
        customer: appointment.customer,
        status: appointment.status,
        vehicle: {
          brand: vehicleBrand,
          model: vehicleModel,
          licensePlate
        },
        service: {
          type: serviceType,
          description: serviceDescription
        },
        date,
        startTime
      }
    });
  } catch (error: any) {
    console.error('创建简易预约失败:', error);
    // 打印详细错误信息以便调试
    if (error.errors) {
      for (const field in error.errors) {
        console.error(`字段 ${field} 错误:`, error.errors[field].message);
      }
    }
    return errorResponse(error.message || '创建预约失败');
  }
}

// 辅助函数：计算结束时间
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  let endMinutes = minutes + durationMinutes;
  let endHours = hours + Math.floor(endMinutes / 60);
  endMinutes = endMinutes % 60;
  
  // 确保格式是两位数
  const formattedHours = endHours % 24;
  return `${formattedHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
} 