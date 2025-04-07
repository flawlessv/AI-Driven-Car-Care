import mongoose from 'mongoose';
import type { Part } from '@/app/dashboard/parts/types';

const partSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '配件名称是必需的'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, '配件编号是必需的'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, '类别是必需的'],
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, '制造商是必需的'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, '单价是必需的'],
      min: [0, '单价不能小于0'],
    },
    stock: {
      type: Number,
      required: [true, '库存数量是必需的'],
      min: [0, '库存数量不能小于0'],
    },
    minStock: {
      type: Number,
      required: [true, '最低库存是必需的'],
      min: [0, '最低库存不能小于0'],
    },
    unit: {
      type: String,
      required: false,
      default: '个',
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 添加索引
partSchema.index({ code: 1 }, { unique: true });
partSchema.index({ name: 1 });
partSchema.index({ category: 1 });
partSchema.index({ manufacturer: 1 });
partSchema.index({ stock: 1 });

const Part = mongoose.models.Part || mongoose.model<Part>('Part', partSchema);

export default Part; 