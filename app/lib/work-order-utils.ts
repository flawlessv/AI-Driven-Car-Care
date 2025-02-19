import { getUserModel } from '@/lib/db/models';

// 更新技师统计数据
export async function updateTechnicianStats(
  technicianId: string,
  changes: {
    totalOrders?: number;
    completedOrders?: number;
    rating?: number;
  }
): Promise<void> {
  try {
    const User = getUserModel();
    const updateData: any = {};

    if (typeof changes.totalOrders === 'number') {
      updateData.$inc = { ...updateData.$inc, totalOrders: changes.totalOrders };
    }
    
    if (typeof changes.completedOrders === 'number') {
      updateData.$inc = { ...updateData.$inc, completedOrders: changes.completedOrders };
    }

    if (typeof changes.rating === 'number') {
      // 获取当前技师信息以计算新的平均评分
      const technician = await User.findById(technicianId);
      if (technician) {
        const currentRating = technician.rating || 0;
        const currentRatedOrders = technician.completedOrders || 0;
        const newRating = (currentRating * currentRatedOrders + changes.rating) / (currentRatedOrders + 1);
        updateData.rating = newRating;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(technicianId, updateData);
    }
  } catch (error) {
    console.error('更新技师统计数据失败:', error);
    throw error;
  }
} 