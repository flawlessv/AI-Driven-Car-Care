import mongoose, { Schema, Model } from 'mongoose';

// 定义保养规则的接口
export interface IMaintenanceRule {
  vehicle: mongoose.Types.ObjectId;
  type: 'mileage' | 'time' | 'both';
  mileageInterval?: number;
  timeInterval?: number;
  enabled: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 定义保养规则的 Schema
const maintenanceRuleSchema = new Schema<IMaintenanceRule>(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    type: {
      type: String,
      enum: ['mileage', 'time', 'both'],
      required: true,
    },
    mileageInterval: {
      type: Number,
      min: 0,
      validate: {
        validator: function(this: IMaintenanceRule, value: number) {
          return this.type !== 'time' ? value > 0 : true;
        },
        message: '里程间隔必须大于0',
      },
    },
    timeInterval: {
      type: Number,
      min: 0,
      validate: {
        validator: function(this: IMaintenanceRule, value: number) {
          return this.type !== 'mileage' ? value > 0 : true;
        },
        message: '时间间隔必须大于0',
      },
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 添加验证
maintenanceRuleSchema.pre('validate', function(next) {
  if (this.type === 'mileage' && !this.mileageInterval) {
    next(new Error('里程类型的规则必须设置里程间隔'));
  } else if (this.type === 'time' && !this.timeInterval) {
    next(new Error('时间类型的规则必须设置时间间隔'));
  } else if (this.type === 'both' && (!this.mileageInterval || !this.timeInterval)) {
    next(new Error('复合类型的规则必须同时设置里程和时间间隔'));
  } else {
    next();
  }
});

// 使用函数来获取模型，避免重复定义
export function getMaintenanceRuleModel(): Model<IMaintenanceRule> {
  return mongoose.models.MaintenanceRule || mongoose.model<IMaintenanceRule>('MaintenanceRule', maintenanceRuleSchema);
}

export default getMaintenanceRuleModel(); 