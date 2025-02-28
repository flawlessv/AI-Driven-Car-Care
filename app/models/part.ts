import mongoose from 'mongoose';

const partSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['engine', 'transmission', 'brake', 'electrical', 'body', 'other'],
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  minStock: {
    type: Number,
    default: 5,
    min: 0,
  },
  unit: {
    type: String,
    default: '个',
  },
  manufacturer: String,
  location: String, // 库存位置
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 更新时自动更新 updatedAt 字段
partSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 添加库存不足的虚拟字段
partSchema.virtual('lowStock').get(function() {
  return this.stock <= this.minStock;
});

const Part = mongoose.models.Part || mongoose.model('Part', partSchema);

export default Part; 