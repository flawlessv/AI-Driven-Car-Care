import { connectDB } from '@/app/lib/mongodb';
import { getAppointmentModel } from '@/app/models/appointment';
import { getServiceModel } from '@/app/models/service';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { authMiddleware, checkRole } from '@/app/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`正在获取预约ID: ${params.id}`);
    await connectDB();
    const appointment = await getAppointmentModel().findById(params.id)
      .populate('vehicle')
      .populate('service')
      .populate('technician')
      // 为兼容旧代码，同时填充timeSlot结构中的技师
      .populate({ 
        path: 'timeSlot.technician',
        strictPopulate: false 
      });

    if (!appointment) {
      console.log(`找不到ID为 ${params.id} 的预约`);
      return errorResponse('预约不存在', 404);
    }

    console.log(`成功获取预约: ${appointment._id}`);
    return successResponse({
      data: appointment
    });
  } catch (error: any) {
    console.error(`获取预约错误:`, error);
    return errorResponse(error.message);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`开始更新预约ID: ${params.id}`);
    await connectDB();
    const data = await request.json();
    console.log('收到更新数据:', JSON.stringify(data, null, 2));

    // 处理服务信息 - 需要先创建或查找服务，然后使用ID
    let serviceId = data.service?._id;
    
    // 如果没有服务ID但有服务信息，则创建新的服务
    if (!serviceId && data.service) {
      try {
        const Service = getServiceModel();
        
        // 转换服务类型到数据库期望的格式
        const categoryMap: Record<string, string> = {
          'repair': '维修',
          'maintenance': '保养',
          'inspection': '检查'
        };
        
        // 使用类型断言确保TypeScript识别类型
        const serviceType = data.service.category as string;
        const category = categoryMap[serviceType] || serviceType;
        
        console.log('服务类型映射:', {
          originalType: serviceType,
          mappedCategory: category
        });
        
        // 创建新服务
        const newService = new Service({
          name: data.service.name,
          description: data.service.description || '',
          category: category,
          duration: data.service.duration,
          basePrice: data.service.basePrice
        });
        
        await newService.save();
        serviceId = newService._id;
        console.log('创建了新服务ID:', serviceId);
      } catch (error: any) {
        console.error('创建服务错误:', error);
        throw new Error('创建服务失败: ' + error.message);
      }
    }

    // 直接使用原生MongoDB更新，避免Mongoose验证问题
    console.log(`正在直接更新预约: ${params.id}`);
    
    // 构建更新对象
    const updateData: any = {};
    
    // 处理客户信息
    if (data.customer) {
      updateData.customer = data.customer;
      console.log('更新客户信息:', JSON.stringify(data.customer));
    }
    
    // 处理日期时间信息，支持扁平结构和嵌套结构
    if (data.date) {
      updateData.date = new Date(data.date);
      console.log('更新日期(扁平):', data.date);
    } else if (data.timeSlot?.date) {
      updateData.date = new Date(data.timeSlot.date);
      console.log('更新日期(嵌套):', data.timeSlot.date);
    }
    
    if (data.startTime) {
      updateData.startTime = data.startTime;
      console.log('更新开始时间(扁平):', data.startTime);
    } else if (data.timeSlot?.startTime) {
      updateData.startTime = data.timeSlot.startTime;
      console.log('更新开始时间(嵌套):', data.timeSlot.startTime);
    }
    
    if (data.endTime) {
      updateData.endTime = data.endTime;
      console.log('更新结束时间(扁平):', data.endTime);
    } else if (data.timeSlot?.endTime) {
      updateData.endTime = data.timeSlot.endTime;
      console.log('更新结束时间(嵌套):', data.timeSlot.endTime);
    }
    
    // 处理技师信息 - 直接更新technician字段，支持扁平结构和嵌套结构
    if (data.technician) {
      updateData.technician = data.technician;
      console.log('更新技师ID(扁平):', data.technician);
    } else if (data.timeSlot?.technician) {
      updateData.technician = data.timeSlot.technician;
      console.log('更新技师ID(嵌套):', data.timeSlot.technician);
    }
    
    // 处理服务ID
    if (serviceId) {
      updateData.service = serviceId;
      console.log('更新服务ID:', serviceId);
    }
    
    // 处理状态和其他字段
    if (data.status) {
      updateData.status = data.status;
      console.log('更新状态:', data.status);
    }
    
    if (data.notes) {
      updateData.notes = data.notes;
      console.log('更新备注:', data.notes);
    }
    
    if (data.estimatedDuration) {
      updateData.estimatedDuration = Number(data.estimatedDuration);
      console.log('更新预计时长:', data.estimatedDuration);
    }
    
    if (data.estimatedCost) {
      updateData.estimatedCost = Number(data.estimatedCost);
      console.log('更新预计费用:', data.estimatedCost);
    }
    
    // 处理车辆ID
    if (data.vehicle) {
      updateData.vehicle = data.vehicle;
      console.log('更新车辆ID:', data.vehicle);
    }
    
    console.log('最终更新数据:', JSON.stringify(updateData, null, 2));
    
    // 使用MongoDB直接更新操作
    await connectDB();
    const mongoose = require('mongoose');
    const result = await mongoose.connection.collection('appointments').updateOne(
      { _id: new mongoose.Types.ObjectId(params.id) },
      { $set: updateData }
    );
    
    console.log('MongoDB更新结果:', result);
    
    if (result.matchedCount === 0) {
      return errorResponse('预约不存在', 404);
    }
    
    // 重新获取更新后的数据
    const updatedAppointment = await getAppointmentModel().findById(params.id)
      .populate('vehicle', 'brand model licensePlate')
      .populate('service', 'name description category duration basePrice')
      .populate('technician', 'name username');
    
    if (!updatedAppointment) {
      return errorResponse('更新成功但无法获取最新数据', 404);
    }
    
    console.log('更新成功，最终数据:', JSON.stringify({
      id: updatedAppointment._id,
      status: updatedAppointment.status,
      date: updatedAppointment.timeSlot?.date,
      startTime: updatedAppointment.timeSlot?.startTime,
      service: updatedAppointment.service,
      technician: updatedAppointment.technician,
      vehicle: updatedAppointment.vehicle
    }, null, 2));

    return successResponse({
      message: '更新成功',
      data: updatedAppointment
    });
  } catch (error: any) {
    console.error('更新错误:', error);
    return errorResponse(error.message || '更新预约时发生错误');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户权限，客户不允许删除预约
    const authResult = await checkRole(['admin', 'technician'])(request);
    if (!authResult.success) {
      console.log('删除预约失败: 用户权限不足');
      return errorResponse('无权删除预约', 403);
    }

    await connectDB();
    const appointment = await getAppointmentModel().findByIdAndDelete(params.id);

    if (!appointment) {
      return errorResponse('预约不存在', 404);
    }

    return successResponse({
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('删除预约错误:', error);
    return errorResponse(error.message);
  }
} 