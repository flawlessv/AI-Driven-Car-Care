import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import { getAppointmentModel } from '@/models/appointment';
import Vehicle from '@/models/vehicle';
import { getServiceModel } from '@/models/service';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';

// 服务类型映射
const SERVICE_CATEGORY_MAP = {
  'repair': '维修',
  'regular': '保养',
  'maintenance': '保养',
  'inspection': '检查'
} as const;

type ServiceCategory = '维修' | '保养' | '检查';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    // 根据用户角色过滤
    let query = {};
    if (authResult.user.role === 'customer') {
      // 普通用户只能查看自己的预约
      const vehicles = await Vehicle.find({ owner: authResult.user._id }).select('_id');
      query = { vehicle: { $in: vehicles.map(v => v._id) } };
    }

    const Appointment = getAppointmentModel();
    const appointments = await Appointment.find(query)
      .populate('vehicle', 'brand model licensePlate')
      .populate('service', 'name description category duration basePrice')
      .populate('timeSlot.technician', 'name username')
      .sort({ 'timeSlot.date': -1 });

    return successResponse(appointments);
  } catch (error: any) {
    console.error('获取预约列表失败:', error);
    return errorResponse(error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const data = await request.json();
    const { 
      vehicle: vehicleId, 
      service: serviceData, 
      timeSlot,
      customer,
      estimatedDuration,
      estimatedCost,
      status = 'pending'
    } = data;

    // 验证必填字段
    if (!vehicleId || !serviceData) {
      return validationErrorResponse('车辆和服务为必填项');
    }

    // 验证时间段
    if (!timeSlot?.date || !timeSlot?.startTime || !timeSlot?.endTime || !timeSlot?.technician) {
      return validationErrorResponse('预约日期、开始时间、结束时间和技师为必填项');
    }

    // 验证客户信息
    if (!customer?.name || !customer?.phone) {
      return validationErrorResponse('客户姓名和联系电话为必填项');
    }

    // 验证预计时长和费用
    if (!estimatedDuration || !estimatedCost) {
      return validationErrorResponse('预计时长和预计费用为必填项');
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

      const Service = getServiceModel();
      const service = new Service({
        name: serviceData.name,
        category,
        duration: serviceData.duration,
        basePrice: serviceData.basePrice
      });
      await service.save();
      serviceId = service._id;
    }

    // 创建预约对象
    const appointmentData = {
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      },
      vehicle: vehicleId,
      service: serviceId,
      timeSlot: {
        date: timeSlot.date,  // 不需要手动转换为 Date，mongoose 会自动处理
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        technician: timeSlot.technician
      },
      status,
      estimatedDuration: Number(estimatedDuration),
      estimatedCost: Number(estimatedCost)
    };

    // 创建预约
    const Appointment = getAppointmentModel();
    const appointment = new Appointment(appointmentData);

    // 保存预约
    await appointment.save();

    // 填充关联字段
    await appointment.populate([
      { path: 'vehicle', select: 'brand model licensePlate' },
      { path: 'service', select: 'name description category duration basePrice' },
      { path: 'timeSlot.technician', select: 'name username' }
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