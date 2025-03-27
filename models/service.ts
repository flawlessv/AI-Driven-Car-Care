import mongoose, { Schema, Model } from 'mongoose';

// 定义服务的接口
export interface IService {
  name: string;
  description?: string;
  category: '维修' | '保养' | '检查';
  duration: number;  // 预计时长（分钟）
  basePrice: number;  // 基础价格
  createdAt: Date;
  updatedAt: Date;
}

// 定义服务的 Schema
const serviceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, '服务名称为必填项'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, '服务类型为必填项'],
    },
    duration: {
      type: Number,
      required: [true, '预计时长为必填项'],
      min: [1, '预计时长必须大于0分钟'],
    },
    basePrice: {
      type: Number,
      required: [true, '基础价格为必填项'],
      min: [0, '基础价格不能为负数'],
    },
  },
  {
    timestamps: true,
  }
);

// 使用函数来获取模型，避免重复定义
export function getServiceModel(): Model<IService> {
  return mongoose.models.Service || mongoose.model<IService>('Service', serviceSchema);
}

export default getServiceModel(); 