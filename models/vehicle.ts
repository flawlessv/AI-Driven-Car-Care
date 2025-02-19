import mongoose from 'mongoose';
import type { Vehicle } from '@/types/vehicle';

const vehicleSchema = new mongoose.Schema<Vehicle>(
  {
    brand: {
      type: String,
      required: [true, '品牌是必需的'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, '型号是必需的'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, '年份是必需的'],
      min: [1900, '年份不能早于1900年'],
      max: [new Date().getFullYear() + 1, '年份不能超过明年'],
    },
    licensePlate: {
      type: String,
      required: [true, '车牌号是必需的'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/.test(v);
        },
        message: '请输入正确格式的车牌号',
      },
    },
    vin: {
      type: String,
      required: [true, '车架号是必需的'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[0-9A-Z]{17}$/.test(v);
        },
        message: '请输入正确格式的17位车架号',
      },
    },
    mileage: {
      type: Number,
      required: [true, '里程数是必需的'],
      min: [0, '里程数不能为负数'],
    },
    status: {
      type: String,
      required: [true, '状态是必需的'],
      enum: {
        values: ['active', 'maintenance', 'inactive'],
        message: '无效的车辆状态',
      },
      default: 'active',
    },
    ownerName: {
      type: String,
      required: [true, '车主姓名是必需的'],
      trim: true,
    },
    ownerContact: {
      type: String,
      required: [true, '联系方式是必需的'],
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^1[3-9]\d{9}$/.test(v);
        },
        message: '请输入正确格式的手机号码',
      },
    },
  },
  {
    timestamps: true,
  }
);

// 添加索引
vehicleSchema.index({ licensePlate: 1 }, { unique: true });
vehicleSchema.index({ vin: 1 }, { unique: true });
vehicleSchema.index({ status: 1 });

// 添加方法
vehicleSchema.methods.updateMileage = async function (newMileage: number) {
  if (newMileage < this.mileage) {
    throw new Error('新里程数不能小于当前里程数');
  }
  this.mileage = newMileage;
  await this.save();
  return this;
};

// 删除旧的mongoose.model实例
if (mongoose.models.Vehicle) {
  delete mongoose.models.Vehicle;
}

// 重新创建模型
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle; 