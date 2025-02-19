import mongoose from 'mongoose';

const workOrderProgressSchema = new mongoose.Schema({
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true
  },
  status: {
    type: String,
    required: true
  },
  note: String,
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// 创建索引
workOrderProgressSchema.index({ workOrder: 1, timestamp: 1 });

const WorkOrderProgress = mongoose.models.WorkOrderProgress || 
  mongoose.model('WorkOrderProgress', workOrderProgressSchema);

export default WorkOrderProgress; 