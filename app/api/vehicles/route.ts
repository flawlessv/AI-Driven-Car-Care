import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import Vehicle from '@/app/models/vehicle';
import { authMiddleware } from '@/app/lib/auth';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/app/lib/api-response';
import { VehicleFormData } from '../../../types/vehicle';
import mongoose from 'mongoose';

/**
 * 获取车辆列表的函数
 * 
 * 这个函数用来获取系统中的车辆信息。
 * 如果是普通客户登录，只能看到自己的车辆；如果是管理员或技师登录，可以看到所有车辆。
 * 就像4S店的系统，客户只能查看自己的车，而店里的工作人员可以看到所有客户的车。
 */
export async function GET(request: NextRequest) {
  try {
    // 验证当前用户身份，看看是谁在查询车辆信息
    const {user} = await authMiddleware(request);
    // 记录当前用户信息，方便调试
    console.log('当前用户:', {
      id: user?._id?.toString(),
      role: user?.role,
      username: user?.username || user?.name
    });
    
    // 连接到数据库
    await connectDB();

    // 获取分页参数，控制每次返回多少条数据
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');  // 页码，默认第1页
    const limit = parseInt(searchParams.get('limit') || '10');  // 每页数量，默认10条
    const skip = (page - 1) * limit;  // 计算需要跳过的记录数
    const withoutRule = searchParams.get('withoutRule') === 'true';  // 是否忽略规则

    // 准备查询条件
    let query = {};
    
    // 根据用户角色设置不同的查询条件
    // 如果是客户，只能查看自己的车辆（保护隐私）
    if (user && user.role === 'customer') {
      const ownerId = user._id.toString();
      console.log('客户用户查询车辆，只显示自己的车辆ID：', ownerId);
      query = { ...query, owner: ownerId };  // 添加所有者筛选条件
    }

    // 记录最终的查询条件
    console.log('最终查询条件:', JSON.stringify(query));

    // 进行一些调试查询，验证数据是否正确
    // 查询所有车辆（最多10条）
    const allVehicles = await Vehicle.find({}).limit(10);
    console.log(`数据库中有 ${allVehicles.length} 辆车总数`);
    
    // 查询所有有车主信息的车辆（最多10条）
    const vehiclesWithOwner = await Vehicle.find({ owner: { $exists: true } }).limit(10);
    console.log(`有owner字段的车辆: ${vehiclesWithOwner.length} 辆`);
    
    // 输出示例车辆的所有者信息，便于调试
    if (vehiclesWithOwner.length > 0) {
      console.log('示例车辆owner字段:', {
        vehicleId: vehiclesWithOwner[0]._id,  // 车辆ID
        owner: vehiclesWithOwner[0].owner,    // 所有者ID
        ownerType: typeof vehiclesWithOwner[0].owner  // 所有者字段的数据类型
      });
    }

    // 如果是客户用户，尝试直接用用户ID查询他的车辆
    if (user && user.role === 'customer') {
      const directOwnerQuery = await Vehicle.find({ owner: user._id }).limit(10);
      console.log(`直接用ID查询到 ${directOwnerQuery.length} 辆车`);
    }

    // 同时执行两个查询：获取车辆列表和总数
    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)  // 查询符合条件的车辆
        .skip(skip)        // 跳过前面的记录（分页）
        .limit(limit)      // 限制返回数量（分页）
        .sort({ createdAt: -1 }),  // 按创建时间倒序排列，最新添加的车辆排在前面
      Vehicle.countDocuments(query),  // 计算符合条件的车辆总数
    ]);

    // 记录查询结果
    console.log(`查询结果: 找到 ${vehicles.length} 辆车，总计 ${total} 辆`);

    // 返回车辆列表和分页信息
    return successResponse({
      data: vehicles,  // 车辆数据
      total,           // 总记录数
      page,            // 当前页码
      limit,           // 每页数量
      totalPages: Math.ceil(total / limit),  // 总页数
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('获取车辆列表错误:', error);
    return errorResponse(error.message || '获取车辆列表失败');
  }
}

/**
 * 创建新车辆的函数
 * 
 * 这个函数用来在系统中添加新的车辆记录。
 * 就像4S店登记一辆新车入库时，需要记录车辆的各种信息。
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份，确认是谁在添加车辆
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      // 如果身份验证失败，记录错误并返回未授权响应
      console.error('认证错误:', authResult.message);
      return unauthorizedResponse(authResult.message || '未授权访问');
    }

    // 确保用户信息存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }
    
    // 获取当前用户信息
    const user = authResult.user;
    
    // 连接到数据库
    try {
      await connectDB();
    } catch (error: any) {
      // 如果数据库连接失败，记录错误并返回错误响应
      console.error('数据库连接错误:', error);
      return errorResponse('数据库连接失败');
    }

    // 获取提交的车辆数据
    const data = await request.json();

    // 验证必填字段是否都已提供
    const requiredFields = [
      'brand',        // 品牌
      'model',        // 型号
      'year',         // 年份
      'licensePlate', // 车牌号
      'vin',          // 车架号
      'mileage',      // 里程数
      'status',       // 状态
      'ownerName',    // 车主姓名
      'ownerPhone'    // 车主电话
    ];
    // 检查是否有缺少的字段
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      // 如果有缺少的字段，返回错误提示
      return validationErrorResponse(`缺少必填字段: ${missingFields.join(', ')}`);
    }

    // 验证车牌号格式是否正确
    // 中国车牌格式：省份简称（中文）+ 大写字母 + 5位字母或数字
    const licensePlateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/;
    if (!licensePlateRegex.test(data.licensePlate)) {
      return validationErrorResponse('车牌号格式不正确，应为：省份简称（中文）+ 大写字母 + 5位字母或数字，例如：豫B12345');
    }

    // 验证车架号格式是否正确
    // 车架号是17位字符，只包含数字和大写字母
    const vinRegex = /^[0-9A-Z]{17}$/;
    if (!vinRegex.test(data.vin)) {
      return validationErrorResponse('车架号格式不正确，应为17位字符，只能包含数字和大写字母');
    }

    // 验证手机号格式是否正确
    // 中国手机号：1开头的11位数字
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(data.ownerPhone)) {
      return validationErrorResponse('联系方式格式不正确，请输入正确的手机号码');
    }

    // 验证年份是否在合理范围内
    const currentYear = new Date().getFullYear();
    if (data.year < 1900 || data.year > currentYear + 1) {
      return validationErrorResponse(`年份必须在 1900 到 ${currentYear + 1} 之间`);
    }

    // 验证里程数是否为正数
    if (typeof data.mileage !== 'number' || data.mileage < 0) {
      return validationErrorResponse('里程数必须是大于等于0的数字');
    }

    // 验证状态是否为有效值
    const validStatuses = ['active', 'maintenance', 'inactive'];
    if (!validStatuses.includes(data.status)) {
      return validationErrorResponse('无效的车辆状态，只能是：active, maintenance, inactive');
    }

    // 验证车牌号和车架号是否已存在（防止重复添加）
    const [existingLicensePlate, existingVIN] = await Promise.all([
      Vehicle.findOne({ licensePlate: data.licensePlate }),  // 查询是否有相同车牌的车辆
      Vehicle.findOne({ vin: data.vin }),  // 查询是否有相同车架号的车辆
    ]);

    // 如果车牌号已存在，返回错误
    if (existingLicensePlate) {
      return validationErrorResponse('车牌号已存在');
    }

    // 如果车架号已存在，返回错误
    if (existingVIN) {
      return validationErrorResponse('车架号已存在');
    }

    // 创建新车辆记录
    const vehicle = new Vehicle({
      ...data,  // 包含所有提交的数据
      owner: user._id  // 设置车主为当前用户
    });

    try {
      // 保存车辆记录到数据库
      await vehicle.save();
      // 返回成功响应，包含新创建的车辆信息
      return successResponse({
        data: vehicle,
        message: '车辆添加成功',
      });
    } catch (error: any) {
      // 如果保存过程中出错，记录错误并返回错误响应
      console.error('保存车辆记录错误:', error);
      if (error.name === 'ValidationError') {
        // 如果是数据验证错误，返回具体的错误信息
        return validationErrorResponse(
          Object.values(error.errors)
            .map((err: any) => err.message)
            .join(', ')
        );
      }
      return errorResponse('保存车辆记录失败');
    }
  } catch (error: any) {
    // 如果出现其他错误，记录错误并返回错误响应
    console.error('添加车辆错误:', error);
    return errorResponse(error.message || '添加车辆失败');
  }
} 