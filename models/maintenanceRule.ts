import mongoose from 'mongoose';

const maintenanceRuleSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    type: {
      type: String,
      enum: ['mileage', 'time', 'both'],
      required: true,
    },
    mileageInterval: {
      type: Number,
      min: 0,
      validate: {
        validator: function(v: number) {
          return this.type === 'both' || this.type === 'mileage' ? v > 0 : true;
        },
        message: '当类型为里程或两者时,里程间隔必须大于0',
      },
    },
    timeInterval: {
      type: Number,
      min: 0,
      validate: {
        validator: function(v: number) {
          return this.type === 'both' || this.type === 'time' ? v > 0 : true;
        },
        message: '当类型为时间或两者时,时间间隔必须大于0',
      },
    },
    lastMileage: {
      type: Number,
      min: 0,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// 确保每个车辆只有一个规则
maintenanceRuleSchema.index({ vehicle: 1 }, { unique: true });

export default mongoose.models.MaintenanceRule || 
  mongoose.model('MaintenanceRule', maintenanceRuleSchema); 