import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  author: mongoose.Types.ObjectId;
  authorName: string;
  targetType: 'technician' | 'service' | 'store';
  targetId: mongoose.Types.ObjectId;
  content: string;
  rating: number;
  workOrder?: mongoose.Types.ObjectId;
  workOrderNumber?: string;
  maintenanceRecord?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'published' | 'rejected' | 'hidden';
  images?: string[];
  tags?: string[];
  replies?: {
    author: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
}

const reviewSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    default: ''
  },
  targetType: {
    type: String,
    enum: ['technician', 'service', 'store'],
    required: true
  },
  targetId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  workOrder: {
    type: Schema.Types.ObjectId,
    ref: 'WorkOrder'
  },
  workOrderNumber: {
    type: String
  },
  maintenanceRecord: {
    type: Schema.Types.ObjectId,
    ref: 'Maintenance'
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'rejected', 'hidden'],
    default: 'published'
  },
  images: {
    type: [String],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  replies: [{
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 创建索引
reviewSchema.index({ author: 1, createdAt: -1 });
reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ workOrder: 1 }, { sparse: true });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });

// 自动更新updatedAt
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Review = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);

export default Review; 