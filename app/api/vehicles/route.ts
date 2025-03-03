import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vehicle from '@/models/vehicle';
import { authMiddleware } from '@/lib/auth';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { VehicleFormData } from '../../../types/vehicle';
import mongoose from 'mongoose';

// 获取车辆列表
export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const withoutRule = searchParams.get('withoutRule') === 'true';

    let query = {};

    if (withoutRule) {
      // 获取已有保养规则的车辆ID
      const rulesWithVehicles = await mongoose.model('MaintenanceRule').find().select('vehicle');
      const vehicleIdsWithRules = rulesWithVehicles.map(rule => rule.vehicle);
      
      // 添加条件：排除已有规则的车辆
      query = {
        _id: { $nin: vehicleIdsWithRules }
      };
    }

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Vehicle.countDocuments(query),
    ]);

    return successResponse({
      data: vehicles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('获取车辆列表错误:', error);
    return errorResponse(error.message || '获取车辆列表失败');
  }
}

// 创建新车辆
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    let user;
    try {
      user = await authMiddleware(request);
    } catch (error: any) {
      console.error('认证错误:', error);
      return unauthorizedResponse(error.message);
    }

    // 连接数据库
    try {
      await connectDB();
    } catch (error: any) {
      console.error('数据库连接错误:', error);
      return errorResponse('数据库连接失败');
    }

    const data = await request.json();

    // 验证必填字段
    const requiredFields = [
      'brand', 
      'model', 
      'year', 
      'licensePlate', 
      'vin', 
      'mileage', 
      'status',
      'ownerName',
      'ownerContact'
    ];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      return validationErrorResponse(`缺少必填字段: ${missingFields.join(', ')}`);
    }

    // 验证车牌号格式
    const licensePlateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/;
    if (!licensePlateRegex.test(data.licensePlate)) {
      return validationErrorResponse('车牌号格式不正确，应为：省份简称（中文）+ 大写字母 + 5位字母或数字，例如：豫B12345');
    }

    // 验证车架号格式
    const vinRegex = /^[0-9A-Z]{17}$/;
    if (!vinRegex.test(data.vin)) {
      return validationErrorResponse('车架号格式不正确，应为17位字符，只能包含数字和大写字母');
    }

    // 验证联系方式格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(data.ownerContact)) {
      return validationErrorResponse('联系方式格式不正确，请输入正确的手机号码');
    }

    // 验证年份
    const currentYear = new Date().getFullYear();
    if (data.year < 1900 || data.year > currentYear + 1) {
      return validationErrorResponse(`年份必须在 1900 到 ${currentYear + 1} 之间`);
    }

    // 验证里程数
    if (typeof data.mileage !== 'number' || data.mileage < 0) {
      return validationErrorResponse('里程数必须是大于等于0的数字');
    }

    // 验证状态
    const validStatuses = ['active', 'maintenance', 'inactive'];
    if (!validStatuses.includes(data.status)) {
      return validationErrorResponse('无效的车辆状态，只能是：active, maintenance, inactive');
    }

    // 验证车牌号和车架号是否已存在
    const [existingLicensePlate, existingVIN] = await Promise.all([
      Vehicle.findOne({ licensePlate: data.licensePlate }),
      Vehicle.findOne({ vin: data.vin }),
    ]);

    if (existingLicensePlate) {
      return validationErrorResponse('车牌号已存在');
    }

    if (existingVIN) {
      return validationErrorResponse('车架号已存在');
    }

    // 创建新车辆记录
    const vehicle = new Vehicle({
      ...data,
    });

    try {
      await vehicle.save();
      return successResponse({
        data: vehicle,
        message: '车辆添加成功',
      });
    } catch (error: any) {
      console.error('保存车辆记录错误:', error);
      if (error.name === 'ValidationError') {
        return validationErrorResponse(
          Object.values(error.errors)
            .map((err: any) => err.message)
            .join(', ')
        );
      }
      return errorResponse('保存车辆记录失败');
    }
  } catch (error: any) {
    console.error('添加车辆错误:', error);
    return errorResponse(error.message || '添加车辆失败');
  }
} 