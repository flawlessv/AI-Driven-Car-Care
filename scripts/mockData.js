// 数据生成脚本
const mongoose = require('mongoose');
const { hash } = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('错误: 环境变量中没有找到MONGODB_URI');
  process.exit(1);
}

// 随机生成数据的辅助函数
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// 存储已创建的数据的ID
const ids = {
  users: { customers: [], technicians: [], admins: [] },
  vehicles: [],
  services: [],
  parts: [],
  appointments: [],
  workOrders: [],
};

// 模型定义
const defineModels = () => {
  // 用户模型
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff', 'customer'], default: 'customer' }
  }, { timestamps: true });
  
  // 车辆模型
  const vehicleSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    licensePlate: { type: String, required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ownerName: String,
    ownerContact: String,
    year: { type: Number, default: () => new Date().getFullYear() },
    vin: { type: String, default: () => 'TEMP' + Date.now() },
    mileage: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'maintenance', 'inactive', 'scrapped'], default: 'active' }
  }, { timestamps: true });
  
  // 服务模型
  const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    duration: { type: Number, required: true },
    basePrice: { type: Number, required: true }
  }, { timestamps: true });
  
  // 配件模型
  const partSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, required: true },
    manufacturer: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    minStock: { type: Number, required: true },
    unit: { type: String, default: '个' },
    location: { type: String }
  }, { timestamps: true });
  
  // 预约模型
  const appointmentSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.Mixed, required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: String,
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
    notes: String,
    estimatedDuration: { type: Number, required: true },
    estimatedCost: { type: Number, required: true },
    confirmationSent: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false }
  }, { timestamps: true });
  
  // 工单模型
  const workOrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true },
    description: { type: String, required: true },
    diagnosis: String,
    solution: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], required: true },
    status: { type: String, enum: ['pending', 'assigned', 'in_progress', 'pending_check', 'completed', 'cancelled'], default: 'pending' },
    estimatedHours: { type: Number, min: 0 },
    actualHours: { type: Number, min: 0 },
    startDate: Date,
    completionDate: Date,
    customerNotes: String,
    technicianNotes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }, { timestamps: true });
  
  // 工单评价模型
  const evaluationSchema = new mongoose.Schema({
    workOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    evaluatorInfo: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String,
      email: String
    },
    status: { type: String, enum: ['visible', 'hidden'], default: 'visible' }
  }, { timestamps: true });

  const models = {
    User: mongoose.models.User || mongoose.model('User', userSchema),
    Vehicle: mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema),
    Service: mongoose.models.Service || mongoose.model('Service', serviceSchema),
    Part: mongoose.models.Part || mongoose.model('Part', partSchema),
    Appointment: mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema),
    WorkOrder: mongoose.models.WorkOrder || mongoose.model('WorkOrder', workOrderSchema),
    WorkOrderEvaluation: mongoose.models.WorkOrderEvaluation || mongoose.model('WorkOrderEvaluation', evaluationSchema),
  };

  return models;
};

// 生成数据函数
async function generateData() {
  try {
    console.log('开始连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('已连接到MongoDB');
    
    const models = defineModels();
    
    // 1. 创建管理员账号
    console.log('创建管理员账号...');
    for (let i = 1; i <= 3; i++) {
      const username = `admin${i}`;
      const email = `admin${i}@example.com`;
      const hashedPassword = await hash(`admin${i}`, 10);
      
      const admin = await models.User.create({
        username,
        email,
        password: hashedPassword,
        role: 'admin'
      });
      
      ids.users.admins.push(admin._id);
      console.log(`已创建管理员: ${username}`);
    }
    
    // 2. 创建普通用户
    console.log('创建普通用户...');
    const customerNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'];
    
    for (let i = 0; i < 30; i++) {
      const firstName = getRandomElement(customerNames);
      const username = `customer${i+1}`;
      const email = `customer${i+1}@example.com`;
      const hashedPassword = await hash(`password${i+1}`, 10);
      
      const customer = await models.User.create({
        username,
        email,
        password: hashedPassword,
        role: 'customer'
      });
      
      ids.users.customers.push(customer._id);
    }
    console.log(`已创建 ${ids.users.customers.length} 个普通用户`);
    
    // 3. 创建技师用户
    console.log('创建技师用户...');
    const technicianNames = ['李师傅', '王师傅', '张师傅', '刘师傅', '陈师傅', '杨师傅', '赵师傅', '黄师傅', '周师傅', '吴师傅'];
    
    for (let i = 0; i < 30; i++) {
      const firstName = getRandomElement(technicianNames);
      const username = `technician${i+1}`;
      const email = `technician${i+1}@example.com`;
      const hashedPassword = await hash(`password${i+1}`, 10);
      
      const technician = await models.User.create({
        username,
        email,
        password: hashedPassword,
        role: 'staff'
      });
      
      ids.users.technicians.push(technician._id);
    }
    console.log(`已创建 ${ids.users.technicians.length} 个技师用户`);
    
    // 4. 创建服务项目
    console.log('创建服务项目...');
    const serviceData = [
      { name: '常规保养', description: '包括更换机油、机油滤清器等常规保养项目', category: '保养', duration: 60, basePrice: 300 },
      { name: '全车检查', description: '全车安全检查及故障诊断', category: '检查', duration: 45, basePrice: 200 },
      { name: '轮胎更换', description: '更换轮胎及动平衡', category: '维修', duration: 60, basePrice: 100 },
      { name: '刹车系统检修', description: '刹车片更换及刹车系统维护', category: '维修', duration: 90, basePrice: 500 },
      { name: '空调维修', description: '空调系统检修及加氟', category: '维修', duration: 120, basePrice: 600 },
      { name: '电瓶更换', description: '更换汽车电瓶', category: '维修', duration: 30, basePrice: 800 },
      { name: '变速箱保养', description: '变速箱油更换及系统检查', category: '保养', duration: 120, basePrice: 1000 },
      { name: '发动机大修', description: '发动机拆解检修', category: '维修', duration: 480, basePrice: 5000 },
    ];
    
    for (const service of serviceData) {
      const newService = await models.Service.create(service);
      ids.services.push(newService._id);
    }
    console.log(`已创建 ${ids.services.length} 个服务项目`);
    
    // 5. 创建配件信息
    console.log('创建配件信息...');
    const partCategories = ['发动机', '底盘', '电器', '车身', '内饰', '空调', '转向', '制动'];
    const manufacturers = ['博世', '固特异', '德尔福', '法雷奥', '大陆', '马勒', '日立', '电装', '欧司朗', '飞利浦'];
    
    for (let i = 0; i < 30; i++) {
      const category = getRandomElement(partCategories);
      const manufacturer = getRandomElement(manufacturers);
      const price = getRandomInt(50, 2000);
      
      const part = await models.Part.create({
        name: `${category}配件${i+1}`,
        code: `P${category.charAt(0)}${i+1}${Date.now().toString().substring(10)}`,
        description: `${manufacturer}生产的${category}配件`,
        category,
        manufacturer,
        price,
        stock: getRandomInt(10, 100),
        minStock: getRandomInt(5, 20),
        unit: '个',
        location: `${category}区-${getRandomInt(1, 5)}排-${getRandomInt(1, 20)}号`
      });
      
      ids.parts.push(part._id);
    }
    console.log(`已创建 ${ids.parts.length} 个配件`);
    
    // 6. 创建车辆信息
    console.log('创建车辆信息...');
    const carBrands = ['丰田', '本田', '日产', '大众', '宝马', '奔驰', '奥迪', '福特', '雪佛兰', '现代'];
    const carModels = {
      '丰田': ['卡罗拉', '凯美瑞', 'RAV4', '普拉多', '汉兰达'],
      '本田': ['思域', '雅阁', 'CR-V', '飞度', '奥德赛'],
      '日产': ['轩逸', '天籁', '奇骏', '逍客', '楼兰'],
      '大众': ['高尔夫', '速腾', '迈腾', '途观', '途昂'],
      '宝马': ['3系', '5系', 'X1', 'X3', 'X5'],
      '奔驰': ['C级', 'E级', 'GLC', 'GLE', 'S级'],
      '奥迪': ['A4L', 'A6L', 'Q3', 'Q5L', 'Q7'],
      '福特': ['福克斯', '蒙迪欧', '锐界', '探险者', '翼虎'],
      '雪佛兰': ['科鲁兹', '迈锐宝', '科帕奇', '探界者', '创酷'],
      '现代': ['伊兰特', '索纳塔', '途胜', '胜达', '库斯途']
    };
    
    for (let i = 0; i < 30; i++) {
      const brand = getRandomElement(carBrands);
      const model = getRandomElement(carModels[brand]);
      const year = getRandomInt(2015, 2023);
      const customer = getRandomElement(ids.users.customers);
      const customerObj = await models.User.findById(customer);
      
      const vehicle = await models.Vehicle.create({
        brand,
        model,
        licensePlate: `京${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${getRandomInt(10000, 99999)}`,
        owner: customer,
        ownerName: customerObj.username,
        ownerContact: `1${getRandomInt(3, 8)}${getRandomInt(10000000, 99999999)}`,
        year,
        vin: `VIN${year}${getRandomInt(100000, 999999)}`,
        mileage: getRandomInt(1000, 100000),
        status: 'active'
      });
      
      ids.vehicles.push(vehicle._id);
    }
    console.log(`已创建 ${ids.vehicles.length} 个车辆`);
    
    // 7. 创建预约信息
    console.log('创建预约信息...');
    const appointmentStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
    
    for (let i = 0; i < 30; i++) {
      const vehicle = getRandomElement(ids.vehicles);
      const vehicleObj = await models.Vehicle.findById(vehicle);
      const customer = vehicleObj.owner;
      const customerObj = await models.User.findById(customer);
      const service = getRandomElement(ids.services);
      const serviceObj = await models.Service.findById(service);
      const technician = getRandomElement(ids.users.technicians);
      const status = getRandomElement(appointmentStatuses);
      const date = getRandomDate(new Date(2023, 0, 1), new Date(2023, 11, 31));
      const startTime = getRandomElement(timeSlots);
      
      // 计算结束时间
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const endHour = Math.floor((startHour + serviceObj.duration / 60) % 24);
      const endMinute = (startMinute + serviceObj.duration % 60) % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      const appointment = await models.Appointment.create({
        customer: {
          name: customerObj.username,
          phone: `1${getRandomInt(3, 8)}${getRandomInt(10000000, 99999999)}`,
          email: customerObj.email
        },
        vehicle,
        service,
        date,
        startTime,
        endTime,
        technician,
        status,
        notes: status === 'cancelled' ? '客户取消预约' : '',
        estimatedDuration: serviceObj.duration,
        estimatedCost: serviceObj.basePrice,
        confirmationSent: status !== 'pending',
        reminderSent: ['confirmed', 'in_progress', 'completed'].includes(status)
      });
      
      ids.appointments.push(appointment._id);
    }
    console.log(`已创建 ${ids.appointments.length} 个预约`);
    
    // 8. 创建工单信息
    console.log('创建工单信息...');
    const workOrderTypes = ['常规保养', '故障维修', '事故维修', '安装改装', '质保维修'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['pending', 'assigned', 'in_progress', 'pending_check', 'completed', 'cancelled'];
    
    for (let i = 0; i < 30; i++) {
      const vehicle = getRandomElement(ids.vehicles);
      const vehicleObj = await models.Vehicle.findById(vehicle);
      const customer = vehicleObj.owner;
      const technician = getRandomElement(ids.users.technicians);
      const admin = getRandomElement(ids.users.admins);
      const type = getRandomElement(workOrderTypes);
      const priority = getRandomElement(priorities);
      const status = getRandomElement(statuses);
      const creationDate = getRandomDate(new Date(2023, 0, 1), new Date(2023, 11, 31));
      
      // 生成工单编号
      const year = creationDate.getFullYear();
      const month = String(creationDate.getMonth() + 1).padStart(2, '0');
      const orderNumber = `WO${year}${month}${String(i + 1).padStart(4, '0')}`;
      
      // 根据状态确定其他信息
      let startDate = null;
      let completionDate = null;
      let actualHours = null;
      let diagnosis = null;
      let solution = null;
      
      if (['assigned', 'in_progress', 'pending_check', 'completed'].includes(status)) {
        startDate = new Date(creationDate.getTime() + getRandomInt(1, 48) * 3600000);
        diagnosis = `车辆${type}诊断记录`;
        
        if (['pending_check', 'completed'].includes(status)) {
          solution = `已完成${type}维修`;
          actualHours = getRandomInt(1, 8);
          
          if (status === 'completed') {
            completionDate = new Date(startDate.getTime() + actualHours * 3600000);
          }
        }
      }
      
      const workOrder = await models.WorkOrder.create({
        orderNumber,
        vehicle,
        customer,
        technician: ['assigned', 'in_progress', 'pending_check', 'completed'].includes(status) ? technician : null,
        type,
        description: `${vehicleObj.brand} ${vehicleObj.model} ${type}工单`,
        diagnosis,
        solution,
        priority,
        status,
        estimatedHours: getRandomInt(1, 8),
        actualHours,
        startDate,
        completionDate,
        customerNotes: status === 'cancelled' ? '客户取消工单' : '',
        technicianNotes: ['in_progress', 'pending_check', 'completed'].includes(status) ? `技师维修记录 - ${type}` : '',
        createdBy: admin
      });
      
      ids.workOrders.push(workOrder._id);
      
      // 9. 为已完成的工单创建评价
      if (status === 'completed' && Math.random() > 0.3) {
        const rating = getRandomInt(3, 5);  // 大部分评价比较好
        
        await models.WorkOrderEvaluation.create({
          workOrder: workOrder._id,
          customer,
          technician,
          rating,
          feedback: rating >= 4 
            ? `服务很专业，${technician ? '技师态度很好' : ''}，问题得到了解决，很满意。` 
            : `服务基本满意，${rating < 3 ? '但时间有点长' : ''}。`,
          createdBy: customer,
          evaluatorInfo: {
            userId: customer,
            username: vehicleObj.ownerName,
            email: (await models.User.findById(customer)).email
          },
          status: 'visible'
        });
      }
    }
    console.log(`已创建 ${ids.workOrders.length} 个工单及相关评价`);
    
    console.log('数据生成完成！');
    
  } catch (error) {
    console.error('生成数据时出错:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('数据库连接已关闭');
    }
  }
}

// 运行数据生成函数
generateData().catch(console.error); 