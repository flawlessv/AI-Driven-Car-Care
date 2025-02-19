export interface Part {
  _id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  price: number;
  stock: number;
  minStock?: number;
  unit?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartFormData {
  name: string;
  code: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  price: number;
  stock: number;
  minStock?: number;
  unit?: string;
  location?: string;
}

export interface PartResponse {
  data: {
    data: Part[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} 