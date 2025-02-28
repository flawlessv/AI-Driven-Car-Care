export interface User {
  _id: string;
  username: string;
  name?: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer' | 'technician';
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// 添加角色常量
export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  TECHNICIAN: 'technician',
} as const;

// 添加角色显示名称映射
export const ROLE_NAMES = {
  admin: '管理员',
  customer: '客户',
  technician: '技师',
} as const; 