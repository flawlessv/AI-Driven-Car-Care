/**
 * 预约数据模型文件
 * 
 * 这个文件定义了系统中"预约"的数据结构和相关操作
 * 预约是客户请求汽车服务的第一步，记录客户何时带车来店接受服务
 */

// 导入mongoose库及其类型，用于定义数据结构和与数据库交互
import mongoose, { Schema, Model } from 'mongoose';

/**
 * 客户信息接口
 * 定义预约中客户的基本联系信息
 * 
 * @property {string} name - 客户姓名
 * @property {string} phone - 客户联系电话
 * @property {string} email - 客户电子邮箱（可选）
 */
interface ICustomer {
  name: string;       // 客户姓名
  phone: string;      // 联系电话
  email?: string;     // 电子邮箱（问号表示可选字段）
}

/**
 * 时间段接口
 * 定义预约的具体时间信息
 * 
 * @property {Date} date - 预约日期
 * @property {string} startTime - 开始时间（格式如"09:00"）
 * @property {string} endTime - 结束时间（格式如"10:30"）
 * @property {mongoose.Types.ObjectId} technician - 负责此时段的技师ID
 */
interface ITimeSlot {
  date: Date;                             // 预约日期
  startTime: string;                      // 开始时间
  endTime: string;                        // 结束时间
  technician: mongoose.Types.ObjectId;    // 技师ID，引用User表中的技师
}

/**
 * 预约接口
 * 完整定义一个预约记录包含的所有信息
 * 
 * @property {ICustomer} customer - 客户信息
 * @property {mongoose.Types.ObjectId} vehicle - 预约服务的车辆ID
 * @property {mongoose.Types.ObjectId} service - 预约的服务项目ID
 * @property {ITimeSlot} timeSlot - 预约时间段
 * @property {string} status - 预约状态：待处理、已安排、已完成、已取消
 * @property {number} estimatedDuration - 预计服务时长（分钟）
 * @property {number} estimatedCost - 预计费用（元）
 * @property {Date} createdAt - 预约创建时间
 * @property {Date} updatedAt - 预约最后更新时间
 * @property {mongoose.Types.ObjectId} sourceWorkOrder - 关联的工单ID（可选，用于从工单创建的预约）
 * @property {mongoose.Types.ObjectId} user - 关联的用户ID（可选，如果是注册用户创建的预约）
 * @property {mongoose.Types.ObjectId} technician - 直接指定的技师ID（可选）
 * @property {string} technicianName - 技师姓名（可选，冗余存储便于显示）
 */
export interface IAppointment {
  customer: ICustomer;                            // 客户信息
  vehicle: mongoose.Types.ObjectId;               // 车辆ID
  service: mongoose.Types.ObjectId;               // 服务项目ID
  timeSlot: ITimeSlot;                            // 预约时间段
  status: 'pending' | 'processed' | 'completed' | 'cancelled';  // 预约状态
  estimatedDuration: number;                      // 预计服务时长（分钟）
  estimatedCost: number;                          // 预计费用（元）
  createdAt: Date;                                // 创建时间
  updatedAt: Date;                                // 更新时间
  sourceWorkOrder?: mongoose.Types.ObjectId;      // 关联的工单ID（可选）
  user?: mongoose.Types.ObjectId;                 // 关联用户ID（可选）
  technician?: mongoose.Types.ObjectId;           // 直接指定的技师ID（可选）
  technicianName?: string;                        // 技师姓名（可选）
}

/**
 * 客户信息数据模式
 * 定义客户信息在数据库中的结构和验证规则
 */
const customerSchema = new Schema<ICustomer>({
  // 客户姓名
  name: {
    type: String,                          // 字符串类型
    required: [true, '客户姓名为必填项'],    // 必填，错误提示
    trim: true,                           // 自动去除前后空格
  },
  // 联系电话
  phone: {
    type: String,                          // 字符串类型
    required: [true, '联系电话为必填项'],    // 必填，错误提示
    trim: true,                           // 自动去除前后空格
  },
  // 电子邮箱（可选）
  email: {
    type: String,                          // 字符串类型
    trim: true,                           // 自动去除前后空格
  },
});

/**
 * 时间段数据模式
 * 定义预约时间段在数据库中的结构和验证规则
 */
const timeSlotSchema = new Schema<ITimeSlot>({
  // 预约日期
  date: {
    type: Date,                            // 日期类型
    required: [true, '预约日期为必填项'],    // 必填，错误提示
  },
  // 服务开始时间（格式如"09:00"）
  startTime: {
    type: String,                          // 字符串类型
    required: [true, '开始时间为必填项'],    // 必填，错误提示
  },
  // 服务结束时间（格式如"10:30"）
  endTime: {
    type: String,                          // 字符串类型
    required: [true, '结束时间为必填项'],    // 必填，错误提示
  },
  // 负责此时段的技师
  technician: {
    type: Schema.Types.ObjectId,           // 对象ID类型
    ref: 'User',                          // 引用User模型中的技师
    required: false,                      // 不是必填项
  },
});

/**
 * 预约数据模式
 * 定义完整预约记录在数据库中的结构和验证规则
 */
const appointmentSchema = new Schema<IAppointment>(
  {
    // 客户信息，使用上面定义的customerSchema
    customer: {
      type: customerSchema,                 // 使用客户信息模式
      required: [true, '客户信息为必填项'],   // 必填，错误提示
    },
    // 预约车辆
    vehicle: {
      type: Schema.Types.ObjectId,          // 对象ID类型
      ref: 'Vehicle',                      // 引用Vehicle模型
      required: [true, '车辆为必填项'],      // 必填，错误提示
    },
    // 预约服务项目
    service: {
      type: Schema.Types.ObjectId,          // 对象ID类型
      ref: 'Service',                      // 引用Service模型
      required: [true, '服务项目为必填项'],   // 必填，错误提示
    },
    // 预约时间段，使用上面定义的timeSlotSchema
    timeSlot: {
      type: timeSlotSchema,                 // 使用时间段模式
      required: [true, '预约时间为必填项'],   // 必填，错误提示
    },
    // 预约状态
    status: {
      type: String,                         // 字符串类型
      enum: ['pending', 'processed', 'completed', 'cancelled'],  // 枚举值：待处理、已安排、已完成、已取消
      default: 'pending',                  // 默认值：待处理
    },
    // 预计服务时长（分钟）
    estimatedDuration: {
      type: Number,                         // 数字类型
      required: [true, '预计时长为必填项'],   // 必填，错误提示
      min: [1, '预计时长必须大于0分钟'],     // 最小值为1分钟
    },
    // 预计费用（元）
    estimatedCost: {
      type: Number,                         // 数字类型
      required: [true, '预计费用为必填项'],   // 必填，错误提示
      min: [0, '预计费用不能为负数'],        // 最小值为0元
    },
    // 关联的工单（可选，用于从工单创建的预约）
    sourceWorkOrder: {
      type: Schema.Types.ObjectId,          // 对象ID类型
      ref: 'WorkOrder',                    // 引用WorkOrder模型
    },
    // 关联的用户（可选，如果是注册用户创建的预约）
    user: {
      type: Schema.Types.ObjectId,          // 对象ID类型
      ref: 'User',                         // 引用User模型
      required: false,                     // 不是必填项
    },
    // 直接指定的技师（可选）
    technician: {
      type: Schema.Types.ObjectId,          // 对象ID类型
      ref: 'User',                         // 引用User模型
      required: false,                     // 不是必填项
    },
    // 技师姓名（可选，冗余存储便于显示）
    technicianName: {
      type: String,                         // 字符串类型
      required: false,                     // 不是必填项
    },
  },
  {
    timestamps: true,                      // 自动管理createdAt和updatedAt字段
  }
);

/**
 * 获取预约模型函数
 * 使用函数获取模型，避免在热重载时重复定义模型导致错误
 * 
 * @returns {Model<IAppointment>} 返回预约数据模型，可用于数据库操作
 */
export function getAppointmentModel(): Model<IAppointment> {
  // 如果模型已存在则返回现有模型，否则创建新模型
  return mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', appointmentSchema);
}

/**
 * 导出预约模型
 * 调用getAppointmentModel函数获取模型并导出
 */
export default getAppointmentModel(); 