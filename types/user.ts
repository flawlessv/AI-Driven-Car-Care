// 用户角色定义
export const USER_ROLES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer',
  STAFF: 'staff'
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

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
  username: string;
  email: string;
  name?: string;
  role: UserRole;
  permissions?: MenuPermission[];
  status?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 登录请求参数
export interface LoginParams {
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
  role: 'admin' | 'staff' | 'customer';
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
  role: 'admin' | 'staff' | 'technician' | 'customer';
} 