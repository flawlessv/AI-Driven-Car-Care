import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/appointment';
import Vehicle from '../../../models/vehicle';
import Customer from '../../../models/customer';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    
    // 添加查询条件确保能找到数据
    const appointments = await Appointment.find({}).lean();
    
    console.log('Database query result:', appointments);

    if (!appointments || appointments.length === 0) {
      console.log('No appointments found');
    }

    return successResponse(appointments);
  } catch (error: any) {
    console.error('获取预约列表失败:', error);
    return errorResponse(error.message || '获取预约列表失败');
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    console.log('Received appointment data:', data);

    const appointmentData = {
      customer: {
        name: data.name,
        phone: data.phone
      },
      vehicle: {
        brand: data.vehicleBrand,
        model: data.vehicleModel,
        licensePlate: data.licensePlate
      },
      service: {
        type: data.serviceType,
        name: data.serviceType === 'maintenance' ? '常规保养' :
              data.serviceType === 'repair' ? '故障维修' : '年检服务',
        description: data.description || '',
        duration: 60,
        basePrice: 0
      },
      timeSlot: {
        date: new Date(data.date),
        startTime: data.time,
        endTime: data.time
      },
      status: 'pending',
      notes: data.description || '',
      estimatedDuration: 60,
      estimatedCost: 0
    };

    console.log('Creating appointment with data:', appointmentData);
    
    const appointment = await Appointment.create(appointmentData);
    console.log('Created appointment:', appointment);

    // 验证数据是否成功保存
    const savedAppointment = await Appointment.findById(appointment._id);
    console.log('Verified saved appointment:', savedAppointment);

    return successResponse({
      message: '预约成功',
      data: appointment
    });
  } catch (error: any) {
    console.error('创建预约失败:', error);
    return errorResponse(error.message || '预约失败');
  }
} 