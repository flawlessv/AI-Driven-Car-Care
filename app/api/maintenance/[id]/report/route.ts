import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authMiddleware } from '@/app/lib/auth';
import Maintenance from '@/app/models/maintenance';
import {
  successResponse,
  errorResponse,
} from '@/app/lib/api-response';
import mongoose from 'mongoose';

/**
 * 维修记录详细报告API - GET方法
 * 
 * 获取指定维修记录ID的详细报告，包括维修详情、车辆信息、使用的零部件、
 * 技术人员信息、状态历史记录以及成本统计。该API需要用户身份验证。
 * 
 * 路径参数:
 * - id: 维修记录ID(必填)
 * 
 * 返回:
 * - 维修记录的完整报告数据，包括:
 *   - reportId: 报告ID
 *   - generatedAt: 报告生成时间
 *   - generatedBy: 报告生成者
 *   - maintenance: 维修记录详细信息
 *   - vehicle: 车辆详情
 *   - parts: 使用的零部件列表
 *   - statusHistory: 状态变更历史
 *   - summary: 成本统计摘要
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 身份验证：检查用户是否已登录并获取用户信息
    const user = await authMiddleware(req);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    // 连接数据库
    await connectDB();

    // 提取并验证维修记录ID的有效性
    const maintenanceId = params.id;
    if (!mongoose.Types.ObjectId.isValid(maintenanceId)) {
      return errorResponse('无效的维修记录ID', 400);
    }

    // 查询维修记录并填充关联数据
    // 包括车辆信息、零部件信息、技师信息和用户信息
    const maintenance = await Maintenance.findById(maintenanceId)
      .populate('vehicle', 'brand model licensePlate vin year')  // 填充车辆信息
      .populate('parts.part', 'name code manufacturer')  // 填充零部件信息
      .populate('technician', 'name username')  // 填充技师信息
      .populate('createdBy', 'name username')  // 填充创建者信息
      .populate('updatedBy', 'name username')  // 填充更新者信息
      .populate('statusHistory.updatedBy', 'name username')  // 填充状态更新者信息
      .lean();  // 使用lean()获取纯JavaScript对象，提高性能

    // 如果找不到记录，返回404错误
    if (!maintenance) {
      return errorResponse('维修记录不存在', 404);
    }

    // 检查用户权限：如果是客户，只能查看自己的车辆维修记录
    if (user.role === 'customer' && maintenance.vehicle.owner?.toString() !== user._id.toString()) {
      return errorResponse('无权查看此维修记录', 403);
    }

    // 处理可能缺失的用户数据，提供默认值的辅助函数
    const processUser = (user: any) => {
      if (!user) return { name: '未知用户' };
      return {
        ...user,
        name: user.name || user.username || '未知用户'
      };
    };

    // 构建完整的报告数据
    const report = {
      // 生成报告ID：使用维修记录ID的后6位，并转为大写
      reportId: `MR${maintenance._id.toString().slice(-6).toUpperCase()}`,
      generatedAt: new Date().toISOString(),  // 报告生成时间
      generatedBy: user.name || user.username || '系统用户',  // 报告生成者
      
      // 维修记录核心信息
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
      
      // 车辆信息
      vehicle: maintenance.vehicle || {},
      
      // 零部件信息，处理可能缺失的数据
      parts: (maintenance.parts || []).map(part => ({
        ...part,
        part: {
          name: part.part?.name || '未知配件',
          code: part.part?.code || '',
          manufacturer: part.part?.manufacturer || ''
        }
      })),
      
      // 记录创建和更新信息
      createdBy: processUser(maintenance.createdBy),
      updatedBy: processUser(maintenance.updatedBy),
      
      // 状态变更历史
      statusHistory: (maintenance.statusHistory || []).map(history => ({
        ...history,
        updatedBy: processUser(history.updatedBy)
      })),
      
      // 成本统计摘要
      summary: {
        totalParts: maintenance.parts?.length || 0,  // 使用的零部件总数
        totalPartsPrice: maintenance.parts?.reduce((sum, p) => sum + (p.price || 0), 0) || 0,  // 零部件总成本
        laborCost: maintenance.laborCost || 0,  // 人工成本
        totalCost: maintenance.cost || 0  // 总成本
      }
    };

    // 返回成功响应，包含完整的报告数据
    return successResponse({
      success: true,
      data: report
    });
    
  } catch (error: any) {
    // 错误处理
    console.error('获取维修报告失败:', error);
    return errorResponse(error.message || '获取维修报告失败');
  }
} 