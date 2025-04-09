import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import Maintenance from '@/app/models/maintenance';
import Vehicle from '@/app/models/vehicle';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/app/lib/api-response';
import mongoose from 'mongoose';
import Part from '@/app/models/part';
import { getUserModel } from '@/app/lib/db/models';

export async function GET(req: NextRequest) {
  try {
    const user = await authMiddleware(req);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const vehicle = searchParams.get('vehicle');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};
    if (user.role === 'customer') {
      // 普通用户只能查看自己的车辆的维修记录
      const vehicles = await Vehicle.find({ owner: user._id }).select('_id');
      query.vehicle = { $in: vehicles.map(v => v._id) };
    }
    if (status) query.status = status;
    if (type) query.type = type;
    if (vehicle) query.vehicle = vehicle;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.completionDate = { $lte: new Date(endDate) };

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Maintenance.find(query)
        .populate('vehicle', 'brand model licensePlate')
        .populate({
          path: 'technician',
          select: 'name username',
          model: 'User'
        })
        .populate({
          path: 'parts.part',
          model: 'Part',
          select: 'name code',
          strictPopulate: false
        })
        .populate('createdBy', 'username')
        .populate('updatedBy', 'username')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit),
      Maintenance.countDocuments(query),
    ]);

    const processedRecords = records.map(record => {
      const doc = record.toObject();
      return {
        ...doc,
        technician: doc.technician ? {
          _id: doc.technician._id,
          name: doc.technician.name || doc.technician.username,
          username: doc.technician.username
        } : null
      };
    });

    return successResponse({
      data: processedRecords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('获取维修记录失败:', error);
    return errorResponse(error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    await authMiddleware(request);
    await connectDB();

    const data = await request.json();
    console.log('请求数据:', data);

    // 验证必填字段
    const requiredFields = [
      'vehicle',
      'type',
      'description',
      'mileage',
      'cost',
      'startDate',
      'status',
      'technician',
    ];

    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      const fieldNames = {
        vehicle: '车辆',
        type: '保养类型',
        description: '描述',
        mileage: '里程数',
        cost: '费用',
        startDate: '开始日期',
        status: '状态',
        technician: '技师',
      };
      const missingFieldNames = missingFields.map(field => fieldNames[field as keyof typeof fieldNames]);
      return validationErrorResponse(`请填写以下必填项：${missingFieldNames.join('、')}`);
    }

    // 获取车辆信息
    const vehicle = await Vehicle.findById(data.vehicle).lean();
    if (!vehicle) {
      return notFoundResponse('未找到指定车辆信息');
    }

    // 验证车辆是否有车主信息
    if (!vehicle.ownerName || !vehicle.ownerContact) {
      return validationErrorResponse('该车辆未关联车主信息，请先完善车主信息');
    }

    // 创建维修记录
    const maintenance = new Maintenance({
      vehicle: data.vehicle,
      type: data.type,
      description: data.description,
      mileage: data.mileage,
      cost: data.cost,
      startDate: new Date(data.startDate),
      completionDate: data.completionDate ? new Date(data.completionDate) : undefined,
      status: data.status,
      technician: data.technician,
      notes: data.notes,
      customer: {
        name: vehicle.ownerName,
        contact: vehicle.ownerContact
      },
      createdBy: new mongoose.Types.ObjectId(),
      updatedBy: new mongoose.Types.ObjectId(),
      statusHistory: [{
        status: data.status,
        note: '创建维修记录',
        timestamp: new Date(),
        updatedBy: new mongoose.Types.ObjectId()
      }]
    });

    // 如果有配件信息，计算配件总价
    if (Array.isArray(data.parts) && data.parts.length > 0) {
      maintenance.parts = data.parts.map(part => ({
        part: part.part,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        totalPrice: part.quantity * part.unitPrice
      }));
    }

    try {
      await maintenance.save();
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return validationErrorResponse(validationErrors.join('；'));
      }
      throw error;
    }

    // 更新车辆状态为维修中
    if (vehicle.status !== 'maintenance') {
      await Vehicle.findByIdAndUpdate(data.vehicle, {
        status: 'maintenance',
        lastMaintenanceDate: new Date(),
      });
    }

    return successResponse({
      data: maintenance,
      message: '维修记录创建成功',
    });
  } catch (error: any) {
    console.error('添加维修记录失败:', error);
    return errorResponse(error.message || '添加维修记录失败');
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authMiddleware(req);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const maintenanceId = params.id;
    if (!mongoose.Types.ObjectId.isValid(maintenanceId)) {
      return errorResponse('无效的维修记录ID', 400);
    }

    const data = await req.json();
    const {
      vehicle,
      type,
      description,
      startDate,
      completionDate,
      mileage,
      cost,
      technician,
      parts = [],
      notes,
      status,
    } = data;

    // 验证必填字段
    if (!vehicle || !type || !description || !startDate || !mileage || !cost || !technician) {
      return validationErrorResponse('缺少必需的字段');
    }

    // 查找现有维修记录
    const existingMaintenance = await Maintenance.findById(maintenanceId);
    if (!existingMaintenance) {
      return errorResponse('维修记录不存在', 404);
    }

    // 验证车辆是否存在
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return errorResponse('车辆不存在', 404);
    }

    // 验证用户是否有权限操作该车辆
    if (user.role === 'customer' && vehicleDoc.owner.toString() !== user._id.toString()) {
      return errorResponse('无权操作此车辆', 403);
    }

    // 验证配件并更新库存
    const validatedParts = [];
    for (const part of parts) {
      const partDoc = await Part.findById(part.part);
      if (!partDoc) {
        return errorResponse(`配件 ${part.part} 不存在`, 404);
      }

      // 计算库存变化
      const existingPart = existingMaintenance.parts.find(
        (p: any) => p.part.toString() === part.part.toString()
      );
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

      // 更新配件库存
      await Part.findByIdAndUpdate(part.part, {
        $inc: { stock: -stockChange },
      });
    }

    // 更新维修记录
    const updatedMaintenance = await Maintenance.findByIdAndUpdate(
      maintenanceId,
      {
        vehicle,
        type,
        description,
        startDate,
        completionDate,
        mileage,
        cost,
        technician,
        parts: validatedParts,
        notes,
        status,
        updatedBy: user._id,
        updatedAt: new Date(),
      },
      { new: true }
    );

    // 更新车辆状态和里程数
    await Vehicle.findByIdAndUpdate(vehicle, {
      status: status === 'completed' ? 'available' : 'maintenance',
      mileage,
    });

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

    await connectDB();

    const maintenanceId = params.id;
    if (!mongoose.Types.ObjectId.isValid(maintenanceId)) {
      return errorResponse('无效的维修记录ID', 400);
    }

    // 查找维修记录
    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance) {
      return errorResponse('维修记录不存在', 404);
    }

    // 验证用户权限
    const vehicle = await Vehicle.findById(maintenance.vehicle);
    if (!vehicle) {
      return errorResponse('车辆不存在', 404);
    }

    if (user.role === 'customer' && vehicle.owner.toString() !== user._id.toString()) {
      return errorResponse('无权操作此车辆', 403);
    }

    // 恢复配件库存
    for (const part of maintenance.parts) {
      await Part.findByIdAndUpdate(part.part, {
        $inc: { stock: part.quantity },
      });
    }

    // 更新车辆状态
    await Vehicle.findByIdAndUpdate(maintenance.vehicle, {
      status: 'available',
    });

    // 删除维修记录
    await Maintenance.findByIdAndDelete(maintenanceId);

    return successResponse({ message: '维修记录已删除' });
  } catch (error: any) {
    console.error('删除维修记录失败:', error);
    return errorResponse(error.message);
  }
} 