// 配件信息类型定义文件
// 这个文件定义了汽车配件相关的数据结构

// 配件的完整信息结构
// 包含配件的所有属性和数据
export interface Part {
  _id: string;                // 配件的唯一标识号，相当于配件的身份证号码
  name: string;               // 配件名称，例如"空气滤芯"、"机油滤芯"等
  code: string;               // 配件编号，用于快速查找和识别配件的代码
  description?: string;       // 配件描述，详细说明配件的用途和特点（可选字段）
  category?: string;          // 配件分类，如"发动机部件"、"制动系统"等（可选字段）
  manufacturer?: string;      // 制造商名称，生产该配件的厂商（可选字段）
  price: number;              // 配件价格，单位为元
  stock: number;              // 当前库存数量，表示仓库中还剩多少个该配件
  minStock?: number;          // 最小库存数量，低于此数量时系统会提醒需要补货（可选字段）
  unit?: string;              // 计量单位，如"个"、"套"、"箱"等（可选字段）
  location?: string;          // 库存位置，配件在仓库中的具体存放位置（可选字段）
  createdAt: string;          // 创建时间，记录该配件信息首次添加到系统的时间
  updatedAt: string;          // 更新时间，记录该配件信息最后一次修改的时间
}

// 配件表单数据结构
// 用于创建或更新配件信息时的表单数据
export interface PartFormData {
  name: string;               // 配件名称
  code: string;               // 配件编号
  description?: string;       // 配件描述（可选）
  category?: string;          // 配件分类（可选）
  manufacturer?: string;      // 制造商名称（可选）
  price: number;              // 配件价格
  stock: number;              // 库存数量
  minStock?: number;          // 最小库存数量（可选）
  unit?: string;              // 计量单位（可选）
  location?: string;          // 库存位置（可选）
}

// 配件列表响应数据结构
// 从服务器获取配件列表时的返回数据格式
export interface PartResponse {
  data: {
    data: Part[];             // 配件数据数组，包含多个配件信息
    total: number;            // 符合条件的配件总数
    page: number;             // 当前页码
    limit: number;            // 每页显示的配件数量
    totalPages: number;       // 总页数
  };
} 