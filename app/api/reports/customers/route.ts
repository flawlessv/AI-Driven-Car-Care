import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db-connect';
import Customer from '@/models/customer';
import MaintenanceRecord from '@/models/maintenance';

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

    // 获取所有客户
    const customers = await Customer.find({});
    const totalCustomers = customers.length;

    // 获取指定日期范围内的新增客户
    const newCustomers = await Customer.countDocuments({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    // 获取指定日期范围内的维修记录
    const maintenanceRecords = await MaintenanceRecord.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).populate('customer');

    // 计算活跃客户（在指定时间段内有维修记录的客户）
    const activeCustomerIds = new Set(
      maintenanceRecords.map(record => record.customer?._id.toString())
    );
    const activeCustomers = activeCustomerIds.size;

    // 计算总消费和平均消费
    const totalSpending = maintenanceRecords.reduce(
      (sum, record) => sum + record.cost,
      0
    );
    const averageSpending = totalCustomers > 0 ? totalSpending / totalCustomers : 0;

    // 按客户类型统计
    const customersByType = Object.entries(
      customers.reduce((acc: any, customer) => {
        if (!acc[customer.type]) {
          acc[customer.type] = { count: 0, spending: 0 };
        }
        acc[customer.type].count += 1;
        // 计算该类型客户的总消费
        const customerRecords = maintenanceRecords.filter(
          record => record.customer?._id.toString() === customer._id.toString()
        );
        acc[customer.type].spending += customerRecords.reduce(
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

    // 获取高价值客户
    const customerSpending = new Map();
    const customerVisits = new Map();
    const customerLastVisit = new Map();

    maintenanceRecords.forEach(record => {
      const customerId = record.customer?._id.toString();
      if (!customerId) return;

      // 累计消费
      customerSpending.set(
        customerId,
        (customerSpending.get(customerId) || 0) + record.cost
      );

      // 累计访问次数
      customerVisits.set(
        customerId,
        (customerVisits.get(customerId) || 0) + 1
      );

      // 更新最近访问时间
      const visitDate = new Date(record.date);
      const lastVisit = customerLastVisit.get(customerId);
      if (!lastVisit || visitDate > lastVisit) {
        customerLastVisit.set(customerId, visitDate);
      }
    });

    const topCustomers = customers
      .map(customer => ({
        name: customer.name,
        phone: customer.phone,
        visits: customerVisits.get(customer._id.toString()) || 0,
        spending: customerSpending.get(customer._id.toString()) || 0,
        lastVisit: customerLastVisit.get(customer._id.toString())?.toISOString() || '',
      }))
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 10);

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