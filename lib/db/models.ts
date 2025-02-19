import mongoose, { Document, Model } from 'mongoose';
import { hash } from 'bcryptjs';

// 用户角色
export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer'
} as const;

// 用户状态
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

// 用户接口
export interface IUser {
  _id?: string;
  username: string;
  password: string;
  email: string;
  phone?: string;
  role: typeof USER_ROLES[keyof typeof USER_ROLES];
  status: typeof USER_STATUS[keyof typeof USER_STATUS];
  specialties?: string[];
  workExperience?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 用户文档接口
export interface UserDocument extends IUser, Document {
  _id: string;
}

// 用户模型接口
export interface UserModel extends Model<UserDocument> {
  findByUsername(username: string): Promise<UserDocument | null>;
}

// 用户Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    select: false
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'staff', 'technician', 'customer'],
      message: '无效的用户角色'
    },
    default: 'customer'
  },
  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.ACTIVE
  },
  specialties: [{
    type: String
  }],
  workExperience: {
    type: String
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await hash(this.password, 10);
    next();
  } catch (error: any) {
    next(error);
  }
});

// 静态方法：通过用户名查找用户
userSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username }).select('+password');
};

// 获取用户模型
export function getUserModel(): UserModel {
  // 如果模型已存在，先删除它
  if (mongoose.models.User) {
    delete mongoose.models.User;
  }
  
  // 重新编译并返回模型
  return mongoose.model<UserDocument, UserModel>('User', userSchema);
} 