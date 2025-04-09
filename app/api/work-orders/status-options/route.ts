import { NextRequest } from 'next/server';
import { authMiddleware } from '@/app/lib/auth';
import { successResponse, errorResponse } from '@/app/lib/api-response';

// 状态显示文本
export const statusText = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  pending_check: '待审核',
  completed: '已完成',
  cancelled: '已取消'
};

// 工单状态颜色
export const statusColor = {
  pending: 'orange',
  assigned: 'blue',
  in_progress: 'processing',
  pending_check: 'purple',
  completed: 'green',
  cancelled: 'red',
};

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return errorResponse('未授权访问', 401);
    }

    // 根据用户角色返回不同的可用状态
    const userRole = authResult.user?.role || '';
    
    // 定义不同角色可用的状态
    const roleBasedStatusOptions = {
      admin: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
      technician: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
      customer: ['pending', 'cancelled']
    };
    
    // 获取当前用户角色可用的状态
    const availableStatuses = roleBasedStatusOptions[userRole as keyof typeof roleBasedStatusOptions] || [];
    
    // 构建状态选项数据
    const statusOptions = availableStatuses.map(status => ({
      value: status,
      label: statusText[status as keyof typeof statusText] || status,
      color: statusColor[status as keyof typeof statusColor] || 'default'
    }));

    return successResponse({
      message: '获取状态选项成功',
      statusOptions,
      userRole
    });
  } catch (error: any) {
    console.error('获取状态选项失败:', error);
    return errorResponse(error.message || '获取状态选项失败');
  }
} 