import { ObjectId } from 'mongodb';
import { User } from './user';

export interface Vehicle {
  _id: string | ObjectId;
  owner: string | ObjectId | User;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vinNumber?: string;
  color?: string;
  mileage?: number;
  lastServiceDate?: Date | string;
  nextServiceDate?: Date | string;
  insuranceExpiryDate?: Date | string;
  registrationExpiryDate?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
} 