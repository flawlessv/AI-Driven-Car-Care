import mongoose from 'mongoose';
import { hash } from 'bcryptjs';
import { USER_ROLES } from '@/types/user';

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

// 权限定义的Schema
const menuPermissionSchema = new mongoose.Schema({
  menuKey: {
    type: String,
    required: true
  },
  permission: {
    type: String,
    enum: ['read', 'write', 'manage', 'none'],
    default: 'none'
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    // 用作登录名和显示名称
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.CUSTOMER,
  },
  // 新增权限字段
  permissions: {
    type: [menuPermissionSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  // 技师特有字段
  specialties: {
    type: [String],
    default: [],
  },
  workExperience: {
    type: Number,
    default: 0,
  },
  certifications: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  completedOrders: {
    type: Number,
    default: 0,
  },
  notes: String,
}, {
  timestamps: true,
});

// 创建用户前加密密码
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 10);
  }
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 