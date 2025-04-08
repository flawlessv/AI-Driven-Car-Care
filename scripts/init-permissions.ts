/**
 * 初始化权限规则的脚本
 * 用于系统首次部署时创建默认权限规则
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 菜单项权限Schema定义
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

// 权限规则模型定义
const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  roles: {
    type: [String],
    enum: ['admin', 'customer'],
    default: []
  },
  users: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  permissions: {
    type: [menuPermissionSchema],
    default: []
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 创建索引
permissionSchema.index({ name: 1 });
permissionSchema.index({ 'roles': 1 });
permissionSchema.index({ 'users': 1 });

// 用户模型
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: String,
  role: {
    type: String,
    enum: ['admin',  'customer'],
    default: 'customer',
  },
  permissions: {
    type: [menuPermissionSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// 初始化数据库连接
async function connectToDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('环境变量 MONGODB_URI 未设置');
    }
    
    await mongoose.connect(uri);
    console.log('数据库连接成功');
    return mongoose.connection;
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
}

// 初始化模型
const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 默认权限配置
const adminPermissions = [
  { menuKey: 'dashboard', permission: 'manage' },
  { menuKey: 'vehicles', permission: 'manage' },
  { menuKey: 'vehicle-list', permission: 'manage' },
  { menuKey: 'vehicle-files', permission: 'manage' },
  { menuKey: 'vehicle-health', permission: 'manage' },
  { menuKey: 'maintenance', permission: 'manage' },
  { menuKey: 'maintenance-records', permission: 'manage' },
  { menuKey: 'maintenance-rules', permission: 'manage' },
  { menuKey: 'appointments', permission: 'manage' },
  { menuKey: 'technicians', permission: 'manage' },
  { menuKey: 'users', permission: 'manage' },
  { menuKey: 'parts', permission: 'manage' },
  { menuKey: 'reports', permission: 'manage' },
  { menuKey: 'maintenance-stats', permission: 'manage' },
  { menuKey: 'revenue-stats', permission: 'manage' },
  { menuKey: 'customer-analysis', permission: 'manage' },
  { menuKey: 'reviews', permission: 'manage' },
  { menuKey: 'permissions', permission: 'manage' },
];

const customerPermissions = [
  { menuKey: 'dashboard', permission: 'read' },
  { menuKey: 'vehicles', permission: 'read' },
  { menuKey: 'vehicle-list', permission: 'read' },
  { menuKey: 'vehicle-files', permission: 'read' },
  { menuKey: 'vehicle-health', permission: 'read' },
  { menuKey: 'maintenance', permission: 'read' },
  { menuKey: 'maintenance-records', permission: 'read' },
  { menuKey: 'maintenance-rules', permission: 'none' },
  { menuKey: 'appointments', permission: 'write' },
  { menuKey: 'technicians', permission: 'read' },
  { menuKey: 'users', permission: 'none' },
  { menuKey: 'parts', permission: 'none' },
  { menuKey: 'reports', permission: 'none' },
  { menuKey: 'maintenance-stats', permission: 'none' },
  { menuKey: 'revenue-stats', permission: 'none' },
  { menuKey: 'customer-analysis', permission: 'none' },
  { menuKey: 'reviews', permission: 'write' },
  { menuKey: 'permissions', permission: 'none' },
];

// 默认角色权限规则
const defaultPermissionRules = [
  {
    name: '管理员权限',
    description: '系统管理员的默认权限规则，拥有所有功能的完全访问权限',
    roles: ['admin'],
    permissions: adminPermissions,
    isDefault: true
  },
  {
    name: '客户权限',
    description: '客户的默认权限规则，仅能查看自己的数据和基本功能',
    roles: ['customer'],
    permissions: customerPermissions,
    isDefault: true
  }
];

// 初始化权限规则
async function initPermissions() {
  try {
    await connectToDB();
    
    console.log('开始初始化权限规则...');
    
    // 检查是否已存在权限规则
    const existingRules = await Permission.countDocuments();
    
    if (existingRules > 0) {
      console.log(`已存在 ${existingRules} 条权限规则，跳过初始化`);
      return;
    }
    
    // 创建默认权限规则
    for (const rule of defaultPermissionRules) {
      const newRule = new Permission(rule);
      await newRule.save();
      console.log(`创建权限规则: ${rule.name}`);
    }
    
    // 给所有用户应用默认权限
    const users = await User.find();
    let updatedCount = 0;
    
    for (const user of users) {
      if (!user.permissions || user.permissions.length === 0) {
        let permissions;
        
        if (user.role === 'admin') {
          permissions = adminPermissions;
        } else {
          permissions = customerPermissions;
        }
        
        user.permissions = permissions;
        await user.save();
        updatedCount++;
      }
    }
    
    console.log(`已为 ${updatedCount} 名用户应用默认权限`);
    console.log('权限规则初始化完成!');
  } catch (error) {
    console.error('初始化权限规则失败:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 运行初始化
initPermissions(); 