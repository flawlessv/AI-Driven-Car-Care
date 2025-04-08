import { ObjectId } from 'mongodb';

export type UserRole = 'admin' | 'technician' | 'customer';

export interface User {
  _id: string | ObjectId;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 用户角色定义
export const USER_ROLES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer'
} as const;

// 角色显示名称映射
export const ROLE_NAMES = {
  admin: '管理员',
  technician: '技师',
  customer: '客户'
} as const; 