import mongoose from 'mongoose';
import type { MaintenanceRecord } from '@/app/dashboard/maintenance/types';
import { DocumentWithMethods, ModelWithStaticMethods } from '../lib/mongoose-types';


// 保养记录文档接口
interface MaintenanceDocument extends DocumentWithMethods<MaintenanceRecord, {
  updateStatus(newStatus: MaintenanceRecord['status'], note: string, userId: string): Promise<MaintenanceDocument>;
}> {}

// 保养记录模型接口
interface MaintenanceModel extends ModelWithStaticMethods<MaintenanceDocument, {
  findByVehicle(vehicleId: string): Promise<MaintenanceDocument[]>;
  findByTechnician(technicianId: string): Promise<MaintenanceDocument[]>;
}> {}

// 配件Schema
const maintenancePartSchema = new mongoose.Schema({
  part: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part',
    required: [true, '配件是必需的'],
  },
  quantity: {
    type: Number,
    required: [true, '数量是必需的'],
    min: [1, '数量必须大于0'],
  },
  unitPrice: {
    type: Number,
    required: [true, '单价是必需的'],
    min: [0, '单价不能小于0'],
  },
  totalPrice: {
    type: Number,
    required: [true, '总价是必需的'],
    min: [0, '总价不能小于0'],
  },
});

// 状态历史Schema
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    required: [true, '状态是必需的'],
  },
  note: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '操作人是必需的'],
  },
});

// 保养记录Schema
const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, '车辆是必需的'],
    },
    customer: {
      name: {
        type: String,
        required: [true, '客户姓名是必需的']
      },
      contact: {
        type: String,
        required: [true, '客户联系方式是必需的']
      }
    },
    type: {
      type: String,
      enum: ['regular', 'repair', 'inspection'],
      required: [true, '维修类型是必需的'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      required: [true, '状态是必需的'],
    },
    statusHistory: [statusHistorySchema],
    description: {
      type: String,
      required: [true, '描述是必需的'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, '开始日期是必需的'],
    },
    completionDate: {
      type: Date,
    },
    mileage: {
      type: Number,
      required: [true, '里程数是必需的'],
      min: [0, '里程数不能小于0'],
    },
    cost: {
      type: Number,
      required: [true, '费用是必需的'],
      min: [0, '费用不能小于0'],
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '技师是必需的'],
    },
    parts: [maintenancePartSchema],
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '创建者是必需的'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// 添加索引
maintenanceSchema.index({ vehicle: 1 });
maintenanceSchema.index({ type: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ startDate: 1 });
maintenanceSchema.index({ technician: 1 });
maintenanceSchema.index({ createdBy: 1 });

// 添加方法
maintenanceSchema.methods.updateStatus = async function (
  newStatus: MaintenanceRecord['status'],
  note: string,
  userId: string
) {
  const oldStatus = this.status;
  
  // 验证状态流转
  const transitions: { [key: string]: string[] } = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!transitions[oldStatus]?.includes(newStatus)) {
    throw new Error('无效的状态变更');
  }

  // 更新状态
  this.status = newStatus;
  if (newStatus === 'completed') {
    this.completionDate = new Date();
  }

  // 添加状态历史
  this.statusHistory.push({
    status: newStatus,
    note: note || '',
    timestamp: new Date(),
    updatedBy: new mongoose.Types.ObjectId(userId),
  });

  // 更新最后修改人
  this.updatedBy = new mongoose.Types.ObjectId(userId);

  return this.save();
};

// 添加静态方法
maintenanceSchema.statics.findByVehicle = function (vehicleId: string) {
  return this.find({ vehicle: vehicleId })
    .sort({ startDate: -1 });
};

maintenanceSchema.statics.findByTechnician = function (technicianId: string) {
  return this.find({ technician: technicianId })
    .sort({ startDate: -1 })
    .populate('vehicle', 'brand model licensePlate');
};

// 删除已存在的模型
if (mongoose.models.Maintenance) {
  delete mongoose.models.Maintenance;
}

const Maintenance = mongoose.model<MaintenanceDocument, MaintenanceModel>('Maintenance', maintenanceSchema);

export default Maintenance; 