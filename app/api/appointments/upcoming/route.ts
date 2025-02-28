import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/appointment';  // 直接导入模型

export async function GET() {
  try {
    console.log('正在连接数据库...');
    await connectDB();
    console.log('数据库连接成功');

    console.log('开始查询预约...');
    const upcomingAppointments = await Appointment.find({
      date: { $gte: new Date() }
    })
      .sort({ date: 1 })
      .limit(5)
      .populate('vehicle')
      .populate('service');

    console.log('查询结果:', upcomingAppointments);

    return NextResponse.json({
      success: true,
      data: upcomingAppointments
    });
  } catch (error: any) {
    console.error('获取即将到来的预约失败:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        success: false, 
        message: '获取即将到来的预约失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 