import mongoose, { Document, Model } from 'mongoose';
import { hash } from 'bcryptjs';
import { USER_ROLES, USER_STATUS } from '../constants';

// 用户接口
export interface IUser {
  username: string;
  password: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  specialties?: string[];
  workExperience?: number;
  certifications?: string[];
  notes?: string;
  totalOrders?: number;
  completedOrders?: number;
  rating?: number;
}

// 用户文档接口
export interface UserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 用户模型接口
export interface UserModel extends Model<UserDocument> {
  findByUsername(username: string): Promise<UserDocument | null>;
}

// 用户模式
const userSchema = new mongoose.Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, required: true, enum: Object.values(USER_ROLES) },
  status: { type: String, required: true, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE },
  specialties: [String],
  workExperience: Number,
  certifications: [String],
  notes: String,
  totalOrders: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 10);
  }
  next();
});

// 静态方法
userSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username });
};

// 获取用户模型
export function getUserModel(): UserModel {
  const modelName = 'User';
  return (mongoose.models[modelName] || mongoose.model<UserDocument, UserModel>(modelName, userSchema)) as UserModel;
} 