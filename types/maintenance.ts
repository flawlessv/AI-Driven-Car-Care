export interface MaintenanceRule {
  _id: string;
  vehicle: string;
  type: 'mileage' | 'time' | 'both';
  mileageInterval?: number;  // 里程提醒间隔(公里)
  timeInterval?: number;     // 时间提醒间隔(天)
  lastMileage?: number;      // 上次维修里程数
  lastMaintenanceDate?: string; // 上次维修日期
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceReminder {
  _id: string;
  vehicle: string;
  type: 'mileage' | 'time' | 'inspection' | 'insurance';
  title: string;
  description: string;
  targetDate: Date;
  targetMileage?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'dismissed';
  notificationSent: boolean;
  notificationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRuleFormData {
  vehicle: string;
  type: 'mileage' | 'time' | 'both';
  mileageInterval?: number;
  timeInterval?: number;
  enabled: boolean;
}

export interface ReminderSettings {
  enableEmail: boolean;
  enableSMS: boolean;
  enablePush: boolean;
  advanceNoticeDays: number;
  repeatInterval?: number;
} 