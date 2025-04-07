import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAppointmentModel } from '@/models/appointment';
import Vehicle from '@/models/vehicle';
import { getServiceModel } from '@/models/service';
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
      time 
    } = data;

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

    if (!date || !time) {
      return validationErrorResponse('预约日期和时间为必填项');
    }

    // 1. 创建或获取车辆信息
    let vehicle = await Vehicle.findOne({ licensePlate });

    if (!vehicle) {
      // 创建新车辆
      vehicle = new Vehicle({
        brand: vehicleBrand,
        model: vehicleModel,
        licensePlate,
        registrationDate: new Date(),
      });
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
    const appointment = new Appointment({
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      },
      vehicle: vehicle._id,
      service: service._id,
      status: 'pending', // 待处理状态
      estimatedDuration: 60, // 默认60分钟
      estimatedCost: 300, // 默认300元
      timeSlot: {
        date: new Date(date),
        startTime: time,
        endTime: calculateEndTime(time, 60), // 默认60分钟后结束
        technician: null // 技师待分配
      }
    });

    await appointment.save();

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
        time
      }
    });
  } catch (error: any) {
    console.error('创建简易预约失败:', error);
    return errorResponse(error.message || '创建预约失败');
  }
}

// 计算结束时间
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // 计算总分钟数
  let totalMinutes = hours * 60 + minutes + durationMinutes;
  
  // 转换回小时和分钟
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  
  // 格式化为 HH:mm
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
} 