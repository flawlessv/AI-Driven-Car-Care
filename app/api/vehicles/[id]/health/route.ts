import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import Vehicle from '@/app/models/vehicle';
import Maintenance from '@/app/models/maintenance';
import { authMiddleware } from '@/app/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/app/lib/api-response';
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

// 定义类型，确保TypeScript能识别Vehicle对象结构
interface VehicleDocument {
  _id: mongoose.Types.ObjectId;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  owner?: mongoose.Types.ObjectId;
  ownerName: string;
  ownerPhone: string;
  mileage: number;
  status: string;
}

// 定义用户类型
interface UserDocument {
  _id: mongoose.Types.ObjectId;
  role: string;
  username: string;
  name?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('请求车辆健康评分. 车辆ID:', params.id);
    
    const authResult = await authMiddleware(request);
    console.log('认证结果:', JSON.stringify({
      success: authResult.success,
      hasUser: !!authResult.user
    }));
    
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }
    
    // 确保用户存在
    if (!authResult.user) {
      return errorResponse('无法获取用户信息', 401);
    }
    
    const user = authResult.user as UserDocument;
    await connectDB();

    console.log('正在获取车辆ID:', params.id);

    // 获取车辆信息和维修记录 - 使用双重类型转换解决类型问题
    const vehicleData = await Vehicle.findById(params.id).lean();
    if (!vehicleData) {
      console.log('未找到车辆:', params.id);
      return notFoundResponse('车辆不存在');
    }
    
    // 使用双重强制类型转换确保TypeScript正确识别类型
    const vehicle = vehicleData as unknown as VehicleDocument;
    
    // 检查权限：客户只能查看自己的车辆
    if (user.role === 'customer' && vehicle.owner && vehicle.owner.toString() !== user._id.toString()) {
      console.log('权限拒绝：客户尝试查看非自己的车辆', {
        userId: user._id,
        vehicleOwner: vehicle.owner
      });
      return errorResponse('您没有权限查看该车辆', 403);
    }

    console.log('获取到的车辆信息:', JSON.stringify({
      _id: vehicle._id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      status: vehicle.status
    }));

    try {
      const query = { vehicle: vehicle._id };
      console.log('维护记录查询条件:', JSON.stringify(query));
      
      const maintenanceRecords = await Maintenance.find(query)
      .sort({ startDate: -1 })
      .lean();

      console.log(`获取到${maintenanceRecords.length}条维护记录`);
      
      // 记录第一条维护记录的样本，帮助调试
      if (maintenanceRecords.length > 0) {
        console.log('维护记录示例:', JSON.stringify(maintenanceRecords[0]));
      }

      // 计算健康评分
      const healthScore = calculateHealthScore(vehicle, maintenanceRecords);
      console.log('计算得到的健康评分:', healthScore);

      return successResponse({
        data: healthScore,
        message: '获取车辆健康评分成功',
      });
    } catch (error) {
      console.error('获取维护记录或计算健康评分时发生错误:', error);
      return errorResponse('计算健康评分时发生错误', 500);
    }
  } catch (error: any) {
    console.error('获取车辆健康评分错误:', error);
    return errorResponse(error.message || '获取车辆健康评分失败');
  }
}

function calculateHealthScore(vehicle: any, maintenanceRecords: any[]): HealthScore {
  try {
    // 确保vehicle对象有必要的字段，使用默认值避免null/undefined错误
    const safeVehicle = {
      year: vehicle?.year || new Date().getFullYear(),
      mileage: vehicle?.mileage || 0,
      status: vehicle?.status || 'active'
    };
    
    // 确保maintenanceRecords是数组
    const safeRecords = Array.isArray(maintenanceRecords) ? maintenanceRecords : [];
    
    console.log('健康评分计算 - 安全数据:', {
      vehicleYear: safeVehicle.year,
      mileage: safeVehicle.mileage,
      status: safeVehicle.status,
      recordsCount: safeRecords.length
    });
    
    const currentYear = new Date().getFullYear();
    const suggestions: string[] = [];

    // 1. 计算车龄得分（基础20分）
    const age = currentYear - safeVehicle.year;
    const ageScore = Math.max(20 - age * 2, 0); // 每年扣2分，最低0分
    console.log('车龄得分计算:', { currentYear, vehicleYear: safeVehicle.year, age, ageScore });
    
    if (age > 5) {
      suggestions.push('车龄较高，建议更频繁地进行检查和保养');
    }

    // 2. 计算里程得分（基础30分）
    const mileageScore = Math.max(30 - Math.floor(safeVehicle.mileage / 50000) * 5, 0);
    console.log('里程得分计算:', { mileage: safeVehicle.mileage, mileageScore });
    
    if (safeVehicle.mileage > 100000) {
      suggestions.push('行驶里程较高，建议注意关键部件的检查和更换');
    }

    // 3. 计算保养记录得分（基础30分）
    let maintenanceScore = 30;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 检查最近6个月是否有保养记录 - 增强的错误处理
    const hasRecentMaintenance = safeRecords.some(record => {
      try {
        // 尝试多种可能的日期字段名称
        const recordDate = record.startDate || record.date || record.createdAt;
        if (!recordDate) {
          console.log('记录缺少日期字段:', record._id);
          return false;
        }
        const dateObj = new Date(recordDate);
        return dateObj > sixMonthsAgo;
      } catch (error) {
        console.error('处理维护记录日期时发生错误:', error);
        return false;
      }
    });

    // 检查是否有未完成的维修 - 增强的错误处理
    const hasUnfinishedRepair = safeRecords.some(record => {
      try {
        return record.status && record.status !== 'completed';
      } catch (error) {
        console.error('检查维护记录状态时发生错误:', error);
        return false;
      }
    });

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
      maintenanceRecordsCount: safeRecords.length 
    });

    // 4. 计算状态得分（基础20分）
    let statusScore = 20;
    switch (safeVehicle.status) {
      case 'maintenance':
        statusScore = 10;
        suggestions.push('车辆正在维修中，建议完成维修后重新评估车况');
        break;
      case 'inactive':
        statusScore = 0;
        suggestions.push('车辆已停用，建议检查停用原因并进行必要维护');
        break;
    }

    console.log('状态得分计算:', { status: safeVehicle.status, statusScore });

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
  } catch (error) {
    console.error('健康评分计算过程中发生异常:', error);
    // 出错时返回默认健康评分
    return {
      totalScore: 50,
      details: {
        ageScore: 10,
        mileageScore: 15,
        maintenanceScore: 15,
        statusScore: 10,
      },
      suggestions: ['无法正确计算健康评分，建议联系技术支持或手动评估车辆状况']
    };
  }
} 