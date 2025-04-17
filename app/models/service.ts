/**
 * 服务项目数据模型文件
 * 
 * 这个文件定义了系统中"服务项目"的数据结构和相关操作
 * 服务项目是汽车维修保养系统提供的各种服务类型，如"机油更换"、"轮胎更换"等
 */

// 导入mongoose库及其类型，用于定义数据结构和与数据库交互
import mongoose, { Schema, Model } from 'mongoose';

/**
 * 服务项目接口
 * 定义服务项目包含的所有信息字段
 * 
 * @property {string} name - 服务名称，如"机油更换"、"轮胎更换"等
 * @property {string} description - 服务描述，介绍服务内容（可选）
 * @property {string} category - 服务类别：维修、保养或检查
 * @property {number} duration - 预计完成时长（分钟）
 * @property {number} basePrice - 基础价格（元）
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */
export interface IService {
  name: string;                       // 服务名称
  description?: string;               // 服务描述（可选）
  category: '维修' | '保养' | '检查';   // 服务类别，只能是这三种之一
  duration: number;                   // 预计时长（分钟）
  basePrice: number;                  // 基础价格（元）
  createdAt: Date;                    // 创建时间
  updatedAt: Date;                    // 更新时间
}

/**
 * 服务项目数据模式
 * 定义服务项目在数据库中的结构和验证规则
 */
const serviceSchema = new Schema<IService>(
  {
    // 服务名称
    name: {
      type: String,                         // 字符串类型
      required: [true, '服务名称为必填项'],    // 必填，错误提示
      trim: true,                           // 自动去除前后空格
    },
    // 服务描述
    description: {
      type: String,                         // 字符串类型
      trim: true,                           // 自动去除前后空格
    },
    // 服务类别
    category: {
      type: String,                         // 字符串类型
      required: [true, '服务类型为必填项'],    // 必填，错误提示
    },
    // 预计完成时长
    duration: {
      type: Number,                         // 数字类型
      required: [true, '预计时长为必填项'],    // 必填，错误提示
      min: [1, '预计时长必须大于0分钟'],       // 最小值为1分钟
    },
    // 基础价格
    basePrice: {
      type: Number,                         // 数字类型
      required: [true, '基础价格为必填项'],    // 必填，错误提示
      min: [0, '基础价格不能为负数'],         // 最小值为0元
    },
  },
  {
    timestamps: true,                       // 自动管理createdAt和updatedAt字段
  }
);

/**
 * 获取服务项目模型函数
 * 使用函数获取模型，避免在热重载时重复定义模型导致错误
 * 
 * @returns {Model<IService>} 返回服务项目数据模型，可用于数据库操作
 */
export function getServiceModel(): Model<IService> {
  // 如果模型已存在则返回现有模型，否则创建新模型
  return mongoose.models.Service || mongoose.model<IService>('Service', serviceSchema);
}

/**
 * 导出服务项目模型
 * 调用getServiceModel函数获取模型并导出
 */
export default getServiceModel(); 