import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // 确保引用的是User模型
    required: true,
  },
  targetType: {
    type: String,
    enum: ['technician', 'shop'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  maintenanceRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRecord',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  content: {
    type: String,
    required: true,
  },
  images: [{
    type: String,
  }],
  tags: [{
    type: String,
  }],
  likes: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['published', 'hidden', 'deleted'],
    default: 'published',
  },
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
  }
}, {
  timestamps: true
});

export default mongoose.models.Review || mongoose.model('Review', reviewSchema); 