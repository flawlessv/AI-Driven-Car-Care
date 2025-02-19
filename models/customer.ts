import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['individual', 'corporate', 'vip'],
    default: 'individual',
  },
  address: {
    type: String,
  },
  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  notes: {
    type: String,
  },
  lastVisit: {
    type: Date,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  visitCount: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

// 更新客户统计数据的方法
customerSchema.methods.updateStats = async function(amount: number) {
  this.totalSpent += amount;
  this.visitCount += 1;
  this.lastVisit = new Date();
  await this.save();
};

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema); 