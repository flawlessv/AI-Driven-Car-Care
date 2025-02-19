import mongoose from 'mongoose';
import { WorkOrderStatus } from '@/types/workOrder';

const workOrderProgressSchema = new mongoose.Schema(
  {
    workOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'pending_check', 'completed', 'cancelled'],
      required: true,
    },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 索引
workOrderProgressSchema.index({ workOrder: 1, createdAt: -1 });
workOrderProgressSchema.index({ updatedBy: 1 });

export default mongoose.models.WorkOrderProgress || 
  mongoose.model('WorkOrderProgress', workOrderProgressSchema); 