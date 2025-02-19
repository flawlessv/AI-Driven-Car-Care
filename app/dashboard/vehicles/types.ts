export interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  mileage: number;
  status: 'active' | 'maintenance' | 'inactive';
  ownerName: string;
  ownerContact: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  mileage: number;
  status: Vehicle['status'];
  ownerName: string;
  ownerContact: string;
}

export interface VehicleResponse {
  data: Vehicle;
  message: string;
}

export interface VehiclesResponse {
  data: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 