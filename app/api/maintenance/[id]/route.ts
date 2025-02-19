import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import mongoose from 'mongoose';

// 导入模型
import Maintenance from '@/models/maintenance';
import Vehicle from '@/models/vehicle';
import Part from '@/models/part';
import { getUserModel } from '@/lib/db/models';

import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/lib/api-response';

// 定义用户类型
interface AuthUser {
  _id: string;
  role: string;
}

// 定义配件类型
interface MaintenancePart {
  part: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return errorResponse('未授权访问', 401);
    }

    const user = authResult.user as AuthUser;

    // 如果是新建页面，返回空数据
    if (params.id === 'new') {
      return successResponse({
        _id: 'new',
        vehicle: {
          _id: '',
          brand: '',
          model: '',
          licensePlate: ''
        },
        customer: {
          _id: '',
          name: '',
          phone: '',
          email: ''
        },
        technician: {
          _id: '',
          name: '',
          level: ''
        },
        type: 'regular',
        status: 'pending',
        description: '',
        startDate: new Date().toISOString(),
        mileage: 0,
        cost: 0,
        parts: [],
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // 确保数据库连接
    await connectDB();

    // 检查ID的有效性
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return errorResponse('无效的维修记录ID', 400);
    }

    // 检查模型是否已注册
    if (!mongoose.models.Technician) {
      console.error('Technician model not registered');
      return errorResponse('系统错误：模型未注册', 500);
    }

    const maintenance = await Maintenance.findById(params.id)
      .populate('vehicle', 'brand model licensePlate')
      .populate('customer', 'name phone email')
      .populate('technician', 'name level')
      .populate('parts.part', 'name code price')
      .populate('createdBy', 'username');

    if (!maintenance) {
      console.error('维修记录不存在:', params.id);
      return notFoundResponse('维修记录不存在');
    }

    // 如果customer字段为空，尝试从vehicle中获取
    if (!maintenance.customer) {
      const vehicle = await Vehicle.findById(maintenance.vehicle);
      if (vehicle && vehicle.owner) {
        maintenance.customer = vehicle.owner;
        await maintenance.save();
      }
    }

    // 验证用户是否有权限查看该记录
    if (user.role === 'customer') {
      const vehicle = await Vehicle.findById(maintenance.vehicle);
      if (!vehicle || vehicle.owner.toString() !== user._id.toString()) {
        return errorResponse('无权查看此维修记录', 403);
      }
    }

    // 添加调试信息
    console.log('维修记录查询结果:', {
      id: maintenance._id,
      technician: maintenance.technician,
      customer: maintenance.customer,
      vehicle: maintenance.vehicle,
      populated: {
        hasTechnician: !!maintenance.technician,
        technicianId: maintenance.technician?._id,
        technicianName: maintenance.technician?.name,
      }
    });

    return successResponse(maintenance);
  } catch (error: any) {
    console.error('获取维修记录详情失败:', error);
    return errorResponse(error.message);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authMiddleware(req);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    if (user.role === 'customer') {
      return errorResponse('无权更新维修记录', 403);
    }

    await connectDB();

    const maintenance = await Maintenance.findById(params.id);
    if (!maintenance) {
      return notFoundResponse('维修记录不存在');
    }

    const data = await req.json();
    const {
      type,
      description,
      startDate,
      completionDate,
      mileage,
      cost,
      status,
      technician,
      parts = [],
      notes,
    } = data;

    // 验证必填字段
    if (!type || !description || !startDate || !mileage || !cost || !status || !technician) {
      return validationErrorResponse('缺少必需的字段');
    }

    // 验证状态
    const validStatus = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatus.includes(status)) {
      return validationErrorResponse('无效的状态');
    }

    // 验证类型
    const validTypes = ['regular', 'repair', 'inspection'];
    if (!validTypes.includes(type)) {
      return validationErrorResponse('无效的维修类型');
    }

    // 验证配件是否存在并计算总价
    const validatedParts = [];
    for (const part of parts) {
      const partDoc = await Part.findById(part.part);
      if (!partDoc) {
        return errorResponse(`配件 ${part.part} 不存在`, 404);
      }
      // 如果是新增的配件，检查库存
      const existingPart = maintenance.parts.find(p => p.part.toString() === part.part);
      const stockChange = existingPart ? part.quantity - existingPart.quantity : part.quantity;
      if (stockChange > 0 && stockChange > partDoc.stock) {
        return errorResponse(`配件 ${partDoc.name} 库存不足`, 400);
      }
      validatedParts.push({
        part: part.part,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        totalPrice: part.quantity * part.unitPrice,
      });
    }

    // 更新维修记录
    const updatedMaintenance = await Maintenance.findByIdAndUpdate(
      params.id,
      {
        type,
        description,
        startDate,
        completionDate,
        mileage,
        cost,
        status,
        technician,
        parts: validatedParts,
        notes,
      },
      { new: true }
    )
      .populate('vehicle', 'brand model licensePlate')
      .populate('parts.part', 'name code price')
      .populate('createdBy', 'username');

    // 更新车辆状态和里程数
    await Vehicle.findByIdAndUpdate(maintenance.vehicle, {
      status: status === 'completed' ? 'active' : 'maintenance',
      mileage: status === 'completed' ? mileage : undefined,
    });

    // 更新配件库存
    for (const part of parts) {
      const existingPart = maintenance.parts.find(p => p.part.toString() === part.part);
      const stockChange = existingPart ? part.quantity - existingPart.quantity : part.quantity;
      if (stockChange !== 0) {
        await Part.findByIdAndUpdate(part.part, {
          $inc: { stock: -stockChange },
        });
      }
    }

    return successResponse(updatedMaintenance);
  } catch (error: any) {
    console.error('更新维修记录失败:', error);
    if (error.name === 'ValidationError') {
      return validationErrorResponse(error.message);
    }
    return errorResponse(error.message);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authMiddleware(req);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    if (user.role === 'customer') {
      return errorResponse('无权删除维修记录', 403);
    }

    await connectDB();

    const maintenance = await Maintenance.findById(params.id);
    if (!maintenance) {
      return notFoundResponse('维修记录不存在');
    }

    // 恢复配件库存
    for (const part of maintenance.parts) {
      await Part.findByIdAndUpdate(part.part, {
        $inc: { stock: part.quantity },
      });
    }

    // 更新车辆状态
    await Vehicle.findByIdAndUpdate(maintenance.vehicle, {
      status: 'active',
    });

    await Maintenance.findByIdAndDelete(params.id);

    return successResponse({ message: '维修记录已删除' });
  } catch (error: any) {
    console.error('删除维修记录失败:', error);
    return errorResponse(error.message);
  }
} 