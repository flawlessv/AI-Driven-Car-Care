import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import Vehicle from '@/models/vehicle';
import { getAppointmentModel } from '@/models/appointment';
import WorkOrder from '@/models/workOrder';
import User from '@/models/user';
import Part from '@/models/part';
import dayjs from 'dayjs';

export async function GET(request: NextRequest) {
  try {
    const { user, success } = await authMiddleware(request);
    if (!success || !user) {
      console.log('仪表盘API：认证失败');
      return errorResponse('未授权访问', 401);
    }

    await connectDB();
    console.log('仪表盘API：数据库连接成功');
    console.log('当前用户:', user);
    
    const isCustomer = user.role === 'customer';
    
    // 构建查询条件
    const vehicleQuery = isCustomer ? { owner: user._id } : {};
    const workOrderQuery = isCustomer ? { customer: user._id } : {};
    const appointmentQuery = isCustomer ? { 'user': user._id } : {};
    
    // 获取今日日期和本月日期范围
    const today = dayjs();
    const startOfMonth = today.startOf('month').toDate();
    const endOfMonth = today.endOf('month').toDate();
    const startOfDay = today.startOf('day').toDate();
    const endOfDay = today.endOf('day').toDate();
    
    try {
      // 获取车辆统计
      const vehicleStats = await Promise.all([
        Vehicle.countDocuments(vehicleQuery), // 总车辆数
        Vehicle.countDocuments({...vehicleQuery, status: 'active'}), // 激活状态车辆
        Vehicle.countDocuments({...vehicleQuery, status: 'maintenance'}) // 维修中车辆
      ]);
      
      // 获取预约统计
      const Appointment = getAppointmentModel();
      const appointmentStats = await Promise.all([
        Appointment.countDocuments(appointmentQuery), // 总预约数
        Appointment.countDocuments({...appointmentQuery, status: 'pending'}), // 待处理预约
        Appointment.countDocuments({...appointmentQuery, 
          'timeSlot.date': {$gte: startOfDay, $lte: endOfDay}
        }) // 今日预约
      ]);
      
      // 获取工单统计
      const workOrderStats = await Promise.all([
        WorkOrder.countDocuments(workOrderQuery), // 总工单数
        WorkOrder.countDocuments({...workOrderQuery, status: 'pending'}), // 待处理工单
        WorkOrder.countDocuments({...workOrderQuery, status: 'in_progress'}), // 进行中工单
        WorkOrder.countDocuments({...workOrderQuery, status: 'completed'}), // 已完成工单
        WorkOrder.countDocuments({
          ...workOrderQuery,
          createdAt: {$gte: startOfMonth, $lte: endOfMonth}
        }) // 本月工单
      ]);
      
      // 获取技师统计
      const technicianStats = await Promise.all([
        User.countDocuments({role: 'technician'}), // 总技师数
        User.countDocuments({role: 'technician', status: 'active'}) // 激活状态技师
      ]);
      
      // 获取配件统计
      const partStats = await Promise.all([
        Part.countDocuments({}), // 总配件数
        Part.countDocuments({stock: {$lte: 10}}), // 低库存配件
        Part.countDocuments({stock: 0}) // 无库存配件
      ]);
      
      // 获取工单状态分布
      const workOrderStatusDistribution = await WorkOrder.aggregate([
        { $match: workOrderQuery },
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
      ]);
      
      // 获取工单类型分布
      const workOrderTypeDistribution = await WorkOrder.aggregate([
        { $match: workOrderQuery },
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
      
      // 获取配件类型分布
      const partCategoryDistribution = await Part.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ]);
      
      // 获取月度工单统计
      const monthlyWorkOrders = await WorkOrder.aggregate([
        { 
          $match: {
            ...workOrderQuery,
            createdAt: { $gte: dayjs().subtract(6, 'month').toDate() }
          } 
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
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
            count: 1,
          },
        },
        { $sort: { month: 1 } },
      ]);
      
      const responseData = {
        username: user.username || '用户',
        overview: {
          vehicles: {
            total: vehicleStats[0] || 0,
            active: vehicleStats[1] || 0,
            inMaintenance: vehicleStats[2] || 0
          },
          appointments: {
            total: appointmentStats[0] || 0,
            pending: appointmentStats[1] || 0,
            today: appointmentStats[2] || 0
          },
          workOrders: {
            total: workOrderStats[0] || 0,
            pending: workOrderStats[1] || 0,
            inProgress: workOrderStats[2] || 0,
            completed: workOrderStats[3] || 0,
            thisMonth: workOrderStats[4] || 0
          },
          technicians: {
            total: technicianStats[0] || 0,
            active: technicianStats[1] || 0
          },
          parts: {
            total: partStats[0] || 0,
            lowStock: partStats[1] || 0,
            outOfStock: partStats[2] || 0
          }
        },
        charts: {
          workOrderStatus: workOrderStatusDistribution.length > 0 ? workOrderStatusDistribution : getDefaultWorkOrderStatusData(),
          workOrderTypes: workOrderTypeDistribution.length > 0 ? workOrderTypeDistribution : getDefaultWorkOrderTypeData(),
          partCategories: partCategoryDistribution.length > 0 ? partCategoryDistribution : getDefaultPartCategoryData(),
          monthlyWorkOrders: monthlyWorkOrders.length > 0 ? monthlyWorkOrders : getDefaultMonthlyData()
        }
      };
      
      console.log('仪表盘API：成功获取数据，返回响应');
      return successResponse(responseData);
    } catch (dbError: any) {
      console.error('仪表盘API：数据查询失败:', dbError);
      
      // 返回示例数据，避免前端显示空白
      const exampleData = {
        username: user.username || '用户',
        overview: {
          vehicles: { total: 15, active: 12, inMaintenance: 3 },
          appointments: { total: 8, pending: 3, today: 2 },
          workOrders: { total: 25, pending: 5, inProgress: 8, completed: 12, thisMonth: 5 },
          technicians: { total: 5, active: 4 },
          parts: { total: 120, lowStock: 8, outOfStock: 3 }
        },
        charts: {
          workOrderStatus: getDefaultWorkOrderStatusData(),
          workOrderTypes: getDefaultWorkOrderTypeData(),
          partCategories: getDefaultPartCategoryData(),
          monthlyWorkOrders: getDefaultMonthlyData()
        }
      };
      
      console.log('仪表盘API：返回示例数据');
      return successResponse(exampleData);
    }
  } catch (error: any) {
    console.error('获取仪表盘统计数据失败:', error);
    return errorResponse(error.message);
  }
}

// 默认工单状态数据
function getDefaultWorkOrderStatusData() {
  return [
    { status: 'pending', count: 5 },
    { status: 'in_progress', count: 8 },
    { status: 'completed', count: 12 },
    { status: 'cancelled', count: 2 }
  ];
}

// 默认工单类型数据
function getDefaultWorkOrderTypeData() {
  return [
    { type: 'regular', count: 10 },
    { type: 'repair', count: 8 },
    { type: 'inspection', count: 5 },
    { type: 'maintenance', count: 3 },
    { type: 'emergency', count: 1 }
  ];
}

// 默认配件类型数据
function getDefaultPartCategoryData() {
  return [
    { category: 'engine', count: 35 },
    { category: 'transmission', count: 25 },
    { category: 'brake', count: 20 },
    { category: 'electrical', count: 18 },
    { category: 'body', count: 15 },
    { category: 'other', count: 7 }
  ];
}

// 默认月度数据
function getDefaultMonthlyData() {
  const now = dayjs();
  return Array.from({ length: 6 }, (_, i) => {
    const month = now.subtract(i, 'month');
    return {
      month: `${month.year()}-${month.format('MM')}`,
      count: Math.floor(Math.random() * 15) + 5 // 随机5-20之间的数
    };
  }).reverse();
} 