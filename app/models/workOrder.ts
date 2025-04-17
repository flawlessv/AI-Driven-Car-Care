/**
 * 工单数据模型文件
 * 
 * 这个文件定义了汽车维修/保养工单的数据结构和相关操作
 * 工单是整个汽车保养系统的核心业务对象，记录了从开始到结束的整个维修/保养过程
 */

// 导入mongoose库及其相关类型，用于与MongoDB数据库通信
import mongoose, { Schema, Document } from 'mongoose';

/**
 * 工单状态枚举
 * 定义了工单在生命周期中可能的所有状态
 */
export const WORK_ORDER_STATUS = {
  PENDING: 'pending',         // 待处理：工单刚创建，等待分配技师
  ASSIGNED: 'assigned',       // 已分配：已经分配了技师，但还未开始工作
  IN_PROGRESS: 'in_progress', // 处理中：技师正在进行维修/保养工作
  PENDING_CHECK: 'pending_check', // 待审核：工作已完成，等待质检人员审核
  COMPLETED: 'completed',     // 已完成：工单全部完成，可以交付给客户
  CANCELLED: 'cancelled'      // 已取消：工单被取消，不再进行
} as const;

/**
 * 工单优先级枚举
 * 定义了工单的紧急程度，影响处理的先后顺序
 */
export const WORK_ORDER_PRIORITY = {
  LOW: 'low',        // 低优先级：可以稍后处理
  MEDIUM: 'medium',  // 中优先级：普通工单
  HIGH: 'high'       // 高优先级：需要尽快处理
} as const;

/**
 * 工单类型枚举
 * 定义了不同种类的服务内容
 */
export const WORK_ORDER_TYPE = {
  REPAIR: 'repair',           // 维修：修复故障或损坏
  MAINTENANCE: 'maintenance', // 保养：定期保养服务
  INSPECTION: 'inspection'    // 检查：车辆状态检查
} as const;

/**
 * 工单接口
 * 定义工单数据的结构和类型
 * 这相当于工单"表格"中包含的所有字段
 */
export interface IWorkOrder extends Document {
  orderNumber: string;      // 工单编号：唯一标识每个工单的编号，如"WO-2023-0001"
  vehicle: Schema.Types.ObjectId;  // 车辆ID：关联到哪辆车，引用Vehicle集合
  customer: Schema.Types.ObjectId; // 客户ID：车主信息，引用User集合
  technician?: Schema.Types.ObjectId; // 技师ID：负责维修/保养的技师，引用User集合（可选）
  type: typeof WORK_ORDER_TYPE[keyof typeof WORK_ORDER_TYPE]; // 工单类型：维修、保养或检查
  status: typeof WORK_ORDER_STATUS[keyof typeof WORK_ORDER_STATUS]; // 工单状态：当前处理阶段
  priority: typeof WORK_ORDER_PRIORITY[keyof typeof WORK_ORDER_PRIORITY]; // 优先级：工单紧急程度
  description: string;      // 问题描述：客户描述的问题或需求
  diagnosis?: string;       // 故障诊断：技师对问题的诊断结果（可选）
  solution?: string;        // 解决方案：技师提出的解决方法（可选）
  parts?: Array<{          // 使用的配件：维修/保养中使用的零部件列表（可选）
    part: Schema.Types.ObjectId;  // 配件ID：引用Part集合
    quantity: number;             // 数量：使用了多少个该配件
    price: number;                // 单价：每个配件的价格
  }>;
  estimatedHours: number;   // 预计工时：预计完成工作需要的小时数
  actualHours?: number;     // 实际工时：实际花费的小时数（可选，完成后填写）
  startDate: Date;          // 开始日期：计划开始工作的日期
  completionDate?: Date;    // 完成日期：实际完成工作的日期（可选）
  customerNotes?: string;   // 客户备注：客户提供的额外信息（可选）
  technicianNotes?: string; // 技师备注：技师的工作笔记（可选）
  completionProof?: {       // 完工证明：证明工作已完成的材料（可选）
    workOrderId: Schema.Types.ObjectId;  // 关联的工单ID
    proofImages: string[];                // 完工照片：展示工作成果
    notes?: string;                       // 完工说明：文字描述
    submittedBy: Schema.Types.ObjectId;   // 提交人：谁提交的完工证明
    submittedAt: Date;                    // 提交时间：何时提交的
    approved?: boolean;                   // 是否通过：审核结果
    approvedBy?: Schema.Types.ObjectId;   // 审核人：谁审核的
    approvedAt?: Date;                    // 审核时间：何时审核的
  };
  progress?: Array<{        // 工单进度记录：记录工单状态变化的历史（可选）
    status: typeof WORK_ORDER_STATUS[keyof typeof WORK_ORDER_STATUS]; // 状态：当时的工单状态
    notes?: string;                                                  // 备注：状态变更的说明
    timestamp: Date;                                                 // 时间戳：状态变更的时间
    user: Schema.Types.ObjectId;                                     // 操作用户：谁进行了状态变更
  }>;
  rating?: number;          // 评分：客户对服务的评价，1-5分（可选）
  feedback?: string;        // 反馈：客户的文字评价（可选）
  createdBy?: Schema.Types.ObjectId; // 创建人ID：谁创建了这个工单（可选）
  updatedBy?: Schema.Types.ObjectId; // 最后更新人ID：谁最后修改了这个工单（可选）
  createdAt: Date;          // 创建时间：工单创建的时间（自动生成）
  updatedAt: Date;          // 更新时间：工单最后更新的时间（自动生成）
}

/**
 * 工单模式定义
 * 详细定义了工单在数据库中的结构、验证规则和默认值
 */
const workOrderSchema = new Schema<IWorkOrder>({
  // 工单编号：必填且唯一
  orderNumber: { type: String, required: true, unique: true },
  // 车辆：必填，关联到Vehicle集合
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  // 客户：必填，关联到User集合
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // 技师：可选，关联到User集合
  technician: { type: Schema.Types.ObjectId, ref: 'User' },
  // 工单类型：必填，只能是预定义的类型之一
  type: { 
    type: String, 
    required: true,
    enum: Object.values(WORK_ORDER_TYPE)
  },
  // 工单状态：必填，默认为"待处理"
  status: { 
    type: String, 
    required: true,
    enum: Object.values(WORK_ORDER_STATUS),
    default: WORK_ORDER_STATUS.PENDING
  },
  // 优先级：必填，默认为"中"
  priority: { 
    type: String, 
    required: true,
    enum: Object.values(WORK_ORDER_PRIORITY),
    default: WORK_ORDER_PRIORITY.MEDIUM
  },
  // 问题描述：必填
  description: { type: String, required: true },
  // 故障诊断：可选的字符串
  diagnosis: String,
  // 解决方案：可选的字符串
  solution: String,
  // 使用的配件：可选的数组，每项包含配件、数量和价格
  parts: [{
    part: { type: Schema.Types.ObjectId, ref: 'Part', required: true },
    quantity: { type: Number, required: true, min: 1 },  // 数量最少为1
    price: { type: Number, required: true, min: 0 }      // 价格不能为负
  }],
  // 预计工时：必填，不能为负数
  estimatedHours: { type: Number, required: true, min: 0 },
  // 实际工时：可选，不能为负数
  actualHours: { type: Number, min: 0 },
  // 开始日期：必填
  startDate: { type: Date, required: true },
  // 完成日期：可选
  completionDate: Date,
  // 客户备注：可选的字符串
  customerNotes: String,
  // 技师备注：可选的字符串
  technicianNotes: String,
  // 完工证明：复杂对象，包含多个字段
  completionProof: {
    workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
    proofImages: [String],  // 图片URL数组
    notes: String,
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },  // 默认为当前时间
    approved: { type: Boolean, default: false },     // 默认为未审核通过
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  // 工单进度记录：数组，记录状态变更历史
  progress: [{
    status: { 
      type: String, 
      required: true,
      enum: Object.values(WORK_ORDER_STATUS)
    },
    notes: String,
    timestamp: { type: Date, default: Date.now },  // 默认为当前时间
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  // 评分：可选，1-5分
  rating: { type: Number, min: 1, max: 5 },
  // 反馈：可选的字符串
  feedback: String,
  // 创建人：可选，关联到User集合
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  // 最后更新人：可选，关联到User集合
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true // 自动添加和管理createAt和updatedAt字段
});

/**
 * 创建数据库索引
 * 索引可以加速查询操作，类似于图书馆的目录
 */
// 按工单编号创建索引，便于快速查找特定工单
workOrderSchema.index({ orderNumber: 1 });
// 按车辆ID创建索引，便于查询特定车辆的所有工单
workOrderSchema.index({ vehicle: 1 });
// 按客户ID创建索引，便于查询特定客户的所有工单
workOrderSchema.index({ customer: 1 });
// 按技师ID创建索引，便于查询特定技师负责的所有工单
workOrderSchema.index({ technician: 1 });
// 按状态创建索引，便于查询处于特定状态的工单
workOrderSchema.index({ status: 1 });
// 按创建时间创建索引，便于时间顺序查询
workOrderSchema.index({ createdAt: 1 });
// 按创建人创建索引
workOrderSchema.index({ createdBy: 1 });
// 按最后更新人创建索引
workOrderSchema.index({ updatedBy: 1 });

/**
 * 获取工单模型的函数
 * 这个函数确保只创建一次模型，避免重复定义
 * 
 * @returns {mongoose.Model} 返回工单模型，可以用于数据库操作
 */
export function getWorkOrderModel() {
  try {
    const modelName = 'WorkOrder';
    // 如果模型已存在，直接返回已有模型
    if (mongoose.models[modelName]) {
      return mongoose.models[modelName];
    }
    // 否则创建新模型并返回
    return mongoose.model<IWorkOrder>(modelName, workOrderSchema);
  } catch (error) {
    // 如果出错，记录错误信息并抛出异常
    console.error('获取WorkOrder模型失败:', error);
    throw error;
  }
}

/**
 * 向后兼容的默认导出
 * 如果模型已存在则使用现有模型，否则创建新模型
 */
export default mongoose.models.WorkOrder || mongoose.model<IWorkOrder>('WorkOrder', workOrderSchema); 