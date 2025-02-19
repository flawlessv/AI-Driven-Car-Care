import type { User } from '@/types/user';
import type { Vehicle } from '@/types/vehicle';
import type { Part } from '../parts/types';

export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceType = 'regular' | 'repair' | 'inspection';

export interface MaintenancePart {
  part: Part;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StatusHistory {
  _id: string;
  status: MaintenanceStatus;
  note: string;
  timestamp: string;
  updatedBy: User;
}

export interface MaintenanceRecord {
  _id: string;
  vehicle: Vehicle;
  customer: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  type: MaintenanceType;
  status: MaintenanceStatus;
  statusHistory: StatusHistory[];
  description: string;
  startDate: string;
  completionDate?: string;
  mileage: number;
  cost: number;
  technician: {
    _id: string;
    name: string;
    level: string;
  };
  parts: MaintenancePart[];
  notes?: string;
  createdBy: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
  review?: {
    _id: string;
    rating: number;
    content: string;
    createdAt: string;
  };
}

export interface MaintenanceFormData {
  vehicle: string;
  type: MaintenanceType;
  description: string;
  startDate: string;
  completionDate?: string;
  mileage: number;
  cost: number;
  technician: string;
  parts: {
    part: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
}

export interface MaintenanceResponse {
  data: MaintenanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StatusUpdateData {
  status: MaintenanceStatus;
  note?: string;
}

export interface MaintenanceReport {
  reportId: string;
  generatedAt: string;
  generatedBy: string;
  maintenance: {
    id: string;
    type: MaintenanceType;
    status: MaintenanceStatus;
    description: string;
    startDate: string;
    completionDate?: string;
    mileage: number;
    cost: number;
    technician: string;
    notes?: string;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
    vin: string;
    year: number;
  };
  parts: {
    name: string;
    code: string;
    manufacturer: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  statusHistory: {
    status: MaintenanceStatus;
    note: string;
    timestamp: string;
    updatedBy: string;
  }[];
  summary: {
    totalParts: number;
    totalPartsPrice: number;
    laborCost: number;
    totalCost: number;
  };
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedBy?: string;
    updatedAt: string;
  };
}

export interface MaintenanceBasicStats {
  totalCount: number;
  totalCost: number;
  avgCost: number;
  totalPartsCount: number;
  totalPartsCost: number;
}

export interface MaintenanceTypeStats {
  _id: MaintenanceType;
  count: number;
  totalCost: number;
  avgCost: number;
}

export interface MaintenanceVehicleStats {
  _id: string;
  count: number;
  totalCost: number;
  avgCost: number;
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
  };
}

export interface MaintenanceTimeStats {
  _id: string;
  count: number;
  totalCost: number;
  partsCost: number;
  laborCost: number;
}

export interface MaintenanceStatsSummary {
  laborCostRatio: number;
  partsCostRatio: number;
  avgPartsPerMaintenance: number;
}

export interface MaintenanceStats {
  basic: MaintenanceBasicStats;
  byType: MaintenanceTypeStats[];
  byVehicle: MaintenanceVehicleStats[];
  byTime: MaintenanceTimeStats[];
  summary: MaintenanceStatsSummary;
}

export type MaintenanceTimeGroupBy = 'day' | 'week' | 'month' | 'year'; 