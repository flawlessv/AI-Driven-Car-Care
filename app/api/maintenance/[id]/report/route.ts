import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import Maintenance from '@/app/models/maintenance';
import Vehicle from '@/app/models/vehicle';
import {
  successResponse,
  errorResponse,
} from '@/app/lib/api-response';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authMiddleware(req);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    await connectDB();

    const maintenanceId = params.id;
    if (!mongoose.Types.ObjectId.isValid(maintenanceId)) {
      return errorResponse('无效的维修记录ID', 400);
    }

    // 获取维修记录详情并填充关联数据
    const maintenance = await Maintenance.findById(maintenanceId)
      .populate('vehicle', 'brand model licensePlate vin year')
      .populate('parts.part', 'name code manufacturer')
      .populate('technician', 'name username')  // 添加技师信息填充
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username')
      .populate('statusHistory.updatedBy', 'name username')
      .lean();

    if (!maintenance) {
      return errorResponse('维修记录不存在', 404);
    }

    // 验证用户权限
    if (user.role === 'customer' && maintenance.vehicle.owner?.toString() !== user._id.toString()) {
      return errorResponse('无权查看此维修记录', 403);
    }

    // 处理可能缺失的数据,提供默认值
    const processUser = (user: any) => {
      if (!user) return { name: '未知用户' };
      return {
        ...user,
        name: user.name || user.username || '未知用户'
      };
    };

    // 生成报告数据
    const report = {
      reportId: `MR${maintenance._id.toString().slice(-6).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: user.name || user.username || '系统用户',
      maintenance: {
        id: maintenance._id,
        type: maintenance.type,
        status: maintenance.status,
        description: maintenance.description || '',
        startDate: maintenance.startDate,
        completionDate: maintenance.completionDate,
        mileage: maintenance.mileage,
        cost: maintenance.cost,
        technician: maintenance.technician 
          ? (maintenance.technician.name || maintenance.technician.username || '未分配')
          : '未分配',
        notes: maintenance.notes || '',
      },
      vehicle: maintenance.vehicle || {},
      parts: (maintenance.parts || []).map(part => ({
        ...part,
        part: {
          name: part.part?.name || '未知配件',
          code: part.part?.code || '',
          manufacturer: part.part?.manufacturer || ''
        }
      })),
      createdBy: processUser(maintenance.createdBy),
      updatedBy: processUser(maintenance.updatedBy),
      statusHistory: (maintenance.statusHistory || []).map(history => ({
        ...history,
        updatedBy: processUser(history.updatedBy)
      })),
      summary: {
        totalParts: maintenance.parts?.length || 0,
        totalPartsPrice: maintenance.parts?.reduce((sum, p) => sum + (p.price || 0), 0) || 0,
        laborCost: maintenance.laborCost || 0,
        totalCost: maintenance.cost || 0
      }
    };

    return successResponse({
      success: true,
      data: report
    });
    
  } catch (error: any) {
    console.error('获取维修报告失败:', error);
    return errorResponse(error.message || '获取维修报告失败');
  }
} 