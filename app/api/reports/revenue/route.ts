import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import MaintenanceRecord from '../../../../models/maintenance';
import dayjs from 'dayjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: '请提供开始和结束日期' },
        { status: 400 }
      );
    }

    await connectDB();

    // 获取指定日期范围内的维修记录
    const maintenanceRecords = await MaintenanceRecord.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: 1 });

    // 计算基础统计数据
    const totalOrders = maintenanceRecords.length;
    const totalRevenue = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 计算收入增长率
    const previousPeriodStart = dayjs(startDate).subtract(1, 'month').toDate();
    const previousPeriodEnd = dayjs(endDate).subtract(1, 'month').toDate();
    
    const previousRecords = await MaintenanceRecord.find({
      date: {
        $gte: previousPeriodStart,
        $lte: previousPeriodEnd,
      },
    });

    const previousRevenue = previousRecords.reduce((sum, record) => sum + record.cost, 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // 按服务类型统计收入
    const revenueByService = Object.entries(
      maintenanceRecords.reduce((acc: any, record) => {
        if (!acc[record.type]) {
          acc[record.type] = { revenue: 0 };
        }
        acc[record.type].revenue += record.cost;
        return acc;
      }, {})
    ).map(([type, data]: [string, any]) => ({
      type,
      revenue: data.revenue,
    }));

    // 按月份统计收入
    const revenueByMonth = Array.from(
      maintenanceRecords.reduce((acc, record) => {
        const month = dayjs(record.date).format('YYYY-MM');
        acc.set(month, (acc.get(month) || 0) + record.cost);
        return acc;
      }, new Map())
    ).map(([month, revenue]) => ({
      month,
      revenue,
    })).sort((a, b) => a.month.localeCompare(b.month));

    // 获取热门服务
    const topServices = Object.entries(
      maintenanceRecords.reduce((acc: any, record) => {
        const serviceKey = `${record.type}-${record.description}`;
        if (!acc[serviceKey]) {
          acc[serviceKey] = {
            service: record.description || record.type,
            revenue: 0,
            orders: 0,
          };
        }
        acc[serviceKey].revenue += record.cost;
        acc[serviceKey].orders += 1;
        return acc;
      }, {})
    )
      .map(([_, data]: [string, any]) => data)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

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
    console.error('获取收入报表数据失败:', error);
    return NextResponse.json(
      { message: '获取收入报表数据失败' },
      { status: 500 }
    );
  }
} 