import mongoose, { Document, Model } from 'mongoose';
import { hash } from 'bcryptjs';
import { USER_ROLES, USER_STATUS } from '../constants';

// 用户接口
export interface IUser {
  username: string;
  password: string;
  email: string;
  phone?: string;
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
  phone: { type: String },
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

// 维护记录接口
export interface IMaintenance {
  vehicle: mongoose.Types.ObjectId;
  technician: mongoose.Types.ObjectId;
  type: 'regular' | 'repair' | 'inspection';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startDate: Date;
  createdAt: Date;
}

// 预约接口
export interface IAppointment {
  vehicle: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  date: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
}

// 维护记录文档接口
export interface MaintenanceDocument extends IMaintenance, Document {}

// 预约文档接口
export interface AppointmentDocument extends IAppointment, Document {}

// 维护记录 Schema
const maintenanceSchema = new mongoose.Schema<MaintenanceDocument>({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['regular', 'repair', 'inspection']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 预约 Schema
const appointmentSchema = new mongoose.Schema<AppointmentDocument>({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 修改导出函数的写法
export function getMaintenanceModel(): Model<MaintenanceDocument> {
  try {
    console.log('正在获取 Maintenance 模型...');
    const modelName = 'Maintenance';
    const model = mongoose.models[modelName] || mongoose.model<MaintenanceDocument>(modelName, maintenanceSchema);
    console.log('Maintenance 模型获取成功:', !!model);
    return model;
  } catch (error) {
    console.error('获取 Maintenance 模型失败:', error);
    throw error;
  }
}

export function getAppointmentModel(): Model<AppointmentDocument> {
  try {
    console.log('正在获取 Appointment 模型...');
    const modelName = 'Appointment';
    const model = mongoose.models[modelName] || mongoose.model<AppointmentDocument>(modelName, appointmentSchema);
    console.log('Appointment 模型获取成功:', !!model);
    return model;
  } catch (error) {
    console.error('获取 Appointment 模型失败:', error);
    throw error;
  }
}

export function getUserModel(): UserModel {
  try {
    console.log('正在获取 User 模型...');
    const modelName = 'User';
    const model = (mongoose.models[modelName] || mongoose.model<UserDocument, UserModel>(modelName, userSchema)) as UserModel;
    console.log('User 模型获取成功:', !!model);
    return model;
  } catch (error) {
    console.error('获取 User 模型失败:', error);
    throw error;
  }
} 