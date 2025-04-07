// 数据库清除脚本
const mongoose = require('mongoose');
require('dotenv').config(); // 加载环境变量

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('错误: 环境变量中没有找到MONGODB_URI');
  process.exit(1);
}

async function clearDatabase() {
  try {
    console.log('开始清除数据库...');
    console.log(`连接到: ${MONGODB_URI.substring(0, MONGODB_URI.indexOf('@') > 0 ? MONGODB_URI.indexOf('@') : 20)}...`);
    
    // 连接到数据库
    await mongoose.connect(MONGODB_URI);
    console.log('已连接到MongoDB');
    
    // 获取所有集合
    const collections = mongoose.connection.collections;
    const collectionNames = Object.keys(collections);
    
    if (collectionNames.length === 0) {
      console.log('数据库为空，没有集合需要清除');
      return;
    }
    
    console.log(`发现 ${collectionNames.length} 个集合: ${collectionNames.join(', ')}`);
    
    // 确认是否继续
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise((resolve) => {
      readline.question('警告: 即将删除所有数据! 输入 "yes" 确认继续: ', (answer) => {
        if (answer.toLowerCase() !== 'yes') {
          console.log('操作已取消');
          process.exit(0);
        }
        readline.close();
        resolve();
      });
    });
    
    // 清除每个集合中的所有文档
    let totalDeleted = 0;
    for (const collName of collectionNames) {
      const collection = collections[collName];
      const result = await collection.deleteMany({});
      const count = result.deletedCount || 0;
      totalDeleted += count;
      console.log(`已清除集合 "${collName}" 中的 ${count} 条文档`);
    }
    
    console.log(`数据库已成功清除! 总共删除了 ${totalDeleted} 条文档`);
    
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