import mongoose from 'mongoose';
import { WorkOrderStatus, WorkOrderPriority } from '@/types/workOrder';

const workOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    maintenanceRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRecord',
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    diagnosis: String,
    solution: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'pending_check', 'completed', 'cancelled'],
      default: 'pending',
    },
    estimatedHours: {
      type: Number,
      min: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
    },
    startDate: Date,
    completionDate: Date,
    customerNotes: String,
    technicianNotes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 创建工单编号的自动生成函数
workOrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.models.WorkOrder.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      },
    });
    this.orderNumber = `WO${year}${month}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// 索引
workOrderSchema.index({ orderNumber: 1 });
workOrderSchema.index({ vehicle: 1 });
workOrderSchema.index({ customer: 1 });
workOrderSchema.index({ technician: 1 });
workOrderSchema.index({ status: 1 });
workOrderSchema.index({ createdAt: -1 });

export default mongoose.models.WorkOrder || 
  mongoose.model('WorkOrder', workOrderSchema); 