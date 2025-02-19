import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db-connect';
import Maintenance from '@/models/maintenance';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: '请提供开始和结束日期' },
        { status: 400 }
      );
    }

    await dbConnect();

    // 获取指定日期范围内的维修记录
    const maintenanceRecords = await Maintenance.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).populate('vehicle');

    // 计算统计数据
    const totalMaintenance = maintenanceRecords.length;
    const totalRevenue = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);
    const avgCost = totalMaintenance > 0 ? totalRevenue / totalMaintenance : 0;
    const completedMaintenance = maintenanceRecords.filter(record => record.status === 'completed').length;
    const pendingMaintenance = maintenanceRecords.filter(record => record.status === 'pending').length;

    // 获取不重复的车辆数量
    const uniqueVehicles = new Set(maintenanceRecords.map(record => record.vehicle?._id.toString()));
    const totalVehicles = uniqueVehicles.size;

    // 按维修类型统计
    const maintenanceByType = Object.entries(
      maintenanceRecords.reduce((acc: any, record) => {
        if (!acc[record.type]) {
          acc[record.type] = { count: 0, revenue: 0 };
        }
        acc[record.type].count += 1;
        acc[record.type].revenue += record.cost;
        return acc;
      }, {})
    ).map(([type, data]: [string, any]) => ({
      type,
      count: data.count,
      revenue: data.revenue,
    }));

    // 按车辆统计
    const maintenanceByVehicle = Array.from(
      maintenanceRecords.reduce((acc, record) => {
        const vehicleId = record.vehicle?._id.toString();
        if (!vehicleId) return acc;

        const key = vehicleId;
        if (!acc.has(key)) {
          acc.set(key, {
            vehicle: {
              brand: record.vehicle.brand,
              model: record.vehicle.model,
              licensePlate: record.vehicle.licensePlate,
            },
            count: 0,
            revenue: 0,
          });
        }
        const data = acc.get(key);
        data.count += 1;
        data.revenue += record.cost;
        return acc;
      }, new Map())
    ).map(([_, data]) => data);

    return NextResponse.json({
      data: {
        totalMaintenance,
        totalRevenue,
        avgCost,
        completedMaintenance,
        pendingMaintenance,
        totalVehicles,
        maintenanceByType,
        maintenanceByVehicle,
      },
    });
  } catch (error: any) {
    console.error('获取报表数据失败:', error);
    return NextResponse.json(
      { message: '获取报表数据失败' },
      { status: 500 }
    );
  }
} 