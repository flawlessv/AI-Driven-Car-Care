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

export interface ReminderSettings {
  enableEmail: boolean;
  enableSMS: boolean;
  enablePush: boolean;
  advanceNoticeDays: number;
  repeatInterval?: number;
} 