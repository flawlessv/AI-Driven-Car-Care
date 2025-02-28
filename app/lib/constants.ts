export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer'
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

export const MAINTENANCE_TYPE_MAP = {
  regular: '常规保养',
  repair: '维修',
  inspection: '检查'
};

export const MAINTENANCE_STATUS_MAP = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}; 