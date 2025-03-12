import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import Maintenance from '@/models/maintenance';
import Vehicle from '@/models/vehicle';
import { getUserModel } from '@/lib/db/models';
import { successResponse, errorResponse } from '@/lib/api-response';
import dayjs from 'dayjs';

export async function GET(request: NextRequest) {
  try {
    const {user} = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('查询日期范围:', { startDate, endDate });

    // 构建查询条件
    const dateQuery = {
      createdAt: {
        $gte: startDate ? new Date(startDate) : new Date(dayjs().subtract(30, 'days').format('YYYY-MM-DD')),
        $lte: endDate ? new Date(endDate) : new Date(dayjs().format('YYYY-MM-DD')),
      },
    };

    console.log('构建的日期查询:', dateQuery);

    // 获取基础统计数据
    const [
      totalVehicles,
      totalMaintenance,
      completedMaintenance,
      pendingMaintenance,
      todayAppointments,
      monthlyRevenue,
      activeTechnicians,
      alerts,
    ] = await Promise.all([
      Vehicle.countDocuments({}),
      Maintenance.countDocuments(dateQuery),
      Maintenance.countDocuments({ ...dateQuery, status: 'completed' }),
      Maintenance.countDocuments({ status: 'pending' }),
      Maintenance.countDocuments({
        startDate: {
          $gte: new Date(dayjs().startOf('day').format()),
          $lte: new Date(dayjs().endOf('day').format()),
        },
      }),
      Maintenance.aggregate([
        {
          $match: {
            ...dateQuery,
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$cost' },
          },
        },
      ]).then(result => (result[0]?.total || 0)),
      getUserModel().countDocuments({ role: 'technician', status: 'active' }),
      Maintenance.countDocuments({ status: 'pending' }),
    ]);

    console.log('基础统计数据:', {
      totalVehicles,
      totalMaintenance,
      completedMaintenance,
      pendingMaintenance,
      todayAppointments,
      monthlyRevenue,
      activeTechnicians,
      alerts,
    });

    // 获取维修类型分布
    const maintenanceByType = await Maintenance.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    console.log('维修类型分布:', maintenanceByType);

    // 获取最近维修记录
    const recentMaintenance = await Maintenance.find({})
      .populate('vehicle', 'brand model licensePlate')
      .populate('technician', 'name username')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('最近维修记录数量:', recentMaintenance.length);

    // 获取月度统计数据
    const monthlyStats = await Maintenance.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          maintenance: { $sum: 1 },
          revenue: { $sum: '$cost' },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' },
                },
              },
            ],
          },
          maintenance: 1,
          revenue: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    console.log('月度统计数据:', monthlyStats);

    const responseData = {
      overview: {
        totalVehicles,
        totalMaintenance,
        completedMaintenance,
        pendingMaintenance,
        todayAppointments,
        monthlyRevenue,
        activeTechnicians,
        alerts,
      },
      maintenanceByType,
      maintenanceByStatus: await Maintenance.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ]),
      recentMaintenance,
      monthlyStats,
    };

    console.log('返回的响应数据:', responseData);

    return successResponse(responseData);
  } catch (error: any) {
    console.error('获取仪表盘统计数据失败:', error);
    return errorResponse(error.message);
  }
} 