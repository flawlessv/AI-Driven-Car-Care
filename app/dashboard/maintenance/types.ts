// 引入用户、车辆和配件的数据类型，这些都是系统中的其他重要信息
import type { User } from '@/types/user';
import type { Vehicle } from '@/types/vehicle';
import type { Part } from '../parts/types';

// 保养记录可能的状态：等待处理、正在进行中、已完成、已取消
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// 保养的类型：常规保养、维修或检查
export type MaintenanceType = 'regular' | 'repair' | 'inspection';

// 保养中使用的配件信息
export interface MaintenancePart {
  part: Part;           // 配件的详细信息
  quantity: number;     // 使用的配件数量
  unitPrice: number;    // 每个配件的单价
  totalPrice: number;   // 该配件的总价（单价×数量）
}

// 保养状态变更的历史记录
export interface StatusHistory {
  _id: string;          // 历史记录的唯一标识符
  status: MaintenanceStatus;  // 变更后的状态
  note: string;         // 关于此次状态变更的说明
  timestamp: string;    // 状态变更的时间
  updatedBy: User;      // 谁进行了这次状态变更
}

// 完整的保养记录信息
export interface MaintenanceRecord {
  _id: string;          // 保养记录的唯一标识符
  vehicle: Vehicle;     // 被保养的车辆信息
  customer: {           // 车主信息
    _id: string;        // 车主的唯一标识符
    name: string;       // 车主姓名
    phone: string;      // 车主电话
    email: string;      // 车主邮箱
  };
  type: MaintenanceType;      // 保养类型
  status: MaintenanceStatus;  // 当前状态
  statusHistory: StatusHistory[];  // 状态变更历史
  description: string;  // 保养描述
  startDate: string;    // 开始日期
  completionDate?: string;  // 完成日期（可能尚未完成）
  mileage: number;      // 车辆当前里程数
  cost: number;         // 总费用
  technician: {         // 负责技师信息
    _id: string;        // 技师唯一标识符
    name: string;       // 技师姓名
    level: string;      // 技师级别
  };
  parts: MaintenancePart[];  // 使用的配件列表
  notes?: string;       // 其他备注（可选）
  createdBy: User;      // 创建此记录的用户
  updatedBy?: User;     // 最后更新此记录的用户（可选）
  createdAt: string;    // 记录创建时间
  updatedAt: string;    // 记录最后更新时间
  review?: {            // 客户评价（可选）
    _id: string;        // 评价唯一标识符
    rating: number;     // 评分
    content: string;    // 评价内容
    createdAt: string;  // 评价时间
  };
}

// 创建或更新保养记录时使用的表单数据
export interface MaintenanceFormData {
  vehicle: string;      // 车辆ID
  type: MaintenanceType;  // 保养类型
  description: string;  // 描述
  startDate: string;    // 开始日期
  completionDate?: string;  // 完成日期（可选）
  mileage: number;      // 里程数
  cost: number;         // 费用
  technician: string;   // 技师ID
  parts: {              // 配件列表
    part: string;       // 配件ID
    quantity: number;   // 数量
    unitPrice: number;  // 单价
  }[];
  notes?: string;       // 备注（可选）
}

// 从服务器获取保养记录列表时的响应格式
export interface MaintenanceResponse {
  data: MaintenanceRecord[];  // 保养记录列表
  total: number;       // 总记录数
  page: number;        // 当前页码
  limit: number;       // 每页显示数量
  totalPages: number;  // 总页数
}

// 更新保养状态时使用的数据
export interface StatusUpdateData {
  status: MaintenanceStatus;  // 新状态
  note?: string;              // 状态变更说明（可选）
}

// 完整的保养报告信息
export interface MaintenanceReport {
  reportId: string;     // 报告唯一标识符
  generatedAt: string;  // 报告生成时间
  generatedBy: string;  // 报告生成人
  maintenance: {        // 保养基本信息
    id: string;         // 保养记录ID
    type: MaintenanceType;  // 保养类型
    status: MaintenanceStatus;  // 状态
    description: string;  // 描述
    startDate: string;    // 开始日期
    completionDate?: string;  // 完成日期
    mileage: number;      // 里程数
    cost: number;         // 费用
    technician: string;   // 技师姓名
    notes?: string;       // 备注
  };
  vehicle: {            // 车辆信息
    brand: string;      // 品牌
    model: string;      // 型号
    licensePlate: string;  // 车牌号
    vin: string;        // 车架号
    year: number;       // 年份
  };
  parts: {              // 配件清单
    name: string;       // 配件名称
    code: string;       // 配件编号
    manufacturer: string;  // 制造商
    quantity: number;     // 数量
    unitPrice: number;    // 单价
    totalPrice: number;   // 总价
  }[];
  statusHistory: {      // 状态变更历史
    status: MaintenanceStatus;  // 状态
    note: string;       // 备注
    timestamp: string;  // 时间
    updatedBy: string;  // 操作人
  }[];
  summary: {            // 费用汇总
    totalParts: number;   // 配件总数
    totalPartsPrice: number;  // 配件总价
    laborCost: number;    // 人工费
    totalCost: number;    // 总费用
  };
  metadata: {           // 元数据
    createdBy: string;    // 创建人
    createdAt: string;    // 创建时间
    updatedBy?: string;   // 更新人
    updatedAt: string;    // 更新时间
  };
}

// 基础保养统计信息
export interface MaintenanceBasicStats {
  totalCount: number;     // 保养记录总数
  totalCost: number;      // 总费用
  avgCost: number;        // 平均费用
  totalPartsCount: number;  // 配件总数
  totalPartsCost: number;   // 配件总费用
}

// 按保养类型统计的信息
export interface MaintenanceTypeStats {
  _id: MaintenanceType;   // 保养类型
  count: number;          // 该类型的记录数
  totalCost: number;      // 该类型的总费用
  avgCost: number;        // 该类型的平均费用
}

// 按车辆统计的信息
export interface MaintenanceVehicleStats {
  _id: string;           // 车辆ID
  count: number;         // 该车辆的保养记录数
  totalCost: number;     // 该车辆的保养总费用
  avgCost: number;       // 该车辆的平均保养费用
  vehicle: {             // 车辆信息
    brand: string;       // 品牌
    model: string;       // 型号
    licensePlate: string;  // 车牌号
  };
}

// 按时间统计的信息
export interface MaintenanceTimeStats {
  _id: string;          // 时间段标识
  count: number;        // 这段时间的记录数
  totalCost: number;    // 这段时间的总费用
  partsCost: number;    // 这段时间的配件费用
  laborCost: number;    // 这段时间的人工费用
}

// 保养统计摘要
export interface MaintenanceStatsSummary {
  laborCostRatio: number;       // 人工费用占比
  partsCostRatio: number;       // 配件费用占比
  avgPartsPerMaintenance: number;  // 每次保养平均使用的配件数
}

// 完整的保养统计信息
export interface MaintenanceStats {
  basic: MaintenanceBasicStats;     // 基础统计
  byType: MaintenanceTypeStats[];   // 按类型统计
  byVehicle: MaintenanceVehicleStats[];  // 按车辆统计
  byTime: MaintenanceTimeStats[];        // 按时间统计
  summary: MaintenanceStatsSummary;      // 统计摘要
}

// 时间分组方式：按日、按周、按月或按年
export type MaintenanceTimeGroupBy = 'day' | 'week' | 'month' | 'year'; 