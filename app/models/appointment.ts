import mongoose, { Schema, Model } from 'mongoose';

// 定义客户信息接口
interface ICustomer {
  name: string;
  phone: string;
  email?: string;
}

// 定义时间段接口
interface ITimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  technician: mongoose.Types.ObjectId;
}

// 定义预约接口
export interface IAppointment {
  customer: ICustomer;
  vehicle: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  timeSlot: ITimeSlot;
  status: 'pending' | 'processed' | 'completed' | 'cancelled';
  estimatedDuration: number;
  estimatedCost: number;
  createdAt: Date;
  updatedAt: Date;
  sourceWorkOrder?: mongoose.Types.ObjectId;
}

// 定义客户信息 Schema
const customerSchema = new Schema<ICustomer>({
  name: {
    type: String,
    required: [true, '客户姓名为必填项'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, '联系电话为必填项'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
});

// 定义时间段 Schema
const timeSlotSchema = new Schema<ITimeSlot>({
  date: {
    type: Date,
    required: [true, '预约日期为必填项'],
  },
  startTime: {
    type: String,
    required: [true, '开始时间为必填项'],
  },
  endTime: {
    type: String,
    required: [true, '结束时间为必填项'],
  },
  technician: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
});

// 定义预约 Schema
const appointmentSchema = new Schema<IAppointment>(
  {
    customer: {
      type: customerSchema,
      required: [true, '客户信息为必填项'],
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, '车辆为必填项'],
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, '服务项目为必填项'],
    },
    timeSlot: {
      type: timeSlotSchema,
      required: [true, '预约时间为必填项'],
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'completed', 'cancelled'],
      default: 'pending',
    },
    estimatedDuration: {
      type: Number,
      required: [true, '预计时长为必填项'],
      min: [1, '预计时长必须大于0分钟'],
    },
    estimatedCost: {
      type: Number,
      required: [true, '预计费用为必填项'],
      min: [0, '预计费用不能为负数'],
    },
    sourceWorkOrder: {
      type: Schema.Types.ObjectId,
      ref: 'WorkOrder',
    },
  },
  {
    timestamps: true,
  }
);

// 使用函数来获取模型，避免重复定义
export function getAppointmentModel(): Model<IAppointment> {
  return mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', appointmentSchema);
}

export default getAppointmentModel(); 