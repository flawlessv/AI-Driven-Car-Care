import mongoose, { Schema, Document } from 'mongoose';

// 工单状态枚举
export const WORK_ORDER_STATUS = {
  PENDING: 'pending',      // 待处理
  ASSIGNED: 'assigned',    // 已分配
  IN_PROGRESS: 'in_progress', // 处理中
  COMPLETED: 'completed',  // 已完成
  CANCELLED: 'cancelled'   // 已取消
} as const;

// 工单优先级枚举
export const WORK_ORDER_PRIORITY = {
  LOW: 'low',       // 低
  MEDIUM: 'medium', // 中
  HIGH: 'high'      // 高
} as const;

// 工单类型枚举
export const WORK_ORDER_TYPE = {
  REPAIR: 'repair',         // 维修
  MAINTENANCE: 'maintenance', // 保养
  INSPECTION: 'inspection'    // 检查
} as const;

// 工单接口
export interface IWorkOrder extends Document {
  orderNumber: string;      // 工单编号
  vehicle: Schema.Types.ObjectId;  // 车辆ID
  customer: Schema.Types.ObjectId; // 客户ID
  technician?: Schema.Types.ObjectId; // 技师ID
  type: typeof WORK_ORDER_TYPE[keyof typeof WORK_ORDER_TYPE]; // 工单类型
  status: typeof WORK_ORDER_STATUS[keyof typeof WORK_ORDER_STATUS]; // 工单状态
  priority: typeof WORK_ORDER_PRIORITY[keyof typeof WORK_ORDER_PRIORITY]; // 优先级
  description: string;      // 问题描述
  diagnosis?: string;       // 故障诊断
  solution?: string;        // 解决方案
  parts?: Array<{          // 使用的配件
    part: Schema.Types.ObjectId;
    quantity: number;
    price: number;
  }>;
  estimatedHours: number;   // 预计工时
  actualHours?: number;     // 实际工时
  startDate: Date;         // 开始日期
  completionDate?: Date;   // 完成日期
  customerNotes?: string;   // 客户备注
  technicianNotes?: string; // 技师备注
  rating?: number;         // 评分 (1-5)
  feedback?: string;       // 反馈
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
}

// 工单模式
const workOrderSchema = new Schema<IWorkOrder>({
  orderNumber: { type: String, required: true, unique: true },
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  technician: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    required: true,
    enum: Object.values(WORK_ORDER_TYPE)
  },
  status: { 
    type: String, 
    required: true,
    enum: Object.values(WORK_ORDER_STATUS),
    default: WORK_ORDER_STATUS.PENDING
  },
  priority: { 
    type: String, 
    required: true,
    enum: Object.values(WORK_ORDER_PRIORITY),
    default: WORK_ORDER_PRIORITY.MEDIUM
  },
  description: { type: String, required: true },
  diagnosis: String,
  solution: String,
  parts: [{
    part: { type: Schema.Types.ObjectId, ref: 'Part', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  estimatedHours: { type: Number, required: true, min: 0 },
  actualHours: { type: Number, min: 0 },
  startDate: { type: Date, required: true },
  completionDate: Date,
  customerNotes: String,
  technicianNotes: String,
  rating: { type: Number, min: 1, max: 5 },
  feedback: String,
}, {
  timestamps: true // 自动管理 createdAt 和 updatedAt
});

// 创建索引
workOrderSchema.index({ orderNumber: 1 });
workOrderSchema.index({ vehicle: 1 });
workOrderSchema.index({ customer: 1 });
workOrderSchema.index({ technician: 1 });
workOrderSchema.index({ status: 1 });
workOrderSchema.index({ createdAt: 1 });

// 导出模型
export const WorkOrder = mongoose.models.WorkOrder || mongoose.model<IWorkOrder>('WorkOrder', workOrderSchema); 