import mongoose from 'mongoose';
import type { Vehicle } from '@/types/vehicle';

const vehicleSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: [true, '请输入车辆品牌']
  },
  model: {
    type: String,
    required: [true, '请输入车型']
  },
  licensePlate: {
    type: String,
    required: [true, '请输入车牌号'],
    unique: true
  },
  ownerName: String,
  ownerContact: String,
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  vin: {
    type: String,
    default: () => 'TEMP' + Date.now()
  },
  mileage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'scrapped'],
    default: 'active'
  }
}, {
  timestamps: true
});

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

// 更新时间中间件
vehicleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 删除旧的mongoose.model实例
if (mongoose.models.Vehicle) {
  delete mongoose.models.Vehicle;
}

// 重新创建模型
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle; 