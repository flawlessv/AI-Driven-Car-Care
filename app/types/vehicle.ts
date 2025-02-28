import type { User } from './user';

export interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  owner: string | User;
  mileage: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  status: 'active' | 'inactive' | 'maintenance';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
} 