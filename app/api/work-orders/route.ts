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


// 获取工单列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const authResult = await checkRole(['admin', 'customer', 'technician'])(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const vehicle = searchParams.get('vehicle');
    const technician = searchParams.get('technician');
    const customer = searchParams.get('customer');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // 构建查询条件
    const query: any = {};
    
    // 根据用户角色过滤
    if (authResult.user.role === 'customer') {
      console.log('客户查询工单，只显示自己的：', authResult.user._id);
      query.customer = authResult.user._id;
    } else if (authResult.user.role === 'technician') {
      // 技师可以看到所有工单，不再限制为只能看到分配给自己的工单
      // 如果前端传入了特定technician参数，仍然支持过滤
      if (technician) {
        query.technician = technician;
      }
    } else if (customer) {
      // 管理员如果指定了customer参数，则查询该客户的工单
      query.customer = customer;
    }

    if (status) query.status = status;
    if (vehicle) query.vehicle = vehicle;

    // 如果是请求统计数据
    const isStatistics = searchParams.get('statistics') === 'true';

    if (isStatistics) {
      // 获取基础统计数据
      const totalCount = await WorkOrder.countDocuments(query);
      const completedCount = await WorkOrder.countDocuments({
        ...query,
        status: 'completed',
      });
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      // 获取平均评分
      const ratingResult = await WorkOrder.aggregate([
        { $match: { ...query, rating: { $exists: true } } },
        { $group: { _id: null, averageRating: { $avg: '$rating' } } },
      ]);
      const averageRating = ratingResult[0]?.averageRating || 0;

      // 获取状态分布
      const statusDistribution = await WorkOrder.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { name: '$_id', value: '$count', _id: 0 } },
      ]);

      // 获取优先级分布
      const priorityDistribution = await WorkOrder.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $project: { name: '$_id', value: '$count', _id: 0 } },
      ]);

      // 获取最近6个月的月度统计
      const monthlyStats = [];
      for (let i = 0; i < 6; i++) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const monthCount = await WorkOrder.countDocuments({
          ...query,
          createdAt: { $gte: start, $lte: end },
        });
        
        const monthCompleted = await WorkOrder.countDocuments({
          ...query,
          status: 'completed',
          createdAt: { $gte: start, $lte: end },
        });

        monthlyStats.unshift({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          count: monthCount,
          completed: monthCompleted,
        });
      }

      return successResponse({
        totalCount,
        completedCount,
        completionRate,
        averageRating,
        statusDistribution,
        priorityDistribution,
        monthlyStats,
      });
    }

    // 获取总数
    const total = await WorkOrder.countDocuments(query);

    // 获取工单列表
    const workOrders = await WorkOrder.find(query)
      .populate('vehicle', 'plateNumber brand model licensePlate')
      .populate('customer', 'username')
      .populate('technician', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    console.log('获取到的工单列表:', JSON.stringify(workOrders.slice(0, 1), null, 2));

    return successResponse({
      data: workOrders,
      pagination: {
        current: page,
        pageSize,
        total
      }
    });
  } catch (error: any) {
    console.error('获取工单列表失败:', error);
    return errorResponse(error.message || '获取工单列表失败');
  }
}

// 创建工单
export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const authResult = await checkRole(['admin', 'customer'])(request);
    if (!authResult.success) {
      return errorResponse(authResult.message || '未授权访问', 401);
    }

    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }

    await connectDB();

    const data = await request.json();
    
    // 生成工单编号
    const today = new Date();
    const yearMonth = format(today, 'yyyyMM');
    
    // 获取当月最后一个工单编号
    const lastOrder = await WorkOrder.findOne({
      orderNumber: new RegExp(`^WO${yearMonth}`)
    }).sort({ orderNumber: -1 });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    // 生成新的工单编号 (格式: WO2024030001)
    const orderNumber = `WO${yearMonth}${String(sequence).padStart(4, '0')}`;
    
    // 添加创建者和客户信息
    const workOrderData: any = {
      ...data,
      orderNumber,
      createdBy: authResult.user._id,
      status: 'pending',
      createdAt: today
    };

    // 设置customer字段
    if (authResult.user.role === 'customer') {
      workOrderData.customer = authResult.user._id;
    } else {
      // 当不是客户创建工单时，根据车辆ID获取其车主信息
      const vehicle = await Vehicle.findById(data.vehicle).lean();
      if (!vehicle) {
        return errorResponse('车辆不存在', 404);
      }
      
      // 确认正确的owner属性
      if (!vehicle._id) {
        return errorResponse('车辆信息不完整', 400);
      }
      
      // 在这里我们设置customer为用户自己，因为提供的Vehicle模型可能没有owner字段
      // 在实际应用中，应该根据实际的Vehicle模型结构来设置customer
      workOrderData.customer = authResult.user._id;
    }

    // 验证数据
    const errors = validateWorkOrder(workOrderData);
    if (errors.length > 0) {
      // 将验证错误转换为API期望的格式
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

    // 创建工单
    const workOrder = await WorkOrder.create(workOrderData);

    // 记录工单进度
    await recordWorkOrderProgress(
      workOrder._id.toString(),
      'pending',
      authResult.user._id.toString(),
      '工单已创建'
    );

    return successResponse(workOrder);

  } catch (error: any) {
    console.error('创建工单失败:', error);
    return errorResponse(error.message || '创建工单失败');
  }
} 