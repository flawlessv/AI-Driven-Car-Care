import type { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import Maintenance from '@/app/models/maintenance';
import {
  successResponse,
  errorResponse,
} from '../../../../lib/api-response';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * 维护报表API - GET方法
 * 
 * 获取维护记录的统计数据，包括总数量、完成率、收入以及按时间和类型的趋势分析。
 * 支持按不同时间周期(日、周、月、年)和自定义日期范围进行查询。
 * 
 * 查询参数:
 * - period: 时间周期(day/week/month/year, 默认为"month")
 * - startDate: 开始日期(可选，如未提供则默认为过去6个月)
 * - endDate: 结束日期(可选，如未提供则默认为当前月份结束)
 * 
 * 返回:
 * - overview: 总览数据(总数量、已完成数量、完成率、总收入)
 * - trends: 按时间分组的趋势数据(日期、数量、已完成数量、收入)
 * - typeStats: 按维护类型分组的统计数据(类型、数量、收入)
 */
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
      // 使用客户端提供的日期范围
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // 默认统计最近6个月数据
      query.createdAt = {
        $gte: subMonths(startOfMonth(new Date()), 5),
        $lte: endOfMonth(new Date())
      };
    }

    // 获取基础统计数据:
    // 1. 总维护记录数
    // 2. 已完成的维护记录数
    // 3. 已完成维护的总收入
    const [totalCount, completedCount, totalRevenue] = await Promise.all([
      Maintenance.countDocuments(query),
      Maintenance.countDocuments({ ...query, status: 'completed' }),
      Maintenance.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ])
    ]);

    // 定义不同时间周期的日期格式化模板
    const timeGroupFormat = {
      day: '%Y-%m-%d',    // 按天: YYYY-MM-DD
      week: '%Y-W%V',     // 按周: YYYY-W周数
      month: '%Y-%m',     // 按月: YYYY-MM
      year: '%Y'          // 按年: YYYY
    };

    // 按时间分组获取趋势数据
    const trends = await Maintenance.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: timeGroupFormat[period as keyof typeof timeGroupFormat], date: '$createdAt' } }
          },
          count: { $sum: 1 },                                    // 维护记录总数
          completed: {                                           // 已完成的维护记录数
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          revenue: {                                            // 已完成维护的收入
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$cost', 0] }
          }
        }
      },
      { $sort: { '_id.date': 1 } }                             // 按日期升序排序
    ]);

    // 按维护类型分组统计数量和收入
    const typeStats = await Maintenance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',                                         // 按维护类型分组
          count: { $sum: 1 },                                   // 每种类型的维护记录数
          revenue: {                                            // 每种类型已完成维护的收入
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$cost', 0] }
          }
        }
      }
    ]);

    // 返回成功响应，包含三类统计数据
    return successResponse({
      // 总览数据
      overview: {
        totalCount,                                              // 维护记录总数
        completedCount,                                          // 已完成维护记录数
        completionRate: totalCount > 0 ? (completedCount / totalCount * 100) : 0,  // 完成率(百分比)
        totalRevenue: totalRevenue[0]?.total || 0                // 总收入
      },
      // 趋势数据
      trends: trends.map(t => ({
        date: t._id.date,
        count: t.count,
        completed: t.completed,
        revenue: t.revenue
      })),
      // 按类型统计数据
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