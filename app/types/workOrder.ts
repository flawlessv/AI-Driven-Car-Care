import { ObjectId } from 'mongodb';
import { User } from './user';
import { Vehicle } from './vehicle';

export type WorkOrderStatus = 
  | 'pending' 
  | 'assigned' 
  | 'in_progress' 
  | 'pending_check'
  | 'completed' 
  | 'cancelled';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkOrderType = 
  | '常规保养' 
  | '维修' 
  | '检查' 
  | '轮胎更换'
  | '其他';

export interface WorkOrderProgress {
  _id?: string | ObjectId;
  status: WorkOrderStatus;
  notes?: string;
  timestamp: Date | string;
  user: string | User;
}

export interface WorkOrderCompletionProof {
  _id?: string | ObjectId;
  workOrderId: string | ObjectId;
  proofImages: string[];
  notes?: string;
  submittedBy: string | ObjectId | User;
  submittedAt: Date | string;
  approved?: boolean;
  approvedBy?: string | ObjectId | User;
  approvedAt?: Date | string;
}

export interface WorkOrder {
  _id: string | ObjectId;
  customer: string | User;
  vehicle: string | Vehicle;
  technician?: string | User;
  createdBy: string | User;
  type: WorkOrderType;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  startDate?: Date | string;
  completionDate?: Date | string;
  estimatedCompletionDate?: Date | string;
  estimatedCost?: number;
  actualCost?: number;
  customerNotes?: string;
  technicianNotes?: string;
  internalNotes?: string;
  progressNotes?: string;
  parts?: string[] | ObjectId[];
  completionProof?: WorkOrderCompletionProof;
  createdAt: Date | string;
  updatedAt: Date | string;
  review?: {
    _id: string | ObjectId;
    rating: number;
    comment: string;
    createdAt: Date | string;
  };
} 