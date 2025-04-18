import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import Maintenance from '@/app/models/maintenance';
import Vehicle from '@/app/models/vehicle';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/app/lib/api-response';
import mongoose from 'mongoose';

/**
 * 获取维修保养记录列表的函数
 * 
 * 这个函数用来获取系统中的汽车维修和保养记录。
 * 就像4S店的维修记录系统，客户只能看到自己车辆的维修记录，而店里的工作人员可以看到所有车辆的维修记录。
 */
export async function GET(req: NextRequest) {
  try {
    // 验证用户身份，确认是谁在查询维修记录
    const user = await authMiddleware(req);
    if (!user) {
      // 如果身份验证失败，返回未授权错误
      return errorResponse('未授权访问', 401);
    }

    // 连接到数据库
    await connectDB();

    // 获取查询参数，用于筛选维修记录
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');       // 页码，默认第1页
    const limit = parseInt(searchParams.get('limit') || '10');    // 每页数量，默认10条
    const status = searchParams.get('status');                    // 维修状态（如进行中、已完成）
    const type = searchParams.get('type');                        // 维修类型（如定期保养、故障维修）
    const vehicle = searchParams.get('vehicle');                  // 车辆ID
    const startDate = searchParams.get('startDate');              // 开始日期
    const endDate = searchParams.get('endDate');                  // 结束日期

    // 准备查询条件
    const query: any = {};
    if (user.role === 'customer') {
      // 如果是普通客户，只能查看自己车辆的维修记录（保护隐私）
      const vehicles = await Vehicle.find({ owner: user._id }).select('_id');
      query.vehicle = { $in: vehicles.map(v => v._id) };  // 查询条件：车辆ID在用户车辆列表中
    }
    // 添加其他筛选条件
    if (status) query.status = status;                                // 按状态筛选
    if (type) query.type = type;                                      // 按类型筛选
    if (vehicle) query.vehicle = vehicle;                             // 按车辆筛选
    if (startDate) query.startDate = { $gte: new Date(startDate) };   // 按开始日期筛选（大于等于）
    if (endDate) query.completionDate = { $lte: new Date(endDate) };  // 按完成日期筛选（小于等于）

    // 计算分页参数
    const skip = (page - 1) * limit;  // 计算需要跳过的记录数
    
    // 同时执行两个查询：获取维修记录列表和总数
    const [records, total] = await Promise.all([
      Maintenance.find(query)
        .populate('vehicle', 'brand model licensePlate')  // 填充车辆信息
        .populate({
          path: 'technician',                             // 填充技师信息
          select: 'name username',
          model: 'User'
        })
        .populate({
          path: 'parts.part',                             // 填充零部件信息
          model: 'Part',
          select: 'name code',
          strictPopulate: false
        })
        .populate('createdBy', 'username')                // 填充创建人信息
        .populate('updatedBy', 'username')                // 填充更新人信息
        .sort({ startDate: -1 })                          // 按开始日期倒序排列，最新的维修记录排在前面
        .skip(skip)                                       // 分页：跳过之前页的数据
        .limit(limit),                                    // 分页：限制每页数量
      Maintenance.countDocuments(query),                  // 计算符合条件的维修记录总数
    ]);

    // 处理返回的记录，格式化技师信息
    const processedRecords = records.map(record => {
      const doc = record.toObject();
      return {
        ...doc,
        technician: doc.technician ? {
          _id: doc.technician._id,                                // 技师ID
          name: doc.technician.name || doc.technician.username,   // 技师姓名（没有则用用户名代替）
          username: doc.technician.username                       // 技师用户名
        } : null
      };
    });

    // 返回维修记录列表和分页信息
    return successResponse({
      data: processedRecords,                   // 维修记录数据
      total,                                    // 总记录数
      page,                                     // 当前页码
      limit,                                    // 每页数量
      totalPages: Math.ceil(total / limit),     // 总页数
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('获取维修记录失败:', error);
    return errorResponse(error.message);
  }
}

/**
 * 创建新维修保养记录的函数
 * 
 * 这个函数用来在系统中添加新的汽车维修或保养记录。
 * 就像4S店接车维修时，需要记录车辆的维修项目、费用和技师等信息。
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    await authMiddleware(request);
    
    // 连接到数据库
    await connectDB();

    // 获取提交的维修记录数据
    const data = await request.json();
    console.log('请求数据:', data);

    // 验证必填字段是否都已提供
    const requiredFields = [
      'vehicle',       // 车辆
      'type',          // 维修类型
      'description',   // 描述
      'mileage',       // 里程数
      'cost',          // 费用
      'startDate',     // 开始日期
      'status',        // 状态
      'technician',    // 技师
    ];

    // 检查是否有缺少的字段
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      // 字段名称的中文对照表，方便用户理解
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
      // 如果有缺少的字段，返回错误提示，使用中文名称
      const missingFieldNames = missingFields.map(field => fieldNames[field as keyof typeof fieldNames]);
      return validationErrorResponse(`请填写以下必填项：${missingFieldNames.join('、')}`);
    }

    // 获取车辆信息，确认车辆存在
    const vehicle = await Vehicle.findById(data.vehicle).lean();
    if (!vehicle) {
      // 如果找不到车辆，返回错误提示
      return notFoundResponse('未找到指定车辆信息');
    }

    // 验证车辆是否有车主信息
    if (!vehicle.ownerName || !vehicle.ownerPhone) {
      // 如果车辆没有关联车主信息，返回错误提示
      return validationErrorResponse('该车辆未关联车主信息，请先完善车主信息');
    }

    // 创建新的维修记录
    const maintenance = new Maintenance({
      vehicle: data.vehicle,                                         // 车辆ID
      type: data.type,                                               // 维修类型（如常规保养、维修）
      description: data.description,                                 // 维修描述
      mileage: data.mileage,                                         // 车辆当前里程数
      cost: data.cost,                                               // 维修总费用
      startDate: new Date(data.startDate),                           // 开始日期
      completionDate: data.completionDate ? new Date(data.completionDate) : undefined,  // 完成日期（如果有）
      status: data.status,                                           // 维修状态
      technician: data.technician,                                   // 技师ID
      notes: data.notes,                                             // 备注信息
      customer: {
        name: vehicle.ownerName,                                     // 车主姓名
        contact: vehicle.ownerPhone                                  // 车主联系方式
      },
      createdBy: new mongoose.Types.ObjectId(),                      // 创建人ID
      updatedBy: new mongoose.Types.ObjectId(),                      // 更新人ID
      statusHistory: [{                                              // 状态变更历史
        status: data.status,                                         // 当前状态
        note: '创建维修记录',                                          // 变更说明
        timestamp: new Date(),                                       // 变更时间
        updatedBy: new mongoose.Types.ObjectId()                     // 操作人ID
      }]
    });

    // 如果有配件信息，计算配件总价
    if (Array.isArray(data.parts) && data.parts.length > 0) {
      maintenance.parts = data.parts.map(part => ({
        part: part.part,                                     // 配件ID
        quantity: part.quantity,                             // 数量
        unitPrice: part.unitPrice,                           // 单价
        totalPrice: part.quantity * part.unitPrice           // 总价 = 数量 × 单价
      }));
    }

    try {
      // 保存维修记录到数据库
      await maintenance.save();
    } catch (error: any) {
      // 如果是数据验证错误，返回具体的错误信息
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return validationErrorResponse(validationErrors.join('；'));
      }
      throw error;
    }

    // 更新车辆状态为"维修中"
    if (vehicle.status !== 'maintenance') {
      await Vehicle.findByIdAndUpdate(data.vehicle, {
        status: 'maintenance',                               // 更新状态为"维修中"
        lastMaintenanceDate: new Date(),                     // 更新最后维修日期
      });
    }

    // 返回成功响应，包含新创建的维修记录信息
    return successResponse({
      data: maintenance,
      message: '维修记录创建成功',
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
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