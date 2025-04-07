// 初始化基础数据脚本
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 获取MongoDB连接URI
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('错误: 未找到MONGODB_URI环境变量');
  console.error('请确保在.env或.env.local文件中设置了MONGODB_URI');
  process.exit(1);
}

// 用户模型定义
function createUserModel() {
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    role: {
      type: String,
      enum: ['admin', 'staff', 'customer', 'technician'],
      default: 'customer',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
  }, { timestamps: true });

  // 如果模型已存在则使用已有的
  return mongoose.models.User || mongoose.model('User', userSchema);
}

async function initializeData() {
  try {
    console.log('=== 初始化基础数据 ===');
    console.log('正在连接到MongoDB...');
    
    // 连接到MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('连接成功!');
    
    const User = createUserModel();
    
    // 检查是否已存在管理员用户
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('已存在管理员账户，跳过创建。');
    } else {
      // 创建管理员账户
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        name: '系统管理员',
        role: 'admin',
        status: 'active',
      });
      
      await adminUser.save();
      console.log('已创建管理员账户:');
      console.log('- 用户名: admin');
      console.log('- 密码: admin123');
    }
    
    // 检查是否已存在技师用户
    const existingTechnician = await User.findOne({ role: 'technician' });
    if (existingTechnician) {
      console.log('已存在技师账户，跳过创建。');
    } else {
      // 创建示例技师账户
      const hashedPassword = await bcrypt.hash('tech123', 10);
      const techUser = new User({
        username: 'technician',
        email: 'tech@example.com',
        password: hashedPassword,
        name: '张技师',
        role: 'technician',
        status: 'active',
      });
      
      await techUser.save();
      console.log('已创建技师账户:');
      console.log('- 用户名: technician');
      console.log('- 密码: tech123');
    }
    
    // 检查是否已存在员工用户
    const existingStaff = await User.findOne({ role: 'staff' });
    if (existingStaff) {
      console.log('已存在员工账户，跳过创建。');
    } else {
      // 创建示例员工账户
      const hashedPassword = await bcrypt.hash('staff123', 10);
      const staffUser = new User({
        username: 'staff',
        email: 'staff@example.com',
        password: hashedPassword,
        name: '李员工',
        role: 'staff',
        status: 'active',
      });
      
      await staffUser.save();
      console.log('已创建员工账户:');
      console.log('- 用户名: staff');
      console.log('- 密码: staff123');
    }
    
    console.log('\n=== 基础数据初始化完成 ===');
    console.log('现在您可以使用这些账户登录系统');
    
  } catch (error) {
    console.error('初始化数据时出错:', error);
  } finally {
    // 关闭数据库连接
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行初始化
initializeData().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
}); 