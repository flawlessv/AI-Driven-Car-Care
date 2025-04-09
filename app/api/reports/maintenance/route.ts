import type { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import Maintenance from '@/app/models/maintenance';
import {
  successResponse,
  errorResponse,
} from '../../../../lib/api-response';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }

    // 连接数据库
    await connectDB();

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 构建查询条件
    const query: any = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // 默认统计最近6个月
      query.createdAt = {
        $gte: subMonths(startOfMonth(new Date()), 5),
        $lte: endOfMonth(new Date())
      };
    }

    // 获取基础统计数据
    const [totalCount, completedCount, totalRevenue] = await Promise.all([
      Maintenance.countDocuments(query),
      Maintenance.countDocuments({ ...query, status: 'completed' }),
      Maintenance.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ])
    ]);

    // 按时间分组获取趋势数据
    const timeGroupFormat = {
      day: '%Y-%m-%d',
      week: '%Y-W%V',
      month: '%Y-%m',
      year: '%Y'
    };

    const trends = await Maintenance.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: timeGroupFormat[period as keyof typeof timeGroupFormat], date: '$createdAt' } }
          },
          count: { $sum: 1 },
          completed: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$cost', 0] }
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // 按类型分组统计
    const typeStats = await Maintenance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$cost', 0] }
          }
        }
      }
    ]);

    return successResponse({
      overview: {
        totalCount,
        completedCount,
        completionRate: totalCount > 0 ? (completedCount / totalCount * 100) : 0,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      trends: trends.map(t => ({
        date: t._id.date,
        count: t.count,
        completed: t.completed,
        revenue: t.revenue
      })),
      typeStats: typeStats.map(t => ({
        type: t._id,
        count: t.count,
        revenue: t.revenue
      }))
    });

  } catch (error: any) {
    console.error('获取维修统计数据失败:', error);
    return errorResponse(error.message || '获取维修统计数据失败');
  }
} 