import { User } from './user';
import { Vehicle } from './vehicle';
import { MaintenanceRecord } from './maintenance';
import { ObjectId } from 'mongoose';

// 预约时间段类型
export interface TimeSlot {
  _id: string;
  date: Date;
  startTime: string; // 格式: "HH:mm"
  endTime: string;   // 格式: "HH:mm"
  technician: string;
  isAvailable: boolean;
  appointmentId?: string;
}

// 预约类型
export interface Appointment {
  _id?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
  };
  service: {
    type: 'maintenance' | 'repair' | 'inspection';
    name: string;
    description: string;
    duration: number;
    basePrice: number;
  };
  timeSlot: {
    date: string | Date;
    startTime: string;
    endTime?: string;
    technician?: string; // 技师ID
  };
  status: 'pending' | 'processed' | 'completed' | 'cancelled';
  notes?: string;
  estimatedDuration: number;
  estimatedCost: number;
  confirmationSent?: boolean;
  reminderSent?: boolean;
  sourceWorkOrder?: string; // 来源工单ID
  user?: string; // 关联用户ID
}

// 维修保养服务类型
export interface MaintenanceService {
  _id: string;
  name: string;
  description: string;
  category: 'regular' | 'repair' | 'inspection';
  duration: number;      // 服务时长（分钟）
  basePrice: number;     // 基础价格
  availableTechnicians: string[]; // 可提供该服务的技师ID列表
  requiredParts?: string[];      // 所需配件ID列表
}

// 技师排班类型
export interface TechnicianSchedule {
  _id: string;
  technician: User;
  date: Date;
  shifts: {
    startTime: string;
    endTime: string;
    status: 'available' | 'busy' | 'off';
  }[];
  appointments: string[]; // 预约ID列表
  createdAt: Date;
  updatedAt: Date;
}

// 预约设置类型
export interface AppointmentSettings {
  workingHours: {
    startTime: string;
    endTime: string;
  };
  timeSlotDuration: number;     // 时间段长度（分钟）
  maxDaysInAdvance: number;     // 最大提前预约天数
  minHoursInAdvance: number;    // 最小提前预约小时数
  autoConfirmation: boolean;    // 是否自动确认预约
  reminderSettings: {
    enableEmail: boolean;
    enableSMS: boolean;
    enablePush: boolean;
    reminderHours: number[];    // 提前提醒时间（小时）
  };
}

// 预约推荐结果类型
export interface AppointmentRecommendation {
  timeSlot: TimeSlot;
  score: number;           // 推荐分数
  technician: User;        // 推荐技师
  reasons: string[];       // 推荐原因
  alternativeSlots: TimeSlot[]; // 备选时间段
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  licensePlate: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  category: 'regular' | 'repair' | 'inspection';
  duration: number;
  basePrice: number;
} 