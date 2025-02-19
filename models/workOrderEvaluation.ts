import mongoose from 'mongoose';

const workOrderEvaluationSchema = new mongoose.Schema(
  {
    workOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
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

// 确保每个工单只有一个评价
workOrderEvaluationSchema.index({ workOrder: 1 }, { unique: true });
workOrderEvaluationSchema.index({ createdBy: 1 });

export default mongoose.models.WorkOrderEvaluation || 
  mongoose.model('WorkOrderEvaluation', workOrderEvaluationSchema); 