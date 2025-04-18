import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import MaintenanceRecord from '@/app/models/maintenance';
import dayjs from 'dayjs';

/**
 * 收入报表API - GET方法
 * 
 * 获取指定日期范围内的收入统计数据，包括总收入、订单数、平均订单价值、
 * 收入增长率、按服务类型分类的收入、按月份分类的收入以及热门服务。
 * 
 * 查询参数:
 * - period: 时间周期(默认为"month")
 * - startDate: 开始日期(必填)
 * - endDate: 结束日期(必填)
 * 
 * 返回:
 * - totalRevenue: 总收入
 * - totalOrders: 总订单数
 * - averageOrderValue: 平均订单价值
 * - revenueGrowth: 收入增长率(与上一个相同时期相比)
 * - revenueByService: 按服务类型分类的收入
 * - revenueByMonth: 按月份分类的收入
 * - topServices: 热门服务(按收入排序)
 */
export async function GET(request: Request) {
  try {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 验证必填参数
    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: '请提供开始和结束日期' },
        { status: 400 }
      );
    }

    // 连接数据库
    await connectDB();

    // 查询指定日期范围内的维修记录
    // 查询条件：日期在起止日期之间，按日期升序排列
    const maintenanceRecords = await MaintenanceRecord.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: 1 });

    // 计算基础统计数据：总订单数、总收入和平均订单价值
    const totalOrders = maintenanceRecords.length;  // 订单总数就是记录条数
    const totalRevenue = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);  // 计算总收入
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;  // 计算平均订单价值

    // 计算与上一时期相比的收入增长率
    // 例如：如果当前查询是3月数据，则上一时期是2月数据
    const previousPeriodStart = dayjs(startDate).subtract(1, 'month').toDate();
    const previousPeriodEnd = dayjs(endDate).subtract(1, 'month').toDate();
    
    // 查询上一时期的维修记录
    const previousRecords = await MaintenanceRecord.find({
      date: {
        $gte: previousPeriodStart,
        $lte: previousPeriodEnd,
      },
    });

    // 计算上一时期的总收入
    const previousRevenue = previousRecords.reduce((sum, record) => sum + record.cost, 0);
    // 计算收入增长率（百分比）
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // 按服务类型统计收入
    // 使用reduce聚合收入数据，按维修类型分组
    const revenueByService = Object.entries(
      maintenanceRecords.reduce((acc: any, record) => {
        if (!acc[record.type]) {
          acc[record.type] = { revenue: 0 };
        }
        acc[record.type].revenue += record.cost;
        return acc;
      }, {})
    ).map(([type, data]: [string, any]) => ({
      type,  // 服务类型
      revenue: data.revenue,  // 该类型的总收入
    }));

    // 按月份统计收入
    // 使用Map确保月份唯一，并按月份格式（YYYY-MM）归类收入
    const revenueByMonth = Array.from(
      maintenanceRecords.reduce((acc, record) => {
        const month = dayjs(record.date).format('YYYY-MM');  // 将日期格式化为年月
        acc.set(month, (acc.get(month) || 0) + record.cost);  // 累加该月份的收入
        return acc;
      }, new Map<string, number>())
    ).map(([month, revenue]: [string, number]) => ({
      month,  // 月份（YYYY-MM格式）
      revenue,  // 该月的总收入
    })).sort((a, b) => a.month.localeCompare(b.month));  // 按月份升序排列

    // 按服务类型和描述统计并提取收入最高的前5个服务
    // 组合服务类型和描述作为唯一标识
    const topServices = Object.entries(
      maintenanceRecords.reduce((acc: any, record) => {
        const serviceKey = `${record.type}-${record.description}`;  // 创建服务唯一标识
        if (!acc[serviceKey]) {
          acc[serviceKey] = {
            service: record.description || record.type,  // 服务名称
            revenue: 0,  // 收入
            orders: 0,  // 订单数
          };
        }
        acc[serviceKey].revenue += record.cost;  // 累加收入
        acc[serviceKey].orders += 1;  // 累加订单数
        return acc;
      }, {})
    )
      .map(([_, data]: [string, any]) => data)  // 提取服务数据
      .sort((a, b) => b.revenue - a.revenue)  // 按收入降序排序
      .slice(0, 5);  // 只取前5个热门服务

    // 返回所有统计数据
    return NextResponse.json({
      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        revenueGrowth,
        revenueByService,
        revenueByMonth,
        topServices,
      },
    });
  } catch (error: any) {
    // 错误处理
    console.error('获取收入报表数据失败:', error);
    return NextResponse.json(
      { message: '获取收入报表数据失败' },
      { status: 500 }
    );
  }
} 