export interface Part {
  _id: string;
  name: string;
  code: string;
  category: 'engine' | 'transmission' | 'brake' | 'electrical' | 'body' | 'other';
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  manufacturer?: string;
  location?: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
  lowStock?: boolean;
}

export const PART_CATEGORIES = {
  engine: '发动机',
  transmission: '变速箱',
  brake: '制动系统',
  electrical: '电气系统',
  body: '车身部件',
  other: '其他',
} as const;

export const PART_STATUS = {
  active: '正常',
  inactive: '停用',
  discontinued: '停产',
} as const; 