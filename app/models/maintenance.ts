import mongoose, { Model } from 'mongoose';

// 定义状态历史记录的 Schema
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    required: true
  },
  note: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// 定义配件的 Schema
const maintenancePartSchema = new mongoose.Schema({
  part: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

// 主维修记录 Schema
const maintenanceSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['regular', 'repair', 'inspection']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  completionDate: Date,
  mileage: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  parts: [maintenancePartSchema],
  customer: {
    name: {
      type: String,
      required: true
    },
    contact: {
      type: String,
      required: true
    }
  },
  notes: String,
  statusHistory: [statusHistorySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// 更新时自动更新 updatedAt 字段
maintenanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 使用函数来获取模型，确保只创建一次
export function getMaintenanceModel(): Model<any> {
  try {
    return mongoose.model('Maintenance');
  } catch {
    return mongoose.model('Maintenance', maintenanceSchema);
  }
}

// 导出模型实例
const Maintenance = getMaintenanceModel();
export default Maintenance; 