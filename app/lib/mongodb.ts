import mongoose from 'mongoose';
//获取环境变量
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('请在环境变量中设置 MONGODB_URI');
}

export async function connectDB() {
  try {
    console.log('正在连接到MongoDB...');
    
    if (mongoose.connection.readyState === 1) {
      console.log('已经连接到MongoDB');
      return;
    }
    //连接数据库
    await mongoose.connect(MONGODB_URI as string);
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    throw error;
  }
} 