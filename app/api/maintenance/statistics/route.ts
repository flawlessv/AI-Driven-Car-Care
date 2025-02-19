import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import Maintenance from '@/models/maintenance';
import Vehicle from '@/models/vehicle';
import {
  successResponse,
  errorResponse,
} from '@/lib/api-response';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const user = await authMiddleware(req);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'month'; // day, week, month, year
    const type = searchParams.get('type');
    const vehicle = searchParams.get('vehicle');

    // 构建查询条件
    const query: any = {
      status: 'completed', // 只统计已完成的维修记录
    };

    if (user.role === 'customer') {
      // 普通用户只能查看自己的车辆的维修记录
      const vehicles = await Vehicle.find({ owner: user._id }).select('_id');
      query.vehicle = { $in: vehicles.map(v => v._id) };
    }

    if (startDate) {
      query.completionDate = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.completionDate = { ...query.completionDate, $lte: new Date(endDate) };
    }
    if (type) {
      query.type = type;
    }
    if (vehicle) {
      query.vehicle = vehicle;
    }

    // 按时间分组的聚合管道
    const timeGroupStage = {
      day: {
        $dateToString: { format: '%Y-%m-%d', date: '$completionDate' }
      },
      week: {
        $dateToString: { format: '%Y-W%V', date: '$completionDate' }
      },
      month: {
        $dateToString: { format: '%Y-%m', date: '$completionDate' }
      },
      year: {
        $dateToString: { format: '%Y', date: '$completionDate' }
      }
    };

    // 基础统计
    const [basicStats, typeStats, vehicleStats, timeStats] = await Promise.all([
      // 基础统计
      Maintenance.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            avgCost: { $avg: '$cost' },
            totalPartsCount: { $sum: { $size: '$parts' } },
            totalPartsCost: {
              $sum: {
                $reduce: {
                  input: '$parts',
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.totalPrice'] }
                }
              }
            }
          }
        }
      ]),

      // 按维修类型统计
      Maintenance.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            avgCost: { $avg: '$cost' }
          }
        }
      ]),

      // 按车辆统计
      Maintenance.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$vehicle',
            count: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            avgCost: { $avg: '$cost' }
          }
        },
        {
          $lookup: {
            from: 'vehicles',
            localField: '_id',
            foreignField: '_id',
            as: 'vehicle'
          }
        },
        {
          $unwind: '$vehicle'
        },
        {
          $project: {
            count: 1,
            totalCost: 1,
            avgCost: 1,
            'vehicle.brand': 1,
            'vehicle.model': 1,
            'vehicle.licensePlate': 1
          }
        }
      ]),

      // 按时间统计
      Maintenance.aggregate([
        { $match: query },
        {
          $group: {
            _id: timeGroupStage[groupBy as keyof typeof timeGroupStage],
            count: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            partsCost: {
              $sum: {
                $reduce: {
                  input: '$parts',
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.totalPrice'] }
                }
              }
            }
          }
        },
        {
          $addFields: {
            laborCost: { $subtract: ['$totalCost', '$partsCost'] }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // 处理统计结果
    const stats = {
      basic: basicStats[0] || {
        totalCount: 0,
        totalCost: 0,
        avgCost: 0,
        totalPartsCount: 0,
        totalPartsCost: 0,
      },
      byType: typeStats,
      byVehicle: vehicleStats,
      byTime: timeStats,
      summary: {
        laborCostRatio: basicStats[0]
          ? (basicStats[0].totalCost - basicStats[0].totalPartsCost) / basicStats[0].totalCost
          : 0,
        partsCostRatio: basicStats[0]
          ? basicStats[0].totalPartsCost / basicStats[0].totalCost
          : 0,
        avgPartsPerMaintenance: basicStats[0]
          ? basicStats[0].totalPartsCount / basicStats[0].totalCount
          : 0,
      }
    };

    return successResponse(stats);
  } catch (error: any) {
    console.error('获取维修统计失败:', error);
    return errorResponse(error.message);
  }
} 