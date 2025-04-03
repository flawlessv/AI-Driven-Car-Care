import { ObjectId } from 'mongodb';

export type UserRole = 'admin' | 'staff' | 'technician' | 'customer';

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

// 添加角色常量
export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  TECHNICIAN: 'technician',
  STAFF: 'staff',
} as const;

// 添加角色显示名称映射
export const ROLE_NAMES = {
  admin: '管理员',
  customer: '客户',
  technician: '技师',
  staff: '职员',
} as const; 