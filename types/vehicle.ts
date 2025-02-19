export interface Vehicle {
  _id: string;
  brand: string; // 品牌
  model: string; // 型号
  year: number; // 年份
  licensePlate: string; // 车牌号
  vin: string; // 车架号
  mileage: number; // 里程数
  lastMaintenance?: Date; // 上次保养时间
  nextMaintenance?: Date; // 下次保养时间
  status: 'active' | 'inactive' | 'maintenance'; // 状态
  ownerName: string; // 车主姓名
  ownerContact: string; // 联系方式
  createdAt: Date;
  updatedAt: Date;
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

export interface MaintenanceRecord {
  _id: string;
  vehicle: string; // 车辆ID
  type: 'regular' | 'repair' | 'inspection'; // 保养类型
  description: string; // 保养描述
  mileage: number; // 保养时的里程数
  cost: number; // 保养费用
  parts: MaintenancePart[]; // 使用的配件
  technician: string; // 技师ID
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'; // 状态
  startDate: Date; // 开始日期
  completionDate?: Date; // 完成日期
  notes?: string; // 备注
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenancePart {
  _id: string;
  name: string; // 配件名称
  code: string; // 配件编号
  quantity: number; // 使用数量
  unitPrice: number; // 单价
  totalPrice: number; // 总价
} 