import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkOrderEvaluation extends Document {
  workOrder: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  technician: mongoose.Types.ObjectId;
  rating: number;
  feedback: string;
  createdAt: Date;
}

const workOrderEvaluationSchema = new Schema({
  workOrder: {
    type: Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technician: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建索引
workOrderEvaluationSchema.index({ workOrder: 1 }, { unique: true });
workOrderEvaluationSchema.index({ technician: 1, createdAt: -1 });

export const WorkOrderEvaluation = mongoose.models.WorkOrderEvaluation || 
  mongoose.model<IWorkOrderEvaluation>('WorkOrderEvaluation', workOrderEvaluationSchema); 