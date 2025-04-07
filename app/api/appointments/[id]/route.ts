import { connectDB } from '../../../../lib/mongodb';
import Appointment from '../../../../models/appointment';
import { successResponse, errorResponse } from '../../../../lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const appointment = await Appointment.findById(params.id)
      .populate('customer')
      .populate('vehicle')
      .populate('technician');

    if (!appointment) {
      return errorResponse('预约不存在', 404);
    }

    return successResponse({
      data: appointment
    });
  } catch (error: any) {
    return errorResponse(error.message);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const data = await request.json();
    console.log('Received update data:', data);

    // 处理服务信息 - 需要先创建或查找服务，然后使用ID
    let serviceId = data.service?._id;
    
    // 如果没有服务ID但有服务信息，则创建新的服务
    if (!serviceId && data.service) {
      try {
        const { getServiceModel } = require('models/service');
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
        
        console.log('Service category mapping:', {
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
        console.log('Created new service with ID:', serviceId);
      } catch (error: any) {
        console.error('Error creating service:', error);
        throw new Error('创建服务失败: ' + error.message);
      }
    }

    // 使用扁平结构
    const updateData: any = {
      // 将timeSlot字段提取到顶层
      date: data.timeSlot?.date ? new Date(data.timeSlot.date) : undefined,
      startTime: data.timeSlot?.startTime,
      endTime: data.timeSlot?.endTime,
      technician: data.timeSlot?.technician,
      // 服务信息 - 使用服务ID而不是对象
      service: serviceId,
      // 其他字段
      status: data.status,
      notes: data.notes
    };

    // 移除所有 undefined 值
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      } else if (typeof updateData[key] === 'object' && key !== 'date') {
        Object.keys(updateData[key]).forEach(subKey => {
          if (updateData[key][subKey] === undefined) {
            delete updateData[key][subKey];
          }
        });
      }
    });

    console.log('Processed update data:', updateData);

    const appointment = await Appointment.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { 
        new: true,
        runValidators: true
      }
    )
    .populate('vehicle', 'brand model licensePlate')
    .populate('service', 'name description category duration basePrice')
    .populate('technician', 'name username');

    if (!appointment) {
      return errorResponse('预约不存在', 404);
    }

    return successResponse({
      message: '更新成功',
      data: appointment
    });
  } catch (error: any) {
    console.error('Update error:', error);
    return errorResponse(error.message);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const appointment = await Appointment.findByIdAndDelete(params.id);

    if (!appointment) {
      return errorResponse('预约不存在', 404);
    }

    return successResponse({
      message: '删除成功'
    });
  } catch (error: any) {
    return errorResponse(error.message);
  }
} 