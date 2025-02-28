import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Maintenance from '@/models/maintenance';  // 直接导入模型

export async function GET() {
  try {
    console.log('正在连接数据库...');
    await connectDB();
    console.log('数据库连接成功');

    console.log('开始查询维修记录...');
    const recentMaintenance = await Maintenance.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicle')
      .populate('technician');

    console.log('查询结果:', recentMaintenance);

    return NextResponse.json({
      success: true,
      data: recentMaintenance
    });
  } catch (error: any) {
    console.error('获取最近保养记录失败:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false, 
        message: '获取最近保养记录失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 