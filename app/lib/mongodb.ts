import mongoose from 'mongoose';

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

    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    throw error;
  }
} 