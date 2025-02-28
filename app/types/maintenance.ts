import type { Vehicle } from './vehicle';
import type { User } from './user';

export interface MaintenanceRecord {
  _id: string;
  vehicle?: Vehicle;
  technician?: User;
  type: 'regular' | 'repair' | 'inspection';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startDate: Date;
  completionDate?: Date;
  cost?: number;
  notes?: string;
  items?: string[];
  parts?: {
    name: string;
    quantity: number;
    price: number;
  }[];
  recommendations?: string;
} 