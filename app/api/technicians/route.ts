import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { getUserModel } from '@/app/lib/db/models';

export async function GET() {
  try {
    // 连接数据库
    await connectDB();
    console.log('数据库连接成功');

    const User = getUserModel();
    // 从数据库获取技师列表
    const technicians = await User.find({ role: 'technician' })
      .select('name email phone level specialties certifications workExperience status stats')
      .select('name email phone level specialties certifications workingYears status stats')
      .sort({ createdAt: -1 });
    
    console.log('获取到技师数据:', technicians.length, '条记录');
    
    return NextResponse.json({
      success: true,
      data: technicians
    });
  } catch (error: any) {
    console.error('获取技师列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '获取技师列表失败'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 连接数据库
    await connectDB();
    
    // 获取请求数据
    const data = await request.json();
    console.log('创建技师，接收到的数据:', data);

    const User = getUserModel();
    // 创建新技师
    const technician = await User.create({
      ...data,
      role: 'technician',
      stats: {
        totalOrders: 0,
        completedOrders: 0,
        completionRate: 0,
        averageRating: 0
      }
    });
    
    console.log('技师创建成功:', technician);

    return NextResponse.json({
      success: true,
      message: '技师添加成功',
      data: technician
    });
  } catch (error: any) {
    console.error('创建技师失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '添加技师失败'
      },
      { status: 500 }
    );
  }
} 
