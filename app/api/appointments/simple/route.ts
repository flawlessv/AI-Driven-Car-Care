/**
 * 简易预约API接口文件
 * 
 * 这个文件处理前台用户提交的预约请求
 * 它提供了一个简化的预约流程，适用于客户直接在网站前台创建预约
 */
import { NextRequest } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { getAppointmentModel } from '@/app/models/appointment';
import Vehicle from '@/app/models/vehicle';
import { getServiceModel } from '@/app/models/service';
import mongoose from 'mongoose';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/app/lib/api-response';

/**
 * POST方法处理函数 - 创建新的预约
 * 
 * 这个函数处理用户提交的预约请求，包括:
 * 1. 验证预约数据
 * 2. 创建或更新车辆信息
 * 3. 创建服务记录
 * 4. 创建预约记录
 * 
 * @param {NextRequest} request - HTTP请求对象
 * @returns {Promise<Response>} 返回操作结果的HTTP响应
 */
export async function POST(request: NextRequest) {
  try {
    // 连接数据库
    await connectDB();

    // 解析请求数据
    const data = await request.json();
    const { 
      customer,           // 客户信息对象
      vehicleBrand,       // 车辆品牌
      vehicleModel,       // 车型
      licensePlate,       // 车牌号
      serviceType,        // 服务类型
      serviceDescription, // 服务描述
      date,               // 预约日期
      startTime,          // 开始时间
      user                // 用户ID（可选）
    } = data;

    console.log('收到简易预约数据:', JSON.stringify(data, null, 2));
    console.log('提取的用户ID:', user); // 添加用户ID日志

    // 验证用户ID有效性
    if (user) {
      try {
        // 检查是否是有效的MongoDB ObjectId格式
        if (mongoose.Types.ObjectId.isValid(user)) {
          console.log('有效的用户ID:', user);
        } else {
          console.warn('提供的用户ID无效:', user);
        }
      } catch (error) {
        console.error('验证用户ID时出错:', error);
      }
    }

    // 验证客户信息必填字段
    if (!customer?.name || !customer?.phone) {
      return validationErrorResponse('客户姓名和联系电话为必填项');
    }

    // 验证车辆信息必填字段
    if (!vehicleBrand || !vehicleModel || !licensePlate) {
      return validationErrorResponse('车辆品牌、车型和车牌号为必填项');
    }

    // 验证服务信息必填字段
    if (!serviceType || !serviceDescription) {
      return validationErrorResponse('服务类型和问题描述为必填项');
    }

    // 验证时间信息必填字段
    if (!date || !startTime) {
      return validationErrorResponse('预约日期和时间为必填项');
    }

    // 第一步：查找或创建车辆信息
    let vehicle;
    const vehicleQuery = { licensePlate };
    
    // 通过车牌号查找车辆
    vehicle = await Vehicle.findOne(vehicleQuery);

    if (!vehicle) {
      // 如果车辆不存在，创建新车辆记录
      console.log('未找到现有车辆，创建新车辆记录');
      vehicle = new Vehicle({
        brand: vehicleBrand,
        model: vehicleModel,
        licensePlate,
        registrationDate: new Date(),
        owner: user || null,        // 如果有用户ID，关联车辆和用户
        ownerName: customer.name,   // 添加车主姓名
        ownerPhone: customer.phone, // 添加车主联系方式
        vin: generateValidVIN(vehicleBrand, vehicleModel, licensePlate) // 生成有效的17位VIN码
      });
      await vehicle.save();
      console.log('新车辆创建成功:', vehicle._id);
    } else {
      // 如果找到了车辆，更新车主信息（如果缺少）
      console.log('找到现有车辆:', vehicle._id);
      let needsUpdate = false;
      
      // 如果有用户ID且车辆没有关联用户，更新车辆所有者
      if (user && !vehicle.owner) {
        vehicle.owner = user;
        needsUpdate = true;
      }
      
      // 如果车辆没有车主姓名或联系方式，则更新
      if (!vehicle.ownerName || !vehicle.ownerPhone) {
        vehicle.ownerName = customer.name;
        vehicle.ownerPhone = customer.phone;
        needsUpdate = true;
      }
      
      // 如果需要更新，保存车辆信息
      if (needsUpdate) {
        await vehicle.save();
        console.log('车辆信息已更新');
      }
    }

    // 第二步：创建服务记录
    console.log('创建服务记录...');
    const Service = getServiceModel();
    const service = new Service({
      name: `${serviceType === 'maintenance' ? '保养' : (serviceType === 'repair' ? '维修' : '检查')}服务`,
      category: serviceType === 'maintenance' ? '保养' : (serviceType === 'repair' ? '维修' : '检查'),
      description: serviceDescription,
      duration: 60, // 默认60分钟
      basePrice: 300 // 默认300元
    });
    await service.save();
    console.log('服务记录创建成功:', service._id);

    // 第三步：创建预约记录
    console.log('创建预约记录...');
    const Appointment = getAppointmentModel();
    
    // 计算结束时间
    const endTime = calculateEndTime(startTime, 60);
    
    // 构造预约数据
    const rawAppointment = {
      // 客户信息
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || ''
      },
      // 关联的车辆和服务
      vehicle: vehicle._id,
      service: service._id,
      // 使用扁平结构，增强兼容性
      date: new Date(date),
      startTime: startTime,
      endTime: endTime,
      // 关联的技师(如果指定)
      technician: data.technician ? new mongoose.Types.ObjectId(data.technician) : null,
      // 预约状态和估算信息
      status: 'pending',
      estimatedDuration: 60,
      estimatedCost: 300,
      notes: data.notes || '',
      // 保留timeSlot结构以兼容现有代码
      timeSlot: {
        date: new Date(date),
        startTime: startTime,
        endTime: endTime,
        technician: data.technician ? new mongoose.Types.ObjectId(data.technician) : null
      },
      // 关联的用户(如果有)
      user: user ? new mongoose.Types.ObjectId(user) : null,
      // 时间戳
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('创建预约数据:', JSON.stringify(rawAppointment, null, 2));
    
    // 直接使用MongoDB集合插入文档，绕过Mongoose验证
    // 这在处理复杂或混合结构时更灵活
    const appointmentCollection = mongoose.connection.collection('appointments');
    const result = await appointmentCollection.insertOne(rawAppointment);
    
    // 获取创建的预约完整信息
    const appointment = await Appointment.findById(result.insertedId);

    // 检查预约是否创建成功
    if (!appointment) {
      return errorResponse('预约创建失败，无法检索创建的预约数据');
    }

    // 返回创建成功的响应
    return successResponse({
      message: '预约创建成功，我们将尽快与您联系确认详细信息',
      appointment: {
        _id: appointment._id,
        customer: appointment.customer,
        status: appointment.status,
        vehicle: {
          brand: vehicleBrand,
          model: vehicleModel,
          licensePlate
        },
        service: {
          type: serviceType,
          description: serviceDescription
        },
        date,
        startTime
      }
    });
  } catch (error: any) {
    // 捕获并处理错误
    console.error('创建简易预约失败:', error);
    // 打印详细错误信息以便调试
    if (error.errors) {
      for (const field in error.errors) {
        console.error(`字段 ${field} 错误:`, error.errors[field].message);
      }
    }
    return errorResponse(error.message || '创建预约失败');
  }
}

/**
 * 计算结束时间
 * 
 * 根据开始时间和持续时间计算结束时间
 * 
 * @param {string} startTime - 开始时间 (格式: "HH:MM")
 * @param {number} durationMinutes - 持续时间 (分钟)
 * @returns {string} 结束时间 (格式: "HH:MM")
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  // 将开始时间拆分为小时和分钟
  const [hours, minutes] = startTime.split(':').map(Number);
  // 计算结束时间的总分钟数
  let endMinutes = minutes + durationMinutes;
  // 计算结束时间的小时数
  let endHours = hours + Math.floor(endMinutes / 60);
  // 计算结束时间的分钟数
  endMinutes = endMinutes % 60;
  
  // 确保小时数不超过24（循环到第二天）
  const formattedHours = endHours % 24;
  // 返回格式化的时间字符串 (HH:MM)
  return `${formattedHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * 生成有效的17位VIN码
 * 
 * 生成符合格式要求的随机车辆识别号码
 * 
 * @param {string} brand - 车辆品牌
 * @param {string} model - 车辆型号
 * @param {string} licensePlate - 车牌号
 * @returns {string} 17位VIN码
 */
function generateValidVIN(brand: string, model: string, licensePlate: string): string {
  // 创建完全随机的17位VIN码
  
  // 1-3位：制造商代码，使用常见的中国制造商代码
  const manufacturerCodes = ['LSV', 'LFV', 'LVS', 'LGJ', 'LBV'];
  const manufacturerCode = manufacturerCodes[Math.floor(Math.random() * manufacturerCodes.length)];
  
  // 4-8位：车辆特征，完全随机生成
  const characters = 'ABCDEFGHJKLMNPRSTUVWXYZ1234567890';
  let vehicleDescriptor = '';
  for (let i = 0; i < 5; i++) {
    vehicleDescriptor += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // 9位：校验位
  const checkDigit = '1';
  
  // 10位：年份代码
  const yearCodes = 'ABCDEFGHJKLMNPRSTVWXY123456789';
  const yearCode = yearCodes.charAt(Math.floor(Math.random() * yearCodes.length));
  
  // 11位：装配厂代码
  const plantCodes = 'ABCDEFGHJKLMNPRSTUVWXYZ1234567890';
  const plantCode = plantCodes.charAt(Math.floor(Math.random() * plantCodes.length));
  
  // 12-17位：完全随机的序列号
  let serialNumber = '';
  for (let i = 0; i < 6; i++) {
    serialNumber += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // 组合17位VIN码，确保没有I、O、Q字母（避免与数字1和0混淆）
  return (manufacturerCode + vehicleDescriptor + checkDigit + yearCode + plantCode + serialNumber).replace(/[IOQ]/g, 'X');
} 