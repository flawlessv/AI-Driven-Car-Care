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

// 角色权限模型 - 集中存储各角色的权限配置
const rolePermissionSchema = new mongoose.Schema({
  // 角色名称
  role: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'staff', 'customer', 'technician']
  },
  // 权限配置
  permissions: {
    type: [menuPermissionSchema],
    default: []
  },
  // 是否为系统默认
  isDefault: {
    type: Boolean,
    default: false
  },
  // 描述
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// 创建索引
rolePermissionSchema.index({ role: 1 });

const RolePermission = mongoose.models.RolePermission || 
                        mongoose.model('RolePermission', rolePermissionSchema);

export default RolePermission; 