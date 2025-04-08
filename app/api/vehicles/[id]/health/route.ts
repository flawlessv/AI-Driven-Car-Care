import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vehicle from '@/models/vehicle';
import { authMiddleware } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api-response';
import mongoose from 'mongoose';

interface HealthScore {
  totalScore: number;
  details: {
    ageScore: number;
    mileageScore: number;
    maintenanceScore: number;
    statusScore: number;
  };
  suggestions: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }
    
    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }
    
    const user = authResult.user;
    await connectDB();

    console.log('正在获取车辆ID:', params.id);

    // 获取车辆信息和维修记录
    const vehicle = await Vehicle.findById(params.id).lean();
    if (!vehicle) {
      return notFoundResponse('车辆不存在');
    }
    
    // 检查权限：客户只能查看自己的车辆
    if (user.role === 'customer' && vehicle.owner && vehicle.owner.toString() !== user._id.toString()) {
      console.log('权限拒绝：客户尝试查看非自己的车辆', {
        userId: user._id,
        vehicleOwner: vehicle.owner
      });
      return errorResponse('您没有权限查看该车辆', 403);
    }

    console.log('获取到的车辆信息:', vehicle);

    const maintenanceRecords = await mongoose.model('Maintenance').find({
      vehicle: vehicle._id,
    })
    .sort({ startDate: -1 })
    .lean();

    console.log('获取到的保养记录:', maintenanceRecords);

    // 计算健康评分
    const healthScore = calculateHealthScore(vehicle, maintenanceRecords);
    console.log('计算得到的健康评分:', healthScore);

    return successResponse({
      data: healthScore,
      message: '获取车辆健康评分成功',
    });
  } catch (error: any) {
    console.error('获取车辆健康评分错误:', error);
    return errorResponse(error.message || '获取车辆健康评分失败');
  }
}

function calculateHealthScore(vehicle: any, maintenanceRecords: any[]): HealthScore {
  const currentYear = new Date().getFullYear();
  const suggestions: string[] = [];

  // 1. 计算车龄得分（基础20分）
  const age = currentYear - vehicle.year;
  const ageScore = Math.max(20 - age * 2, 0); // 每年扣2分，最低0分
  console.log('车龄得分计算:', { currentYear, vehicleYear: vehicle.year, age, ageScore });
  
  if (age > 5) {
    suggestions.push('车龄较高，建议更频繁地进行检查和保养');
  }

  // 2. 计算里程得分（基础30分）
  const mileageScore = Math.max(30 - Math.floor(vehicle.mileage / 50000) * 5, 0);
  console.log('里程得分计算:', { mileage: vehicle.mileage, mileageScore });
  
  if (vehicle.mileage > 100000) {
    suggestions.push('行驶里程较高，建议注意关键部件的检查和更换');
  }

  // 3. 计算保养记录得分（基础30分）
  let maintenanceScore = 30;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // 检查最近6个月是否有保养记录
  const hasRecentMaintenance = maintenanceRecords.some(
    record => new Date(record.startDate) > sixMonthsAgo
  );

  // 检查是否有未完成的维修
  const hasUnfinishedRepair = maintenanceRecords.some(
    record => record.status !== 'completed'
  );

  if (!hasRecentMaintenance) {
    maintenanceScore -= 10;
    suggestions.push('已超过6个月未进行保养，建议尽快进行常规保养');
  }

  if (hasUnfinishedRepair) {
    maintenanceScore -= 5;
    suggestions.push('存在未完成的维修项目，建议及时处理');
  }

  console.log('保养得分计算:', { 
    maintenanceScore, 
    hasRecentMaintenance, 
    hasUnfinishedRepair,
    maintenanceRecordsCount: maintenanceRecords.length 
  });

  // 4. 计算状态得分（基础20分）
  let statusScore = 20;
  switch (vehicle.status) {
    case 'maintenance':
      statusScore = 10;
      suggestions.push('车辆正在维修中，建议完成维修后重新评估车况');
      break;
    case 'inactive':
      statusScore = 0;
      suggestions.push('车辆已停用，建议检查停用原因并进行必要维护');
      break;
  }

  console.log('状态得分计算:', { status: vehicle.status, statusScore });

  // 计算总分
  const totalScore = ageScore + mileageScore + maintenanceScore + statusScore;

  // 根据总分添加综合建议
  if (totalScore < 60) {
    suggestions.push('车辆整体状况需要注意，建议进行全面检查和必要的维修保养');
  } else if (totalScore < 80) {
    suggestions.push('车辆状况一般，建议按计划进行保养维护');
  }

  const result = {
    totalScore,
    details: {
      ageScore,
      mileageScore,
      maintenanceScore,
      statusScore,
    },
    suggestions,
  };

  console.log('最终计算结果:', result);
  return result;
} 