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
    // 因为一个客户可能拥有多辆车，所以需要去重
    const vehicles = await Vehicle.find({});
    // 使用Map数据结构确保客户ID唯一，提取客户相关信息
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
    
    // 计算总客户数
    const totalCustomers = uniqueCustomers.length;

    // 获取指定日期范围内的新增车辆(代表新客户)
    // 基于车辆创建日期来估算新客户数量
    const newVehicles = await Vehicle.countDocuments({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
    
    // 假设每辆新车对应一个新客户
    const newCustomers = newVehicles;

    // 获取指定日期范围内的所有维修记录
    // 使用populate填充车辆信息以便后续分析
    const maintenanceRecords = await MaintenanceRecord.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).populate('vehicle');

    // 计算活跃客户：在指定时期内有维修记录的唯一客户数
    // 使用Set数据结构确保客户ID唯一
    const activeCustomerIds = new Set(
      maintenanceRecords
        .filter(record => record.vehicle)  // 过滤掉没有关联车辆的记录
        .map(record => record.vehicle.owner?.toString())  // 提取车主ID
        .filter(Boolean)  // 过滤掉undefined或null值
    );
    const activeCustomers = activeCustomerIds.size;

    // 计算总消费金额：所有维修记录成本的总和
    const totalSpending = maintenanceRecords.reduce(
      (sum, record) => sum + record.cost,
      0
    );
    // 计算平均客户消费：总消费除以总客户数
    const averageSpending = totalCustomers > 0 ? totalSpending / totalCustomers : 0;

    // 按客户类型分组统计
    // 计算每种类型的客户数量和消费金额
    const customersByType = Object.entries(
      uniqueCustomers.reduce((acc: Record<string, { count: number; spending: number }>, customer: any) => {
        const customerType = customer.type || 'individual';
        
        // 初始化客户类型统计对象
        if (!acc[customerType]) {
          acc[customerType] = { count: 0, spending: 0 };
        }
        acc[customerType].count += 1;
        
        // 查找该客户的所有维修记录
        const customerRecords = maintenanceRecords.filter(
          record => record.vehicle && record.vehicle.owner?.toString() === customer._id.toString()
        );
        
        // 累计该类型客户的总消费
        acc[customerType].spending += customerRecords.reduce(
          (sum: number, record: any) => sum + record.cost,
          0
        );
        
        return acc;
      }, {})
    ).map(([type, data]: [string, any]) => ({
      type,  // 客户类型
      count: data.count,  // 该类型的客户数量
      spending: data.spending,  // 该类型客户的总消费
    }));

    // 计算每个客户的详细指标
    // 创建三个Map来存储不同维度的统计数据
    const customerSpending = new Map<string, number>();  // 存储客户消费金额
    const customerVisits = new Map<string, number>();    // 存储客户访问次数
    const customerLastVisit = new Map<string, Date>();   // 存储客户最近访问时间

    // 遍历所有维修记录，计算客户维度的统计数据
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
      .slice(0, 10);  // 只取前10名客户

    // 返回所有统计数据，构建最终响应结构
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
    // 错误处理
    console.error('获取客户报表数据失败:', error);
    return NextResponse.json(
      { message: '获取客户报表数据失败' },
      { status: 500 }
    );
  }
} 