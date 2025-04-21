import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware, checkRole } from '@/app/lib/auth';
import WorkOrder from '@/app/models/workOrder';
import Vehicle from '@/app/models/vehicle';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/lib/api-response';
import { validateWorkOrder, recordWorkOrderProgress } from '@/app/lib/work-order-utils';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';


/**
 * 获取工单列表的函数
 * 
 * 这个函数用来获取系统中的维修工单信息。
 * 不同角色的用户看到的工单不同：
 * - 普通客户只能看到自己的工单
 * - 技师能看到所有工单（也可以筛选出自己负责的）
 * - 管理员能看到所有工单
 */
export async function GET(request: NextRequest) {
  try {
    // 检查用户权限，只有管理员、客户和技师可以查看工单
    const authResult = await checkRole(['admin', 'customer', 'technician'])(request);
    if (!authResult.success) {
      // 如果用户没有权限，返回未授权错误
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户信息存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    // 连接到数据库
    await connectDB();

    // 获取查询参数，用于筛选工单
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');          // 工单状态（如进行中、已完成）
    const vehicle = searchParams.get('vehicle');        // 车辆ID
    const technician = searchParams.get('technician');  // 技师ID
    const customer = searchParams.get('customer');      // 客户ID
    const page = parseInt(searchParams.get('page') || '1');            // 当前页码
    const pageSize = parseInt(searchParams.get('pageSize') || '10');   // 每页数量

    // 准备查询条件
    const query: any = {};
    
    // 根据用户角色设置不同的查询条件
    if (authResult.user.role === 'customer') {
      // 如果是客户，只能查看自己的工单
      console.log('客户查询工单，只显示自己的：', authResult.user._id);
      query.customer = authResult.user._id;
    }

    // 添加其他筛选条件
    if (status) query.status = status;     // 按工单状态筛选
    if (vehicle) query.vehicle = vehicle;  // 按车辆筛选

    // 检查是否需要获取统计数据
    const isStatistics = searchParams.get('statistics') === 'true';

    if (isStatistics) {
      // 如果是请求统计数据，提供各种统计信息

      // 计算工单总数和已完成工单数
      const totalCount = await WorkOrder.countDocuments(query);  // 工单总数
      const completedCount = await WorkOrder.countDocuments({
        ...query,
        status: 'completed',  // 已完成的工单
      });
      // 计算完成率（百分比）
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      // 计算平均评分
      const ratingResult = await WorkOrder.aggregate([
        { $match: { ...query, rating: { $exists: true } } },  // 只统计有评分的工单
        { $group: { _id: null, averageRating: { $avg: '$rating' } } },  // 计算平均值
      ]);
      const averageRating = ratingResult[0]?.averageRating || 0;

      // 获取各状态的工单数量分布
      const statusDistribution = await WorkOrder.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },  // 按状态分组计数
        { $project: { name: '$_id', value: '$count', _id: 0 } },  // 格式化输出
      ]);

      // 获取各优先级的工单数量分布
      const priorityDistribution = await WorkOrder.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } },  // 按优先级分组计数
        { $project: { name: '$_id', value: '$count', _id: 0 } },  // 格式化输出
      ]);

      // 获取最近6个月的工单数据统计
      const monthlyStats = [];
      for (let i = 0; i < 6; i++) {
        // 计算每个月的起止时间
        const date = subMonths(new Date(), i);  // 从当前月份往前推i个月
        const start = startOfMonth(date);       // 月初
        const end = endOfMonth(date);           // 月末
        
        // 获取当月创建的工单数量
        const monthCount = await WorkOrder.countDocuments({
          ...query,
          createdAt: { $gte: start, $lte: end },  // 在该月创建的工单
        });
        
        // 获取当月完成的工单数量
        const monthCompleted = await WorkOrder.countDocuments({
          ...query,
          status: 'completed',  // 状态为"已完成"
          createdAt: { $gte: start, $lte: end },  // 在该月创建的工单
        });

        // 添加到月度统计数组前面，保持时间顺序（从老到新）
        monthlyStats.unshift({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,  // 月份格式：2024-05
          count: monthCount,        // 当月总工单数
          completed: monthCompleted, // 当月已完成工单数
        });
      }

      // 返回所有统计数据
      return successResponse({
        totalCount,             // 工单总数
        completedCount,         // 已完成工单数
        completionRate,         // 完成率
        averageRating,          // 平均评分
        statusDistribution,     // 状态分布
        priorityDistribution,   // 优先级分布
        monthlyStats,           // 月度统计
      });
    }

    // 非统计查询，获取工单总数（用于分页）
    const total = await WorkOrder.countDocuments(query);

    // 获取工单列表数据
    const workOrders = await WorkOrder.find(query)
      .populate('vehicle', 'plateNumber brand model licensePlate') // 填充车辆信息
      .populate('customer', 'username')   // 填充客户信息
      .populate('technician', 'username') // 填充技师信息
      .sort({ createdAt: -1 })  // 按创建时间倒序，最新的工单排在前面
      .skip((page - 1) * pageSize)  // 分页：跳过之前页的数据
      .limit(pageSize);  // 分页：限制每页数量

    // 记录查询结果，方便调试
    console.log('获取到的工单列表:', JSON.stringify(workOrders.slice(0, 1), null, 2));

    // 返回工单列表和分页信息
    return successResponse({
      data: workOrders,  // 工单数据
      pagination: {
        current: page,     // 当前页码
        pageSize,          // 每页数量
        total              // 总记录数
      }
    });
  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('获取工单列表失败:', error);
    return errorResponse(error.message || '获取工单列表失败');
  }
}

/**
 * 创建工单的函数
 * 
 * 这个函数用来在系统中创建新的维修工单。
 * 相当于汽车维修店接待员记录新的维修任务。
 */
export async function POST(request: NextRequest) {
  try {
    // 检查用户权限，只有管理员和技师可以创建工单
    const authResult = await checkRole(['admin', 'technician'])(request);
    if (!authResult.success) {
      // 如果用户没有权限，返回未授权错误
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户信息存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    // 连接到数据库
    await connectDB();

    // 获取提交的工单数据
    const data = await request.json();
    
    // 生成工单编号，例如：WO2024050001
    const today = new Date();
    const yearMonth = format(today, 'yyyyMM');  // 格式：202405（年月）
    
    // 查找当月最后一个工单编号，确定新工单的序号
    const lastOrder = await WorkOrder.findOne({
      orderNumber: new RegExp(`^WO${yearMonth}`)  // 查找当月工单
    }).sort({ orderNumber: -1 });  // 按编号倒序，找出最大的

    // 计算新工单的序号
    let sequence = 1;  // 默认从1开始
    if (lastOrder) {
      // 如果已有工单，取最后四位数字并加1
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    // 生成新的工单编号 (格式: WO2024050001)
    // padStart(4, '0')确保序号是四位数，不足前面补0
    const orderNumber = `WO${yearMonth}${String(sequence).padStart(4, '0')}`;
    
    // 准备工单数据，包括用户提交的数据和系统生成的信息
    const workOrderData: any = {
      ...data,  // 用户提交的基本信息
      orderNumber,  // 工单编号
      createdBy: authResult.user._id,  // 创建者ID
      status: 'pending',  // 初始状态为"待处理"
      createdAt: today  // 创建时间
    };

    // 设置客户信息
    if (authResult.user.role === 'customer') {
      // 如果是客户创建工单，则客户就是当前用户
      workOrderData.customer = authResult.user._id;
    } else {
      // 如果是管理员创建工单，尝试根据车辆找到车主
      const vehicle = await Vehicle.findById(data.vehicle).lean();
      if (!vehicle) {
        return errorResponse('车辆不存在', 404);
      }
      
      // 确认车辆信息完整
      if (!vehicle._id) {
        return errorResponse('车辆信息不完整', 400);
      }
      
      // 设置客户为当前用户（简化处理，实际应该根据车辆找到真正的车主）
      workOrderData.customer = authResult.user._id;
    }

    // 验证工单数据是否完整有效
    const errors = validateWorkOrder(workOrderData);
    if (errors.length > 0) {
      // 如果有错误，将验证错误转换为前端友好的格式
      const formattedErrors: Record<string, string[]> = {};
      errors.forEach(err => {
        if (Array.isArray(err.message)) {
          formattedErrors[err.field] = err.message;
        } else {
          formattedErrors[err.field] = [err.message];
        }
      });
      return validationErrorResponse(formattedErrors);
    }

    // 创建工单记录到数据库
    const workOrder = await WorkOrder.create(workOrderData);

    // 记录工单状态变更历史
    await recordWorkOrderProgress(
      workOrder._id.toString(),  // 工单ID
      'pending',  // 状态：待处理
      authResult.user._id.toString(),  // 操作人ID
      '工单已创建'  // 变更说明
    );

    // 返回创建成功的工单信息
    return successResponse(workOrder);

  } catch (error: any) {
    // 如果出现错误，记录错误并返回错误响应
    console.error('创建工单失败:', error);
    return errorResponse(error.message || '创建工单失败');
  }
} 