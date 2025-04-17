/**
 * 用户数据模型文件
 * 
 * 这个文件定义了系统中"用户"的数据结构和相关操作
 * 类似于定义了"用户表"在数据库中的样子
 */

// 导入mongoose库，它是用来与MongoDB数据库通信的工具
import mongoose from 'mongoose';
// 导入加密函数，用于安全地存储用户密码
import { hash } from 'bcryptjs';
// 导入用户角色常量，这些是预定义的用户类型
import { USER_ROLES } from '@/types/user';

/**
 * 用户状态常量
 * 定义了用户可能的状态：
 * - ACTIVE: 活跃状态，用户可以正常使用系统
 * - INACTIVE: 非活跃状态，用户暂时不能使用系统
 */
export const USER_STATUS = {
  ACTIVE: 'active',   // 活跃状态
  INACTIVE: 'inactive', // 非活跃状态
} as const;

/**
 * 菜单权限模式定义
 * 这个模式定义了用户对系统各个菜单的权限
 */
const menuPermissionSchema = new mongoose.Schema({
  // 菜单键，用于标识特定菜单
  menuKey: {
    type: String,
    required: true  // 必填项
  },
  // 权限级别，可以是只读、写入、管理或无权限
  permission: {
    type: String,
    enum: ['read', 'write', 'manage', 'none'],  // 枚举值：限制只能是这些值中的一个
    default: 'none'  // 默认值：无权限
  }
}, { _id: false });  // 不为这个嵌套文档创建单独的ID

/**
 * 用户模式定义
 * 这个模式定义了用户在数据库中的所有字段和属性
 */
const userSchema = new mongoose.Schema({
  // 用户名，用作登录名和显示名称
  username: {
    type: String,  // 字符串类型
    required: true,  // 必填项
    unique: true,  // 唯一值，不能重复
  },
  // 电子邮箱，用于联系和找回密码
  email: {
    type: String,  // 字符串类型
    required: true,  // 必填项
    unique: true,  // 唯一值，不能重复
  },
  // 密码，存储时会被加密
  password: {
    type: String,  // 字符串类型
    required: true,  // 必填项
  },
  // 电话号码
  phone: {
    type: String,  // 字符串类型
    unique: true,  // 唯一值，不能重复
    sparse: true,  // 允许为null的情况下仍然保持唯一性
    trim: true  // 自动去除前后空格
  },
  // 用户角色，决定用户在系统中的权限级别
  role: {
    type: String,  // 字符串类型
    enum: Object.values(USER_ROLES),  // 枚举值：限制只能是预定义的角色之一
    default: USER_ROLES.CUSTOMER,  // 默认值：普通客户
  },
  // 权限列表，定义用户可以访问的菜单和操作
  permissions: {
    type: [menuPermissionSchema],  // 类型是上面定义的菜单权限模式的数组
    default: []  // 默认值：空数组，表示没有任何权限
  },
  // 用户状态，表示账号是否可用
  status: {
    type: String,  // 字符串类型
    enum: ['active', 'inactive', 'suspended'],  // 枚举值：活跃、非活跃、已冻结
    default: 'active',  // 默认值：活跃
  },
  
  // 以下字段主要用于技师用户
  
  // 技师专长领域，例如：发动机维修、车身修复等
  specialties: {
    type: [String],  // 字符串数组类型
    default: [],  // 默认值：空数组
  },
  // 工作经验年限
  workExperience: {
    type: Number,  // 数字类型
    default: 0,  // 默认值：0年
  },
  // 持有的认证证书
  certifications: {
    type: [String],  // 字符串数组类型
    default: [],  // 默认值：空数组
  },
  // 技师评分，由客户评价得出
  rating: {
    type: Number,  // 数字类型
    default: 0,  // 默认值：0分
  },
  // 总接单数量
  totalOrders: {
    type: Number,  // 数字类型
    default: 0,  // 默认值：0单
  },
  // 已完成的订单数量
  completedOrders: {
    type: Number,  // 数字类型
    default: 0,  // 默认值：0单
  },
  // 备注信息
  notes: String,  // 字符串类型，可以为空
}, {
  // 自动添加创建时间和更新时间字段
  timestamps: true,
});

/**
 * 中间件：在保存用户数据前执行
 * 主要用于密码加密
 */
userSchema.pre('save', async function(next) {
  // 如果密码字段被修改了
  if (this.isModified('password')) {
    // 使用bcryptjs库的hash函数对密码进行加密，10是加密强度
    this.password = await hash(this.password, 10);
  }
  // 继续保存过程
  next();
});

/**
 * 创建User模型
 * 如果模型已经存在，则使用现有模型
 * 否则，根据userSchema创建一个新的模型
 */
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 导出User模型，供其他文件使用
export default User; 