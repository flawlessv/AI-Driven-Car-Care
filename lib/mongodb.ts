import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const MONGODB_URI: string = process.env.MONGODB_URI;

async function connectDB() {
  try {
    if (mongoose.connection.readyState >= 1) {
      return mongoose;
    }

    return await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export { connectDB }; 