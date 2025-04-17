/**
 * 零配件数据模型文件
 * 
 * 这个文件定义了系统中"零配件"的数据结构和相关操作
 * 零配件是维修和保养汽车时使用的各种物料，如机油滤芯、刹车片等
 */

// 导入mongoose库，它是用来与MongoDB数据库通信的工具
import mongoose from 'mongoose';

/**
 * 零配件数据模式
 * 定义零配件在数据库中的结构和验证规则
 */
const partSchema = new mongoose.Schema({
  // 配件名称
  name: {
    type: String,          // 字符串类型
    required: true,        // 必填项
  },
  // 配件编码，用于唯一标识配件
  code: {
    type: String,          // 字符串类型
    required: true,        // 必填项
    unique: true,          // 唯一值，不能重复
  },
  // 配件分类
  category: {
    type: String,          // 字符串类型
    required: true,        // 必填项
    enum: ['engine', 'transmission', 'brake', 'electrical', 'body', 'other'],  // 枚举值：发动机、变速箱、制动系统、电气系统、车身、其他
  },
  // 配件描述，详细说明配件的用途和特点
  description: String,     // 字符串类型，可选
  // 配件价格
  price: {
    type: Number,          // 数字类型
    required: true,        // 必填项
    min: 0,                // 最小值为0，不能为负数
  },
  // 当前库存数量
  stock: {
    type: Number,          // 数字类型
    required: true,        // 必填项
    default: 0,            // 默认值为0
    min: 0,                // 最小值为0，不能为负数
  },
  // 最低库存警戒线，低于此值会提醒补货
  minStock: {
    type: Number,          // 数字类型
    default: 5,            // 默认值为5个
    min: 0,                // 最小值为0
  },
  // 计量单位，如"个"、"升"、"套"等
  unit: {
    type: String,          // 字符串类型
    default: '个',         // 默认值为"个"
  },
  // 制造商名称
  manufacturer: String,    // 字符串类型，可选
  // 库存位置，便于查找配件
  location: String,        // 字符串类型，可选
  // 配件状态
  status: {
    type: String,          // 字符串类型
    enum: ['active', 'inactive', 'discontinued'],  // 枚举值：激活（可用）、未激活、已停产
    default: 'active',     // 默认值为"激活"
  },
  // 创建时间，记录配件信息首次添加的时间
  createdAt: {
    type: Date,            // 日期类型
    default: Date.now,     // 默认为当前时间
  },
  // 更新时间，记录配件信息最后一次修改的时间
  updatedAt: {
    type: Date,            // 日期类型
    default: Date.now,     // 默认为当前时间
  },
});

/**
 * 中间件：在保存配件数据前执行
 * 自动更新updatedAt字段为当前时间
 */
partSchema.pre('save', function(next) {
  // 设置更新时间为当前时间
  this.updatedAt = new Date();
  // 继续保存过程
  next();
});

/**
 * 虚拟属性：库存不足标志
 * 
 * 这是一个计算属性，根据当前库存和最低库存警戒线比较，判断是否库存不足
 * 虚拟属性不会存储在数据库中，但可以在查询结果中使用
 * 
 * @returns {boolean} 如果当前库存小于或等于最低库存警戒线，返回true，否则返回false
 */
partSchema.virtual('lowStock').get(function() {
  return this.stock <= this.minStock;
});

/**
 * 创建Part模型
 * 如果模型已经存在，则使用现有模型
 * 否则，根据partSchema创建一个新的模型
 */
const Part = mongoose.models.Part || mongoose.model('Part', partSchema);

// 导出Part模型，供其他文件使用
export default Part; 