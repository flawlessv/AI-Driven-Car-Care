import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authMiddleware } from '@/lib/auth';
import { getUserModel } from '@/lib/db/models';
import {
  successResponse,
  errorResponse,
} from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {user} = await authMiddleware(request);
    if (!user) {
      return errorResponse('未授权访问', 401);
    }

    // 只允许管理员和员工访问统计数据
    if (!['admin'].includes(user.role)) {
      return errorResponse('无权访问', 403);
    }

    await connectDB();
    const User = getUserModel();

    // 获取技师信息
    const technician = await User.findById(params.id);
    if (!technician) {
      return errorResponse('技师不存在', 404);
    }

    // 返回技师的统计数据
    const stats = {
      totalOrders: technician.totalOrders || 0,
      completedOrders: technician.completedOrders || 0,
      completionRate: technician.completedOrders && technician.totalOrders
        ? (technician.completedOrders / technician.totalOrders * 100)
        : 0,
      averageRating: technician.rating || 0,
    };

    return successResponse(stats);
  } catch (error: any) {
    console.error('获取技师统计数据失败:', error);
    return errorResponse(error.message);
  }
} 