import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import WorkOrder from '@/models/workOrder';
import {
  successResponse,
  errorResponse,
} from '@/lib/api-response';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    // 构建查询条件
    let query: any = {};
    if (user.role === 'customer') {
      query.customer = user._id;
    } else if (user.role === 'staff') {
      query.technician = user._id;
    }

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
  } catch (error: any) {
    console.error('获取工单统计数据失败:', error);
    return errorResponse(error.message);
  }
} 