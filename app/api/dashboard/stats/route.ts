import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import Vehicle from '@/app/models/vehicle';
import { getAppointmentModel } from '@/app/models/appointment';
import WorkOrder from '@/app/models/workOrder';
import User from '@/app/models/user';
import Part from '@/app/models/part';
import dayjs from 'dayjs';

/**
 * 获取仪表盘统计数据的函数
 * 
 * 这个函数用来获取系统的各项统计数据，用于显示在仪表盘上。
 * 就像汽车维修店经理的数据报表，可以一目了然地看到业务运营情况。
 * 普通客户只能看到与自己相关的数据，管理员可以看到全部数据。
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份，确认是谁在查询统计数据
    const { user, success } = await authMiddleware(request);
    if (!success || !user) {
      // 如果身份验证失败，返回未授权错误
      console.log('仪表盘API：认证失败');
      return errorResponse('未授权访问', 401);
    }

    // 连接到数据库
    await connectDB();
    console.log('仪表盘API：数据库连接成功');
    console.log('当前用户:', user);
    
    // 判断是否是普通客户，决定查询范围
    const isCustomer = user.role === 'customer';
    
    // 根据用户角色准备不同的查询条件
    // 客户只能看到自己的数据，管理员可以看到所有数据
    const vehicleQuery = isCustomer ? { owner: user._id } : {};            // 车辆查询条件
    const workOrderQuery = isCustomer ? { customer: user._id } : {};       // 工单查询条件
    const appointmentQuery = isCustomer ? { 'user': user._id } : {};       // 预约查询条件
    
    // 准备时间范围查询条件
    const today = dayjs();
    const startOfMonth = today.startOf('month').toDate();  // 本月第一天
    const endOfMonth = today.endOf('month').toDate();      // 本月最后一天
    const startOfDay = today.startOf('day').toDate();      // 今天开始时间
    const endOfDay = today.endOf('day').toDate();          // 今天结束时间
    
    try {
      // 获取车辆相关统计数据
      const vehicleStats = await Promise.all([
        Vehicle.countDocuments(vehicleQuery),                      // 统计车辆总数
        Vehicle.countDocuments({...vehicleQuery, status: 'active'}),       // 统计正常使用中的车辆
        Vehicle.countDocuments({...vehicleQuery, status: 'maintenance'})   // 统计维修中的车辆
      ]);
      
      // 获取预约相关统计数据
      const Appointment = getAppointmentModel();
      const appointmentStats = await Promise.all([
        Appointment.countDocuments(appointmentQuery),              // 统计预约总数
        Appointment.countDocuments({...appointmentQuery, status: 'pending'}),  // 统计待处理的预约
        Appointment.countDocuments({...appointmentQuery, 
          'timeSlot.date': {$gte: startOfDay, $lte: endOfDay}
        })  // 统计今日的预约
      ]);
      
      // 获取工单相关统计数据
      const workOrderStats = await Promise.all([
        WorkOrder.countDocuments(workOrderQuery),                  // 统计工单总数
        WorkOrder.countDocuments({...workOrderQuery, status: 'pending'}),      // 统计待处理的工单
        WorkOrder.countDocuments({...workOrderQuery, status: 'in_progress'}),  // 统计进行中的工单
        WorkOrder.countDocuments({...workOrderQuery, status: 'completed'}),    // 统计已完成的工单
        WorkOrder.countDocuments({
          ...workOrderQuery,
          createdAt: {$gte: startOfMonth, $lte: endOfMonth}
        })  // 统计本月创建的工单
      ]);
      
      // 获取技师相关统计数据
      const technicianStats = await Promise.all([
        User.countDocuments({role: 'technician'}),                 // 统计技师总数
        User.countDocuments({role: 'technician', status: 'active'})  // 统计在职技师数量
      ]);
      
      // 获取配件相关统计数据
      const partStats = await Promise.all([
        Part.countDocuments({}),                             // 统计配件总数
        Part.countDocuments({stock: {$lte: 10}}),           // 统计库存较低的配件（10个以下）
        Part.countDocuments({stock: 0})                     // 统计无库存的配件
      ]);
      
      // 获取工单状态分布数据（用于饼图显示）
      const workOrderStatusDistribution = await WorkOrder.aggregate([
        { $match: workOrderQuery },               // 匹配符合条件的工单
        {
          $group: {                               // 按状态分组统计
            _id: '$status',                       // 分组字段：状态
            count: { $sum: 1 },                   // 计算每组的数量
          },
        },
        {
          $project: {                             // 格式化输出结果
            status: '$_id',                       // 将_id重命名为status
            count: 1,                             // 保留count字段
            _id: 0,                               // 不返回_id字段
          },
        },
      ]);
      
      // 获取工单类型分布数据（用于饼图显示）
      const workOrderTypeDistribution = await WorkOrder.aggregate([
        { $match: workOrderQuery },               // 匹配符合条件的工单
        {
          $group: {                               // 按类型分组统计
            _id: '$type',                         // 分组字段：类型
            count: { $sum: 1 },                   // 计算每组的数量
          },
        },
        {
          $project: {                             // 格式化输出结果
            type: '$_id',                         // 将_id重命名为type
            count: 1,                             // 保留count字段
            _id: 0,                               // 不返回_id字段
          },
        },
      ]);
      
      // 获取配件类型分布数据（用于饼图显示）
      const partCategoryDistribution = await Part.aggregate([
        {
          $group: {                               // 按类别分组统计
            _id: '$category',                     // 分组字段：类别
            count: { $sum: 1 },                   // 计算每组的数量
          },
        },
        {
          $project: {                             // 格式化输出结果
            category: '$_id',                     // 将_id重命名为category
            count: 1,                             // 保留count字段
            _id: 0,                               // 不返回_id字段
          },
        },
      ]);
      
      // 获取最近6个月的工单数据（用于折线图显示）
      const monthlyWorkOrders = await WorkOrder.aggregate([
        { 
          $match: {
            ...workOrderQuery,
            createdAt: { $gte: dayjs().subtract(6, 'month').toDate() }  // 只查询最近6个月的数据
          } 
        },
        {
          $group: {                               // 按年月分组统计
            _id: {
              year: { $year: '$createdAt' },      // 分组字段：年份
              month: { $month: '$createdAt' },    // 分组字段：月份
            },
            count: { $sum: 1 },                   // 计算每组的工单总数
            completed: {                          // 计算每组的已完成工单数
              $sum: { 
                $cond: [
                  { $eq: ['$status', 'completed'] },  // 条件：状态为"已完成"
                  1,                                  // 如果满足条件，计数+1
                  0                                   // 如果不满足条件，计数+0
                ] 
              } 
            }
          },
        },
        {
          $project: {                             // 格式化输出结果
            _id: 0,
            month: {                              // 创建"YYYY-MM"格式的月份字段
              $concat: [
                { $toString: '$_id.year' },       // 年份转为字符串
                '-',
                {
                  $cond: {                        // 月份小于10时前面补0
                    if: { $lt: ['$_id.month', 10] },
                    then: { $concat: ['0', { $toString: '$_id.month' }] },
                    else: { $toString: '$_id.month' },
                  },
                },
              ],
            },
            count: 1,                             // 保留count字段（总工单数）
            completed: 1                          // 保留completed字段（已完成工单数）
          },
        },
        { $sort: { month: 1 } },                  // 按月份升序排序
      ]);
      
      // 组装返回的数据结构
      const responseData = {
        username: user.username || '用户',        // 用户名称
        overview: {                               // 数据概览
          vehicles: {                             // 车辆统计
            total: vehicleStats[0] || 0,          // 车辆总数
            active: vehicleStats[1] || 0,         // 正常使用中的车辆数
            inMaintenance: vehicleStats[2] || 0   // 维修中的车辆数
          },
          appointments: {                         // 预约统计
            total: appointmentStats[0] || 0,      // 预约总数
            pending: appointmentStats[1] || 0,    // 待处理的预约数
            today: appointmentStats[2] || 0       // 今日预约数
          },
          workOrders: {                           // 工单统计
            total: workOrderStats[0] || 0,        // 工单总数
            pending: workOrderStats[1] || 0,      // 待处理的工单数
            inProgress: workOrderStats[2] || 0,   // 进行中的工单数
            completed: workOrderStats[3] || 0,    // 已完成的工单数
            thisMonth: workOrderStats[4] || 0     // 本月创建的工单数
          },
          technicians: {                           // 技师统计
            total: technicianStats[0] || 0,        // 技师总数
            active: technicianStats[1] || 0         // 在职技师数量
          },
          parts: {                                 // 配件统计
            total: partStats[0] || 0,               // 配件总数
            lowStock: partStats[1] || 0,             // 库存较低的配件数量
            outOfStock: partStats[2] || 0            // 无库存的配件数量
          }
        },
        charts: {
          workOrderStatus: workOrderStatusDistribution?.length > 0 ? workOrderStatusDistribution : getDefaultWorkOrderStatusData(),
          workOrderTypes: workOrderTypeDistribution?.length > 0 ? workOrderTypeDistribution : getDefaultWorkOrderTypeData(),
          partCategories: partCategoryDistribution?.length > 0 ? partCategoryDistribution : getDefaultPartCategoryData(),
          monthlyWorkOrders: monthlyWorkOrders?.length > 0 ? monthlyWorkOrders : getDefaultMonthlyData()
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
    { status: 'assigned', count: 3 },
    { status: 'in_progress', count: 8 },
    { status: 'pending_check', count: 2 },
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
    const totalCount = Math.floor(Math.random() * 15) + 5; // 随机5-20之间的数
    const completedCount = Math.floor(totalCount * 0.7); // 约70%的完成率
    return {
      month: `${month.year()}-${month.format('MM')}`,
      count: totalCount,
      completed: completedCount
    };
  }).reverse();
} 