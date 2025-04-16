// 生成汽车维修系统测试数据脚本
require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker/locale/zh_CN');
const bcrypt = require('bcryptjs');

// 定义常量
const USER_ROLES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer'
};

// 工单状态、优先级和类型常量
const WORK_ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  PENDING_CHECK: 'pending_check',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const WORK_ORDER_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

const WORK_ORDER_TYPE = {
  REPAIR: 'repair',
  MAINTENANCE: 'maintenance',
  INSPECTION: 'inspection'
};

// 定义模型Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    // 用作登录名和显示名称
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.CUSTOMER,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  specialties: {
    type: [String],
    default: [],
  },
  workExperience: {
    type: Number,
    default: 0,
  },
  certifications: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  completedOrders: {
    type: Number,
    default: 0,
  },
  notes: String,
}, {
  timestamps: true,
});

const vehicleSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
  },
  vin: {
    type: String,
    required: true,
    unique: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  ownerPhone: {
    type: String,
    required: true,
  },
  mileage: {
    type: Number,
    default: 0,
  },
  lastMaintenanceDate: {
    type: Date,
  },
  nextMaintenanceDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const partSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['engine', 'transmission', 'brake', 'electrical', 'body', 'other'],
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  minStock: {
    type: Number,
    default: 5,
    min: 0,
  },
  unit: {
    type: String,
    default: '个',
  },
  manufacturer: String,
  location: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true,
});

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
});

const timeSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
});

const appointmentSchema = new mongoose.Schema({
  customer: {
    type: customerSchema,
    required: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  timeSlot: {
    type: timeSlotSchema,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'completed', 'cancelled'],
    default: 'pending',
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1,
  },
  estimatedCost: {
    type: Number,
    required: true,
    min: 0,
  },
  sourceWorkOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  technicianName: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const workOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  vehicleBrand: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  vehicleLicensePlate: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technicianName: { type: String },
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
    part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  estimatedHours: { type: Number, required: true, min: 0 },
  actualHours: { type: Number, min: 0 },
  startDate: { type: Date, required: true },
  completionDate: Date,
  customerNotes: String,
  technicianNotes: String,
  progress: [{
    status: { 
      type: String, 
      required: true,
      enum: Object.values(WORK_ORDER_STATUS)
    },
    notes: String,
    timestamp: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  rating: { type: Number, min: 1, max: 5 },
  feedback: String,
}, {
  timestamps: true
});

const workOrderProgressSchema = new mongoose.Schema({
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true
  },
  status: {
    type: String,
    required: true
  },
  note: String,
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const workOrderEvaluationSchema = new mongoose.Schema({
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technicianName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    required: true
  },
  note: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const maintenancePartSchema = new mongoose.Schema({
  part: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const maintenanceSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  vehicleBrand: {
    type: String,
    required: true
  },
  vehicleModel: {
    type: String,
    required: true
  },
  vehicleLicensePlate: {
    type: String,
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technicianName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['regular', 'repair', 'inspection']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  completionDate: Date,
  mileage: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  parts: [maintenancePartSchema],
  customer: {
    name: {
      type: String,
      required: true
    },
    contact: {
      type: String,
      required: true
    }
  },
  notes: String,
  statusHistory: [statusHistorySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const reviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    default: ''
  },
  targetType: {
    type: String,
    enum: ['technician', 'service', 'store'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder'
  },
  workOrderNumber: {
    type: String
  },
  maintenanceRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance'
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'rejected', 'hidden'],
    default: 'published'
  },
  images: {
    type: [String],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
}, {
  timestamps: true
});

// 在此模块中注册模型
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
const Part = mongoose.models.Part || mongoose.model('Part', partSchema);
const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
const WorkOrder = mongoose.models.WorkOrder || mongoose.model('WorkOrder', workOrderSchema);
const WorkOrderProgress = mongoose.models.WorkOrderProgress || mongoose.model('WorkOrderProgress', workOrderProgressSchema);
const WorkOrderEvaluation = mongoose.models.WorkOrderEvaluation || mongoose.model('WorkOrderEvaluation', workOrderEvaluationSchema);
const Maintenance = mongoose.models.Maintenance || mongoose.model('Maintenance', maintenanceSchema);
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

let adminUser;
let technicians = [];
let customers = [];
let vehicles = [];
let parts = [];
let services = [];
let appointments = [];
let workOrders = [];
let maintenanceRecords = [];
let reviews = [];
let evaluations = [];

// 随机数生成工具
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// 随机生成过去的日期
const getRandomPastDate = (months = 6) => {
  const date = new Date();
  date.setMonth(date.getMonth() - getRandomInt(0, months));
  date.setDate(getRandomInt(1, 28));
  return date;
};

// 随机生成未来的日期
const getRandomFutureDate = (months = 3) => {
  const date = new Date();
  date.setMonth(date.getMonth() + getRandomInt(0, months));
  date.setDate(getRandomInt(1, 28));
  return date;
};

// 生成唯一的订单编号
const generateOrderNumber = () => {
  return `WO${Date.now().toString().slice(-8)}${getRandomInt(1000, 9999)}`;
};

// 生成技师专长
const generateSpecialties = () => {
  const allSpecialties = [
    '发动机维修', '变速箱维修', '电气系统', '底盘悬挂', '空调系统',
    '刹车系统', '燃油系统', '排气系统', '车身钣金', '汽车美容',
    '汽车保养', '轮胎更换', '电脑诊断', '车辆改装'
  ];
  
  const numSpecialties = getRandomInt(1, 4);
  const specialties = [];
  
  for (let i = 0; i < numSpecialties; i++) {
    const specialty = getRandomElement(allSpecialties);
    if (!specialties.includes(specialty)) {
      specialties.push(specialty);
    }
  }
  
  return specialties;
};

// 生成证书
const generateCertifications = () => {
  const allCertifications = [
    '汽车维修高级技师', '发动机维修专业认证', '电子电气系统专家',
    '变速箱维修认证', '底盘系统专家', '车身修复技师', 
    '汽车空调系统专家', '汽车美容专家', '燃油系统专家',
    '汽车检测诊断师', '汽车售后服务管理师'
  ];
  
  const numCertifications = getRandomInt(1, 3);
  const certifications = [];
  
  for (let i = 0; i < numCertifications; i++) {
    const certification = getRandomElement(allCertifications);
    if (!certifications.includes(certification)) {
      certifications.push(certification);
    }
  }
  
  return certifications;
};

// 生成车牌号
const generateLicensePlate = () => {
  const provinces = ['京', '沪', '粤', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '琼', '川', '渝'];
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  
  const province = getRandomElement(provinces);
  const letter = getRandomElement(letters.split(''));
  const numbers = faker.string.numeric(5);
  
  return `${province}${letter}${numbers}`;
};

// 生成VIN码
const generateVIN = () => {
  const characters = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return vin;
};

// 生成车型
const generateVehicleModel = (brand) => {
  const brandModels = {
    '大众': ['朗逸', '帕萨特', '途观', '高尔夫', '宝来', '速腾', '迈腾', 'ID.4'],
    '丰田': ['卡罗拉', '凯美瑞', '汉兰达', '雷凌', '普拉多', '亚洲龙', 'RAV4'],
    '本田': ['思域', 'CR-V', '雅阁', '飞度', '缤智', '冠道', '皓影'],
    '奔驰': ['C级', 'E级', 'S级', 'GLA', 'GLC', 'GLE', 'GLB'],
    '宝马': ['3系', '5系', 'X1', 'X3', 'X5', '7系', 'iX3'],
    '奥迪': ['A4L', 'A6L', 'Q3', 'Q5L', 'A3', 'Q7', 'e-tron'],
    '现代': ['途胜', '伊兰特', '胜达', '索纳塔', 'ix35'],
    '起亚': ['K3', 'K5', 'KX5', '智跑', '狮跑'],
    '福特': ['福克斯', '蒙迪欧', '锐界', '翼虎', '探险者'],
    '日产': ['轩逸', '天籁', '奇骏', '逍客', '楼兰'],
    '别克': ['英朗', '君威', '君越', '昂科威', '昂科拉'],
    '雪佛兰': ['科鲁兹', '迈锐宝', '探界者', '科帕奇', '赛欧'],
    '吉利': ['博越', '缤瑞', '帝豪', '远景', '豪越'],
    '长安': ['CS75', 'CS55', 'UNI-T', '逸动', 'CS35'],
    '比亚迪': ['唐', '宋', '秦', '汉', '元']
  };
  
  return brandModels[brand] ? getRandomElement(brandModels[brand]) : '未知';
};

// 连接数据库
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('成功连接到MongoDB数据库');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
}

// 生成用户数据
async function generateUsers() {
  // 检查是否已存在管理员用户
  const existingAdmin = await User.findOne({ username: '系统管理员' });
  
  if (existingAdmin) {
    console.log('使用已存在的管理员用户');
    adminUser = existingAdmin;
  } else {
    // 生成管理员用户
    adminUser = await User.create({
      username: '系统管理员',
      email: 'admin@carbay.com',
      password: await bcrypt.hash('password123', 10),
      phone: '13800138000',
      role: USER_ROLES.ADMIN,
      status: 'active',
    });
    
    console.log('创建管理员用户成功');
  }
  
  // 生成技师用户 (10-20个)
  const numTechnicians = getRandomInt(10, 20);
  
  for (let i = 0; i < numTechnicians; i++) {
    const firstName = faker.person.lastName();
    const lastName = faker.person.firstName();
    const fullName = `${firstName}${lastName}`;
    
    const technician = await User.create({
      username: fullName,
      email: faker.internet.email({ firstName, lastName }),
      password: await bcrypt.hash('password123', 10),
      phone: `1${faker.string.numeric(10)}`, // 确保11位手机号
      role: USER_ROLES.TECHNICIAN,
      status: 'active',
      specialties: generateSpecialties(),
      workExperience: getRandomInt(1, 15),
      certifications: generateCertifications(),
      rating: parseFloat((Math.random() * 3 + 2).toFixed(1)), // 2.0 - 5.0
      totalOrders: getRandomInt(20, 200),
      completedOrders: getRandomInt(10, 180),
      notes: Math.random() > 0.7 ? faker.lorem.sentence() : ''
    });
    
    technicians.push(technician);
  }
  
  console.log(`创建 ${numTechnicians} 个技师用户成功`);
  
  // 生成客户用户 (30-50个)
  const numCustomers = getRandomInt(30, 50);
  
  for (let i = 0; i < numCustomers; i++) {
    const firstName = faker.person.lastName();
    const lastName = faker.person.firstName();
    const fullName = `${firstName}${lastName}`;
    
    const customer = await User.create({
      username: fullName,
      email: faker.internet.email({ firstName, lastName }),
      password: await bcrypt.hash('password123', 10),
      phone: `1${faker.string.numeric(10)}`, // 确保11位手机号
      role: USER_ROLES.CUSTOMER,
      status: 'active',
    });
    
    customers.push(customer);
  }
  
  console.log(`创建 ${numCustomers} 个客户用户成功`);
}

// 生成车辆数据
async function generateVehicles() {
  const carBrands = ['大众', '丰田', '本田', '奔驰', '宝马', '奥迪', '现代', '起亚', '福特', '日产', '别克', '雪佛兰', '吉利', '长安', '比亚迪'];
  
  // 每个客户1-3辆车
  for (const customer of customers) {
    const numVehicles = getRandomInt(1, 3);
    
    for (let i = 0; i < numVehicles; i++) {
      const brand = getRandomElement(carBrands);
      const model = generateVehicleModel(brand);
      const year = getRandomInt(2010, 2024);
      
      const vehicle = await Vehicle.create({
        brand,
        model,
        year,
        licensePlate: generateLicensePlate(),
        vin: generateVIN(),
        owner: customer._id,
        ownerName: customer.username,
        ownerPhone: customer.phone,
        mileage: getRandomInt(1000, 150000),
        lastMaintenanceDate: getRandomPastDate(12),
        nextMaintenanceDate: getRandomFutureDate(6),
        status: getRandomElement(['active', 'active', 'active', 'maintenance']),
        notes: Math.random() > 0.8 ? faker.lorem.sentence() : '',
      });
      
      vehicles.push(vehicle);
    }
  }
  
  console.log(`创建 ${vehicles.length} 辆车辆成功`);
}

// 生成配件数据
async function generateParts() {
  const partCategories = ['engine', 'transmission', 'brake', 'electrical', 'body', 'other'];
  const partNames = {
    engine: ['机油滤清器', '空气滤清器', '火花塞', '正时皮带', '凸轮轴', '曲轴', '活塞', '汽缸垫', '机油泵', '水泵', '节气门', '燃油滤清器'],
    transmission: ['变速箱油', '离合器片', '变速箱滤清器', '变速箱电脑', '差速器', '变速箱壳体', '离合器分离轴承', '变速箱同步器'],
    brake: ['刹车片', '刹车盘', '刹车卡钳', '刹车油', '刹车主缸', 'ABS传感器', '刹车管路', '手刹拉线', '刹车助力泵'],
    electrical: ['蓄电池', '发电机', '起动机', '点火线圈', '氧传感器', '节温器', '水温传感器', '喇叭', '雨刷电机', '车灯', '继电器', '保险丝'],
    body: ['前保险杠', '后保险杠', '引擎盖', '车门', '挡风玻璃', '后视镜', '轮毂', '雨刷', '天线', '车窗升降器'],
    other: ['轮胎', '减震器', '方向机', '转向助力泵', '球头', '汽车空调压缩机', '空调滤清器', '雨刮片', '车窗玻璃', '后备箱支撑杆']
  };
  
  const manufacturers = ['博世', '德尔福', '电装', '法雷奥', '马勒', '大陆', '李尔', '万向', '法兰克福', '舍弗勒', '采埃孚', '天合', '日立', '现代摩比斯'];
  
  // 生成50-80个配件
  const numParts = getRandomInt(50, 80);
  
  for (let i = 0; i < numParts; i++) {
    const category = getRandomElement(partCategories);
    const name = getRandomElement(partNames[category]);
    
    const part = await Part.create({
      name: `${name}${Math.random() > 0.7 ? ' ' + faker.commerce.productAdjective() : ''}`,
      code: `P${faker.string.alphanumeric(6).toUpperCase()}`,
      category,
      description: Math.random() > 0.5 ? faker.lorem.sentence() : '',
      price: parseFloat((Math.random() * 9000 + 100).toFixed(2)),
      stock: getRandomInt(5, 100),
      minStock: getRandomInt(3, 10),
      unit: getRandomElement(['个', '套', '件', '对']),
      manufacturer: getRandomElement(manufacturers),
      location: `${getRandomElement(['A', 'B', 'C', 'D', 'E'])}区-${getRandomInt(1, 10)}架-${getRandomInt(1, 20)}层`,
      status: getRandomElement(['active', 'active', 'active', 'inactive']),
    });
    
    parts.push(part);
  }
  
  console.log(`创建 ${numParts} 个配件成功`);
}

// 生成服务数据
async function generateServices() {
  const serviceData = [
    { name: '常规保养套餐', category: '保养', duration: 60, basePrice: 588 },
    { name: '全车检查', category: '检查', duration: 45, basePrice: 288 },
    { name: '机油和机滤更换', category: '保养', duration: 30, basePrice: 388 },
    { name: '刹车系统保养', category: '保养', duration: 60, basePrice: 588 },
    { name: '变速箱油更换', category: '保养', duration: 90, basePrice: 988 },
    { name: '火花塞更换', category: '维修', duration: 60, basePrice: 488 },
    { name: '空调系统检查与加氟', category: '检查', duration: 60, basePrice: 388 },
    { name: '电池检测与更换', category: '维修', duration: 30, basePrice: 288 },
    { name: '四轮定位', category: '维修', duration: 60, basePrice: 388 },
    { name: '喷油嘴清洗', category: '维修', duration: 60, basePrice: 588 },
    { name: '节气门清洗', category: '维修', duration: 45, basePrice: 388 },
    { name: '冷却系统清洗', category: '维修', duration: 90, basePrice: 688 },
    { name: '进气系统清洗', category: '维修', duration: 60, basePrice: 488 },
    { name: '轮胎更换与平衡', category: '维修', duration: 60, basePrice: 188 },
    { name: '底盘护理', category: '保养', duration: 45, basePrice: 388 },
    { name: '发动机舱清洗', category: '保养', duration: 60, basePrice: 298 },
    { name: '前大灯调整', category: '维修', duration: 30, basePrice: 188 },
    { name: '雨刮器更换', category: '维修', duration: 20, basePrice: 118 },
    { name: '发动机故障诊断', category: '检查', duration: 60, basePrice: 288 },
    { name: '电控系统检测', category: '检查', duration: 45, basePrice: 388 },
  ];
  
  for (const service of serviceData) {
    const newService = await Service.create({
      name: service.name,
      description: faker.lorem.paragraph(),
      category: service.category,
      duration: service.duration,
      basePrice: service.basePrice
    });
    
    services.push(newService);
  }
  
  console.log(`创建 ${services.length} 个服务项目成功`);
}

// 生成预约数据
async function generateAppointments() {
  // 生成30-50个预约
  const numAppointments = getRandomInt(30, 50);
  
  for (let i = 0; i < numAppointments; i++) {
    const customer = getRandomElement(customers);
    const vehicle = getRandomElement(vehicles.filter(v => v.owner.toString() === customer._id.toString()));
    const service = getRandomElement(services);
    const technician = getRandomElement(technicians);
    
    // 生成日期和时间
    const isHistory = Math.random() > 0.3; // 70%是历史预约，30%是未来预约
    const appointmentDate = isHistory ? getRandomPastDate(3) : getRandomFutureDate(1);
    
    // 生成时间段
    const hours = getRandomInt(9, 16);
    const minutes = getRandomElement(['00', '30']);
    const startTime = `${hours}:${minutes}`;
    const endTime = `${hours + Math.ceil(service.duration / 60)}:${minutes}`;
    
    const status = isHistory 
      ? getRandomElement(['completed', 'completed', 'completed', 'cancelled']) 
      : getRandomElement(['pending', 'pending', 'pending', 'processed']);
    
    const newAppointment = await Appointment.create({
      customer: {
        name: customer.username,
        phone: customer.phone,
        email: customer.email
      },
      vehicle: vehicle._id,
      service: service._id,
      timeSlot: {
        date: appointmentDate,
        startTime,
        endTime,
        technician: technician._id
      },
      status,
      estimatedDuration: service.duration,
      estimatedCost: service.basePrice,
      user: customer._id,
      technician: technician._id,
      technicianName: technician.username,
    });
    
    appointments.push(newAppointment);
  }
  
  console.log(`创建 ${numAppointments} 个预约成功`);
}

// 生成工单数据
async function generateWorkOrders() {
  // 为70%的历史预约生成工单
  const historyAppointments = appointments.filter(a => 
    a.status === 'completed' && 
    new Date(a.timeSlot.date) < new Date()
  );
  
  for (const appointment of historyAppointments) {
    const orderNumber = generateOrderNumber();
    const customer = customers.find(c => c._id.toString() === appointment.user.toString());
    const vehicle = vehicles.find(v => v._id.toString() === appointment.vehicle.toString());
    const technician = technicians.find(t => t._id.toString() === appointment.timeSlot.technician.toString());
    const service = services.find(s => s._id.toString() === appointment.service.toString());
    
    // 随机选择1-5个配件
    const usedParts = [];
    const numParts = getRandomInt(1, 5);
    for (let i = 0; i < numParts; i++) {
      const part = getRandomElement(parts);
      const quantity = getRandomInt(1, 3);
      
      usedParts.push({
        part: part._id,
        quantity,
        price: part.price
      });
    }
    
    const startDate = new Date(appointment.timeSlot.date);
    const completionDate = new Date(startDate);
    completionDate.setHours(completionDate.getHours() + getRandomInt(1, 8));
    
    // 添加工单进度记录
    const progressStatuses = ['pending', 'assigned', 'in_progress', 'completed'];
    const progress = [];
    
    // 为每个状态创建一个进度记录
    for (let i = 0; i < progressStatuses.length; i++) {
      const progressDate = new Date(startDate);
      progressDate.setHours(progressDate.getHours() + i * 2); // 每2小时一个状态更新
      
      progress.push({
        status: progressStatuses[i],
        notes: faker.lorem.sentence(),
        timestamp: progressDate,
        user: i === 0 ? adminUser._id : technician._id
      });
    }
    
    // 70%的工单有评分 (1-5)，30%的工单没有评分 (null)
    const hasRating = Math.random() > 0.3;
    const rating = hasRating ? getRandomInt(3, 5) : null;
    
    // 生成中文反馈内容
    const chineseFeedbacks = [
      "服务很满意，技师很专业，解决了我车辆的问题。",
      "技师态度很好，修车速度快，价格合理。",
      "整体服务不错，就是等待时间有点长。",
      "修车质量很好，技师解释得很清楚。",
      "服务一般，但价格合理。",
      "技师很有耐心，详细解答了我的疑问。",
      "维修很彻底，之前的问题没有再出现。",
      "技师很专业，快速诊断出了问题所在。",
      "服务超出预期，以后会继续光顾。",
      "维修及时，服务态度很好。",
      "价格比预期的要高，但修得很好。",
      "技师专业水平高，一次就解决了问题。",
      "服务态度很好，环境也很干净。",
      "修车过程透明，没有乱收费。",
      "预约系统很方便，维修也很及时。"
    ];
    
    const feedback = hasRating ? getRandomElement(chineseFeedbacks) : null;
    
    // 随机工单状态，不全是completed
    const workOrderStatuses = [
      WORK_ORDER_STATUS.PENDING,
      WORK_ORDER_STATUS.ASSIGNED,
      WORK_ORDER_STATUS.IN_PROGRESS,
      WORK_ORDER_STATUS.COMPLETED,
      WORK_ORDER_STATUS.COMPLETED,
      WORK_ORDER_STATUS.COMPLETED, // 让completed状态出现的概率高一些
    ];
    
    const workOrderStatus = getRandomElement(workOrderStatuses);
    
    const workOrder = await WorkOrder.create({
      orderNumber,
      vehicle: vehicle._id,
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      vehicleLicensePlate: vehicle.licensePlate,
      customer: customer._id,
      customerName: customer.username,
      customerPhone: customer.phone,
      technician: technician._id,
      technicianName: technician.username,
      type: service.category === '保养' ? WORK_ORDER_TYPE.MAINTENANCE : 
             service.category === '检查' ? WORK_ORDER_TYPE.INSPECTION : 
             WORK_ORDER_TYPE.REPAIR,
      status: workOrderStatus,
      priority: getRandomElement([
        WORK_ORDER_PRIORITY.LOW, 
        WORK_ORDER_PRIORITY.MEDIUM, 
        WORK_ORDER_PRIORITY.MEDIUM, 
        WORK_ORDER_PRIORITY.HIGH
      ]),
      description: `${service.name}: ${service.description}`,
      diagnosis: faker.lorem.paragraph(),
      solution: faker.lorem.paragraph(),
      parts: usedParts,
      estimatedHours: service.duration / 60,
      actualHours: (service.duration / 60) * (0.8 + Math.random() * 0.4), // 实际时间在估计时间的80%-120%之间
      startDate,
      completionDate: workOrderStatus === WORK_ORDER_STATUS.COMPLETED ? completionDate : null,
      customerNotes: Math.random() > 0.7 ? "客户要求尽快完成维修" : '',
      technicianNotes: Math.random() > 0.6 ? "需要更换部分零件，已与客户确认" : '',
      progress,
      rating,
      feedback,
    });
    
    // 创建工单进度记录
    for (const p of progress) {
      await WorkOrderProgress.create({
        workOrder: workOrder._id,
        status: p.status,
        note: p.notes,
        operator: p.user,
        timestamp: p.timestamp
      });
    }
    
    workOrders.push(workOrder);
    
    // 如果工单有评分，创建评价
    if (rating && workOrderStatus === WORK_ORDER_STATUS.COMPLETED) {
      const evaluation = await WorkOrderEvaluation.create({
        workOrder: workOrder._id,
        customer: customer._id,
        customerName: customer.username,
        technician: technician._id,
        technicianName: technician.username,
        rating,
        feedback: feedback || '',
      });
      
      evaluations.push(evaluation);
      
      // 50%的评价还创建一条Review
      if (Math.random() > 0.5) {
        // 中文评论内容
        const reviewContents = [
          "车子的问题彻底解决了，技师很专业。",
          "维修质量很好，技师态度也很友好。",
          "服务很及时，解决了我的燃眉之急。",
          "技师很耐心地解释了车辆问题，让我明白了很多。",
          "维修过程透明，没有额外收费，很满意。",
          "预约系统很方便，到店就能直接维修。",
          "技师经验丰富，一眼就看出了问题所在。",
          "价格合理，服务也很到位。",
          "维修车间很干净，感觉很专业。",
          "修车速度很快，不用久等。",
          "技师给了我很多车辆保养的建议，很实用。",
          "问题解决得很彻底，开着车回家很放心。",
          "服务超出预期，以后车子有问题还会再来。",
          "技师水平专业，修车很仔细。",
          "店里环境很好，等待区也很舒适。"
        ];
        
        const tags = ['满意', '专业', '高效', '热情', '准时', '价格合理', '技术好', '服务周到', '环境好', '值得推荐'];
        
        const review = await Review.create({
          author: customer._id,
          authorName: customer.username,
          targetType: Math.random() > 0.3 ? 'technician' : 'service',
          targetId: Math.random() > 0.3 ? technician._id : service._id,
          content: getRandomElement(reviewContents),
          rating,
          workOrder: workOrder._id,
          workOrderNumber: workOrder.orderNumber,
          status: 'published',
          tags: Math.random() > 0.5 ? [getRandomElement(tags)] : [],
        });
        
        reviews.push(review);
        
        // 20%的评价有回复
        if (Math.random() > 0.8) {
          const replies = [
            "感谢您的评价，我们会继续努力提供更好的服务。",
            "谢谢您的认可，您的满意是我们最大的动力。",
            "感谢您的反馈，期待您下次光临。",
            "谢谢您对我们工作的肯定，欢迎再次惠顾。",
            "非常感谢您的好评，我们将继续为您提供优质服务。"
          ];
          
          review.replies = [{
            author: technician._id,
            content: getRandomElement(replies),
            createdAt: new Date()
          }];
          await review.save();
        }
      }
    }
    
    // 为工单创建维修记录
    const maintenance = await Maintenance.create({
      vehicle: vehicle._id,
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      vehicleLicensePlate: vehicle.licensePlate,
      technician: technician._id,
      technicianName: technician.username,
      type: workOrder.type === WORK_ORDER_TYPE.MAINTENANCE ? 'regular' : 
            workOrder.type === WORK_ORDER_TYPE.INSPECTION ? 'inspection' : 'repair',
      status: workOrderStatus === WORK_ORDER_STATUS.COMPLETED ? 'completed' : 'in_progress',
      description: workOrder.description,
      startDate: workOrder.startDate,
      completionDate: workOrder.completionDate,
      mileage: vehicle.mileage,
      cost: service.basePrice + usedParts.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      parts: usedParts.map(p => ({
        part: p.part,
        quantity: p.quantity,
        unitPrice: p.price,
        totalPrice: p.price * p.quantity
      })),
      customer: {
        name: customer.username,
        contact: customer.phone
      },
      notes: workOrder.technicianNotes,
      statusHistory: progress.map(p => ({
        status: p.status === WORK_ORDER_STATUS.PENDING ? 'pending' : 
               p.status === WORK_ORDER_STATUS.IN_PROGRESS ? 'in_progress' : 
               p.status === WORK_ORDER_STATUS.COMPLETED ? 'completed' : 'cancelled',
        note: p.notes,
        timestamp: p.timestamp,
        updatedBy: p.user
      })),
      createdBy: adminUser._id,
      updatedBy: technician._id
    });
    
    maintenanceRecords.push(maintenance);
  }
  
  console.log(`创建 ${workOrders.length} 个工单成功`);
  console.log(`创建 ${evaluations.length} 个工单评价成功`);
  console.log(`创建 ${reviews.length} 个评论成功`);
  console.log(`创建 ${maintenanceRecords.length} 个维修记录成功`);
}

// 主函数
async function main() {
  try {
    // 连接数据库
    await connectToDatabase();
    
    // 执行数据生成
    console.log('开始生成测试数据...');
    
    // 生成用户数据（管理员、技师和客户）
    await generateUsers();
    
    // 生成车辆数据，每个客户1-3辆车
    await generateVehicles();
    
    // 生成配件数据，包括各种汽车零部件
    await generateParts();
    
    // 生成服务项目数据，如保养、维修等服务
    await generateServices();
    
    // 生成预约数据，包括历史预约和未来预约
    await generateAppointments();
    
    // 生成工单数据，包括维修记录、评价和评论
    await generateWorkOrders();
    
    console.log('测试数据生成完成！');
    process.exit(0);
  } catch (error) {
    console.error('生成测试数据失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 