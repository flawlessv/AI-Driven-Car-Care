/**
 * 车辆数据模型文件
 * 
 * 这个文件定义了系统中"车辆"的数据结构和相关操作
 * 它存储了每辆车的基本信息、所有权、维护状态等数据
 */

// 导入mongoose库，它是用来与MongoDB数据库通信的工具
import mongoose from 'mongoose';

/**
 * 车辆数据模式定义
 * 这个模式详细描述了车辆对象在数据库中的结构和验证规则
 */
const vehicleSchema = new mongoose.Schema({
  // 车辆品牌（如：丰田、本田、大众等）
  brand: {
    type: String,      // 字符串类型
    required: true,    // 必填项
  },
  // 车辆型号（如：卡罗拉、雅阁、帕萨特等）
  model: {
    type: String,      // 字符串类型
    required: true,    // 必填项
  },
  // 车辆生产年份
  year: {
    type: Number,      // 数字类型
    required: true,    // 必填项
  },
  // 车牌号码，用于唯一标识车辆
  licensePlate: {
    type: String,      // 字符串类型
    required: true,    // 必填项
    unique: true,      // 唯一值，不能重复
  },
  // 车辆识别号码(VIN)，每辆车的全球唯一标识
  vin: {
    type: String,      // 字符串类型
    required: true,    // 必填项
    unique: true,      // 唯一值，不能重复
  },
  // 车主信息，关联到用户表
  owner: {
    type: mongoose.Schema.Types.ObjectId,  // 对象ID类型
    ref: 'User',       // 引用User模型
    required: true,    // 必填项
  },
  // 车主姓名，冗余存储便于查询
  ownerName: {
    type: String,      // 字符串类型
    required: true,    // 必填项
  },
  // 车主电话，冗余存储便于联系
  ownerPhone: {
    type: String,      // 字符串类型
    required: true,    // 必填项
  },
  // 当前里程表读数（单位：公里）
  mileage: {
    type: Number,      // 数字类型
    default: 0,        // 默认值为0
  },
  // 上次保养日期
  lastMaintenanceDate: {
    type: Date,        // 日期类型
  },
  // 下次建议保养日期
  nextMaintenanceDate: {
    type: Date,        // 日期类型
  },
  // 车辆状态
  status: {
    type: String,      // 字符串类型
    enum: ['active', 'inactive', 'maintenance'],  // 枚举值：活跃、非活跃、保养中
    default: 'active', // 默认为活跃状态
  },
  // 备注信息，记录其他需要注意的事项
  notes: String,       // 字符串类型，可选
  // 创建时间，记录车辆信息首次添加的时间
  createdAt: {
    type: Date,        // 日期类型
    default: Date.now, // 默认为当前时间
  },
  // 更新时间，记录车辆信息最后一次修改的时间
  updatedAt: {
    type: Date,        // 日期类型
    default: Date.now, // 默认为当前时间
  },
});

/**
 * 中间件：在保存车辆数据前执行
 * 自动更新updatedAt字段为当前时间
 */
vehicleSchema.pre('save', function(next) {
  // 设置更新时间为当前时间
  this.updatedAt = new Date();
  // 继续保存过程
  next();
});

/**
 * 创建Vehicle模型
 * 如果模型已经存在，则使用现有模型
 * 否则，根据vehicleSchema创建一个新的模型
 */
const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);

// 导出Vehicle模型，供其他文件使用
export default Vehicle; 