// 数据库清除脚本
const mongoose = require('mongoose');
const { hash } = require('bcryptjs'); // 导入bcryptjs的hash函数
require('dotenv').config(); // 加载环境变量

// 获取命令行参数
const args = process.argv.slice(2);
const skipConfirmation = args.includes('--force') || args.includes('-f');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('错误: 环境变量中没有找到MONGODB_URI');
  process.exit(1);
}

// 定义用户模型
const defineUserModel = () => {
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' }
  }, { timestamps: true });

  return mongoose.models.User || mongoose.model('User', userSchema);
};

async function clearDatabase() {
  try {
    console.log('开始清除数据库...');
    console.log(`连接到: ${MONGODB_URI.substring(0, MONGODB_URI.indexOf('@') > 0 ? MONGODB_URI.indexOf('@') : 20)}...`);
    
    // 连接到数据库
    await mongoose.connect(MONGODB_URI);
    console.log('已连接到MongoDB');
    
    // 获取所有集合
    const collections = mongoose.connection.db.listCollections().toArray();
    const collectionsList = await collections;
    const collectionNames = collectionsList.map(c => c.name);
    
    if (collectionNames.length === 0) {
      console.log('数据库为空，没有集合需要清除');
    } else {
      console.log(`发现 ${collectionNames.length} 个集合: ${collectionNames.join(', ')}`);
      
      // 确认是否继续（除非使用了--force参数）
      if (!skipConfirmation) {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        await new Promise((resolve) => {
          readline.question('警告: 即将完全删除整个数据库! 输入 "yes" 确认继续: ', (answer) => {
            if (answer.toLowerCase() !== 'yes') {
              console.log('操作已取消');
              process.exit(0);
            }
            readline.close();
            resolve();
          });
        });
      } else {
        console.log('使用强制模式，跳过确认步骤');
      }
      
      // 删除整个数据库
      try {
        await mongoose.connection.db.dropDatabase();
        console.log('数据库已被完全删除!');
      } catch (err) {
        console.error('删除数据库时出错:', err.message);
        process.exit(1);
      }
    }
    
    // 创建管理员账号
    console.log('正在创建管理员账号...');
    const User = defineUserModel();
    
    try {
      const hashedPassword = await hash('111111', 10);
      await User.create({
        username: 'admin',
        email: 'admin@qq.com',
        password: hashedPassword,
        role: 'admin',
        phone: '19838558988',
      });
      console.log('管理员账号创建成功!');
    } catch (err) {
      if (err.code === 11000) {  // 重复键错误
        console.log('管理员账号已存在，跳过创建步骤');
      } else {
        throw err;  // 重新抛出其他错误
      }
    }
    
  } catch (error) {
    console.error('清除数据库时出错:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('数据库连接已关闭');
    }
  }
}

// 运行清除函数
clearDatabase().catch(console.error); 