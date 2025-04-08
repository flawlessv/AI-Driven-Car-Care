import { NextRequest } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import { authMiddleware } from '../../../../lib/auth';
import { successResponse, errorResponse } from '../../../../lib/api-response';
import { getUserModel } from '../../../../lib/db/models';
import { WorkOrder } from '../../../../models/workOrder';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证用户身份
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }



    // 连接数据库
    await connectDB();

    // 获取技师信息
    const User = getUserModel();
    const technician = await User.findById(params.id);
    if (!technician) {
      return errorResponse('技师不存在', 404);
    }

    // 获取技师的所有工单
    const allOrders = await WorkOrder.find({ technician: params.id });
    const completedOrders = allOrders.filter(order => order.status === 'completed');

    // 计算基础统计数据
    const totalOrders = allOrders.length;
    const completedOrdersCount = completedOrders.length;
    const completionRate = totalOrders > 0 ? completedOrdersCount / totalOrders : 0;
    const averageRating = completedOrders.length > 0 
      ? completedOrders.reduce((sum, order) => sum + (order.rating || 0), 0) / completedOrdersCount 
      : 0;

    // 生成最近6个月的月度统计
    const monthlyStats = [];
    for (let i = 0; i < 6; i++) {
      const currentDate = new Date();
      const monthStart = startOfMonth(subMonths(currentDate, i));
      const monthEnd = endOfMonth(subMonths(currentDate, i));
      
      const monthOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      const monthCompletedOrders = monthOrders.filter(order => order.status === 'completed');
      const monthCompletionRate = monthOrders.length > 0 
        ? monthCompletedOrders.length / monthOrders.length 
        : 0;
      const monthAverageRating = monthCompletedOrders.length > 0
        ? monthCompletedOrders.reduce((sum, order) => sum + (order.rating || 0), 0) / monthCompletedOrders.length
        : 0;

      monthlyStats.push({
        month: format(monthStart, 'yyyy-MM'),
        orderCount: monthOrders.length,
        completionRate: monthCompletionRate,
        averageRating: monthAverageRating
      });
    }

    // 返回统计数据
    return successResponse({
      totalOrders,
      completedOrders: completedOrdersCount,
      completionRate,
      averageRating,
      monthlyStats: monthlyStats.reverse() // 按时间正序排列
    });

  } catch (error) {
    console.error('获取技师统计数据失败:', error);
    return errorResponse('获取统计数据失败', 500);
  }
} 