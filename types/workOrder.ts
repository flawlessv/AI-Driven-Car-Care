export type WorkOrderStatus = 
  | 'pending'     // 待处理
  | 'assigned'    // 已分配
  | 'in_progress' // 进行中
  | 'pending_check' // 待检查
  | 'completed'   // 已完成
  | 'cancelled';  // 已取消

export type WorkOrderPriority = 
  | 'low'      // 低优先级
  | 'medium'   // 中优先级
  | 'high'     // 高优先级
  | 'urgent';  // 紧急

export interface WorkOrder {
  _id: string;
  orderNumber: string;           // 工单编号
  vehicle: string;               // 关联车辆ID
  customer: string;              // 客户ID
  technician?: string;           // 技师ID
  maintenanceRecord?: string;    // 关联的维修记录ID
  type: string;                  // 维修类型
  description: string;           // 问题描述
  diagnosis?: string;            // 故障诊断
  solution?: string;             // 解决方案
  priority: WorkOrderPriority;   // 优先级
  status: WorkOrderStatus;       // 状态
  estimatedHours?: number;       // 预计工时
  actualHours?: number;          // 实际工时
  startDate?: string;           // 开始日期
  completionDate?: string;      // 完成日期
  customerNotes?: string;       // 客户备注
  technicianNotes?: string;     // 技师备注
  rating?: number;              // 客户评分(1-5)
  feedback?: string;            // 客户反馈
  createdBy: string;            // 创建人ID
  createdAt: string;           // 创建时间
  updatedAt: string;           // 更新时间
}

export interface WorkOrderFormData {
  vehicle: string;
  type: string;
  description: string;
  priority: WorkOrderPriority;
  estimatedHours?: number;
  customerNotes?: string;
}

export interface WorkOrderProgress {
  _id: string;
  workOrder: string;           // 工单ID
  status: WorkOrderStatus;     // 状态
  notes?: string;             // 进度说明
  updatedBy: string;          // 更新人ID
  createdAt: string;         // 创建时间
}

export interface WorkOrderEvaluation {
  _id: string;
  workOrder: string;         // 工单ID
  rating: number;            // 评分(1-5)
  feedback?: string;         // 反馈内容
  createdBy: string;         // 评价人ID
  createdAt: string;        // 创建时间
} 