import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请输入客户姓名'],
  },
  phone: {
    type: String,
    required: [true, '请输入联系电话'],
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^1[3-9]\d{9}$/.test(v);
      },
      message: '请输入有效的手机号码'
    }
  },
  email: String,
  address: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // 客户统计数据
  stats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpending: {
      type: Number,
      default: 0
    },
    lastVisit: Date
  }
});

// 更新时间中间件
customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer; 