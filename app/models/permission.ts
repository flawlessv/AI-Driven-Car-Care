import mongoose from 'mongoose';

// 菜单项权限定义
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

// 权限规则模型
const permissionSchema = new mongoose.Schema({
  // 规则名称
  name: {
    type: String,
    required: true,
    unique: true
  },
  // 规则描述
  description: String,
  // 应用于哪些角色
  roles: {
    type: [String],
    enum: ['admin', 'customer'],
    default: []
  },
  // 应用于指定用户
  users: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  // 权限设置
  permissions: {
    type: [menuPermissionSchema],
    default: []
  },
  // 是否为默认规则
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

const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);

export default Permission; 