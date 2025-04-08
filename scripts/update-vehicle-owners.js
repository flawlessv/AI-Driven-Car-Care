const mongoose = require('mongoose');
require('dotenv').config();

// 连接到数据库
async function connectDB() {
  try {
    console.log('正在连接到数据库...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
}

// 获取第一个客户用户的ID
async function getFirstCustomerUser() {
  try {
    const User = mongoose.model('User', new mongoose.Schema({
      role: String,
      username: String,
      name: String
    }));
    
    const customer = await User.findOne({ role: 'customer' }).lean();
    if (!customer) {
      console.log('没有找到客户用户，请先创建客户用户');
      return null;
    }
    
    console.log(`找到客户用户: ${customer.username || customer.name} (${customer._id})`);
    return customer._id;
  } catch (error) {
    console.error('获取客户用户失败:', error);
    return null;
  }
}

// 更新没有所有者的车辆
async function updateVehiclesWithoutOwner(customerId) {
  try {
    const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({
      brand: String,
      model: String,
      licensePlate: String,
      owner: mongoose.Schema.Types.ObjectId
    }));
    
    // 查找没有所有者的车辆
    const vehicles = await Vehicle.find({ 
      $or: [
        { owner: { $exists: false } },
        { owner: null }
      ] 
    });
    
    if (vehicles.length === 0) {
      console.log('没有找到需要更新的车辆');
      return;
    }
    
    console.log(`找到 ${vehicles.length} 辆没有所有者的车辆`);
    
    // 更新车辆所有者
    const updatePromises = vehicles.map(vehicle => {
      console.log(`更新车辆: ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`);
      return Vehicle.updateOne(
        { _id: vehicle._id },
        { $set: { owner: customerId } }
      );
    });
    
    await Promise.all(updatePromises);
    console.log('所有车辆更新完成');
  } catch (error) {
    console.error('更新车辆失败:', error);
  }
}

// 主函数
async function main() {
  await connectDB();
  
  const customerId = await getFirstCustomerUser();
  if (!customerId) {
    console.log('无法继续，没有找到客户用户');
    process.exit(1);
  }
  
  await updateVehiclesWithoutOwner(customerId);
  
  console.log('脚本执行完成');
  process.exit(0);
}

// 执行主函数
main(); 