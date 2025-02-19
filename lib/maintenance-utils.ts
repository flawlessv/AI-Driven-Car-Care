import { MaintenanceRecord } from '../types/vehicle';
import Vehicle from '../models/vehicle';
import { ValidationError } from './api-types';
import MaintenanceRule from '@/models/maintenanceRule';
import MaintenanceReminder from '@/models/maintenanceReminder';
import { addDays } from 'date-fns';

// 验证保养记录数据
export function validateMaintenanceRecord(data: Partial<MaintenanceRecord>): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证必填字段
  if (!data.vehicle) {
    errors.push({ field: 'vehicle', message: ['车辆是必需的'] });
  }

  if (!data.type) {
    errors.push({ field: 'type', message: ['保养类型是必需的'] });
  }

  if (!data.description) {
    errors.push({ field: 'description', message: ['保养描述是必需的'] });
  }

  if (typeof data.mileage !== 'number' || data.mileage < 0) {
    errors.push({ field: 'mileage', message: ['请输入有效的里程数'] });
  }

  if (typeof data.cost !== 'number' || data.cost < 0) {
    errors.push({ field: 'cost', message: ['请输入有效的费用'] });
  }

  if (!data.startDate) {
    errors.push({ field: 'startDate', message: ['开始日期是必需的'] });
  }

  if (!data.status) {
    errors.push({ field: 'status', message: ['状态是必需的'] });
  }

  // 验证配件信息
  if (data.parts?.length) {
    data.parts.forEach((part, index) => {
      if (!part.name) {
        errors.push({ field: `parts.${index}.name`, message: ['配件名称是必需的'] });
      }
      if (!part.code) {
        errors.push({ field: `parts.${index}.code`, message: ['配件编号是必需的'] });
      }
      if (typeof part.quantity !== 'number' || part.quantity < 1) {
        errors.push({ field: `parts.${index}.quantity`, message: ['请输入有效的数量'] });
      }
      if (typeof part.unitPrice !== 'number' || part.unitPrice < 0) {
        errors.push({ field: `parts.${index}.unitPrice`, message: ['请输入有效的单价'] });
      }
      if (typeof part.totalPrice !== 'number' || part.totalPrice < 0) {
        errors.push({ field: `parts.${index}.totalPrice`, message: ['请输入有效的总价'] });
      }
    });
  }

  return errors;
}

// 更新车辆状态
export async function updateVehicleStatus(
  vehicleId: string,
  data: {
    newStatus: MaintenanceRecord['status'];
    oldStatus?: MaintenanceRecord['status'];
    mileage?: number;
    startDate?: Date;
  }
): Promise<void> {
  const { newStatus, oldStatus, mileage, startDate } = data;

  // 如果状态没有变化，不需要更新
  if (oldStatus && newStatus === oldStatus) {
    return;
  }

  const updateData: any = {};

  // 根据不同状态更新车辆信息
  switch (newStatus) {
    case 'completed':
      updateData.status = 'active';
      if (mileage) {
        updateData.mileage = mileage;
      }
      updateData.lastMaintenance = new Date();
      // 设置下次保养时间，例如3个月后
      updateData.nextMaintenance = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      break;

    case 'in_progress':
      updateData.status = 'maintenance';
      break;

    case 'cancelled':
      updateData.status = 'active';
      break;

    case 'pending':
      if (startDate) {
        updateData.nextMaintenance = new Date(startDate);
      }
      break;
  }

  // 如果有需要更新的数据，则更新车辆信息
  if (Object.keys(updateData).length > 0) {
    await Vehicle.findByIdAndUpdate(vehicleId, updateData);
  }
}

// 检查车辆是否存在
export async function checkVehicleExists(vehicleId: string): Promise<boolean> {
  const vehicle = await Vehicle.findById(vehicleId);
  return !!vehicle;
}

// 计算保养记录的总成本
export function calculateMaintenanceCost(data: Partial<MaintenanceRecord>): number {
  let totalCost = data.cost || 0;

  // 计算配件总成本
  if (data.parts?.length) {
    const partsCost = data.parts.reduce((sum, part) => sum + part.totalPrice, 0);
    totalCost += partsCost;
  }

  return totalCost;
}

// 生成维修提醒
export async function generateMaintenanceReminders() {
  try {
    // 获取所有启用的维修规则
    const rules = await MaintenanceRule.find({ enabled: true })
      .populate('vehicle');

    for (const rule of rules) {
      const vehicle = rule.vehicle as any;
      if (!vehicle) continue;

      let shouldCreateReminder = false;
      let dueDate: Date | null = null;
      let dueMileage: number | null = null;
      let message = '';

      // 检查里程提醒
      if (rule.type === 'mileage' || rule.type === 'both') {
        if (rule.lastMileage && rule.mileageInterval) {
          const nextMileage = rule.lastMileage + rule.mileageInterval;
          if (vehicle.mileage >= nextMileage) {
            shouldCreateReminder = true;
            dueMileage = nextMileage;
            message = `车辆${vehicle.brand} ${vehicle.model}(${vehicle.licensePlate})已行驶${vehicle.mileage}公里,建议进行维护保养。`;
          }
        }
      }

      // 检查时间提醒
      if (rule.type === 'time' || rule.type === 'both') {
        if (rule.lastMaintenanceDate && rule.timeInterval) {
          const nextDate = addDays(new Date(rule.lastMaintenanceDate), rule.timeInterval);
          if (new Date() >= nextDate) {
            shouldCreateReminder = true;
            dueDate = nextDate;
            message = message || `车辆${vehicle.brand} ${vehicle.model}(${vehicle.licensePlate})距离上次维护保养已超过${rule.timeInterval}天,建议进行维护保养。`;
          }
        }
      }

      // 创建提醒
      if (shouldCreateReminder) {
        // 检查是否已存在未处理的提醒
        const existingReminder = await MaintenanceReminder.findOne({
          rule: rule._id,
          status: 'pending',
        });

        if (!existingReminder) {
          const reminder = new MaintenanceReminder({
            vehicle: vehicle._id,
            rule: rule._id,
            type: rule.type,
            dueDate: dueDate || new Date(),
            dueMileage,
            message,
          });

          await reminder.save();
        }
      }
    }
  } catch (error) {
    console.error('生成维修提醒失败:', error);
    throw error;
  }
}

// 更新维修规则的最后维修信息
export async function updateMaintenanceRuleLastInfo(
  vehicleId: string,
  mileage: number,
  date: Date
) {
  try {
    const rule = await MaintenanceRule.findOne({ vehicle: vehicleId });
    if (rule) {
      rule.lastMileage = mileage;
      rule.lastMaintenanceDate = date;
      await rule.save();
    }
  } catch (error) {
    console.error('更新维修规则信息失败:', error);
    throw error;
  }
} 