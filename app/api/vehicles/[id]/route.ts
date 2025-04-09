import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import Vehicle from '@/app/models/vehicle';
import { authMiddleware } from '@/app/lib/auth';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  forbiddenResponse,
} from '@/app/lib/api-response';
import mongoose from 'mongoose';

// 获取单个车辆
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }
    
    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }
    
    const user = authResult.user;
    await connectDB();

    // 获取车辆信息并填充关联数据
    const vehicle = await Vehicle.findById(params.id)
      .lean();

    if (!vehicle) {
      return notFoundResponse('车辆不存在');
    }
    
    // 检查权限：客户只能查看自己的车辆
    if (user.role === 'customer' && vehicle.owner && vehicle.owner.toString() !== user._id.toString()) {
      console.log('权限拒绝：客户尝试查看非自己的车辆', {
        userId: user._id,
        vehicleOwner: vehicle.owner
      });
      return errorResponse('您没有权限查看该车辆', 403);
    }

    // 获取最近的维修记录
    const maintenanceRecords = await mongoose.model('Maintenance').find({ 
      vehicle: vehicle._id 
    })
    .sort({ startDate: -1 })
    .limit(5)
    .populate('technician', 'name')
    .lean();

    // 确保数据格式正确
    const vehicleData = {
      ...vehicle,
      maintenanceRecords: maintenanceRecords || [],
      lastMaintenanceDate: maintenanceRecords[0]?.startDate || null,
      mileage: typeof vehicle.mileage === 'number' ? vehicle.mileage : 0,
      year: typeof vehicle.year === 'number' ? vehicle.year : new Date().getFullYear(),
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      licensePlate: vehicle.licensePlate || '',
      vin: vehicle.vin || '',
      ownerName: vehicle.ownerName || '',
      ownerContact: vehicle.ownerContact || '',
      status: vehicle.status || 'inactive'
    };

    console.log('API返回的车辆数据:', vehicleData); // 添加日志

    return successResponse({
      data: vehicleData,
      message: '获取车辆信息成功',
    });
  } catch (error: any) {
    console.error('获取车辆详情错误:', error);
    return errorResponse(error.message || '获取车辆信息失败');
  }
}

// 更新车辆
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {user} = await authMiddleware(request);
    await connectDB();

    const vehicle = await Vehicle.findById(params.id);

    if (!vehicle) {
      return notFoundResponse('车辆不存在');
    }

    // 检查权限：只有管理员、员工或车辆所有者可以更新
    if (
      user.role === 'user' &&
      vehicle.owner.toString() !== user._id.toString()
    ) {
      return forbiddenResponse('无权更新此车辆信息');
    }

    const data = await request.json();

    // 验证必填字段
    const requiredFields = ['brand', 'model', 'year', 'licensePlate', 'vin', 'mileage', 'status'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      return validationErrorResponse(`缺少必填字段: ${missingFields.join(', ')}`);
    }

    // 检查车牌号和车架号是否与其他车辆重复
    const [existingLicensePlate, existingVIN] = await Promise.all([
      Vehicle.findOne({
        licensePlate: data.licensePlate,
        _id: { $ne: params.id },
      }),
      Vehicle.findOne({
        vin: data.vin,
        _id: { $ne: params.id },
      }),
    ]);

    if (existingLicensePlate) {
      return validationErrorResponse('车牌号已存在');
    }

    if (existingVIN) {
      return validationErrorResponse('车架号已存在');
    }

    // 更新车辆信息
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      params.id,
      { ...data },
      { new: true }
    );

    return successResponse({
      data: updatedVehicle,
      message: '更新车辆信息成功',
    });
  } catch (error: any) {
    console.error('更新车辆错误:', error);
    return errorResponse(error.message || '更新车辆信息失败');
  }
}

// 删除车辆
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {user} = await authMiddleware(request);
    await connectDB();

    const vehicle = await Vehicle.findById(params.id);

    if (!vehicle) {
      return notFoundResponse('车辆不存在');
    }

    // 检查权限：只有管理员或员工可以删除
    if (user.role === 'user') {
      return forbiddenResponse('无权删除车辆');
    }

    await Vehicle.findByIdAndDelete(params.id);

    return successResponse({
      message: '删除车辆成功',
    });
  } catch (error: any) {
    console.error('删除车辆错误:', error);
    return errorResponse(error.message || '删除车辆失败');
  }
} 