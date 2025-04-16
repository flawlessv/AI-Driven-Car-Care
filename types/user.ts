// 用户角色定义
export const USER_ROLES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// 角色显示名称映射
export const ROLE_NAMES = {
  admin: '管理员',
  technician: '技师',
  customer: '客户',
} as const;

// 菜单权限类型
export type PermissionLevel = 'none' | 'read' | 'write' | 'manage';

// 菜单项权限配置
export interface MenuPermission {
  menuKey: string;
  permission: PermissionLevel;
}

// 用户信息类型
export interface User {
  _id: string;
  username: string; // 既作为登录账号也作为显示名称
  email: string;
  role: UserRole;
  permissions?: MenuPermission[];
  status?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  // 技师特有字段
  level?: string;                // 技师等级
  specialties?: string[];        // 专长领域
  certifications?: string[];     // 持有证书
  workExperience?: number;       // 工作年限
  hireDate?: string | Date;      // 入职日期
  description?: string;          // 技师介绍
}

// 登录表单接口
export interface LoginForm {
  email: string;
  password: string;
}

// 登录响应数据
export interface LoginResponse {
  user: User;
  token: string;
}

// 用户权限配置
export interface UserPermissions {
  userId: string;
  permissions: MenuPermission[];
}

export interface UserResponse {
  _id: string;
  username: string;
  email: string;
  role: 'admin'  | 'customer';
}

export interface RegisterForm extends LoginForm {
  username: string;
  confirmPassword: string;
}

export interface RegisterData {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'admin'  | 'technician' | 'customer';
} 