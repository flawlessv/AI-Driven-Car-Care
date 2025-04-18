import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import Vehicle from '@/app/models/vehicle';
import MaintenanceRecord from '@/app/models/maintenance';

/**
 * 客户报表API - GET方法
 * 
 * 获取指定日期范围内的客户相关统计数据，包括总客户数、新增客户数、活跃客户数、
 * 总消费、平均消费、按客户类型的统计数据以及高价值客户列表。
 * 
 * 查询参数:
 * - startDate: 开始日期(必填)
 * - endDate: 结束日期(必填)
 * 
 * 返回:
 * - totalCustomers: 总客户数
 * - newCustomers: 新增客户数
 * - activeCustomers: 活跃客户数(在指定时间段内有维修记录的客户)
 * - totalSpending: 总消费金额
 * - averageSpending: 平均客户消费
 * - customersByType: 按客户类型分类的统计数据
 * - topCustomers: 高价值客户列表(按消费金额排序的前10名客户)
 */
export async function GET(request: Request) {
  try {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
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

    // 从车辆数据中提取唯一客户信息
    const vehicles = await Vehicle.find({});
    // 提取唯一的客户信息
    const uniqueCustomers = Array.from(
      new Map(
        vehicles.map(vehicle => [
          vehicle.owner.toString(), 
          {
            name: vehicle.ownerName,
            phone: vehicle.ownerContact,
            type: vehicle.ownerType || 'individual', // 默认为个人客户
            _id: vehicle.owner
          }
        ])
      ).values()
    );
    
    const totalCustomers = uniqueCustomers.length;

    // 获取指定日期范围内的新增车辆(代表新客户)
    const newVehicles = await Vehicle.countDocuments({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
    
    // 假设每辆新车对应一个新客户
    const newCustomers = newVehicles;

    // 获取指定日期范围内的维修记录
    const maintenanceRecords = await MaintenanceRecord.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).populate('vehicle');

    // 根据维修记录计算活跃车主(客户)
    const activeCustomerIds = new Set(
      maintenanceRecords
        .filter(record => record.vehicle)
        .map(record => record.vehicle.owner?.toString())
        .filter(Boolean)
    );
    const activeCustomers = activeCustomerIds.size;

    // 计算总消费和平均消费
    const totalSpending = maintenanceRecords.reduce(
      (sum, record) => sum + record.cost,
      0
    );
    const averageSpending = totalCustomers > 0 ? totalSpending / totalCustomers : 0;

    // 按客户类型分组并统计数量和消费金额
    const customersByType = Object.entries(
      uniqueCustomers.reduce((acc: Record<string, { count: number; spending: number }>, customer: any) => {
        const customerType = customer.type || 'individual';
        
        // 初始化客户类型统计
        if (!acc[customerType]) {
          acc[customerType] = { count: 0, spending: 0 };
        }
        acc[customerType].count += 1;
        
        // 查找该客户的所有维修记录
        const customerRecords = maintenanceRecords.filter(
          record => record.vehicle && record.vehicle.owner?.toString() === customer._id.toString()
        );
        
        // 计算该类型客户的总消费
        acc[customerType].spending += customerRecords.reduce(
          (sum: number, record: any) => sum + record.cost,
          0
        );
        
        return acc;
      }, {})
    ).map(([type, data]: [string, any]) => ({
      type,
      count: data.count,
      spending: data.spending,
    }));

    // 计算每个客户的消费金额、访问次数和最近访问时间
    const customerSpending = new Map<string, number>();
    const customerVisits = new Map<string, number>();
    const customerLastVisit = new Map<string, Date>();

    maintenanceRecords.forEach(record => {
      if (!record.vehicle || !record.vehicle.owner) return;
      
      const customerId = record.vehicle.owner.toString();
      if (!customerId) return;

      // 累计客户消费金额
      customerSpending.set(
        customerId,
        (customerSpending.get(customerId) || 0) + record.cost
      );

      // 累计客户访问次数
      customerVisits.set(
        customerId,
        (customerVisits.get(customerId) || 0) + 1
      );

      // 更新客户最近访问时间
      const visitDate = new Date(record.date);
      const lastVisit = customerLastVisit.get(customerId);
      if (!lastVisit || visitDate > lastVisit) {
        customerLastVisit.set(customerId, visitDate);
      }
    });

    // 计算高价值客户(按消费金额排序的前10名客户)
    const topCustomers = uniqueCustomers
      .map((customer: any) => ({
        name: customer.name,
        phone: customer.phone,
        visits: customerVisits.get(customer._id.toString()) || 0,
        spending: customerSpending.get(customer._id.toString()) || 0,
        lastVisit: customerLastVisit.get(customer._id.toString())?.toISOString() || '',
      }))
      .sort((a: { spending: number }, b: { spending: number }) => b.spending - a.spending)
      .slice(0, 10);

    // 返回所有统计数据
    return NextResponse.json({
      data: {
        totalCustomers,
        newCustomers,
        activeCustomers,
        totalSpending,
        averageSpending,
        customersByType,
        topCustomers,
      },
    });
  } catch (error: any) {
    console.error('获取客户报表数据失败:', error);
    return NextResponse.json(
      { message: '获取客户报表数据失败' },
      { status: 500 }
    );
  }
} 