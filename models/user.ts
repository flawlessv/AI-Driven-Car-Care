import mongoose from 'mongoose';
import { compare, hash } from 'bcryptjs';
import { User } from '../types/user';
import { DocumentWithMethods, ModelWithStaticMethods } from '../lib/mongoose-types';

// 用户文档接口
interface UserDocument extends DocumentWithMethods<User, {
  comparePassword(candidatePassword: string): Promise<boolean>;
}> {}

// 用户模型接口
interface UserModel extends ModelWithStaticMethods<UserDocument, {
  findByEmail(email: string): Promise<UserDocument | null>;
}> {}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    username: {
      type: String,
      required: [true, '请输入用户名'],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, '请输入邮箱'],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, '请输入密码'],
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'customer'],
      default: 'customer'
    }
  },
  {
    timestamps: true
  }
);

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 添加密码比对方法
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await compare(candidatePassword, this.password);
};

// 添加静态方法
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email }).select('+password');
};

// 防止重复编译模型
const User = mongoose.models.User || mongoose.model<UserDocument, UserModel>('User', userSchema);

export default User; 